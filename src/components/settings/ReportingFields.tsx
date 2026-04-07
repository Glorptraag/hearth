'use client';

import { getJurisdiction } from '@/config/jurisdictions';

const AU_STATES = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

interface ReportingFieldsProps {
  registrationNumber: string;
  nextReportDate: string;
  state: string;
  onChange: (field: string, value: string) => void;
}

export default function ReportingFields({
  registrationNumber,
  nextReportDate,
  state,
  onChange,
}: ReportingFieldsProps) {
  const config = getJurisdiction(state || null);

  return (
    <div className="flex flex-col gap-md">
      <div className="rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm">
        <p className="mb-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          State / Territory
        </p>
        <select
          value={state}
          onChange={(e) => onChange('state', e.target.value)}
          className="w-full bg-transparent font-sans text-sm text-text-primary focus:outline-none"
        >
          <option value="" className="bg-surface-panel">Select your state or territory</option>
          {AU_STATES.map((s) => (
            <option key={s} value={s} className="bg-surface-panel">
              {s}
            </option>
          ))}
        </select>
      </div>

      {!state ? (
        <p className="font-sans text-sm text-text-muted">
          Select your state in Family Profile to see reporting options for your area.
        </p>
      ) : (
        <>
          <div className="rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm">
            <label className="mb-xs block font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              {config.registrationLabel}
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => onChange('registrationNumber', e.target.value)}
              placeholder={config.registrationHint}
              className="w-full bg-transparent font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm">
            <label className="mb-xs block font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              {config.reviewDateLabel}
            </label>
            <input
              type="date"
              value={nextReportDate}
              onChange={(e) => onChange('nextReportDate', e.target.value)}
              className="w-full bg-transparent font-sans text-sm text-text-primary focus:outline-none [color-scheme:dark]"
            />
          </div>

          <p className="font-sans text-xs text-text-muted">
            Used to calculate your reporting countdown. Hearth never shares this data.
          </p>
        </>
      )}
    </div>
  );
}
