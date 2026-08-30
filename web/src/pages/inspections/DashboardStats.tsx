/**
 * Dashboard stats cards — shows inspection/client/property counts.
 * M2 scope: inspection summary cards on dashboard (integrates with M1's layout).
 * Drop into M1's scaffold at src/pages/inspections/DashboardStats.tsx
 */
import { useState, useEffect } from "react";
import { api, ApiError } from "../../services/api";

interface DashboardStats {
  total_clients: number;
  total_properties: number;
  total_inspections: number;
  inspections_by_status: Record<string, number>;
  completion_rate: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats")
      .then(setStats)
      .catch((err) => setError((err as ApiError).detail || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No stats available yet. Create some inspections to see data.</p>
      </div>
    );
  }

  const cards = [
    { label: "Clients", value: stats.total_clients, color: "bg-blue-500" },
    { label: "Properties", value: stats.total_properties, color: "bg-green-500" },
    { label: "Inspections", value: stats.total_inspections, color: "bg-purple-500" },
    { label: "Completion Rate", value: `${stats.completion_rate}%`, color: "bg-yellow-500" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} text-white rounded-lg p-4`}>
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-3">Inspections by Status</h3>
        {Object.keys(stats.inspections_by_status).length === 0 ? (
          <p className="text-sm text-gray-400">No inspections yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.inspections_by_status).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="capitalize text-sm">{status.replace("_", " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-200 rounded-full h-2 w-32 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${stats.total_inspections > 0 ? (count / stats.total_inspections) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
