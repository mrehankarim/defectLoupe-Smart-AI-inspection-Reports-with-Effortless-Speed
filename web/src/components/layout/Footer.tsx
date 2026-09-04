import { NavLink } from "react-router-dom";

export function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <NavLink to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-decoration-none">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">DefectLoupe</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                v2.4
              </span>
            </NavLink>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Smart AI property inspection reports with effortless speed and automated vision analysis.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Services Operational
            </div>
          </div>

          {/* Workspace Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-900 dark:text-slate-300">Workspace</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <NavLink to="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                  Command Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/clients" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                  Clients Directory
                </NavLink>
              </li>
              <li>
                <NavLink to="/properties" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                  Properties Portfolio
                </NavLink>
              </li>
              <li>
                <NavLink to="/inspections" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                  Inspections Workbench
                </NavLink>
              </li>
            </ul>
          </div>

          {/* AI Engine */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-900 dark:text-slate-300">AI & Media Engine</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">●</span> Gemini 1.5 Vision Analysis
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">●</span> Whisper STT Audio Transcriber
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">●</span> PgVector RAG Document Search
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">●</span> Automated PDF Generator
              </li>
            </ul>
          </div>

          {/* Platform & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-900 dark:text-slate-300">Security & Core</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>FastAPI Microservices Architecture</li>
              <li>Traefik Reverse Proxy Gateway</li>
              <li>Encrypted JWT Cookie Authentication</li>
              <li>Public QR Verification Scanner</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
          <p>© 2026 DefectLoupe. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Built with React Vite & Tailwind CSS</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer font-medium"
              type="button"
            >
              ↑ Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
