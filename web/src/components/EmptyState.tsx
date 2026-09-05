import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <div className="flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
        {icon || (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
