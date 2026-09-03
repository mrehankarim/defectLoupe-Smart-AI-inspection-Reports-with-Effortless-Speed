interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-lg font-semibold text-text-primary mb-1">{title}</p>
      {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
