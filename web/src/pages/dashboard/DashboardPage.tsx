import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { useTheme } from '../../context/ThemeContext';

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
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val: number | undefined, suffix = '') =>
    loading ? '—' : `${val ?? 0}${suffix}`;

  const numStyle = { color: isDark ? "#f8fafc" : "#0f172a" };

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <PageHeader
          eyebrow="AI Inspection Workspace"
          title="Command Dashboard"
          description="Real-time field operations, client portfolio, and automated defect processing."
        />
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/inspections')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            New Inspection
          </button>
          <button
            onClick={() => navigate('/knowledge-base')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100 transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            RAG Base
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="glass-panel rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs border-emerald-500/30 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 dark:from-emerald-950/40 dark:to-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            System Status: Operational
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-600">•</span>
          <span className="hidden md:inline text-slate-700 dark:text-slate-300">AI Vision: <span className="text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20">Ready</span></span>
          <span className="hidden lg:inline text-slate-300 dark:text-slate-600">•</span>
          <span className="hidden lg:inline text-slate-700 dark:text-slate-300">STT Audio Worker: <span className="text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20">Active</span></span>
        </div>
        <span className="text-slate-500 dark:text-slate-400 font-mono font-medium">Gateway: localhost:80</span>
      </div>

      {/* Metric Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clients Card */}
        <div className="glass-card p-5 relative overflow-hidden group border-l-4 border-l-emerald-500 bg-white/95 dark:bg-slate-900/85">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Active Clients</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{fmt(stats?.total_clients)}</span>
            <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">+100% active</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">Registered property owners</p>
        </div>

        {/* Properties Card */}
        <div className="glass-card p-5 relative overflow-hidden group border-l-4 border-l-amber-500 bg-white/95 dark:bg-slate-900/85">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Properties</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{fmt(stats?.total_properties)}</span>
            <span className="text-xs font-mono text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">Portfolio</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">Managed real estate assets</p>
        </div>

        {/* Inspections Card */}
        <div className="glass-card p-5 relative overflow-hidden group border-l-4 border-l-cyan-500 bg-white/95 dark:bg-slate-900/85">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">Total Inspections</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{fmt(stats?.total_inspections)}</span>
            <span className="text-xs font-mono text-cyan-800 dark:text-cyan-300 font-bold bg-cyan-100 dark:bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-500/30">Live Feed</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">Completed & active field audits</p>
        </div>

        {/* Completion Rate Card */}
        <div className="glass-card p-5 relative overflow-hidden group border-l-4 border-l-indigo-500 bg-white/95 dark:bg-slate-900/85">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Completion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-400">{fmt(stats?.completion_rate, '%')}</span>
            <span className="text-xs font-mono text-indigo-800 dark:text-indigo-300 font-bold bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-500/30">Target 100%</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">Verified PDF report outputs</p>
        </div>
      </div>

      {/* Main Grid: Status Breakdown + Workflow Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown (2 cols) */}
        <div className="glass-card p-6 lg:col-span-2 bg-white/95 dark:bg-slate-900/85">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Inspection Status Distribution</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Live breakdown across all scheduled and finished property audits.</p>
            </div>
            <button
              onClick={() => navigate('/inspections')}
              className="text-xs font-mono text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
              type="button"
            >
              View All →
            </button>
          </div>

          {!stats?.inspections_by_status || Object.keys(stats.inspections_by_status).length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-linear-to-b from-slate-50 to-indigo-50/30 dark:from-slate-900/60 dark:to-slate-900/20 border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-bold mb-3">No inspections recorded yet.</p>
              <button
                onClick={() => navigate('/inspections')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer"
                type="button"
              >
                Create Your First Inspection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.inspections_by_status).map(([status, count]) => {
                const pct = stats.total_inspections > 0 ? (count / stats.total_inspections) * 100 : 0;
                
                // Color theme mapping per status
                const themeMap: Record<string, { bg: string; bar: string; text: string; badge: string }> = {
                  draft: { bg: 'bg-amber-50/80 dark:bg-amber-950/30', bar: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-amber-900 dark:text-amber-200', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
                  scheduled: { bg: 'bg-indigo-50/80 dark:bg-indigo-950/30', bar: 'bg-gradient-to-r from-indigo-500 to-blue-500', text: 'text-indigo-900 dark:text-indigo-200', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300' },
                  in_progress: { bg: 'bg-cyan-50/80 dark:bg-cyan-950/30', bar: 'bg-gradient-to-r from-cyan-500 to-teal-500', text: 'text-cyan-900 dark:text-cyan-200', badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300' },
                  completed: { bg: 'bg-emerald-50/80 dark:bg-emerald-950/30', bar: 'bg-gradient-to-r from-emerald-500 to-teal-500', text: 'text-emerald-900 dark:text-emerald-200', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
                };
                const t = themeMap[status] || { bg: 'bg-slate-100 dark:bg-slate-800/40', bar: 'bg-emerald-500', text: 'text-slate-900 dark:text-slate-200', badge: 'bg-slate-200 text-slate-800' };

                return (
                  <div key={status} className={`p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 ${t.bg}`}>
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className={`capitalize font-extrabold tracking-wide ${t.text}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{count} records</span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${t.badge}`}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${t.bar} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Workflow Quick Launcher (1 col) */}
        <div className="glass-card p-6 flex flex-col justify-between bg-white/95 dark:bg-slate-900/85">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Inspection Workflow</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">Standard 4-step field execution process.</p>

            <div className="space-y-3">
              {[
                { step: '01', title: 'Client Onboarding', desc: 'Create client record and contact details.', path: '/clients', bg: 'bg-emerald-600 text-white' },
                { step: '02', title: 'Property Registration', desc: 'Register property parameters and year built.', path: '/properties', bg: 'bg-indigo-600 text-white' },
                { step: '03', title: 'Field Media & Vision AI', desc: 'Capture photos, analyze defects with AI Vision.', path: '/inspections', bg: 'bg-cyan-600 text-white' },
                { step: '04', title: 'PDF Report & Verification', desc: 'Generate signed PDF and QR verification link.', path: '/reports', bg: 'bg-violet-600 text-white' },
              ].map(({ step, title, desc, path, bg }) => (
                <button
                  key={step}
                  onClick={() => navigate(path)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60 text-left transition-all cursor-pointer group shadow-sm"
                  type="button"
                >
                  <span className={`font-mono text-xs font-extrabold px-2 py-1 rounded-lg shrink-0 shadow-sm ${bg}`}>
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{title}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug font-medium">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between font-semibold">
            <span>Security: JWT Cookie Scoped</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">● Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

