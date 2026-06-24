import clsx from "clsx";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx(
      "flex flex-col items-center justify-center rounded-2xl border border-line bg-surface/50 px-8 py-16 text-center",
      className
    )}>
      {icon && (
        <div className="mb-4 text-4xl opacity-40">{icon}</div>
      )}
      <h3 className="font-display text-lg font-semibold text-white/70">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-white/40">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}
