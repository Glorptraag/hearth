'use client';

interface HEUFieldsProps {
  registrationNumber: string;
  nextReportDate: string;
  state: string;
  onChange: (field: string, value: string) => void;
}

const AU_STATES = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

export default function HEUFields({
  registrationNumber,
  nextReportDate,
  state,
  onChange,
}: HEUFieldsProps) {
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
          {AU_STATES.map((s) => (
            <option key={s} value={s} className="bg-surface-panel">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm">
        <label className="mb-xs block font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Registration Number
        </label>
        <input
          type="text"
          value={registrationNumber}
          onChange={(e) => onChange('heuRegistrationNumber', e.target.value)}
          placeholder="e.g. HEU-12345"
          className="w-full bg-transparent font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm">
        <label className="mb-xs block font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Next Reporting Date
        </label>
        <input
          type="date"
          value={nextReportDate}
          onChange={(e) => onChange('heuNextReportDate', e.target.value)}
          className="w-full bg-transparent font-sans text-sm text-text-primary focus:outline-none [color-scheme:dark]"
        />
      </div>

      <p className="font-sans text-xs text-text-muted">
        Used to calculate compliance countdown in your learning reports. Hearth never shares this data.
      </p>
    </div>
  );
}
