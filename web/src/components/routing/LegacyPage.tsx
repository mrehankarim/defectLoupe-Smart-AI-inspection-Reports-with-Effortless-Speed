import { ReactNode } from "react";

export function LegacyPage({ children }: { children: ReactNode }) {
  return <div className="legacy-page min-h-full">{children}</div>;
}
