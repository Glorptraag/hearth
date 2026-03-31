interface SectionHeaderProps {
  overline: string;
  title: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ overline, title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-md">
      <div>
        <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
          {overline}
        </p>
        <h2 className="font-serif text-lg font-semibold text-text-primary">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
