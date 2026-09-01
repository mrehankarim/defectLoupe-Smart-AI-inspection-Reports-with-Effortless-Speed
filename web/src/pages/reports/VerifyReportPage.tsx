/**
 * Public report verification page.
 * Accessible at /verify/:verify_token without authentication.
 * Fetches verification data from the AI service and displays the result.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

export default function VerifyReportPage() {
  const { verify_token = "" } = useParams();
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const resp = await fetch(`/api/v1/reports/${verify_token}/verify`);
        if (!resp.ok) {
          setError(`Server returned ${resp.status}`);
          return;
        }
        const json: VerificationResponse = await resp.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification request failed");
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [verify_token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--canvas))]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgb(var(--text-muted))] text-sm">Verifying report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--canvas))]">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Verification Error</h2>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Invalid token state
  if (!data.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--canvas))]">
        <div className="max-w-md w-full mx-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-amber-800 mb-2">Invalid Report</h2>
            <p className="text-amber-600 text-sm mb-4">
              {data.error || "This report token is invalid or the report has not been completed yet."}
            </p>
            <div className="bg-amber-100/50 rounded-lg p-3 text-xs text-amber-700 font-mono break-all">
              Token: {data.verify_token}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid report state
  const summary = data.summary;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--canvas))] p-4">
      <div className="max-w-lg w-full">
        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl shadow-lg overflow-hidden">
          {/* Verified Badge */}
          <div className="bg-emerald-50 border-b border-emerald-100 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-emerald-800">Report Verified</h1>
            <p className="text-emerald-600 text-sm mt-1">This inspection report is authentic</p>
          </div>

          {/* Report Details */}
          <div className="p-6 space-y-4">
            {summary && (
              <>
                {/* Property Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[rgb(var(--input-bg))] rounded-lg p-3">
                    <div className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">Property</div>
                    <div className="font-semibold text-sm mt-1">{summary.property_address || "N/A"}</div>
                  </div>
                  <div className="bg-[rgb(var(--input-bg))] rounded-lg p-3">
                    <div className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">Inspector</div>
                    <div className="font-semibold text-sm mt-1">{summary.inspector_name || "N/A"}</div>
                  </div>
                  <div className="bg-[rgb(var(--input-bg))] rounded-lg p-3">
                    <div className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">Inspection Date</div>
                    <div className="font-semibold text-sm mt-1">{summary.inspection_date || "N/A"}</div>
                  </div>
                  <div className="bg-[rgb(var(--input-bg))] rounded-lg p-3">
                    <div className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">Total Findings</div>
                    <div className="font-semibold text-sm mt-1">{summary.total_findings}</div>
                  </div>
                </div>

                {/* Severity Counts */}
                {summary.severity_counts && Object.keys(summary.severity_counts).length > 0 && (
                  <div>
                    <h3 className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide mb-2">Severity Breakdown</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(summary.severity_counts).map(([severity, count]) => (
                        <span key={severity} className={`px-3 py-1 rounded-full text-xs font-medium border ${SEVERITY_COLORS[severity] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {severity}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive Summary */}
                {summary.executive_summary && (
                  <div>
                    <h3 className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide mb-2">Executive Summary</h3>
                    <p className="text-sm text-[rgb(var(--text))] leading-relaxed bg-[rgb(var(--input-bg))] rounded-lg p-3">
                      {summary.executive_summary}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Metadata */}
            <div className="pt-3 border-t border-[rgb(var(--border))]">
              <div className="flex justify-between text-xs text-[rgb(var(--text-muted))]">
                <span>Status: <span className="font-medium capitalize">{data.status}</span></span>
                {data.completed_at && (
                  <span>Completed: {new Date(data.completed_at).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[rgb(var(--text-muted))] mt-4">
          Verified by DefectLoupe — Smart AI Inspection Reports
        </p>
      </div>
    </div>
  );
}
