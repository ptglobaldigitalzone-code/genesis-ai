import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
  vector,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { config } from '../config/index.js';

/**
 * Skema inti Genesis AI (selaras dengan ARCHITECTURE.md §4).
 * Prinsip: setiap baris membawa `tenant_id` → isolasi multi-tenant.
 * Tabel `events` bersifat APPEND-ONLY = system of record (event-sourced).
 */

// ── Enums ────────────────────────────────────────────────
export const userRole = pgEnum('user_role', ['operator', 'reviewer']);
export const autonomyLevel = pgEnum('autonomy_level', [
  'suggest',
  'draft_for_approval',
  'act_with_review',
  'autonomous',
]);
export const conversationStatus = pgEnum('conversation_status', [
  'open',
  'awaiting_review',
  'resolved',
  'escalated',
]);
export const messageRole = pgEnum('message_role', ['customer', 'agent', 'reviewer']);
export const feedbackAction = pgEnum('feedback_action', ['approve', 'edit', 'reject']);
export const knowledgeStatus = pgEnum('knowledge_status', ['pending', 'ready', 'failed']);

// ── Tenancy ──────────────────────────────────────────────
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('starter'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('operator'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    tenantIdx: index('users_tenant_idx').on(t.tenantId),
  }),
);

// ── Agents (AI Employees) ────────────────────────────────
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Trust ladder — default aman = draft_for_approval (Handbook §3)
    autonomy: autonomyLevel('autonomy').notNull().default('draft_for_approval'),
    voice: text('voice').notNull().default('Ramah, jelas, dan solutif.'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('agents_tenant_idx').on(t.tenantId),
  }),
);

// ── Knowledge Base (RAG) ─────────────────────────────────
export const knowledgeSources = pgTable(
  'knowledge_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // document | url | qa_csv | text
    title: text('title').notNull(),
    status: knowledgeStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantAgentIdx: index('ksrc_tenant_agent_idx').on(t.tenantId, t.agentId),
  }),
);

export const kbChunks = pgTable(
  'kb_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: config.EMBED_DIM }),
    authority: real('authority').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantAgentIdx: index('kbchunks_tenant_agent_idx').on(t.tenantId, t.agentId),
    // HNSW index untuk pencarian similarity yang cepat
    embeddingIdx: index('kbchunks_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  }),
);

// ── Conversations & Messages ─────────────────────────────
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull().default('email'),
    subject: text('subject'),
    status: conversationStatus('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('conv_tenant_idx').on(t.tenantId),
    statusIdx: index('conv_status_idx').on(t.tenantId, t.status),
  }),
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: messageRole('role').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    convIdx: index('msg_conv_idx').on(t.conversationId),
  }),
);

// ── Event log (APPEND ONLY — system of record) ───────────
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    conversationId: uuid('conversation_id'),
    agentId: uuid('agent_id'),
    type: text('type').notNull(), // ticket.received, agent.drafted, agent.escalated, dst.
    payload: jsonb('payload').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('events_tenant_idx').on(t.tenantId),
    convIdx: index('events_conv_idx').on(t.conversationId),
    typeIdx: index('events_type_idx').on(t.tenantId, t.type),
  }),
);

// ── Feedback (sinyal pembelajaran dari reviewer) ─────────
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  conversationId: uuid('conversation_id').notNull(),
  reviewerId: uuid('reviewer_id').notNull(),
  action: feedbackAction('action').notNull(),
  editDiff: text('edit_diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Cost per tiket (instrumentasi ekonomi) ───────────────
export const ticketCosts = pgTable('ticket_costs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  conversationId: uuid('conversation_id').notNull(),
  model: text('model').notNull(),
  tokensIn: integer('tokens_in').notNull().default(0),
  tokensOut: integer('tokens_out').notNull().default(0),
  costUsd: real('cost_usd').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type KbChunk = typeof kbChunks.$inferSelect;
