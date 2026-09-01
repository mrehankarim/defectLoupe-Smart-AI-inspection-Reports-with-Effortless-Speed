import { InputHTMLAttributes, ReactNode } from "react";

type GlassInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  error?: string;
  hint?: string;
};

export function GlassInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  error,
  hint,
  autoComplete,
  disabled = false,
  id,
  className = "",
  ...props
}: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[12px] font-mono font-medium tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-4 text-slate-500 dark:text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            background: error
              ? "rgba(239,68,68,0.08)"
              : "var(--input-bg)",
            border: `1px solid ${error ? "rgba(239,68,68,0.40)" : "var(--input-border)"}`,
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)",
            transition: "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? "rgba(239,68,68,0.60)"
              : "rgba(99,102,241,0.55)";
            e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.25), 0 0 0 3px rgba(99,102,241,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "rgba(239,68,68,0.40)"
              : "var(--input-border)";
            e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.25)";
          }}
          className={[
            "w-full rounded-xl py-3 text-[15px] text-[rgb(var(--text))] placeholder-slate-500 outline-none",
            icon ? "pl-11 pr-4" : "px-4",
            disabled ? "opacity-50 cursor-not-allowed" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-[12px] font-medium text-rose-500 dark:text-rose-400">{error}</p>}
      {hint && !error && <p className="text-[12px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
export default GlassInput;
