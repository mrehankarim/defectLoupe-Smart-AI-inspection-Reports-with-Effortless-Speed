import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { StatCard } from '../../components/Card';
import { Card } from '../../components/Card';

interface DashboardStats {
  total_clients: number;
  total_properties: number;
  total_inspections: number;
  completion_rate: number;
  inspections_by_status?: Record<string, number>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val: number | undefined, suffix = '') =>
    loading ? '—' : `${val ?? 0}${suffix}`;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Inspection Dashboard"
        description="A clear view of your field work."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clients" value={fmt(stats?.total_clients)} />
        <StatCard label="Properties" value={fmt(stats?.total_properties)} />
        <StatCard label="Inspections" value={fmt(stats?.total_inspections)} />
        <StatCard
          label="Completion Rate"
          value={fmt(stats?.completion_rate, '%')}
          accent="text-green-600"
        />
      </div>

      {/* Status breakdown + getting started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inspections by status */}
        <Card>
          <h3 className="font-bold text-text-primary mb-4">Inspections by Status</h3>
          {!stats?.inspections_by_status || Object.keys(stats.inspections_by_status).length === 0 ? (
            <p className="text-sm text-text-secondary">No inspections yet. Create your first inspection to see data here.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(stats.inspections_by_status).map(([status, count]) => {
                const pct = stats.total_inspections > 0 ? (count / stats.total_inspections) * 100 : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary capitalize w-28 shrink-0">
                      {status.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-text-primary w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Getting started */}
        <Card>
          <h3 className="font-bold text-text-primary mb-3">Getting Started</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Create a client, add their property, then schedule an inspection. Each record stays linked so your reports have the full context.
          </p>
          <div className="flex flex-col gap-2">
            {[
              { step: '1', text: 'Add a client to your workspace' },
              { step: '2', text: 'Register their property' },
              { step: '3', text: 'Schedule an inspection' },
              { step: '4', text: 'Generate the final report' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {step}
                </span>
                <span className="text-text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
