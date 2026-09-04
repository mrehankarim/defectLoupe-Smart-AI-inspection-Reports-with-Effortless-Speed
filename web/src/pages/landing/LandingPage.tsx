import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Footer } from "../../components/layout/Footer";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolvedTheme, setPreference } = useTheme();
  const isDark = resolvedTheme === "dark";

  function toggleTheme() {
    setPreference(isDark ? "light" : "dark");
  }

  return (
    <div
      className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors"
      style={{
        background: isDark
          ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.05) 50%, transparent 80%), #07090e"
          : "radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.10) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(14, 165, 233, 0.08) 0px, transparent 50%), #f1f5f9",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Landing Navbar */}
      <header
        className="sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors"
        style={{
          background: isDark ? "rgba(7, 9, 14, 0.88)" : "rgba(255, 255, 255, 0.92)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(203, 213, 225, 0.8)",
          boxShadow: isDark ? "0 4px 30px rgba(0, 0, 0, 0.4)" : "0 2px 10px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 text-decoration-none group shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold transition-all group-hover:scale-105"
              style={{
                background: isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.35)",
                boxShadow: "0 0 16px rgba(16,185,129,0.20)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span
              className="text-base font-extrabold tracking-tight flex items-center gap-1.5"
              style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
            >
              DefectLoupe
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                Pro
              </span>
            </span>
          </NavLink>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wide">
            <a href="#features" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#ai-engine" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              AI Vision & STT
            </a>
            <a href="#workflow" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Workflow
            </a>
            <a href="#metrics" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Performance
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
              type="button"
            >
              {isDark ? (
                <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                type="button"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              type="button"
            >
              Enter Workspace →
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-7xl mx-auto text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          DefectLoupe Engine v2.4 • Gemini Vision AI & Whisper STT
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 max-w-4xl mx-auto leading-[1.15]">
          Smart AI Property Inspection Reports with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-400 dark:to-indigo-400">
            Effortless Speed
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Transform hours of manual field auditing into instant, high-precision PDF reports powered by multimodal AI vision, audio note transcription, and PgVector RAG knowledge intelligence.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
            type="button"
          >
            Launch Command Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <button
            onClick={() => navigate("/inspections")}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md transition-all cursor-pointer"
            type="button"
          >
            New Inspection Audit
          </button>
        </div>

        {/* HUD Live Mockup Preview */}
        <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-slate-200/80 via-slate-300/40 to-emerald-500/10 dark:from-slate-800/80 dark:to-emerald-950/30 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="rounded-2xl bg-slate-900 p-4 sm:p-6 text-left text-slate-100 font-mono text-xs overflow-x-auto shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-400 font-bold">DefectLoupe Live Audit Feed</span>
              </div>
              <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                ● Live AI Processing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Vision AI Bounding</span>
                <p className="text-emerald-400 font-bold">Foundation Crack (Severity: High)</p>
                <p className="text-slate-400 text-[11px] mt-1">Confidence Score: 98.4%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Whisper Voice Note</span>
                <p className="text-cyan-300 font-bold">"Water moisture along basement east wall"</p>
                <p className="text-slate-400 text-[11px] mt-1">STT Status: Transcribed</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">RAG Compliance Match</span>
                <p className="text-indigo-400 font-bold">ASTM E2018-24 Standard Code</p>
                <p className="text-slate-400 text-[11px] mt-1">PgVector Distance: 0.12</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-[11px]">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified Signed PDF Report Generated in 1.4s
              </span>
              <span className="font-bold underline text-emerald-400 cursor-pointer" onClick={() => navigate("/reports")}>
                View Sample PDF →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest font-extrabold text-emerald-700 dark:text-emerald-400 mb-2">
            Engine Capabilities
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            Powered by Next-Gen Multimodal Architecture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="glass-card p-6 border-l-4 border-l-emerald-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Gemini 1.5 Vision AI</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload field photos for automated structural defect detection, severity grading, and damage bounding.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 border-l-4 border-l-indigo-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Whisper Voice STT</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Speak observations naturally in the field. Whisper STT instantly transcribes voice into clean report sections.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 border-l-4 border-l-cyan-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">PgVector RAG Search</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Query local building codes, inspector standards, and past reports with high-precision vector embeddings.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-6 border-l-4 border-l-violet-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Signed PDF & QR Codes</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate tamper-evident PDF exports complete with public QR code scanner verification for property buyers.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section id="workflow" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="glass-card p-8 sm:p-12 bg-white/95 dark:bg-slate-900/85">
          <div className="text-center mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">
              Execution Process
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              3 Simple Steps from Field to Final Report
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-mono text-base font-extrabold flex items-center justify-center shadow-md shadow-emerald-500/20 mb-4">
                01
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Capture Field Media</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Snap photos of property rooms and record quick voice notes using mobile or desktop browser.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <span className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-mono text-base font-extrabold flex items-center justify-center shadow-md shadow-indigo-500/20 mb-4">
                02
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Automated AI Analysis</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gemini Vision categorizes defects while Whisper transcribes audio notes into structured findings.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <span className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-mono text-base font-extrabold flex items-center justify-center shadow-md shadow-violet-500/20 mb-4">
                03
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Verify & Export PDF</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Review findings in the command dashboard and publish signed PDF reports with QR verification links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Performance Section */}
      <section id="metrics" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 block mb-1">10x</span>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">Faster Audits</span>
          </div>
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 block mb-1">99.4%</span>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">Vision Accuracy</span>
          </div>
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-400 block mb-1">100%</span>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">QR Verification</span>
          </div>
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-violet-600 dark:text-violet-400 block mb-1">0</span>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">Manual Bottlenecks</span>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Accelerate Your Property Inspection Workflow Today
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto mb-8 font-medium">
            Join property inspectors, asset managers, and engineering auditors saving hours on every report.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-4 rounded-2xl text-sm font-extrabold text-slate-900 bg-white hover:bg-emerald-50 shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
            type="button"
          >
            Launch DefectLoupe Workspace →
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
