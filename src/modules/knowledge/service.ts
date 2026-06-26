import { sql, and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { knowledgeSources, kbChunks } from '../../db/schema.js';
import { chunkText } from './chunker.js';
import { embed, embedBatch } from '../../ai/embeddings.js';
import { emitEvent } from '../events/service.js';

export interface IngestInput {
  tenantId: string;
  agentId: string;
  title: string;
  type: string; // document | text | url | qa_csv
  content: string;
  authority?: number;
}

/**
 * Ingestion pipeline (write path, ARCHITECTURE.md §9):
 * source → chunk → embed → simpan ke pgvector (ter-scope tenant+agent).
 */
export async function ingestKnowledge(input: IngestInput): Promise<{ sourceId: string; chunks: number }> {
  const [source] = await db
    .insert(knowledgeSources)
    .values({
      tenantId: input.tenantId,
      agentId: input.agentId,
      type: input.type,
      title: input.title,
      status: 'pending',
    })
    .returning();
  if (!source) throw new Error('Gagal membuat knowledge source');

  try {
    const chunks = chunkText(input.content);
    const vectors = await embedBatch(chunks);

    if (chunks.length > 0) {
      await db.insert(kbChunks).values(
        chunks.map((content, i) => ({
          tenantId: input.tenantId,
          agentId: input.agentId,
          sourceId: source.id,
          content,
          embedding: vectors[i]!,
          authority: input.authority ?? 1,
        })),
      );
    }

    await db.update(knowledgeSources).set({ status: 'ready' }).where(eq(knowledgeSources.id, source.id));
    await emitEvent({
      tenantId: input.tenantId,
      type: 'knowledge.ingested',
      agentId: input.agentId,
      payload: { sourceId: source.id, title: input.title, chunks: chunks.length },
    });

    return { sourceId: source.id, chunks: chunks.length };
  } catch (err) {
    await db.update(knowledgeSources).set({ status: 'failed' }).where(eq(knowledgeSources.id, source.id));
    throw err;
  }
}

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  authority: number;
}

/**
 * Retrieval (read path): similarity search ter-scope tenant+agent.
 * Memakai cosine distance pgvector (operator <=>). score = 1 - distance.
 */
export async function retrieve(
  tenantId: string,
  agentId: string,
  query: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const qVec = await embed(query);
  const vecLiteral = `[${qVec.join(',')}]`;

  const rows = await db
    .select({
      id: kbChunks.id,
      content: kbChunks.content,
      authority: kbChunks.authority,
      distance: sql<number>`${kbChunks.embedding} <=> ${vecLiteral}::vector`,
    })
    .from(kbChunks)
    .where(and(eq(kbChunks.tenantId, tenantId), eq(kbChunks.agentId, agentId)))
    .orderBy(sql`${kbChunks.embedding} <=> ${vecLiteral}::vector`)
    .limit(topK);

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    authority: r.authority,
    score: 1 - Number(r.distance),
  }));
}
