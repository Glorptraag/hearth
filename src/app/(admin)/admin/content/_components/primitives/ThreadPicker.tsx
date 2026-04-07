'use client';

import type { CapabilityThreadOption } from '@/lib/content-studio/types';

interface ThreadPickerProps {
  threads: CapabilityThreadOption[];
  selected: string[];
  onChange: (threadId: string) => void;
}

export function ThreadPicker({ threads, selected, onChange }: ThreadPickerProps) {
  const grouped = threads.reduce<Record<string, CapabilityThreadOption[]>>((acc, t) => {
    const d = t.domain || 'other';
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});

  return (
    <div>
      <div className="text-xs text-text-secondary italic mb-3 font-sans">
        Curriculum thread mappings. Must be human-confirmed.
      </div>
      {Object.entries(grouped).map(([domain, domainThreads]) => (
        <div key={domain} className="mb-3">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5 font-sans">
            {domain}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {domainThreads.map((t) => {
              const active = selected.includes(t._id);
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => onChange(t._id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-sans cursor-pointer transition-all duration-150 border ${
                    active
                      ? 'bg-ember/15 border-ember text-text-primary'
                      : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
                  }`}
                >
                  <code className="font-mono text-[0.65rem] text-text-muted bg-surface-body px-1.5 py-0.5 rounded">
                    {t.slug}
                  </code>
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
