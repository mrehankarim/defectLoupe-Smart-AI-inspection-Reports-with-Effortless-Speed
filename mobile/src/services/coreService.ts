import { apiClient } from "./api";

export interface DashboardStats {
  total_clients: number;
  total_properties: number;
  total_inspections: number;
  completion_rate: number;
  inspections_by_status?: Record<string, number>;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface Property {
  id: string;
  client_id: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  property_type?: string;
  square_feet?: number;
  year_built?: number;
  created_at?: string;
}

export interface Inspection {
  id: string;
  property_id: string;
  inspector_id: string;
  title?: string;
  status: "draft" | "scheduled" | "in_progress" | "completed" | "report_generated" | "archived" | "cancelled";
  notes?: string;
  scheduled_date?: string;
  report_url?: string;
  created_at: string;
  updated_at: string;
  property?: Property;
  client?: Client;
  areas_count?: number;
}

export interface InspectionArea {
  id: string;
  inspection_id: string;
  name: string;
  display_order: number;
  photos_count?: number;
  defects_count?: number;
}

export const coreService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<DashboardStats>("/api/v1/dashboard/stats");
    return res.data;
  },

  // Clients
  async listClients(params?: { search?: string; limit?: number }): Promise<Client[]> {
    const res = await apiClient.get<any>("/api/v1/clients", { params });
    return res.data?.items || res.data || [];
  },

  async createClient(payload: { name: string; email: string; phone?: string }): Promise<Client> {
    const res = await apiClient.post<Client>("/api/v1/clients", payload);
    return res.data;
  },

  async getClient(id: string): Promise<Client> {
    const res = await apiClient.get<Client>(`/api/v1/clients/${id}`);
    return res.data;
  },

  // Properties
  async listProperties(params?: { client_id?: string; limit?: number }): Promise<Property[]> {
    const res = await apiClient.get<any>("/api/v1/properties", { params });
    return res.data?.items || res.data || [];
  },

  async createProperty(payload: {
    client_id: string;
    address: string;
    city?: string;
    state?: string;
    zip_code?: string;
    property_type?: string;
    square_feet?: number;
    year_built?: number;
  }): Promise<Property> {
    const res = await apiClient.post<Property>("/api/v1/properties", payload);
    return res.data;
  },

  // Inspections
  async listInspections(params?: {
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<Inspection[]> {
    const res = await apiClient.get<any>("/api/v1/inspections", { params });
    return res.data?.items || res.data || [];
  },

  async getInspection(id: string): Promise<Inspection> {
    const res = await apiClient.get<Inspection>(`/api/v1/inspections/${id}`);
    return res.data;
  },

  async createInspection(payload: {
    property_id: string;
    title?: string;
    notes?: string;
    scheduled_date?: string;
  }): Promise<Inspection> {
    const res = await apiClient.post<Inspection>("/api/v1/inspections", payload);
    return res.data;
  },

  async updateInspectionStatus(
    id: string,
    status: Inspection["status"]
  ): Promise<Inspection> {
    const res = await apiClient.patch<Inspection>(`/api/v1/inspections/${id}`, {
      status,
    });
    return res.data;
  },

  async getFullContext(id: string): Promise<any> {
    const res = await apiClient.get(`/api/v1/inspections/${id}/full-context`);
    return res.data;
  },

  // Inspection Areas
  async listAreas(inspectionId: string): Promise<InspectionArea[]> {
    const res = await apiClient.get<InspectionArea[]>(
      `/api/v1/inspections/${inspectionId}/areas`
    );
    return res.data || [];
  },

  async addArea(
    inspectionId: string,
    name: string,
    display_order = 0
  ): Promise<InspectionArea> {
    const res = await apiClient.post<InspectionArea>(
      `/api/v1/inspections/${inspectionId}/areas`,
      { name, display_order }
    );
    return res.data;
  },

  async updateArea(
    areaId: string,
    name: string
  ): Promise<InspectionArea> {
    const res = await apiClient.patch<InspectionArea>(
      `/api/v1/areas/${areaId}`,
      { name }
    );
    return res.data;
  },

  async deleteArea(areaId: string): Promise<void> {
    await apiClient.delete(`/api/v1/areas/${areaId}`);
  },

  async reorderAreas(
    inspectionId: string,
    areaIds: string[]
  ): Promise<void> {
    await apiClient.put(`/api/v1/inspections/${inspectionId}/areas/reorder`, {
      area_ids: areaIds,
    });
  },
};
