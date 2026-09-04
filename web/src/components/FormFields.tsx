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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
          ${error ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'}
          ${className}`}
        {...rest}
      />
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      {helpText && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{helpText}</span>}
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-colors
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors resize-vertical min-h-[80px]
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
          ${className}`}
        {...rest}
      />
    </div>
  );
}
