import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod';
import { pathToFileURL } from 'node:url';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { AppError } from './lib/errors.js';
import { makeRateLimit } from './lib/ratelimit.js';
import { ZodError } from 'zod';

import { authRoutes } from './auth/routes.js';
import { tenantRoutes } from './modules/tenants/routes.js';
import { agentRoutes } from './modules/agents/routes.js';
import { knowledgeRoutes } from './modules/knowledge/routes.js';
import { conversationRoutes } from './modules/conversations/routes.js';
import { reviewRoutes } from './modules/review/routes.js';
import { metricsRoutes } from './modules/metrics/routes.js';
import { eventRoutes } from './modules/events/routes.js';

/**
 * API Gateway (ARCHITECTURE.md §3): satu ingress — auth, validasi, routing,
 * error mapping konsisten. Fase 1 = BFF tipis di dalam app (modular monolith).
 *
 * OpenAPI: schema Zod di tiap route = SUMBER TUNGGAL untuk validasi (via
 * fastify-type-provider-zod) DAN dokumentasi (@fastify/swagger). Tidak ada
 * spec terpisah yang bisa drift (Genesis Constitution Pasal 5 & 6).
 */
export async function buildServer() {
  const app = Fastify({ logger: false });

  // Zod sebagai validator & serializer → schema route = Zod.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: config.JWT_SECRET });

  // OpenAPI: dihasilkan dari schema Zod tiap route.
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Genesis AI API',
        version: '1.0.0',
        description: 'AI Workforce Platform — v1 (AI Customer Support Agent).',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  // Error handler tersentral → bentuk respons error seragam.
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({ error: { code: err.code, message: err.message, details: err.details } });
    }
    // Error validasi dari Zod (manual parse) maupun dari schema route (provider).
    if (err instanceof ZodError) {
      return reply
        .status(400)
        .send({ error: { code: 'VALIDATION', message: 'Input tidak valid', details: err.flatten() } });
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply
        .status(400)
        .send({ error: { code: 'VALIDATION', message: 'Input tidak valid', details: err.validation } });
    }
    logger.error({ err }, 'Unhandled error');
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Kesalahan internal' } });
  });

  // Lapis 1: rate limit IP global (lindungi endpoint publik mis. login dari brute-force).
  // Lapis 2 (per-tenant, lebih ketat) dipasang di modul jalur-mahal (mis. /v1/inbound).
  app.addHook('onRequest', makeRateLimit({ by: 'ip', limit: 300, windowSec: 60 }));

  app.get('/health', { schema: { tags: ['System'], summary: 'Health check' } }, async () => ({
    status: 'ok',
    service: 'genesis-ai',
    ts: new Date().toISOString(),
  }));

  // Spesifikasi OpenAPI mentah (untuk SDK generator / integrator).
  app.get('/openapi.json', { schema: { tags: ['System'], summary: 'OpenAPI spec' } }, async () => app.swagger());

  // Modul (boundary bersih — siap diekstrak jadi microservices)
  await app.register(authRoutes);
  await app.register(tenantRoutes);
  await app.register(agentRoutes);
  await app.register(knowledgeRoutes);
  await app.register(conversationRoutes);
  await app.register(reviewRoutes);
  await app.register(metricsRoutes);
  await app.register(eventRoutes);

  return app;
}

// Entrypoint — hanya jalan bila file ini dieksekusi langsung (bukan saat di-import skrip).
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  buildServer()
    .then((app) =>
      app.listen({ port: config.PORT, host: '0.0.0.0' }).then(() => {
        logger.info(`🚀 Genesis AI API berjalan di http://localhost:${config.PORT} (docs: /docs)`);
      }),
    )
    .catch((err) => {
      logger.error(err, 'Gagal start server');
      process.exit(1);
    });
}
