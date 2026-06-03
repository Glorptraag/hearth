import { Camera, ChatCircle, Note, LinkSimple, Microphone, X } from '@/components/icons';
import { SectionHeader } from './SectionHeader';
import type { LogIconC } from './loggerConstants';
import type { DraftEvidenceItem } from '@/lib/logger/draft';

// Note: 'audio' was added by Phase 2 (Task 2.2 — full audio capture via
// MediaRecorder, persisted as a learning_entry_evidence row). Kept in the
// same shape as the other tools so the EvidenceModal/CaptureTray composition
// picks it up automatically.
const EVIDENCE_TOOLS: ReadonlyArray<{ key: string; Icon: LogIconC; label: string }> = [
  { key: 'photo', Icon: Camera,     label: 'Add Photo' },
  { key: 'audio', Icon: Microphone, label: 'Record Audio' },
  { key: 'quote', Icon: ChatCircle, label: "Child's Words" },
  { key: 'note',  Icon: Note,       label: 'Add Note' },
  { key: 'link',  Icon: LinkSimple, label: 'Link Resource' },
];

interface EvidenceSectionProps {
  done: boolean;
  evidence: DraftEvidenceItem[];
  /** Open the capture modal for a tool ('photo' | 'quote' | 'note' | 'link'). */
  onOpenTool: (key: string) => void;
  onRemoveEvidence: (index: number) => void;
}

/**
 * Logger Section 6 — "Evidence" (optional). The four capture tools (each lit
 * sage once it holds an item) and the list of captured evidence with remove
 * buttons. Extracted verbatim from log/page.tsx; pure presentational, state
 * lifted to the page.
 */
export function EvidenceSection({
  done,
  evidence,
  onOpenTool,
  onRemoveEvidence,
}: EvidenceSectionProps) {
  return (
    <section>
      <SectionHeader number={6} done={done} label="Evidence" optional="Optional" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mb-md">
        {EVIDENCE_TOOLS.map((tool) => {
          const hasItems = evidence.some((e) => e.type === tool.key);
          return (
            <button
              key={tool.key}
              onClick={() => onOpenTool(tool.key)}
              className={`flex flex-col items-center gap-xs rounded-md border-2 p-md font-sans text-sm transition-all duration-200 min-h-[44px] ${
                hasItems
                  ? 'border-sage bg-sage/5 text-sage'
                  : 'border-dashed border-border-medium text-text-secondary hover:border-ember hover:text-text-primary'
              }`}
            >
              <span className="inline-flex" aria-hidden="true"><tool.Icon size={22} /></span>
              <span className="text-xs">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Evidence items */}
      {evidence.length > 0 && (
        <div className="space-y-sm">
          {evidence.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm"
            >
              <span className="font-sans text-xs font-medium uppercase tracking-wider text-text-muted bg-surface-hover rounded px-xs py-[2px]">
                {item.type}
              </span>
              <span className="flex-1 font-serif text-sm text-text-secondary truncate">
                {item.type === 'photo'
                  ? item.caption || 'Photo'
                  : item.type === 'link'
                    ? item.name || item.url || 'Link'
                    : item.content.slice(0, 60)}
              </span>
              <button
                onClick={() => onRemoveEvidence(i)}
                className="text-text-muted hover:text-text-primary min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Remove evidence item"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
