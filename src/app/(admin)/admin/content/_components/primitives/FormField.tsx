'use client';

import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, required, hint, children }: FormFieldProps) {
  return (
    <div className="mb-lg">
      <label className="block font-sans text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-1.5">
        {label}
        {required && <span className="text-ember"> *</span>}
      </label>
      {children}
      {hint && (
        <div className="mt-1 font-sans text-[0.7rem] italic text-text-muted">{hint}</div>
      )}
    </div>
  );
}

const inputClasses =
  'w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-sm outline-none transition-colors duration-150 focus:border-ember focus:shadow-[0_0_0_3px_rgba(217,123,58,0.15)] placeholder:text-text-muted/60';

const textareaClasses =
  'w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary text-sm outline-none transition-colors duration-150 resize-y leading-relaxed focus:border-ember focus:shadow-[0_0_0_3px_rgba(217,123,58,0.15)] placeholder:text-text-muted/60';

interface InputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'url';
  placeholder?: string;
  className?: string;
}

export function Input({ value, onChange, type = 'text', placeholder, className }: InputProps) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) =>
        onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
      }
      placeholder={placeholder}
      className={`${inputClasses} ${className ?? ''}`}
    />
  );
}

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  serif?: boolean;
  className?: string;
}

export function TextArea({ value, onChange, rows = 3, placeholder, serif, className }: TextAreaProps) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`${textareaClasses} ${serif ? 'font-serif text-[0.95rem]' : 'font-sans'} ${className ?? ''}`}
    />
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ value, onChange, options, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClasses} cursor-pointer appearance-none pr-8 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239B8B7E' d='M3 5l3 3 3-3'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] ${className ?? ''}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Pill({ active, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-sans cursor-pointer transition-all duration-150 border ${
        active
          ? 'bg-ember/15 border-ember text-text-primary'
          : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium'
      }`}
    >
      {children}
    </button>
  );
}
