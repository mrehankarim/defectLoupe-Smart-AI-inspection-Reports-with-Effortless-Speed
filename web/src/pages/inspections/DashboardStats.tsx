import { useState, useEffect } from "react";
import { api, ApiError } from "../../services/api";

interface DashboardStatsData {
  total_clients: number;
  total_properties: number;
  total_inspections: number;
  inspections_by_status: Record<string, number>;
  completion_rate: number;
}

const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconFileText = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconArrowUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardStatsData>("/dashboard/stats")
      .then(setStats)
      .catch((err) => setError((err as ApiError).detail || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 h-32 animate-pulse"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm mb-6">
        <p>{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Inspections",
      value: stats ? stats.total_inspections : 0,
      delta: "+12%",
      icon: <IconClipboard />,
      color: "#6366f1", // Indigo
    },
    {
      label: "Active Clients",
      value: stats ? stats.total_clients : 0,
      delta: "+3 this month",
      icon: <IconUsers />,
      color: "#22c55e", // Green
    },
    {
      label: "Properties",
      value: stats ? stats.total_properties : 0,
      delta: "+8 this month",
      icon: <IconHome />,
      color: "#f59e0b", // Amber
    },
    {
      label: "Completion Rate",
      value: stats ? `${stats.completion_rate}%` : "0%",
      delta: "+5 this week",
      icon: <IconFileText />,
      color: "#a78bfa", // Purple
    },
  ];

  return (
    <div className="space-y-8">
      {/* 4 Glass Stat Cards Grid matching exact image spec */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, delta, icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-indigo-500/40"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
              >
                {icon}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <IconArrowUp />
                <span>{delta}</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100">{value}</p>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inspections by Status Progress Breakdowns */}
      {stats && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="text-base font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100 mb-4">
            Inspections by Status
          </h3>
          {Object.keys(stats.inspections_by_status).length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No inspection records found.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.inspections_by_status).map(([status, count]) => {
                const percentage = stats.total_inspections > 0 ? Math.round((count / stats.total_inspections) * 100) : 0;
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{status.replace("_", " ")}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-36 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-200 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
