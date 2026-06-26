'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('operator@demo.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.login(email, password);
      setToken(token);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 380 }}>
      <h1>Masuk</h1>
      <p className="muted">Operator Console — Genesis AI</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        {error && <div style={{ color: 'var(--red)', fontSize: 14 }}>{error}</div>}
        <button className="btn" disabled={loading}>{loading ? '…' : 'Masuk'}</button>
      </form>
    </div>
  );
}
