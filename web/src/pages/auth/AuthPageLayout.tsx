import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

function Noise() {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.035]" style={{ zIndex: 0 }}>
      <filter id="n3">
        <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#n3)" />
    </svg>
  );
}

export function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function AuthPageLayout({ children }: { children: ReactNode }) {
  const { resolvedTheme, setPreference } = useTheme();

  function toggleTheme() {
    setPreference(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-4 py-8 overflow-hidden select-none">
      <Noise />

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 550,
            height: 550,
            top: "-15%",
            right: "5%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 350,
            height: 350,
            bottom: "5%",
            left: "2%",
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Header Bar */}
      <header className="relative z-20 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link className="flex items-center gap-3 group" to="/login">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-300 transition-transform group-hover:scale-105"
            style={{
              background: "rgba(99,102,241,0.18)",
              border: "1px solid rgba(99,102,241,0.35)",
              boxShadow: "0 0 20px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <IconShield />
          </div>
          <div>
            <span className="text-base font-bold tracking-[ -0.02em] text-slate-900 dark:text-slate-100">DefectLoupe</span>
            <span className="ml-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-600 dark:text-indigo-300">
              AI MVP
            </span>
          </div>
        </Link>

        {/* Theme Toggle Header Button */}
        <button
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(12px)",
          }}
          onClick={toggleTheme}
          title={`Currently in ${resolvedTheme} mode (click to toggle)`}
          type="button"
        >
          {resolvedTheme === "dark" ? (
            <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* Main Glass Card Form Body */}
      <main className="relative z-10 w-full max-w-[460px] mx-auto my-auto py-6">
        <div className="glass-panel rounded-3xl p-7 sm:p-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-center text-[12px] text-slate-500 font-medium">
        © 2026 DefectLoupe — AI Property Inspection Platform
      </footer>
    </div>
  );
}
