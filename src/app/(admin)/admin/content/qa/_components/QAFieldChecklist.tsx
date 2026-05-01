'use client';

import type { QAIssue } from '@/lib/content-qa/types';

interface Props {
  docId: string;
  docTitle: string;
  docType: string;
  completeness: number;
  errors: QAIssue[];
  warnings: QAIssue[];
  onClose: () => void;
}

export default function QAFieldChecklist({ docId, docTitle, docType, completeness, errors, warnings, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[400px] border-l border-border-subtle bg-surface-panel shadow-float overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border-subtle px-lg py-md">
        <h3 className="font-sans text-[0.85rem] font-semibold text-text-primary">
          Field Checklist
        </h3>
        <button
          onClick={onClose}
          className="font-sans text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
        >
          Close
        </button>
      </div>

      <div className="p-lg">
        <div className="mb-lg">
          <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.65rem] text-text-secondary capitalize mb-xs">
            {docType}
          </span>
          <h4 className="font-serif text-base font-semibold text-text-primary">
            {docTitle}
          </h4>
          <div className="flex items-center gap-sm mt-sm">
            <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className={`h-full rounded-full ${completeness >= 90 ? 'bg-sage' : completeness >= 70 ? 'bg-text-muted' : 'bg-ember'}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="font-sans text-xs text-text-muted">{completeness}%</span>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-lg">
            <h5 className="font-sans text-[0.7rem] font-semibold text-ember uppercase tracking-wider mb-sm">
              Errors ({errors.length})
            </h5>
            <div className="space-y-xs">
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="rounded-md border border-ember/20 bg-ember/5 px-sm py-xs"
                >
                  <span className="font-mono text-[0.65rem] text-text-muted block mb-px">
                    {err.field}
                  </span>
                  <span className="font-sans text-xs text-text-secondary">
                    {err.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-lg">
            <h5 className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider mb-sm">
              Warnings ({warnings.length})
            </h5>
            <div className="space-y-xs">
              {warnings.map((warn, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border-subtle bg-surface-raised px-sm py-xs"
                >
                  <span className="font-mono text-[0.65rem] text-text-muted block mb-px">
                    {warn.field}
                  </span>
                  <span className="font-sans text-xs text-text-secondary">
                    {warn.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.length === 0 && warnings.length === 0 && (
          <p className="font-sans text-sm text-sage">All fields complete.</p>
        )}

        <div className="mt-lg pt-md border-t border-border-subtle">
          <span className="font-mono text-[0.6rem] text-text-muted block">
            ID: {docId}
          </span>
        </div>
      </div>
    </div>
  );
}
