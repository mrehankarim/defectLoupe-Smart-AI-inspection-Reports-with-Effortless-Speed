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
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 max-w-7xl mx-auto text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Field Inspection Suite • Forensic Defect Auditing & Verified PDF Reports
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 max-w-4xl mx-auto leading-[1.15]">
          Professional Property Inspection Reports with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-400 dark:to-indigo-400">
            Effortless Precision
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Built for chartered surveyors, structural auditors, and field inspectors. Transform tedious site walkthroughs, defect photos, and audio notes into certified, tamper-evident inspection reports in minutes.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
            type="button"
          >
            Launch Command Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <button
            onClick={() => navigate("/inspections")}
            className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
            type="button"
          >
            Start Field Walkthrough
          </button>
        </div>

        {/* 3D Flap / Flip Forensic Specimen Card */}
        <div className="mt-12 max-w-3xl mx-auto [perspective:1400px]">
          <div className="group relative w-full cursor-pointer select-none">
            {/* The 3D Flipping Container */}
            <div
              className="relative w-full rounded-3xl transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl"
              style={{ minHeight: "380px" }}
            >
              {/* FRONT FACE: Structural Field Inspection Specimen */}
              <div
                className="w-full rounded-3xl p-5 sm:p-6 text-left border [backface-visibility:hidden] flex flex-col justify-between"
                style={{
                  background: isDark
                    ? "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(7, 9, 14, 0.98))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.95))",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(203, 213, 225, 0.9)",
                }}
              >
                {/* Specimen Header */}
                <div className="flex items-center justify-between border-b pb-3.5"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">
                      DL
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                          SPECIMEN #DL-2026-8894
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          CRITICAL · SEVERITY 4/5
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        1428 Elm Ridge Pkwy · Sub-Grade Foundation East Wall
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[11px] font-mono text-slate-400">TIMESTAMP</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      04-SEP-2026 · 14:32 EST
                    </span>
                  </div>
                </div>

                {/* Tactile Photo / Optical Inspection Visualizer */}
                <div className="my-4 relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950/90 p-4 font-mono text-xs">
                  {/* Visual simulation of foundation crack with target reticle */}
                  <div className="relative h-44 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center overflow-hidden border border-slate-800">
                    {/* Grid overlay */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />

                    {/* Defect Fracture Graphic */}
                    <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 500 200">
                      <path
                        d="M 50 140 Q 120 110, 180 130 T 260 80 T 360 95 T 450 40"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3.5"
                        strokeDasharray="4 2"
                      />
                      <circle cx="260" cy="80" r="14" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                      <circle cx="260" cy="80" r="4" fill="#f43f5e" />
                    </svg>

                    {/* Target Crosshair & Callout */}
                    <div className="relative z-10 px-4 py-2 rounded-xl bg-slate-900/90 border border-rose-500/50 backdrop-blur-md shadow-xl flex items-center gap-3 text-slate-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <div>
                        <div className="text-[11px] font-bold text-rose-400">Shear Stress Fracture Detected</div>
                        <div className="text-[10px] text-slate-400">Aperture: 4.8mm • Propagation: Active • Moisture: 72% RH</div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Bar below photo */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified Inspector Observation Attached
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">CALIBRATED SCAN: 1:1 METRIC</span>
                  </div>
                </div>

                {/* Card Bottom: Flap Prompt */}
                <div className="pt-2 border-t flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)" }}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Inspector ID: #INSP-402 (M. Rehan Karim)
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                    Hover to flap & inspect forensic diagnosis
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* BACK FACE (Flapped / Flipped 180°): Engineering Diagnosis & Compliance */}
              <div
                className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 text-left border [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between"
                style={{
                  background: isDark
                    ? "linear-gradient(145deg, rgba(10, 15, 28, 0.98), rgba(6, 9, 16, 0.99))"
                    : "linear-gradient(145deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.99))",
                  borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.5)",
                }}
              >
                {/* Back Header */}
                <div className="flex items-center justify-between border-b pb-3.5"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Forensic Diagnostic & Remediation Report
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                    OFFICIAL SPECIFICATION
                  </span>
                </div>

                {/* Back Body: Real Diagnostic Details */}
                <div className="my-3 space-y-3 font-sans text-xs">
                  {/* Diagnostic Finding */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                      DIAGNOSTIC SUMMARY
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      Differential foundation settlement producing 4.8mm diagonal shear stress fracture along reinforced retaining wall with hydrostatic seepage.
                    </p>
                  </div>

                  {/* Standard & Code Cross-Reference */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                        BUILDING CODE MATCH
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                        IBC 2024 §1807.1
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Foundation wall deflection limits
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                        REMEDIATION STANDARD
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                        ASTM C881-20
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Epoxy resin pressure injection
                      </span>
                    </div>
                  </div>

                  {/* Recommended Action & Cost */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-800 dark:text-emerald-300 font-bold block">
                        RECOMMENDED REMEDIATION
                      </span>
                      <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                        Polyurethane waterproofing seal + underpinning stabilization
                      </span>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">ESTIMATE</span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">$3,400 - $4,800</span>
                    </div>
                  </div>
                </div>

                {/* Back Footer */}
                <div className="pt-2 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)" }}
                >
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    PDF Signature: SHA-256 Verified
                  </span>
                  <button
                    onClick={() => navigate("/inspections")}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                  >
                    Open Inspection Workspace →
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
          <div className="glass-card p-6 border-l-4 border-l-emerald-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">High-Resolution Defect Detection</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload photos from site walkthroughs for automatic structural crack classification, severity scoring, and bounding coordinates.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 border-l-4 border-l-indigo-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Hands-Free Audio Dictation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Record spoken inspector observations on site. Background speech transcription converts audio into clean, structured technical findings.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 border-l-4 border-l-cyan-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Building Code Compliance Match</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cross-reference findings against standard building codes (IBC, ASTM) and regional requirements using embedded vector search.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-6 border-l-4 border-l-violet-500 bg-white/95 dark:bg-slate-900/85">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-400 mb-4 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Signed PDF & QR Verification</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate tamper-evident PDF deliverables equipped with cryptographic public QR verification for buyers, insurers, and banks.
            </p>
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
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mt-2">
            Follow our four-phase audit workflow designed for rapid on-site data gathering and certified technical reporting.
          </p>
        </div>

        {/* Vertical Timeline Stepper */}
        <div className="relative pl-6 sm:pl-10 space-y-8 before:content-[''] before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-teal-500 before:to-indigo-600">
          {/* Step 1 */}
          <div className="relative group">
            {/* Step Marker */}
            <div className="absolute -left-6 sm:-left-10 top-0.5 w-6 h-6 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-mono text-xs sm:text-sm font-extrabold flex items-center justify-center shadow-lg shadow-emerald-500/25 border-2 border-white dark:border-slate-950 transition-transform group-hover:scale-110">
              01
            </div>

            {/* Step Card */}
            <div className="glass-card p-5 sm:p-6 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-emerald-500/50 group-hover:shadow-md">
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
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The inspector conducts the property walkthrough room by room (Basement, Kitchen, Roof, Foundation). Snap high-resolution defect photos and dictate immediate field observations hands-free.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  📸 Multi-Angle Defect Photos
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  🎙️ Spoken Audio Notes
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  📍 Room / Area Tagging
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
            <div className="glass-card p-5 sm:p-6 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-teal-500/50 group-hover:shadow-md">
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
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Photos are analyzed for surface fractures, water staining, and structural deterioration. Audio recordings are simultaneously transcribed and parsed into technical finding statements.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  🔍 Computer Vision Defect Bounding
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  ⚡ Severity Scoring (1-5)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  📝 Audio Transcription Sync
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
            <div className="glass-card p-5 sm:p-6 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-cyan-500/50 group-hover:shadow-md">
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
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The compliance engine compares flagged defects with local building codes, ASTM material standards, and historic inspection baselines stored in the knowledge base.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  🏛️ IBC & ASTM Standards Matching
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  🧠 PgVector Semantic RAG
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  🛠️ Remediation Cost Estimating
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
            <div className="glass-card p-5 sm:p-6 bg-white/95 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 transition-all group-hover:border-indigo-500/50 group-hover:shadow-md">
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
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Compile a certified, branded inspection PDF complete with cover photos, area breakdowns, severity summaries, and a tamper-evident QR code that anyone can scan to verify authenticity.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  📑 WeasyPrint Multi-Page PDF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  🔒 Cryptographic Token Verification
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  ⚡ Client Turnaround: &lt; 2 Minutes
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
