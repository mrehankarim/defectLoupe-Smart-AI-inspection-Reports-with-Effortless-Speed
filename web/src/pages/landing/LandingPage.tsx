import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Footer } from "../../components/layout/Footer";
import LogoIcon from "../../components/LogoIcon";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolvedTheme, setPreference } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Center-pinned 3D tilt state: center coordinates (0,0) have 0 rotation
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normX = (x - centerX) / centerX; // -1 at left edge, 0 at center, +1 at right edge
    const normY = (y - centerY) / centerY; // -1 at top edge, 0 at center, +1 at bottom edge

    // Tilts up to 11 degrees from the edges while center remains at 0 rotation
    setTilt({
      rotateX: -normY * 11,
      rotateY: normX * 11,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  }

  function handleCardMouseEnter() {
    setIsHovered(true);
  }

  function handleCardMouseLeave() {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }

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
              <LogoIcon size={18} />
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
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Features
            </a>
            <a
              href="#ai-engine"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("ai-engine")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              AI Vision & STT
            </a>
            <a
              href="#workflow"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Workflow
            </a>
            <a
              href="#metrics"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("metrics")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              type="button"
            >
              Enter Workspace →
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: 2-Column Layout (Text positioned higher, no tick boxes, pinned-center 3D card) */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Hero Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.12]">
              Professional Property Inspection Reports with{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-400 dark:to-indigo-400">
                Effortless Precision
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl">
              Built for chartered surveyors, structural auditors, and field inspectors. Conduct room-by-room walkthroughs, capture high-res defect photos, cross-reference municipal building codes, and generate certified, tamper-evident inspection reports in minutes.
            </p>

            {/* Hero CTA Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
                type="button"
              >
                Launch Command Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button
                onClick={() => navigate("/inspections")}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
                type="button"
              >
                Start Field Walkthrough
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-6 w-full max-w-lg">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">1,200+</div>
                <div className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">Audits Done</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">&lt; 2 min</div>
                <div className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">PDF Generation</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">100%</div>
                <div className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">QR Verifiable</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Center-Pinned Defect Specimen Card */}
          <div className="lg:col-span-5 perspective-distant">
            <div
              className="relative w-full cursor-pointer select-none"
              onMouseMove={handleCardMouseMove}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              {/* 3D Static Specimen Card with Center Pinned */}
              <div
                className="relative w-full rounded-3xl p-5 sm:p-6 text-left border shadow-2xl overflow-hidden flex flex-col justify-between"
                style={{
                  transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  transition: isHovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(7, 9, 14, 0.98))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.95))",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(203, 213, 225, 0.9)",
                  boxShadow: isHovered
                    ? "0 25px 50px -12px rgba(16, 185, 129, 0.18), 0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                    : "0 20px 40px -15px rgba(0, 0, 0, 0.2)",
                }}
              >
                {/* Dynamic Specular Light Flare Effect tracking cursor */}
                {isHovered && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-3xl z-30 transition-opacity duration-200"
                    style={{
                      background: `radial-gradient(circle 320px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.14), transparent 70%)`,
                    }}
                  />
                )}

                {/* Dossier Header */}
                <div
                  className="flex items-center justify-between border-b pb-3.5"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold shrink-0">
                      DL
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                        Audit Record #DL-4820
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Highland Ridge Residence
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Audit Complete
                  </span>
                </div>

                {/* Architecture Visual Preview */}
                <div className="my-3.5 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
                    alt="Highland Ridge Residence Inspection View"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xs font-semibold">742 Evergreen Terrace, Sector 4</p>
                    <p className="text-[11px] text-slate-200 opacity-90">Structural, Envelope & Electrical Assessment</p>
                  </div>
                </div>

                {/* Simple & Plain Property Information Grid */}
                <div className="space-y-2.5 mb-3.5 font-sans">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Inspection Scope</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">14 Audited Zones</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Building Standard</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">IBC & ASTM Aligned</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Lead Inspector</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sarah Jenkins, PE</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">License #8492-CA</span>
                  </div>
                </div>

                {/* Card Footer: Simple and Plain Action */}
                <div
                  className="pt-3 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)" }}
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cryptographic report verification sealed
                  </span>
                  <button
                    onClick={() => navigate("/inspections")}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Open Inspection
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest font-extrabold text-emerald-700 dark:text-emerald-400 mb-2">
            Inspection Capabilities
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            Engineered for Structural & Field Auditing Accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="glass-card p-6 sm:p-7 border-l-4 border-l-emerald-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">High-Resolution Defect Detection</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload photos from site walkthroughs for automatic structural crack classification, severity scoring, and bounding coordinates.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 sm:p-7 border-l-4 border-l-indigo-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Hands-Free Audio Dictation</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Record spoken inspector observations on site. Background speech transcription converts audio into clean, structured technical findings.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 sm:p-7 border-l-4 border-l-cyan-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-11 h-11 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Building Code Compliance Match</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Cross-reference findings against standard building codes (IBC, ASTM) and regional requirements using embedded vector search.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-6 sm:p-7 border-l-4 border-l-violet-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Signed PDF & QR Verification</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Generate tamper-evident PDF deliverables equipped with cryptographic public QR verification for buyers, insurers, and banks.
            </p>
          </div>
        </div>
      </section>

      {/* AI Vision & Speech Diagnostics Engine Section */}
      <section id="ai-engine" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">
            Dual AI Diagnostics Engine
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            Multimodal AI Vision & Field Speech-to-Text
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed">
            Real-time computer vision bounding coordinates for structural defects paired with hands-free Whisper voice transcription structured into certified engineering reports.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Panel 1: Computer Vision Defect Diagnostics */}
          <div className="glass-card p-6 sm:p-8 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      AI Vision Defect Diagnostics
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Spatial Bounding & Severity Classification
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  99.4% Precision
                </span>
              </div>

              {/* Defect Specimen View with Precision Bounding Box */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-slate-950 p-4 mb-6">
                {/* Visual Texture / Photo */}
                <div className="h-48 w-full rounded-xl relative overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1000&q=80"
                    alt="Structural concrete audit"
                    className="w-full h-full object-cover opacity-75 contrast-125"
                  />
                  {/* Subtle Grid Scanning Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(16, 185, 129, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.4) 1px, transparent 1px)",
                      backgroundSize: "24px 24px"
                    }}
                  />

                  {/* Simulated Bounding Box Overlay */}
                  <div
                    className="absolute border-2 border-dashed border-emerald-400 rounded-lg bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                    style={{ top: "18%", left: "22%", width: "56%", height: "64%" }}
                  >
                    {/* Bounding Corner Crosshairs */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-emerald-300" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-emerald-300" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-emerald-300" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-emerald-300" />

                    {/* Tag badge */}
                    <div className="absolute -top-3.5 left-2 bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      STRUCTURAL CRACK · 99.2%
                    </div>

                    <div className="absolute bottom-2 right-2 bg-slate-900/90 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                      [Y: 140, X: 220, W: 640, H: 380]
                    </div>
                  </div>
                </div>

                {/* Analysis telemetry bar */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Sensor: 48MP Optical RGB
                  </span>
                  <span>Latency: 410ms</span>
                </div>
              </div>

              {/* Analysis Metadata Breakdown */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Defect Classification</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Basement Foundation Wall Crack</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Severity 4 / 5
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Building Standard Match</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">IBC Section 1807.1.5 · Foundation Wall Cracking</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ASTM C823</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Automated bounding box & technical report injection
              </span>
              <button
                onClick={() => navigate("/inspections")}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                type="button"
              >
                Scan Photos →
              </button>
            </div>
          </div>

          {/* Panel 2: Field Speech-to-Text Dictation */}
          <div className="glass-card p-6 sm:p-8 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Whisper Audio Dictation (STT)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Voice Ingestion to Structured Observations
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  Real-Time STT
                </span>
              </div>

              {/* Audio Waveform & Speech Ingestion Player */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-950 p-4 mb-6">
                <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2 text-teal-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Inspector Field Dictation
                  </div>
                  <span>00:14 / 00:22 · 16kHz PCM</span>
                </div>

                {/* Soundwave bars */}
                <div className="h-16 flex items-center justify-center gap-1 px-2 py-2 bg-slate-900/90 rounded-xl border border-slate-800">
                  {[28, 45, 62, 35, 80, 95, 70, 40, 85, 100, 75, 50, 90, 65, 45, 85, 92, 60, 38, 70, 88, 52, 30, 65, 78, 42, 25, 60, 82, 55, 30, 48, 70, 35, 20].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-linear-to-t from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ height: `${h}%`, opacity: i > 25 ? 0.35 : 0.9 }}
                    />
                  ))}
                </div>

                {/* Raw Spoken Dictation Quote */}
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 italic font-serif leading-relaxed">
                  "Visible crack on the basement wall with water leaking through. Needs immediate repair."
                </div>
              </div>

              {/* Structured Extracted Finding */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Mapped Location</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Basement · North Foundation Wall</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Auto-Tagged</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Detected Defect</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Wall Crack with Water Leak</span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Hands-free audio dictation with automated finding synthesis
              </span>
              <button
                onClick={() => navigate("/inspections")}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                type="button"
              >
                Record Audio →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vertical Workflow Stepper Section */}
      <section id="workflow" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest font-extrabold text-emerald-700 dark:text-emerald-400 mb-2">
            Inspection Lifecycle
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            A Seamless Vertical Field-to-Report Workflow
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
            Follow our four-phase audit workflow designed for rapid on-site data gathering and certified technical reporting.
          </p>
        </div>

        {/* Vertical Timeline Stepper */}
        <div className="relative pl-6 sm:pl-10 space-y-8 before:content-[''] before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-linear-to-b before:from-emerald-500 before:via-teal-500 before:to-indigo-600">
          {/* Step 1 */}
          <div className="relative group">
            {/* Step Marker */}
            <div className="absolute -left-6 sm:-left-10 top-0.5 w-6 h-6 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center shadow-lg shadow-emerald-500/25 border-2 border-white dark:border-slate-950 transition-transform group-hover:scale-110">
              01
            </div>

            {/* Step Card */}
            <div className="glass-card p-5 sm:p-7 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-emerald-500/50 group-hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  On-Site Field Capture & Media Ingestion
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Phase 1 · On-Site
                  </span>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                The inspector conducts the property walkthrough room by room (Basement, Kitchen, Roof, Foundation). Snap high-resolution defect photos and dictate immediate field observations hands-free.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Multi-Angle Defect Photos
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  Spoken Audio Notes
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Room & Area Tagging
                </span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            {/* Step Marker */}
            <div className="absolute -left-6 sm:-left-10 top-0.5 w-6 h-6 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-600 text-white font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center shadow-lg shadow-teal-500/25 border-2 border-white dark:border-slate-950 transition-transform group-hover:scale-110">
              02
            </div>

            {/* Step Card */}
            <div className="glass-card p-5 sm:p-7 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-teal-500/50 group-hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Automated Defect Diagnostics & Speech Processing
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    Phase 2 · Diagnostic
                  </span>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Photos are analyzed for surface fractures, water staining, and structural deterioration. Audio recordings are simultaneously transcribed and parsed into technical finding statements.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  Computer Vision Defect Bounding
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Severity Scoring (1 to 5)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" x2="8" y1="13" y2="13" />
                    <line x1="16" x2="8" y1="17" y2="17" />
                  </svg>
                  Audio Transcription Sync
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            {/* Step Marker */}
            <div className="absolute -left-6 sm:-left-10 top-0.5 w-6 h-6 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-600 text-white font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center shadow-lg shadow-cyan-500/25 border-2 border-white dark:border-slate-950 transition-transform group-hover:scale-110">
              03
            </div>

            {/* Step Card */}
            <div className="glass-card p-5 sm:p-7 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-cyan-500/50 group-hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Building Code Cross-Referencing & Synthesis
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Phase 3 · Compliance
                  </span>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                The compliance engine compares flagged defects with local building codes, ASTM material standards, and historic inspection baselines stored in the knowledge base.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600 dark:text-cyan-400">
                    <rect width="16" height="20" x="4" y="2" rx="2" />
                    <line x1="8" x2="16" y1="6" y2="6" />
                    <line x1="8" x2="16" y1="10" y2="10" />
                    <line x1="8" x2="12" y1="14" y2="14" />
                  </svg>
                  IBC & ASTM Standards Matching
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                    <path d="M3 12A9 3 0 0 0 21 12" />
                  </svg>
                  PgVector Semantic RAG
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  Remediation Cost Estimating
                </span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative group">
            {/* Step Marker */}
            <div className="absolute -left-6 sm:-left-10 top-0.5 w-6 h-6 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center shadow-lg shadow-indigo-500/25 border-2 border-white dark:border-slate-950 transition-transform group-hover:scale-110">
              04
            </div>

            {/* Step Card */}
            <div className="glass-card p-5 sm:p-7 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-indigo-500/50 group-hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Signed PDF Generation & Public QR Verification
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Phase 4 · Deliverable
                  </span>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Compile a certified, branded inspection PDF complete with cover photos, area breakdowns, severity summaries, and a tamper-evident QR code that anyone can scan to verify authenticity.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" />
                    <path d="M6 10h10" />
                  </svg>
                  WeasyPrint Multi-Page PDF
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cryptographic Token Verification
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Client Turnaround Under 2 Minutes
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Performance Section */}
      <section id="metrics" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 block mb-1">10x</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">Faster Audits</span>
          </div>
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 block mb-1">99.4%</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">Vision Accuracy</span>
          </div>
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-400 block mb-1">100%</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">QR Verification</span>
          </div>
          <div className="glass-card p-6 bg-white/95 dark:bg-slate-900/85">
            <span className="text-4xl font-extrabold text-violet-600 dark:text-violet-400 block mb-1">0</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">Manual Bottlenecks</span>
          </div>
        </div>
      </section>

      {/* Architectural Audit Deliverable Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div
          className="rounded-2xl p-6 sm:p-8 border shadow-lg relative overflow-hidden"
          style={{
            background: isDark
              ? "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(7, 9, 14, 0.98))"
              : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.95))",
            borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(203, 213, 225, 0.9)",
          }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 block">
              Architectural & Engineering Audits
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2.5">
              A Standard of Precision for Modern Property Auditing
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 max-w-xl mx-auto">
              Standardized room protocols, cryptographic report seals, and automated building standard cross-checks built for certified survey teams and asset managers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                type="button"
              >
                Launch DefectLoupe Workspace
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate("/knowledge-base")}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                type="button"
              >
                Inspect Building Standards
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                IBC & ASTM Citations
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sealed PDFs
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Air-gapped Deployable
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
