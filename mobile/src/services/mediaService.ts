import { apiClient } from "./api";
import { Platform } from "react-native";

export interface AreaPhoto {
  id: string;
  inspection_area_id: string;
  file_url: string;
  thumbnail_url?: string;
  analyzed?: boolean;
  defect_labels?: any;
  created_at: string;
}

export interface AreaObservation {
  id: string;
  inspection_area_id: string;
  photo_id?: string;
  note_type: "text" | "voice";
  content?: string;
  audio_url?: string;
  transcription?: {
    id: string;
    text: string;
    status: "pending" | "processing" | "completed" | "failed";
    confidence?: number;
  };
  created_at: string;
}

export const mediaService = {
  // Photos
  async listAreaPhotos(areaId: string): Promise<AreaPhoto[]> {
    const res = await apiClient.get<AreaPhoto[]>(`/api/v1/areas/${areaId}/photos`);
    return res.data || [];
  },

  async uploadPhoto(
    areaId: string,
    fileUri: string,
    fileName = "photo.jpg"
  ): Promise<AreaPhoto> {
    const formData = new FormData();
    const uri =
      Platform.OS === "android" ? fileUri : fileUri.replace("file://", "");

    formData.append("file", {
      uri,
      name: fileName,
      type: "image/jpeg",
    } as any);

    const res = await apiClient.post<AreaPhoto>(
      `/api/v1/areas/${areaId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  },

  async deletePhoto(photoId: string): Promise<void> {
    await apiClient.delete(`/api/v1/photos/${photoId}`);
  },

  // Observations
  async listAreaObservations(areaId: string): Promise<AreaObservation[]> {
    const res = await apiClient.get<AreaObservation[]>(
      `/api/v1/areas/${areaId}/observations`
    );
    return res.data || [];
  },

  async addTextObservation(payload: {
    area_id: string;
    photo_id?: string;
    text: string;
  }): Promise<AreaObservation> {
    const endpoint = payload.photo_id
      ? `/api/v1/photos/${payload.photo_id}/observations`
      : `/api/v1/areas/${payload.area_id}/observations`;

    const res = await apiClient.post<AreaObservation>(endpoint, {
      content: payload.text,
      note_type: "text",
    });
    return res.data;
  },

  async uploadVoiceObservation(payload: {
    area_id: string;
    photo_id?: string;
    audioUri: string;
    durationSeconds?: number;
  }): Promise<AreaObservation> {
    const formData = new FormData();
    formData.append("inspection_area_id", payload.area_id);
    if (payload.photo_id) {
      formData.append("photo_id", payload.photo_id);
    }
    if (payload.durationSeconds) {
      formData.append("duration_seconds", String(payload.durationSeconds));
    }

    const uri =
      Platform.OS === "android"
        ? payload.audioUri
        : payload.audioUri.replace("file://", "");

    formData.append("file", {
      uri,
      name: "voice_note.m4a",
      type: "audio/m4a",
    } as any);

    const res = await apiClient.post<AreaObservation>(
      "/api/v1/observations",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  },

  async triggerTranscription(observationId: string): Promise<{ message: string; job_id?: string }> {
    const res = await apiClient.post(`/api/v1/observations/${observationId}/transcribe`);
    return res.data;
  },

  async getTranscription(transcriptionId: string): Promise<any> {
    const res = await apiClient.get(`/api/v1/transcriptions/${transcriptionId}`);
    return res.data;
  },

  async getInspectionMedia(inspectionId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/v1/inspections/${inspectionId}/media`);
    return res.data || [];
  },
};
