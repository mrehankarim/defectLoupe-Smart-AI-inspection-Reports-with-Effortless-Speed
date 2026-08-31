import DashboardStats from "../inspections/DashboardStats";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Overview</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Inspection dashboard</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">Track your current clients, properties, and inspection activity.</p>
      </div>
      <DashboardStats />
    </div>
  );
}
