'use client';

import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowedValues?: { value: string; label: string }[];
}

export function TagInput({ values, onChange, placeholder, allowedValues }: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput('');
  }

  function removeTag(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && values.length > 0) {
      removeTag(values.length - 1);
    }
  }

  if (allowedValues) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {allowedValues.map((opt) => {
          const active = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (active) onChange(values.filter((v) => v !== opt.value));
                else onChange([...values, opt.value]);
              }}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-sans cursor-pointer transition-all duration-150 border ${
                active
                  ? 'bg-ember/15 border-ember text-text-primary'
                  : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-surface-raised border border-border-subtle rounded-[8px] min-h-[42px] focus-within:border-ember focus-within:shadow-[0_0_0_3px_rgba(217,123,58,0.15)] transition-colors duration-150">
      {values.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-1 bg-surface-panel border border-border-subtle rounded text-xs text-text-primary font-sans"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="text-text-muted hover:text-ember ml-0.5 font-sans"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={values.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] bg-transparent text-text-primary text-sm font-sans outline-none placeholder:text-text-muted/60"
      />
    </div>
  );
}
