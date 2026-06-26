/**
 * Error domain terstruktur. Setiap error punya HTTP status + kode mesin-readable,
 * supaya API Gateway bisa memetakan respons secara konsisten.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: (msg = 'Tidak terautentikasi') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'Tidak diizinkan') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (resource = 'Resource') => new AppError(404, 'NOT_FOUND', `${resource} tidak ditemukan`),
  badRequest: (msg = 'Permintaan tidak valid', details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', msg, details),
  conflict: (msg = 'Konflik data') => new AppError(409, 'CONFLICT', msg),
  internal: (msg = 'Kesalahan internal') => new AppError(500, 'INTERNAL', msg),
};
