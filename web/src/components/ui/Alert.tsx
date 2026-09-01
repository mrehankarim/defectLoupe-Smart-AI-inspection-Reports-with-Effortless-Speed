import { ReactNode } from "react";

type AlertProps = {
  children: ReactNode;
  variant?: "error" | "success" | "info";
  title?: string;
};

export function Alert({ children, variant = "error", title }: AlertProps) {
  const icon = {
    error: (
      <svg className="h-5 w-5 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[variant];

  const alertClass = {
    error: "alert-error",
    success: "alert-success",
    info: "alert-info",
  }[variant];

  return (
    <div className={alertClass} role={variant === "error" ? "alert" : "status"}>
      {icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold leading-none mb-1">{title}</h5>}
        <div className="text-sm font-normal">{children}</div>
      </div>
    </div>
  );
}
