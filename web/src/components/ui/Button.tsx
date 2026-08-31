import { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${variant === "primary" ? "btn-primary" : "btn-secondary"} ${className}`} {...props} />;
}
