/**
 * Report viewer page — displays report status, PDF preview, and JSON payload
 * for a given inspection. Authenticated (inside AppShell).
 */
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../services/api";

interface ReportStatus {
  job_id: string;
  status: string;
  pdf_url: string | null;
  error_message: string | null;
}

interface InspectionSummary {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

export default function ReportViewerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspectionId, setInspectionId] = useState("");
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null);
  const [reportJson, setReportJson] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const showToast = (message: string, type: "error" | "success" = "success") =>
    setToast({ message, type });

  const fetchStatusForId = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setReportJson(null);
    setShowJson(false);
    setShowPdfPreview(false);
    try {
      const data = await api.get<ReportStatus>(
        `/inspections/${id.trim()}/report/status`
      );
      setReportStatus(data);
    } catch (err) {
      setReportStatus(null);
      showToast((err as ApiError).detail || "No report found for this inspection.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(() => {
    fetchStatusForId(inspectionId);
  }, [fetchStatusForId, inspectionId]);

  // Load user's inspections for the quick dropdown
  useEffect(() => {
    api.get<{ items: InspectionSummary[] }>("/inspections?limit=50")
      .then((data) => {
        const items = data.items || [];
        setInspections(items);
        // If no ID is specified yet and inspections exist, pick the first one with a report or the first inspection
        const paramId = searchParams.get("inspection_id");
        if (!paramId && items.length > 0) {
          const preferred = items.find((i) => i.status === "report_generated") || items[0];
          setInspectionId(preferred.id);
          fetchStatusForId(preferred.id);
        }
      })
      .catch(() => {});
  }, [fetchStatusForId, searchParams]);

  // Handle URL query parameter ?inspection_id=...
  useEffect(() => {
    const qId = searchParams.get("inspection_id");
    if (qId && qId.trim() && qId !== inspectionId) {
      setInspectionId(qId.trim());
      fetchStatusForId(qId.trim());
    }
  }, [searchParams, fetchStatusForId, inspectionId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleFetchJson() {
    if (!inspectionId.trim()) return;
    try {
      const data = await api.get<Record<string, unknown>>(
        `/inspections/${inspectionId.trim()}/report/json`
      );
      setReportJson(data);
      setShowJson(true);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to fetch JSON report", "error");
    }
  }

  function handleDownloadPdf() {
    if (!inspectionId.trim()) return;
    // Create a temporary anchor and trigger click — browser downloads without auto-opening
    const a = document.createElement("a");
    a.href = `/api/v1/inspections/${inspectionId.trim()}/report/pdf`;
    a.download = `inspection-report-${inspectionId.trim().slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleGenerateReport() {
    if (!inspectionId.trim()) return;
    setLoading(true);
    try {
      await api.post(`/inspections/${inspectionId.trim()}/generate-report`);
      showToast("Report generation queued");
      fetchStatus();
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white px-4 py-3 rounded-lg shadow-lg z-100 max-w-sm`}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold">&times;</button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Inspection Reports & PDF Viewer</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inspect, generate, preview, and download compliance-ready inspection PDF reports.
        </p>
      </div>

      {/* Inspection Selection Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Select an Inspection from your account
          </label>
          <select
            value={inspectionId}
            onChange={(e) => {
              const val = e.target.value;
              setInspectionId(val);
              if (val) {
                setSearchParams({ inspection_id: val });
                fetchStatusForId(val);
              }
            }}
            className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium text-sm outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">-- Choose an inspection to view or generate report --</option>
            {inspections.map((insp) => (
              <option key={insp.id} value={insp.id}>
                {insp.title || "Inspection"} ({insp.status.replace(/_/g, " ")}) — {insp.id.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>

        {/* Quick select pills */}
        {inspections.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center pt-1">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Quick Select:</span>
            {inspections.slice(0, 5).map((insp) => (
              <button
                key={insp.id}
                onClick={() => {
                  setInspectionId(insp.id);
                  setSearchParams({ inspection_id: insp.id });
                  fetchStatusForId(insp.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  inspectionId === insp.id
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"
                }`}
              >
                {insp.title || "Inspection"}
              </button>
            ))}
          </div>
        )}

        {/* Manual ID Input fallback */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1.5">Or paste a specific Inspection UUID:</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 74e104e1-c6fa-42db-9627-e4808e4eb743"
              value={inspectionId}
              onChange={(e) => setInspectionId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchStatus()}
              className="flex-1 p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none text-xs font-mono focus:border-emerald-500"
            />
            <button
              onClick={fetchStatus}
              disabled={!inspectionId.trim() || loading}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Status */}
      {reportStatus && (
        <div className="border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--surface))] overflow-hidden mb-6">
          <div className="p-5 border-b border-[rgb(var(--border))]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">Report Job</h2>
                <p className="text-xs text-[rgb(var(--text-muted))] mt-1 font-mono">{reportStatus.job_id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[reportStatus.status] || "bg-gray-100 text-gray-700"}`}>
                {reportStatus.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 flex flex-wrap gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? "Working..." : "Generate Report"}
            </button>
            {reportStatus.status === "ready" && (
              <>
                <button
                  onClick={() => setShowPdfPreview((v) => !v)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {showPdfPreview ? "Hide Preview" : "Preview PDF"}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={handleFetchJson}
                  className="bg-gray-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium cursor-pointer"
                >
                  View JSON
                </button>
              </>
            )}
          </div>

          {/* Error Message */}
          {reportStatus.error_message && (
            <div className="px-5 pb-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <strong>Error:</strong> {reportStatus.error_message}
              </div>
            </div>
          )}

          {/* PDF Preview — only shown when user explicitly clicks "Preview PDF" */}
          {reportStatus.status === "ready" && showPdfPreview && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">PDF Preview</h3>
                <button
                  onClick={() => setShowPdfPreview(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden" style={{ height: "700px" }}>
                <iframe
                  src={`/api/v1/inspections/${inspectionId.trim()}/report/pdf#toolbar=0`}
                  className="w-full h-full"
                  title="Report PDF Preview"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* JSON Viewer */}
      {showJson && reportJson && (
        <div className="border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--surface))] overflow-hidden">
          <div className="p-5 border-b border-[rgb(var(--border))] flex justify-between items-center">
            <h2 className="font-semibold">Structured JSON Report</h2>
            <button
              onClick={() => setShowJson(false)}
              className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
            >
              Close
            </button>
          </div>
          <div className="p-5">
            <pre className="bg-[rgb(var(--input-bg))] rounded-lg p-4 text-xs font-mono overflow-auto max-h-96 text-[rgb(var(--text))]">
              {JSON.stringify(reportJson, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportStatus && !loading && (
        <div className="text-center py-16 text-[rgb(var(--text-muted))]">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg mb-1">No report loaded</p>
          <p className="text-sm">Enter an inspection ID above to check its report status</p>
        </div>
      )}
    </div>
  );
}
