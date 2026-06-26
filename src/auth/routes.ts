import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tenants, users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { Errors } from '../lib/errors.js';
import { emitEvent } from '../modules/events/service.js';

const registerSchema = z.object({
  tenantName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /v1/auth/register
   * Membuat tenant baru + user operator pertama (founder/admin tenant).
   */
  app.post(
    '/v1/auth/register',
    { schema: { tags: ['Auth'], summary: 'Daftar tenant + operator pertama', body: registerSchema } },
    async (req) => {
      const { tenantName, email, password } = registerSchema.parse(req.body);

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) throw Errors.conflict('Email sudah terdaftar');

    const [tenant] = await db.insert(tenants).values({ name: tenantName }).returning();
    if (!tenant) throw Errors.internal('Gagal membuat tenant');

    const [user] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        email,
        passwordHash: await hashPassword(password),
        role: 'operator',
      })
      .returning();
    if (!user) throw Errors.internal('Gagal membuat user');

    await emitEvent({ tenantId: tenant.id, type: 'tenant.created', payload: { name: tenantName } });
    await emitEvent({ tenantId: tenant.id, type: 'user.registered', payload: { email } });

    const token = app.jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      { expiresIn: '7d' },
    );
    return { token, tenant: { id: tenant.id, name: tenant.name }, user: { id: user.id, email, role: user.role } };
  });

  /**
   * POST /v1/auth/login
   */
  app.post(
    '/v1/auth/login',
    { schema: { tags: ['Auth'], summary: 'Login → JWT', body: loginSchema } },
    async (req) => {
      const { email, password } = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw Errors.unauthorized('Email atau password salah');

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw Errors.unauthorized('Email atau password salah');

    const token = app.jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      { expiresIn: '7d' },
    );
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  });
}
