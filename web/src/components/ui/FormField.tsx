import { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function FormField({
  id,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="w-full">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400 dark:text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
          className={`form-input ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${
            error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : ""
          } ${className}`}
          id={id}
          {...props}
        />
        {rightIcon && <div className="absolute right-3 flex items-center">{rightIcon}</div>}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="form-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
