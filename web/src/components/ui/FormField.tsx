import { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export function FormField({ id, label, error, hint, className = "", ...props }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className={`form-input ${className}`}
        id={id}
        {...props}
      />
      {hint && <p className="mt-1 text-sm text-[rgb(var(--text-muted))]" id={hintId}>{hint}</p>}
      {error && <p className="form-error" id={errorId}>{error}</p>}
    </div>
  );
}
