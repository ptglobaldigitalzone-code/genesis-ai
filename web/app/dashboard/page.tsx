'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, type Metrics, type Agent, type Autonomy, ApiError } from '@/lib/api';

const LADDER: Autonomy[] = ['suggest', 'draft_for_approval', 'act_with_review', 'autonomous'];

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    Promise.all([api.metrics(), api.agents()])
      .then(([m, a]) => {
        setMetrics(m);
        setAgents(a);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat'));
  }, [router]);

  async function changeAutonomy(agent: Agent, autonomy: Autonomy) {
    try {
      const updated = await api.setAutonomy(agent.id, autonomy);
      setAgents((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      // Gate eval bisa menolak (403) — tampilkan alasannya (Human Approval).
      alert(e instanceof ApiError ? e.message : 'Gagal mengubah autonomy');
    }
  }

  if (error) return <div className="container"><p style={{ color: 'var(--red)' }}>{error}</p></div>;
  if (!metrics) return <div className="container">Memuat…</div>;

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="grid" style={{ marginTop: 16 }}>
        <Kpi label="Resolution rate" value={pct(metrics.resolutionRate)} />
        <Kpi label="Escalation rate" value={pct(metrics.escalationRate)} />
        <Kpi label="Cost / tiket" value={`$${metrics.cost.costPerTicketUsd.toFixed(4)}`} />
        <Kpi label="Total tiket" value={String(metrics.totalTickets)} />
        <Kpi label="Terkirim" value={String(metrics.counts.sent)} />
        <Kpi label="Menunggu review" value={String(metrics.counts.queuedForReview)} />
      </div>

      <h2 style={{ marginTop: 28 }}>AI Employees</h2>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {agents.map((a) => (
          <div key={a.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="row">
                <strong>🤖 {a.name}</strong>
                <span className={`badge ${a.autonomy}`}>{a.autonomy}</span>
              </div>
              <div className="row">
                <span className="muted" style={{ fontSize: 13 }}>Trust ladder:</span>
                <select
                  className="input"
                  style={{ width: 'auto' }}
                  value={a.autonomy}
                  onChange={(e) => changeAutonomy(a, e.target.value as Autonomy)}
                >
                  {LADDER.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{a.voice}</div>
          </div>
        ))}
        {agents.length === 0 && <p className="muted">Belum ada agent.</p>}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
