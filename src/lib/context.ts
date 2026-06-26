/**
 * Konteks autentikasi yang diturunkan dari JWT oleh API Gateway.
 * `tenantId` SELALU diambil dari token, tidak pernah dari input klien
 * (ARCHITECTURE.md §3) — ini batas keamanan multi-tenant.
 */
export interface AuthContext {
  userId: string;
  tenantId: string;
  role: 'operator' | 'reviewer';
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
