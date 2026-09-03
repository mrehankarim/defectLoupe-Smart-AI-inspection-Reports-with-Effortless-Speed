import { useState, useEffect } from "react";
import { api, ApiError } from "../../services/api";
import { useToast } from "../../components/Layout";
import { StatCard } from "../../components/Card";
import { Card } from "../../components/Card";

interface DashboardStats {
  total_clients: number;
  total_properties: number;
  total_inspections: number;
  inspections_by_status: Record<string, number>;
  completion_rate: number;
}

export default function DashboardStats() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats")
      .then(setStats)
      .catch((err) => showToast((err as ApiError).detail || "Failed to load stats", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) {
    return (
      <div className="text-center py-16 text-text-muted">
        <div className="animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p>No stats available yet. Create some inspections to see data.</p>
      </div>
    );
  }

  const cards = [
    { label: "Clients", value: stats.total_clients },
    { label: "Properties", value: stats.total_properties },
    { label: "Inspections", value: stats.total_inspections },
    { label: "Completion Rate", value: `${stats.completion_rate}%`, accent: "text-green-600" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            accent={(card as { accent?: string }).accent}
          />
        ))}
      </div>

      <Card>
        <h3 className="font-bold text-text-primary mb-4">Inspections by Status</h3>
        {Object.keys(stats.inspections_by_status).length === 0 ? (
          <p className="text-sm text-text-secondary">No inspections yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(stats.inspections_by_status).map(([status, count]) => {
              const pct = stats.total_inspections > 0 ? (count / stats.total_inspections) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary capitalize w-28 shrink-0">
                    {status.replace(/_/g, " ")}
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
    </div>
  );
}
