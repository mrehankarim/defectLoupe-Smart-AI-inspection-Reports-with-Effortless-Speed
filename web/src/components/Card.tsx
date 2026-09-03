import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`bg-surface-card border border-border rounded-xl shadow-[0_2px_7px_rgba(16,43,49,0.03)] ${
        padding ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, icon, accent = 'text-brand-500' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary m-0">{label}</p>
          <p className={`text-3xl font-bold mt-1 m-0 ${accent}`}>{value}</p>
        </div>
        {icon && <div className="text-brand-200">{icon}</div>}
      </div>
    </Card>
  );
}
