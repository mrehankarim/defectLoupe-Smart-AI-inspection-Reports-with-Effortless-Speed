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
  status: "QUEUED" | "PROCESSING" | "READY" | "FAILED";
  report_pdf_url?: string;
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
    const res = await apiClient.get<ReportStructuredData>(
      `/api/v1/inspections/${inspectionId}/report/json`
    );
    return res.data;
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
