/**
 * Public report verification page.
 * Accessible at /verify/:verify_token without authentication.
 * Fetches verification data from the AI service and displays the result.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "../../services/api";
import { stripMarkdown } from "../../utils/stripMarkdown";
import LogoIcon from "../../components/LogoIcon";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

interface VerificationResponse {
  valid: boolean;
  verify_token: string;
  inspection_id: string | null;
  status: string;
  completed_at: string | null;
  summary: {
    property_address: string | null;
    inspection_date: string | null;
    inspector_name: string | null;
    executive_summary: string | null;
    total_findings: number;
    severity_counts: Record<string, number>;
  } | null;
  error: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
  High: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50",
  Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
};

export default function VerifyReportPage() {
  const { verify_token = "" } = useParams();
  const navigate = useNavigate();
  const { resolvedTheme, setPreference } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setPreference(isDark ? "light" : "dark");

  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const json = await api.get<VerificationResponse>(`/reports/${verify_token}/verify`);
        setData(json);
      } catch (err) {
        setError((err as ApiError).detail || "Verification request failed");
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [verify_token]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? "/dashboard" : "/");
    }
  };

  const HeaderBar = () => (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            type="button"
            title="Go back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>

          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm hover:opacity-80 transition-opacity">
            <LogoIcon size={20} />
            <span>DefectLoupe</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline-block">
              Verification Portal
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
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

          <Link
            to={user ? "/dashboard" : "/"}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            {user ? "Dashboard" : "Home"}
          </Link>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
        <HeaderBar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-950 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Verifying inspection report signature...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
        <HeaderBar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center shadow-lg">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verification Failed</h2>
              <p className="text-rose-600 dark:text-rose-400 text-sm mb-6 leading-relaxed">{error}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleBack}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Go Back
                </button>
                <button
                  onClick={() => navigate(user ? "/dashboard" : "/")}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer"
                  type="button"
                >
                  Return to {user ? "Dashboard" : "Home"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Invalid token state
  if (!data.valid) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
        <HeaderBar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 text-center shadow-lg">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unverified or Invalid Token</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                {data.error || "This report verification token is unrecognized or the inspection report has not completed final sign-off."}
              </p>
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 font-mono break-all mb-6">
                Token: {data.verify_token}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleBack}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Go Back
                </button>
                <button
                  onClick={() => navigate(user ? "/dashboard" : "/")}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer"
                  type="button"
                >
                  Return to {user ? "Dashboard" : "Home"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Valid report state
  const summary = data.summary;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
      <HeaderBar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Back Link Breadcrumb */}
        <div className="max-w-lg w-full mb-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to previous page
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            SHA-256 Validated
          </span>
        </div>

        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Verified Header Banner */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 text-center">
              <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Report Verified Authentic</h1>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-1 font-medium">
                Cryptographically sealed inspection record on DefectLoupe
              </p>
            </div>

            {/* Report Details */}
            <div className="p-6 space-y-5">
              {summary && (
                <>
                  {/* Property Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wide">Property Address</div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5 line-clamp-1">{summary.property_address || "N/A"}</div>
                    </div>
                    <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wide">Lead Inspector</div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">{summary.inspector_name || "N/A"}</div>
                    </div>
                    <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wide">Inspection Date</div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">{summary.inspection_date || "N/A"}</div>
                    </div>
                    <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wide">Audited Findings</div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">{summary.total_findings} Recorded</div>
                    </div>
                  </div>

                  {/* Severity Counts */}
                  {summary.severity_counts && Object.keys(summary.severity_counts).length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Severity Breakdown</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(summary.severity_counts).map(([severity, count]) => (
                          <span key={severity} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${SEVERITY_COLORS[severity] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                            {severity}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  {summary.executive_summary && (
                    <div>
                      <h3 className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h3>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
                        {stripMarkdown(summary.executive_summary)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Metadata */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                  <span>Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{data.status}</span></span>
                  {data.completed_at && (
                    <span>Completed: {new Date(data.completed_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                  Token: {data.verify_token}
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={handleBack}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Go Back
                </button>

                {user ? (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    Open Command Dashboard →
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/")}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors cursor-pointer"
                    type="button"
                  >
                    Learn more about DefectLoupe →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
            Verified by DefectLoupe — Smart AI Inspection Reports
          </p>
        </div>
      </main>
    </div>
  );
}
