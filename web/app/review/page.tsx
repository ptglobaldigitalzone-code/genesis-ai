'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, type Conversation, ApiError } from '@/lib/api';

export default function ReviewPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.reviewQueue()
      .then(setQueue)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat'));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, [router, load]);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      await api.review(id, action, action === 'reject' ? { reason: 'ditolak reviewer' } : undefined);
      setQueue((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Gagal');
    } finally {
      setBusy(null);
    }
  }

  if (error) return <div className="container"><p style={{ color: 'var(--red)' }}>{error}</p></div>;

  return (
    <div className="container">
      <h1>Review Queue <span className="muted">({queue.length})</span></h1>
      <p className="muted">Draf agent yang menunggu persetujuan manusia (Human Approval).</p>

      {queue.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>Tidak ada yang menunggu review. 🎉</div>
      ) : (
        <table style={{ marginTop: 16 }}>
          <thead>
            <tr><th>ID</th><th>Subjek</th><th>Channel</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {queue.map((c) => (
              <tr key={c.id}>
                <td className="muted">{c.id.slice(0, 8)}</td>
                <td>{c.subject ?? '(tanpa subjek)'}</td>
                <td>{c.channel}</td>
                <td className="row">
                  <button className="btn" disabled={busy === c.id} onClick={() => act(c.id, 'approve')}>Approve</button>
                  <button className="btn secondary" disabled={busy === c.id} onClick={() => act(c.id, 'reject')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
