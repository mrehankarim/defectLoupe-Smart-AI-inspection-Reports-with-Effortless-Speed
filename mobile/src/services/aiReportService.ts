import { apiClient, getBaseUrl } from "./api";

export interface DefectItem {
  id?: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  remediation?: string;
  estimated_cost?: string;
}

export interface PhotoAnalysisResult {
  photo_id: string;
  defects_found: boolean;
  defects: DefectItem[];
  summary?: string;
  confidence?: number;
}

export interface ReportJobStatus {
  job_id: string;
  inspection_id: string;
  status: "queued" | "processing" | "ready" | "failed";
  report_pdf_url?: string;
  pdf_url?: string;
  verify_token?: string;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
}

export interface ReportStructuredData {
  inspection_id: string;
  title: string;
  property_address: string;
  inspector_name: string;
  inspection_date: string;
  executive_summary: string;
  severity_matrix: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  areas: Array<{
    name: string;
    defects: DefectItem[];
    photos: string[];
    notes: string[];
  }>;
  recommendations: string[];
  verify_token?: string;
}

export const aiReportService = {
  // Vision AI
  async analyzePhoto(photoId: string): Promise<PhotoAnalysisResult> {
    const res = await apiClient.post<PhotoAnalysisResult>(
      `/api/v1/photos/${photoId}/analyze`
    );
    return res.data;
  },

  async getPhotoAnalysis(photoId: string): Promise<PhotoAnalysisResult> {
    const res = await apiClient.get<PhotoAnalysisResult>(
      `/api/v1/photos/${photoId}/analysis`
    );
    return res.data;
  },

  // Report Generation
  async triggerReportGeneration(inspectionId: string): Promise<ReportJobStatus> {
    const res = await apiClient.post<ReportJobStatus>(
      `/api/v1/inspections/${inspectionId}/generate-report`
    );
    return res.data;
  },

  async getReportStatus(inspectionId: string): Promise<ReportJobStatus> {
    const res = await apiClient.get<ReportJobStatus>(
      `/api/v1/inspections/${inspectionId}/report/status`
    );
    return res.data;
  },

  async getReportJson(inspectionId: string): Promise<ReportStructuredData> {
    const res = await apiClient.get<any>(
      `/api/v1/inspections/${inspectionId}/report/json`
    );
    const raw = res.data;

    // Normalize severity_matrix: API returns array of findings, mobile expects counts
    let severityMatrix = { critical: 0, high: 0, medium: 0, low: 0 };
    if (raw.severity_matrix && Array.isArray(raw.severity_matrix)) {
      for (const item of raw.severity_matrix) {
        const sev = (item.severity || "low").toLowerCase();
        if (sev === "critical") severityMatrix.critical++;
        else if (sev === "high") severityMatrix.high++;
        else if (sev === "medium") severityMatrix.medium++;
        else severityMatrix.low++;
      }
    } else if (raw.severity_matrix && typeof raw.severity_matrix === "object") {
      severityMatrix = raw.severity_matrix;
    }

    // Normalize recommendations: API returns remediation_items array of objects
    let recommendations: string[] = [];
    if (raw.recommendations && Array.isArray(raw.recommendations)) {
      recommendations = raw.recommendations;
    } else if (raw.remediation_items && Array.isArray(raw.remediation_items)) {
      recommendations = raw.remediation_items.map(
        (item: any) => item.title || item.remediation || String(item)
      );
    }

    return {
      inspection_id: raw.inspection_id || inspectionId,
      title: raw.title || "Inspection Report",
      property_address: raw.property_address || "Address not available",
      inspector_name: raw.inspector_name || "Inspector",
      inspection_date: raw.inspection_date || raw.report_date || "",
      executive_summary: raw.executive_summary || "",
      severity_matrix: severityMatrix,
      areas: raw.areas || [],
      recommendations,
      verify_token: raw.verify_token,
    };
  },

  getReportPdfUrl(inspectionId: string): string {
    return `${getBaseUrl()}/api/v1/inspections/${inspectionId}/report/pdf`;
  },

  // Verification
  async verifyReportToken(token: string): Promise<any> {
    const res = await apiClient.get(`/api/v1/reports/${token}/verify`);
    return res.data;
  },

  // RAG Knowledge Base
  async searchRag(query: string, limit = 5): Promise<any> {
    const res = await apiClient.post("/api/v1/rag/search", { query, limit });
    return res.data;
  },

  async listRagDocuments(): Promise<any[]> {
    const res = await apiClient.get("/api/v1/rag/documents");
    return res.data || [];
  },
};
