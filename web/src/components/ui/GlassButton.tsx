import { ReactNode, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export type ButtonVariant = "primary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

interface GlassButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[rgba(99,102,241,0.12)] dark:bg-[rgba(99,102,241,0.18)]",
    "border-indigo-300/80 dark:border-[rgba(99,102,241,0.35)]",
    "text-indigo-600 dark:text-indigo-200",
    "hover:bg-[rgba(99,102,241,0.20)] dark:hover:bg-[rgba(99,102,241,0.26)]",
    "hover:border-indigo-400 dark:hover:border-[rgba(99,102,241,0.5)]",
  ].join(" "),
  ghost: [
    "bg-slate-100/70 dark:bg-[rgba(255,255,255,0.06)]",
    "border-slate-200/80 dark:border-[rgba(255,255,255,0.11)]",
    "text-slate-700 dark:text-slate-200",
    "hover:bg-slate-200/80 dark:hover:bg-[rgba(255,255,255,0.10)]",
    "hover:border-slate-300 dark:hover:border-[rgba(255,255,255,0.18)]",
  ].join(" "),
  danger: [
    "bg-[rgba(239,68,68,0.10)] dark:bg-[rgba(239,68,68,0.15)]",
    "border-rose-300/80 dark:border-[rgba(239,68,68,0.30)]",
    "text-rose-600 dark:text-rose-300",
    "hover:bg-[rgba(239,68,68,0.18)] dark:hover:bg-[rgba(239,68,68,0.22)]",
    "hover:border-rose-400 dark:hover:border-[rgba(239,68,68,0.45)]",
  ].join(" "),
  success: [
    "bg-[rgba(34,197,94,0.10)] dark:bg-[rgba(34,197,94,0.14)]",
    "border-emerald-300/80 dark:border-[rgba(34,197,94,0.28)]",
    "text-emerald-600 dark:text-emerald-300",
    "hover:bg-[rgba(34,197,94,0.18)] dark:hover:bg-[rgba(34,197,94,0.20)]",
    "hover:border-emerald-400 dark:hover:border-[rgba(34,197,94,0.42)]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5 rounded-xl font-semibold",
  md: "px-6 py-2.5 text-[15px] gap-2 rounded-2xl font-semibold",
  lg: "px-8 py-3.5 text-base gap-2.5 rounded-2xl font-semibold",
};

export function GlassButton({
  children,
  variant = "ghost",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  type = "button",
  fullWidth = false,
  onClick,
  className = "",
}: GlassButtonProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  const lightShadow = pressed
    ? "inset 0 1px 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.05)"
    : "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 6px rgba(99,102,241,0.12), 0 1px 2px rgba(0,0,0,0.04)";

  const darkShadow = pressed
    ? "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 2px 6px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.45)"
    : "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 14px rgba(0,0,0,0.25)";

  return (
    <button
      type={type}
      onMouseDown={() => !isDisabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !isDisabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: isDark ? darkShadow : lightShadow,
        transform: pressed ? "translateY(1px) scale(0.985)" : "translateY(0) scale(1)",
        transition: pressed
          ? "transform 60ms linear, box-shadow 60ms linear"
          : "transform 220ms cubic-bezier(0.16,1,0.3,1), box-shadow 220ms cubic-bezier(0.16,1,0.3,1), background-color 160ms ease, border-color 160ms ease",
        opacity: isDisabled ? 0.42 : 1,
        width: fullWidth ? "100%" : undefined,
      }}
      className={[
        "relative inline-flex items-center justify-center select-none cursor-pointer border tracking-[-0.01em]",
        variantStyles[variant],
        sizeStyles[size],
        isDisabled ? "cursor-not-allowed pointer-events-none" : "",
        className,
      ].join(" ")}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {children}
        </span>
      ) : (
        <>
          {icon && <span className="shrink-0 opacity-80">{icon}</span>}
          {children}
          {iconRight && <span className="shrink-0 opacity-80">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
export default GlassButton;
