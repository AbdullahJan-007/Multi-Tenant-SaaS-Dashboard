export default function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink/55">{description}</p>}
      </div>
      {action}
    </div>
  );
}
