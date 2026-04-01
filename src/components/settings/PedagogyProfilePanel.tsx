'use client';

const VALUES = [
  { id: 'child-led', label: 'Child-led learning', emoji: '🧒' },
  { id: 'structured', label: 'Structured curriculum', emoji: '📋' },
  { id: 'nature', label: 'Nature & outdoors', emoji: '🌿' },
  { id: 'arts', label: 'Arts & creativity', emoji: '🎨' },
  { id: 'academic', label: 'Academic rigour', emoji: '📚' },
  { id: 'real-world', label: 'Real-world connection', emoji: '🌍' },
  { id: 'flexibility', label: 'Flexibility & flow', emoji: '🌊' },
  { id: 'whole-child', label: 'Whole-child development', emoji: '💚' },
  { id: 'independence', label: 'Independence & autonomy', emoji: '🦅' },
  { id: 'mastery', label: 'Mastery & depth', emoji: '🎯' },
];

const PRACTICES = [
  { id: 'short-lessons', label: 'Short focused lessons', emoji: '⏱' },
  { id: 'extended-projects', label: 'Extended projects', emoji: '🏗' },
  { id: 'living-books', label: 'Living books & literature', emoji: '📖' },
  { id: 'hands-on', label: 'Hands-on activities', emoji: '🤲' },
  { id: 'narration', label: 'Narration & retelling', emoji: '🗣' },
  { id: 'nature-journaling', label: 'Nature journaling', emoji: '🌸' },
  { id: 'movement', label: 'Movement & rhythm', emoji: '🎵' },
  { id: 'rhythm', label: 'Daily/weekly rhythm', emoji: '🔄' },
  { id: 'documentation', label: 'Documentation & portfolios', emoji: '📁' },
  { id: 'free-play', label: 'Free play & exploration', emoji: '🎮' },
  { id: 'memory-work', label: 'Memory work & recitation', emoji: '🧠' },
  { id: 'copywork', label: 'Copywork & dictation', emoji: '✍' },
];

const VALUE_COMPATIBILITY: Record<string, Record<string, number>> = {
  charlotte_mason: { 'child-led': 2, 'nature': 2, 'living-books': 2, 'whole-child': 2, 'narration': 2, 'nature-journaling': 2, 'structured': 1, 'arts': 1 },
  classical: { 'structured': 2, 'academic': 2, 'mastery': 2, 'memory-work': 2, 'copywork': 2, 'narration': 2, 'living-books': 1 },
  montessori: { 'child-led': 2, 'independence': 2, 'hands-on': 2, 'real-world': 2, 'whole-child': 2, 'free-play': 1, 'nature': 1 },
  waldorf_steiner: { 'arts': 2, 'whole-child': 2, 'rhythm': 2, 'movement': 2, 'nature': 2, 'extended-projects': 1, 'flexibility': 1 },
  unschooling: { 'child-led': 2, 'flexibility': 2, 'independence': 2, 'real-world': 2, 'free-play': 2, 'nature': 1, 'whole-child': 1 },
  eclectic: { 'flexibility': 2, 'real-world': 1, 'child-led': 1, 'whole-child': 1 },
};

const PRACTICE_COMPATIBILITY: Record<string, Record<string, number>> = {
  charlotte_mason: { 'living-books': 2, 'narration': 2, 'nature-journaling': 2, 'short-lessons': 2, 'hands-on': 1, 'documentation': 1 },
  classical: { 'memory-work': 2, 'copywork': 2, 'short-lessons': 2, 'narration': 1, 'structured': 1, 'extended-projects': 1 },
  montessori: { 'hands-on': 2, 'free-play': 2, 'extended-projects': 2, 'documentation': 1, 'movement': 1 },
  waldorf_steiner: { 'rhythm': 2, 'movement': 2, 'arts': 2, 'extended-projects': 2, 'living-books': 1, 'nature-journaling': 1 },
  unschooling: { 'free-play': 2, 'extended-projects': 2, 'hands-on': 1, 'nature-journaling': 1 },
  eclectic: { 'hands-on': 1, 'documentation': 1 },
};

function CompatibilityDot({ score }: { score: number }) {
  if (score === 2) {
    return (
      <span className="flex items-center gap-[3px] font-sans text-[10px] text-sage">
        <span className="h-[6px] w-[6px] rounded-full bg-sage inline-block" />
        Great match
      </span>
    );
  }
  return null;
}

function getCompatibility(id: string, philosophy: string, map: Record<string, Record<string, number>>): number {
  return map[philosophy]?.[id] ?? 0;
}

export interface PedagogyProfilePanelProps {
  philosophy: string;
  selectedValues: string[];
  selectedPractices: string[];
  onValuesChange: (values: string[]) => void;
  onPracticesChange: (practices: string[]) => void;
}

export function PedagogyProfilePanel({
  philosophy,
  selectedValues,
  selectedPractices,
  onValuesChange,
  onPracticesChange,
}: PedagogyProfilePanelProps) {
  function toggleItem(id: string, selected: string[], maxItems: number, onChange: (items: string[]) => void) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length < maxItems) {
      onChange([...selected, id]);
    }
  }

  function moveItem(idx: number, direction: -1 | 1, selected: string[], onChange: (items: string[]) => void) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= selected.length) return;
    const next = [...selected];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-xl">
      {/* Values */}
      <div>
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
          Learning Values
        </p>
        <p className="font-serif text-sm text-text-secondary mb-md">
          Choose up to 5 values that reflect what matters most in your family&apos;s approach to learning.
        </p>

        {selectedValues.length > 0 && (
          <div className="mb-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Your priorities</p>
            <div className="flex flex-col gap-xs">
              {selectedValues.map((id, idx) => {
                const item = VALUES.find((v) => v.id === id)!;
                return (
                  <div key={id} className="flex items-center gap-sm bg-surface-raised rounded-md border border-ember/30 px-md py-sm">
                    <span className="font-sans text-[11px] font-semibold text-text-muted w-4 text-center">{idx + 1}</span>
                    <span className="text-sm">{item.emoji}</span>
                    <span className="font-serif text-sm text-text-primary flex-1">{item.label}</span>
                    <div className="flex gap-xs">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, -1, selectedValues, onValuesChange)}
                        disabled={idx === 0}
                        className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                      >↑</button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 1, selectedValues, onValuesChange)}
                        disabled={idx === selectedValues.length - 1}
                        className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                      >↓</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onValuesChange(selectedValues.filter((x) => x !== id))}
                      className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors"
                    >×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
          {VALUES.map((value) => {
            const isSelected = selectedValues.includes(value.id);
            const compat = getCompatibility(value.id, philosophy, VALUE_COMPATIBILITY);
            const canSelect = !isSelected && selectedValues.length < 5;
            return (
              <button
                key={value.id}
                type="button"
                onClick={() => toggleItem(value.id, selectedValues, 5, onValuesChange)}
                disabled={!isSelected && !canSelect}
                className={[
                  'flex items-start gap-sm rounded-md border p-sm text-left transition-all duration-200',
                  isSelected
                    ? 'border-ember/40 bg-ember-glow/30'
                    : canSelect
                    ? 'border-border-subtle hover:border-border-medium bg-surface-raised'
                    : 'border-border-subtle bg-surface-raised opacity-40 cursor-not-allowed',
                ].join(' ')}
              >
                <span className="text-base mt-[1px]">{value.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-text-primary">{value.label}</p>
                  <CompatibilityDot score={compat} />
                </div>
                {isSelected && <span className="text-ember text-sm">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="font-sans text-xs text-text-muted mt-xs">{selectedValues.length}/5 selected</p>
      </div>

      {/* Practices */}
      <div>
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
          Learning Practices
        </p>
        <p className="font-serif text-sm text-text-secondary mb-md">
          Choose up to 5 practices that describe how your family typically learns together.
        </p>

        {selectedPractices.length > 0 && (
          <div className="mb-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Your priorities</p>
            <div className="flex flex-col gap-xs">
              {selectedPractices.map((id, idx) => {
                const item = PRACTICES.find((p) => p.id === id)!;
                return (
                  <div key={id} className="flex items-center gap-sm bg-surface-raised rounded-md border border-ember/30 px-md py-sm">
                    <span className="font-sans text-[11px] font-semibold text-text-muted w-4 text-center">{idx + 1}</span>
                    <span className="text-sm">{item.emoji}</span>
                    <span className="font-serif text-sm text-text-primary flex-1">{item.label}</span>
                    <div className="flex gap-xs">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, -1, selectedPractices, onPracticesChange)}
                        disabled={idx === 0}
                        className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                      >↑</button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 1, selectedPractices, onPracticesChange)}
                        disabled={idx === selectedPractices.length - 1}
                        className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                      >↓</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPracticesChange(selectedPractices.filter((x) => x !== id))}
                      className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors"
                    >×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
          {PRACTICES.map((practice) => {
            const isSelected = selectedPractices.includes(practice.id);
            const compat = getCompatibility(practice.id, philosophy, PRACTICE_COMPATIBILITY);
            const canSelect = !isSelected && selectedPractices.length < 5;
            return (
              <button
                key={practice.id}
                type="button"
                onClick={() => toggleItem(practice.id, selectedPractices, 5, onPracticesChange)}
                disabled={!isSelected && !canSelect}
                className={[
                  'flex items-start gap-sm rounded-md border p-sm text-left transition-all duration-200',
                  isSelected
                    ? 'border-ember/40 bg-ember-glow/30'
                    : canSelect
                    ? 'border-border-subtle hover:border-border-medium bg-surface-raised'
                    : 'border-border-subtle bg-surface-raised opacity-40 cursor-not-allowed',
                ].join(' ')}
              >
                <span className="text-base mt-[1px]">{practice.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-text-primary">{practice.label}</p>
                  <CompatibilityDot score={compat} />
                </div>
                {isSelected && <span className="text-ember text-sm">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="font-sans text-xs text-text-muted mt-xs">{selectedPractices.length}/5 selected</p>
      </div>
    </div>
  );
}
