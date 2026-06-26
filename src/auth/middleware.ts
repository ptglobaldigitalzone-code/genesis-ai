import type { FastifyRequest, FastifyReply } from 'fastify';
import { Errors } from '../lib/errors.js';
import type { AuthContext } from '../lib/context.js';

/**
 * Middleware autentikasi: verifikasi JWT, isi request.auth dengan konteks tenant.
 * Dipasang per-route yang butuh proteksi.
 */
export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const decoded = await req.jwtVerify<AuthContext>();
    req.auth = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
  } catch {
    throw Errors.unauthorized('Token tidak valid atau kedaluwarsa');
  }
}

/**
 * Otorisasi berbasis role (operator | reviewer).
 */
export function requireRole(...roles: AuthContext['role'][]) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.auth) throw Errors.unauthorized();
    if (!roles.includes(req.auth.role)) {
      throw Errors.forbidden(`Butuh role: ${roles.join(' atau ')}`);
    }
  };
}
