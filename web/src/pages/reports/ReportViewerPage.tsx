/**
 * Report viewer page — displays report status, PDF preview, and JSON payload
 * for a given inspection. Authenticated (inside AppShell).
 */
import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../../services/api";

interface ReportStatus {
  job_id: string;
  status: string;
  pdf_url: string | null;
  error_message: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-gray-200 text-gray-800",
  processing: "bg-blue-200 text-blue-800",
  ready: "bg-green-200 text-green-800",
  failed: "bg-red-200 text-red-800",
};

export default function ReportViewerPage() {
  const [inspectionId, setInspectionId] = useState("");
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null);
  const [reportJson, setReportJson] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const showToast = (message: string, type: "error" | "success" = "success") =>
    setToast({ message, type });

  const fetchStatus = useCallback(async () => {
    if (!inspectionId.trim()) return;
    setLoading(true);
    setReportJson(null);
    setShowJson(false);
    try {
      const data = await api.get<ReportStatus>(
        `/inspections/${inspectionId.trim()}/report/status`
      );
      setReportStatus(data);
    } catch (err) {
      setReportStatus(null);
      showToast((err as ApiError).detail || "Failed to fetch report status", "error");
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

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
    window.open(`/api/v1/inspections/${inspectionId.trim()}/report/pdf`, "_blank");
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
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white px-4 py-3 rounded-lg shadow-lg z-[100] max-w-sm`}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold">&times;</button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Report Viewer</h1>

      {/* Inspection ID Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter inspection ID..."
          value={inspectionId}
          onChange={(e) => setInspectionId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchStatus()}
          className="flex-1 p-2.5 border border-[rgb(var(--input-border))] rounded-xl bg-[rgb(var(--input-bg))] focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
        />
        <button
          onClick={fetchStatus}
          disabled={!inspectionId.trim() || loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? "Loading..." : "Check Status"}
        </button>
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
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
              Generate Report
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={reportStatus.status !== "ready"}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Download PDF
            </button>
            <button
              onClick={handleFetchJson}
              disabled={reportStatus.status !== "ready"}
              className="bg-gray-100 border border-[rgb(var(--border))] px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              View JSON
            </button>
          </div>

          {/* Error Message */}
          {reportStatus.error_message && (
            <div className="px-5 pb-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <strong>Error:</strong> {reportStatus.error_message}
              </div>
            </div>
          )}

          {/* PDF Preview */}
          {reportStatus.status === "ready" && reportStatus.pdf_url && (
            <div className="p-5 border-t border-[rgb(var(--border))]">
              <h3 className="text-sm font-medium mb-3">PDF Preview</h3>
              <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden" style={{ height: "600px" }}>
                <iframe
                  src={`/api/v1/inspections/${inspectionId.trim()}/report/pdf`}
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
