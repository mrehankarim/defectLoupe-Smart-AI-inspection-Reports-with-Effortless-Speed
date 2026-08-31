export function Alert({ children, variant = "error" }: { children: string; variant?: "error" | "success" }) {
  const message = typeof children === "string" ? children : "Something went wrong. Please try again.";

  return (
    <div className={variant === "error" ? "alert-error" : "alert-success"} role={variant === "error" ? "alert" : "status"}>
      {message}
    </div>
  );
}
