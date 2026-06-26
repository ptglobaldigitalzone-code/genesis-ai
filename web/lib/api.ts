/**
 * Genesis API client — console adalah konsumen API /v1 (API First).
 * Token JWT disimpan di localStorage (v1; akan diganti managed auth).
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'genesis_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init?.auth !== false) {
    const token = getToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers as object) } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? 'ERROR', err.message ?? res.statusText);
  }
  return data as T;
}

// ── Tipe ringan (selaras backend) ──
export type Autonomy = 'suggest' | 'draft_for_approval' | 'act_with_review' | 'autonomous';

export interface Agent {
  id: string;
  name: string;
  autonomy: Autonomy;
  voice: string;
}

export interface Metrics {
  totalTickets: number;
  byStatus: Record<string, number>;
  resolutionRate: number;
  escalationRate: number;
  counts: { sent: number; escalated: number; queuedForReview: number };
  cost: { totalUsd: number; costPerTicketUsd: number };
}

export interface Conversation {
  id: string;
  agentId: string;
  channel: string;
  subject: string | null;
  status: string;
  updatedAt: string;
}

// ── Endpoints ──
export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; role: string } }>(
      '/v1/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }), auth: false },
    ),

  metrics: () => request<Metrics>('/v1/metrics'),
  agents: () => request<Agent[]>('/v1/agents'),
  setAutonomy: (id: string, autonomy: Autonomy) =>
    request<Agent>(`/v1/agents/${id}/autonomy`, { method: 'PATCH', body: JSON.stringify({ autonomy }) }),

  reviewQueue: () => request<Conversation[]>('/v1/review-queue'),
  review: (conversationId: string, action: 'approve' | 'edit' | 'reject', extra?: { editedBody?: string; reason?: string }) =>
    request<{ ok: boolean; status: string }>(`/v1/conversations/${conversationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, ...extra }),
    }),
  conversation: (id: string) =>
    request<{ conversation: Conversation; messages: { role: string; body: string }[] }>(`/v1/conversations/${id}`),
};
