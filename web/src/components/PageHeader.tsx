import { type ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <p className="text-[11px] tracking-[0.13em] font-extrabold text-brand-500 uppercase m-0 mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-bold text-text-primary m-0 leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-text-secondary mt-1 m-0">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
