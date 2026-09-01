import { GlassButton } from "../../components/ui/GlassButton";
import DashboardStats from "../inspections/DashboardStats";

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Good morning — here's your inspection overview.</p>
        </div>
        <GlassButton icon={<IconPlus />} size="md" variant="primary">
          New Inspection
        </GlassButton>
      </div>

      {/* 4 Stat Cards & Inspection Breakdown */}
      <DashboardStats />
    </div>
  );
}
