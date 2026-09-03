import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';

/* ── Text input with label ─────────────────────────────────────── */
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export function InputField({ label, error, helpText, id, className = '', ...rest }: InputFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors
          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
          ${error ? 'border-red-400' : 'border-border'}
          ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
      {helpText && !error && <span className="text-xs text-text-muted">{helpText}</span>}
    </div>
  );
}

/* ── Select with label ─────────────────────────────────────────── */
interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, children, id, className = '', ...rest }: SelectFieldProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none transition-colors
          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white
          ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

/* ── Textarea with label ───────────────────────────────────────── */
interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TextareaField({ label, id, className = '', ...rest }: TextareaFieldProps) {
  const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={textareaId} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none transition-colors resize-vertical min-h-[80px]
          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
          ${className}`}
        {...rest}
      />
    </div>
  );
}
