import { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[rgb(var(--canvas))] px-4 py-10">
      <div className="w-full max-w-md">
        <Link className="mb-8 inline-block text-xl font-bold tracking-tight text-[rgb(var(--text))]" to="/login">DefectLoupe</Link>
        <section className="app-card p-6 sm:p-8">{children}</section>
      </div>
    </main>
  );
}
