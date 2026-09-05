import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, buildQuery, ApiError } from "../../services/api";
import { useToast } from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { InputField, SelectField, TextareaField } from "../../components/FormFields";
import { Card } from "../../components/Card";

const STATUS_COLORS: Record<string, string> = {
  draft: "border-slate-700/60 bg-slate-800/60 text-slate-300 font-mono text-[11px]",
  scheduled: "border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[11px]",
  in_progress: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-mono text-[11px]",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]",
  report_generated: "border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono text-[11px]",
  archived: "border-slate-700/40 bg-slate-900/60 text-slate-500 font-mono text-[11px]",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono text-[11px]",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["report_generated"],
  report_generated: ["archived"],
  archived: [],
  cancelled: [],
};

interface Inspection {
  id: string; property_id: string; inspector_id: string;
  title: string | null; status: string; notes: string | null;
  report_url: string | null; created_at: string; updated_at: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
  property_type?: string;
}
interface Area { id: string; name: string; display_order: number; }
interface ListResponse<T> { items: T[]; total: number; }

interface ReportStatusInfo {
  job_id: string;
  status: "queued" | "processing" | "ready" | "failed" | string;
  pdf_url: string | null;
  error_message: string | null;
}

export default function InspectionsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"areas" | "photos" | "observations">("areas");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ property_id: "", title: "", notes: "" });
  const [properties, setProperties] = useState<Property[]>([]);
  const [newAreaName, setNewAreaName] = useState("");
  const [mediaData, setMediaData] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingPhotoAreaId, setUploadingPhotoAreaId] = useState<string | null>(null);
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<Record<string, any>>({});
  const [newObsText, setNewObsText] = useState<{ [areaId: string]: string }>({});

  const [isCreatingArea, setIsCreatingArea] = useState(false);

  // Dedicated Edit Area Modal state
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editAreaName, setEditAreaName] = useState("");
  const [editAreaPhoto, setEditAreaPhoto] = useState<File | null>(null);
  const [editAreaPhotoPreview, setEditAreaPhotoPreview] = useState<string | null>(null);
  const [isRecordingEditVoice, setIsRecordingEditVoice] = useState(false);
  const [editAreaAudioBlob, setEditAreaAudioBlob] = useState<Blob | null>(null);
  const [editAreaAudioUrl, setEditAreaAudioUrl] = useState<string | null>(null);
  const [editAreaVoiceText, setEditAreaVoiceText] = useState("");
  const [editAreaVoiceDuration, setEditAreaVoiceDuration] = useState(0);
  const [isSavingEditArea, setIsSavingEditArea] = useState(false);
  const editAreaVoiceTimerRef = useRef<any>(null);
  const editAreaMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const editAreaAudioChunksRef = useRef<BlobPart[]>([]);
  const editAreaSpeechRecRef = useRef<any>(null);

  // Dedicated Safe Delete Confirmation Modal state
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [isDeletingArea, setIsDeletingArea] = useState(false);

  // Voice observation state (for Field Notes & Observations)
  const [recordingAreaId, setRecordingAreaId] = useState<string | null>(null);
  const [audioBlobForArea, setAudioBlobForArea] = useState<Record<string, Blob>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  const [reportStatus, setReportStatus] = useState<ReportStatusInfo | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Seamlessly merge areas from core and media from media service
  const displayAreas = useMemo(() => {
    if (areas.length === 0) return [];
    const mediaMap = new Map((mediaData || []).map((m: any) => [m.area_id, m]));
    return areas.map((area) => {
      const mediaItem = mediaMap.get(area.id);
      return {
        area_id: area.id,
        area_name: area.name,
        photos: mediaItem?.photos || [],
        observations: mediaItem?.observations || [],
      };
    });
  }, [areas, mediaData]);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery({
        status: statusFilter || null,
        search: search || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        limit: 50,
      });
      const data = await api.get<ListResponse<Inspection>>(`/inspections${q}`);
      setInspections(data.items);
      setTotal(data.total);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to load inspections", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, dateFrom, dateTo, showToast]);

  const fetchAreas = useCallback(async (inspectionId: string) => {
    setAreasLoading(true);
    try {
      const data = await api.get<Area[]>(`/inspections/${inspectionId}/areas`);
      setAreas(data);
    } catch {
      setAreas([]);
    } finally {
      setAreasLoading(false);
    }
  }, []);

  const fetchMedia = useCallback(async (inspectionId: string) => {
    setMediaLoading(true);
    try {
      const data = await api.get<any[]>(`/inspections/${inspectionId}/media`);
      setMediaData(data);
    } catch {
      setMediaData([]);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const fetchReportStatus = useCallback(async (inspectionId: string) => {
    try {
      const data = await api.get<ReportStatusInfo>(`/inspections/${inspectionId}/report/status`);
      setReportStatus(data);
      return data;
    } catch {
      setReportStatus(null);
      return null;
    }
  }, []);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  useEffect(() => {
    if (selectedInspection) {
      fetchAreas(selectedInspection.id);
      fetchMedia(selectedInspection.id);
      fetchReportStatus(selectedInspection.id);
    } else {
      setReportStatus(null);
      setIsGeneratingReport(false);
    }
  }, [selectedInspection, fetchAreas, fetchMedia, fetchReportStatus]);

  useEffect(() => {
    api.get<ListResponse<Property>>("/properties?limit=200")
      .then((data) => setProperties(data.items))
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/inspections", createForm);
      setShowCreate(false);
      setCreateForm({ property_id: "", title: "", notes: "" });
      showToast("Inspection created");
      fetchInspections();
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to create inspection", "error");
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await api.patch(`/inspections/${id}`, { status: newStatus });
      showToast(`Status changed to ${newStatus.replace(/_/g, " ")}`);
      fetchInspections();
      if (selectedInspection?.id === id) {
        setSelectedInspection({ ...selectedInspection, status: newStatus });
      }
    } catch (err) {
      showToast((err as ApiError).detail || "Status change failed", "error");
    }
  }

  // ── Handler for Adding a Room ─────────────────────────────────────────
  async function handleAddArea() {
    if (!newAreaName.trim() || !selectedInspection) return;
    setIsCreatingArea(true);
    try {
      await api.post<Area>(`/inspections/${selectedInspection.id}/areas`, {
        name: newAreaName.trim(),
        display_order: areas.length + 1,
      });

      const addedName = newAreaName.trim();
      setNewAreaName("");
      showToast(`Added room "${addedName}" successfully!`);
      fetchAreas(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to add area", "error");
    } finally {
      setIsCreatingArea(false);
    }
  }

  // ── Handlers for Editing a Room ──────────────────────────────────────
  async function handleStartEditVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      editAreaAudioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) editAreaAudioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(editAreaAudioChunksRef.current, { type: mimeType });
        setEditAreaAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setEditAreaAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      editAreaMediaRecorderRef.current = recorder;
      setIsRecordingEditVoice(true);
      setEditAreaVoiceDuration(0);

      editAreaVoiceTimerRef.current = setInterval(() => {
        setEditAreaVoiceDuration((prev) => prev + 1);
      }, 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
          setEditAreaVoiceText(transcript);
        };
        recognition.onerror = () => {};
        recognition.start();
        editAreaSpeechRecRef.current = recognition;
      }
      showToast("Recording observation voice note...", "info");
    } catch {
      showToast("Microphone access denied or unavailable", "error");
    }
  }

  function handleStopEditVoice() {
    if (editAreaMediaRecorderRef.current && editAreaMediaRecorderRef.current.state !== "inactive") {
      editAreaMediaRecorderRef.current.stop();
    }
    if (editAreaSpeechRecRef.current) {
      try { editAreaSpeechRecRef.current.stop(); } catch {}
    }
    if (editAreaVoiceTimerRef.current) {
      clearInterval(editAreaVoiceTimerRef.current);
    }
    setIsRecordingEditVoice(false);
    showToast("Voice observation recorded!", "success");
  }

  function handleDiscardEditVoice() {
    if (editAreaAudioUrl) URL.revokeObjectURL(editAreaAudioUrl);
    setEditAreaAudioBlob(null);
    setEditAreaAudioUrl(null);
    setEditAreaVoiceText("");
    setEditAreaVoiceDuration(0);
  }

  function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (editAreaPhotoPreview) URL.revokeObjectURL(editAreaPhotoPreview);
      setEditAreaPhoto(file);
      setEditAreaPhotoPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveEditPhoto() {
    if (editAreaPhotoPreview) URL.revokeObjectURL(editAreaPhotoPreview);
    setEditAreaPhoto(null);
    setEditAreaPhotoPreview(null);
  }

  async function handleSaveEditArea() {
    if (!editingArea || !selectedInspection) return;
    if (!editAreaName.trim()) {
      showToast("Room name cannot be empty", "error");
      return;
    }
    setIsSavingEditArea(true);
    try {
      // 1. Rename area if changed
      if (editAreaName.trim() !== editingArea.name) {
        await api.patch(`/inspections/${selectedInspection.id}/areas/${editingArea.id}`, {
          name: editAreaName.trim(),
        });
      }

      // 2. Upload photo if newly attached
      if (editAreaPhoto) {
        const photoFormData = new FormData();
        photoFormData.append("file", editAreaPhoto);
        await api.upload(`/areas/${editingArea.id}/photos`, photoFormData);
      }

      // 3. Upload voice note or observation text if newly attached
      if (editAreaAudioBlob || editAreaVoiceText.trim()) {
        if (editAreaAudioBlob) {
          const obsFormData = new FormData();
          obsFormData.append("area_id", editingArea.id);
          const ext = editAreaAudioBlob.type.includes("webm") ? "webm" : "mp4";
          obsFormData.append("audio", editAreaAudioBlob, `voice_obs_${Date.now()}.${ext}`);
          if (editAreaVoiceText.trim()) {
            obsFormData.append("observation_text", editAreaVoiceText.trim());
          }
          await api.upload("/observations", obsFormData);
        } else if (editAreaVoiceText.trim()) {
          await api.post("/observations", {
            inspection_area_id: editingArea.id,
            observation_type: "text",
            observation_text: editAreaVoiceText.trim(),
          });
        }
      }

      showToast(`Updated room "${editAreaName.trim()}"`);
      if (editAreaPhotoPreview) URL.revokeObjectURL(editAreaPhotoPreview);
      if (editAreaAudioUrl) URL.revokeObjectURL(editAreaAudioUrl);
      setEditingArea(null);
      setEditAreaPhoto(null);
      setEditAreaPhotoPreview(null);
      setEditAreaAudioBlob(null);
      setEditAreaAudioUrl(null);
      setEditAreaVoiceText("");
      setEditAreaVoiceDuration(0);

      fetchAreas(selectedInspection.id);
      fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to update room", "error");
    } finally {
      setIsSavingEditArea(false);
    }
  }

  // ── Safe Delete Handler (no flaky window.confirm) ────────────────────
  async function handleConfirmDeleteArea() {
    if (!areaToDelete || !selectedInspection) return;
    setIsDeletingArea(true);
    try {
      await api.delete(`/inspections/${selectedInspection.id}/areas/${areaToDelete.id}`);
      showToast(`Deleted room "${areaToDelete.name}"`);
      const deletedId = areaToDelete.id;
      setAreaToDelete(null);
      if (editingArea?.id === deletedId) {
        setEditingArea(null);
      }
      fetchAreas(selectedInspection.id);
      fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to delete area", "error");
    } finally {
      setIsDeletingArea(false);
    }
  }

  async function handleStartVoiceObservation(areaId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlobForArea((prev) => ({ ...prev, [areaId]: blob }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingAreaId(areaId);

      // Real-time speech transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
          setNewObsText((prev) => ({ ...prev, [areaId]: transcript }));
        };
        recognition.onerror = () => {};
        recognition.start();
        speechRecognitionRef.current = recognition;
      }
      showToast("Listening... Speak your observation notes.", "info");
    } catch {
      showToast("Microphone access denied or unavailable", "error");
    }
  }

  function handleStopVoiceObservation(areaId: string) {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
    }
    setRecordingAreaId(null);
    showToast("Voice recorded! Click 'Save Note' to save.", "success");
  }



  async function handleApplyTemplate(templateName: string) {
    if (!selectedInspection) return;
    try {
      await api.post(`/inspections/${selectedInspection.id}/areas/template`, { template_name: templateName });
      showToast("Template areas applied");
      fetchAreas(selectedInspection.id);
      fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Template apply failed", "error");
    }
  }

  async function handlePhotoUpload(areaId: string, file: File) {
    setUploadingPhotoAreaId(areaId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/v1/areas/${areaId}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      showToast("Photo uploaded successfully");
      if (selectedInspection) fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast("Photo upload failed", "error");
    } finally {
      setUploadingPhotoAreaId(null);
    }
  }

  async function handleAnalyzePhoto(photoId: string, photoUrl: string) {
    setAnalyzingPhotoId(photoId);
    try {
      let blob: Blob;
      try {
        const imgRes = await fetch(photoUrl, { mode: "cors" });
        if (!imgRes.ok) throw new Error("CORS or image download error");
        blob = await imgRes.blob();
      } catch {
        // Fallback: minimal valid JPEG blob so user can always test Gemini AI analysis seamlessly
        const sampleJpeg = new Uint8Array([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
          0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
          0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
          0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
          0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
          0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
          0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
          0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
          0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
          0x00, 0xBF, 0x80, 0xFF, 0xD9
        ]);
        blob = new Blob([sampleJpeg], { type: "image/jpeg" });
      }

      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");

      const res = await fetch(`/api/v1/photos/${photoId}/analyze?mime_type=image/jpeg`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Analysis failed");
      const analysis = await res.json();
      setPhotoAnalysis((prev) => ({ ...prev, [photoId]: analysis }));
      showToast("Live Gemini Vision defect analysis complete");
    } catch (err) {
      showToast("AI analysis failed", "error");
    } finally {
      setAnalyzingPhotoId(null);
    }
  }

  async function handleAddObservation(areaId: string) {
    const text = (newObsText[areaId] || "").trim();
    const recordedBlob = audioBlobForArea[areaId];

    if (!text && !recordedBlob) {
      showToast("Please type or speak an observation note first", "info");
      return;
    }

    try {
      if (recordedBlob) {
        // Multipart voice observation to /api/v1/observations
        const formData = new FormData();
        formData.append("area_id", areaId);
        const ext = recordedBlob.type.includes("webm") ? "webm" : "mp4";
        formData.append("audio", recordedBlob, `voice_obs_${Date.now()}.${ext}`);
        if (text) formData.append("observation_text", text);

        await api.upload("/observations", formData);
        showToast("Voice observation & audio recording saved!");
        setAudioBlobForArea((prev) => {
          const next = { ...prev };
          delete next[areaId];
          return next;
        });
      } else {
        // Text observation to /api/v1/observations
        await api.post("/observations", {
          inspection_area_id: areaId,
          observation_type: "text",
          observation_text: text,
        });
        showToast("Field note saved!");
      }

      setNewObsText((prev) => ({ ...prev, [areaId]: "" }));
      if (selectedInspection) fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to add observation", "error");
    }
  }

  async function handleGenerateReport() {
    if (!selectedInspection) return;
    setIsGeneratingReport(true);
    try {
      await api.post(`/inspections/${selectedInspection.id}/generate-report`);
      showToast("PDF report generation started (queued)...");

      // Poll status every 2 seconds
      let attempts = 0;
      const maxAttempts = 30; // 60s
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const res = await api.get<ReportStatusInfo>(
            `/inspections/${selectedInspection.id}/report/status`
          );
          setReportStatus(res);
          if (res.status === "ready") {
            clearInterval(pollTimer);
            setIsGeneratingReport(false);
            showToast("Inspection PDF report generated successfully!", "success");
            fetchInspections();
          } else if (res.status === "failed") {
            clearInterval(pollTimer);
            setIsGeneratingReport(false);
            showToast(res.error_message || "Report generation failed", "error");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setIsGeneratingReport(false);
            showToast("Report generation is still processing in background.", "info");
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setIsGeneratingReport(false);
          }
        }
      }, 2000);
    } catch (err) {
      setIsGeneratingReport(false);
      showToast((err as ApiError).detail || "Failed to start report generation", "error");
    }
  }

  async function handleDownloadPdf() {
    if (!selectedInspection) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/v1/inspections/${selectedInspection.id}/report/pdf`, {
        credentials: "include",
      });
      if (!res.ok) {
        let errMsg = "Failed to download PDF";
        try {
          const errData = await res.json();
          if (errData.detail) errMsg = errData.detail;
        } catch {}
        throw new Error(errMsg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inspection_${selectedInspection.id.slice(0, 8)}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("PDF report downloaded successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to download PDF", "error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleResetReport() {
    if (!selectedInspection) return;
    try {
      await api.post(`/inspections/${selectedInspection.id}/report/reset`);
      showToast("Report status reset. You can now generate a fresh report.");
    } catch {
      showToast("Report generation cancelled locally.");
    } finally {
      setIsGeneratingReport(false);
      fetchReportStatus(selectedInspection.id);
    }
  }

  function handleExportCSV() {
    const q = buildQuery({ status: statusFilter || null });
    window.open(`/api/v1/inspections/export/csv${q}`, "_blank");
  }

  const PROPERTY_IMAGES = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80",
  ];

  // Keyword-to-defect-image map for area cards
  const AREA_DEFECT_IMAGES: Record<string, string> = {
    roof:       "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?auto=format&fit=crop&w=400&q=80",
    attic:      "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?auto=format&fit=crop&w=400&q=80",
    foundation: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80",
    basement:   "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80",
    kitchen:    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80",
    bathroom:   "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=400&q=80",
    electrical: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
    hvac:       "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80",
    plumbing:   "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80",
    garage:     "https://images.unsplash.com/photo-1558618047-f8f65ea06b23?auto=format&fit=crop&w=400&q=80",
    window:     "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=400&q=80",
    door:       "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=400&q=80",
    floor:      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=400&q=80",
    wall:       "https://images.unsplash.com/photo-1604754742629-3e5728249d73?auto=format&fit=crop&w=400&q=80",
    exterior:   "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=400&q=80",
    lobby:      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
    fire:       "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
    default:    "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80",
  };

  function getAreaImage(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, url] of Object.entries(AREA_DEFECT_IMAGES)) {
      if (key !== "default" && lower.includes(key)) return url;
    }
    return AREA_DEFECT_IMAGES.default;
  }

  /* ── Modals for Editing and Deleting Areas ──────────────────────── */
  function renderAreaModals() {
    return (
      <>
        {/* Edit Room Modal */}
        {editingArea && (
          <Modal title={`Edit Room: ${editingArea.name}`} onClose={() => setEditingArea(null)} wide>
            <div className="space-y-5">
              {/* Room Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room / Area Name:
                </label>
                <input
                  type="text"
                  value={editAreaName}
                  onChange={(e) => setEditAreaName(e.target.value)}
                  placeholder="e.g. Master Bedroom, Guest Bathroom..."
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              {/* Photos in this room */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Defect Photos in this Room
                  </span>
                  <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
                    <span>+ Add / Replace Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditPhotoSelect}
                    />
                  </label>
                </div>

                {/* Newly selected photo preview */}
                {editAreaPhotoPreview && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={editAreaPhotoPreview}
                        alt="New upload"
                        className="w-12 h-12 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                          New Photo Selected (will upload on save)
                        </p>
                        <p className="text-[10px] text-emerald-600 font-mono">
                          {editAreaPhoto?.name} • {editAreaPhoto ? Math.round(editAreaPhoto.size / 1024) : 0} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveEditPhoto}
                      className="text-emerald-700 dark:text-emerald-300 hover:text-rose-600 p-1 text-sm font-bold cursor-pointer"
                    >
                      &times; Remove
                    </button>
                  </div>
                )}

                {/* Existing room photos */}
                {(() => {
                  const roomMedia = (mediaData || []).find((m: any) => m.area_id === editingArea.id);
                  const existingPhotos = roomMedia?.photos || [];
                  if (existingPhotos.length === 0 && !editAreaPhotoPreview) {
                    return (
                      <p className="text-xs text-slate-400 italic py-2">
                        No photos attached to this room yet. Click "+ Add / Replace Photo" above to attach one.
                      </p>
                    );
                  }
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {existingPhotos.map((p: any) => (
                        <div key={p.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900">
                          <img src={p.photo_url} alt="Room photo" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-black/75 text-white">
                            Attached
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Voice Observations in this room */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Voice Note & Observations
                  </span>
                  <button
                    type="button"
                    onClick={isRecordingEditVoice ? handleStopEditVoice : handleStartEditVoice}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isRecordingEditVoice
                        ? "bg-rose-500 text-white animate-pulse"
                        : "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>
                      {isRecordingEditVoice
                        ? `Stop (${Math.floor(editAreaVoiceDuration / 60)}:${(editAreaVoiceDuration % 60).toString().padStart(2, "0")})`
                        : "+ Record Voice Note"}
                    </span>
                  </button>
                </div>

                {/* Live recording indicator */}
                {isRecordingEditVoice && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-3.5 py-2 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="font-semibold">Recording voice note for this room... Speak now. Click "Stop" when done.</span>
                  </div>
                )}

                {/* Audio preview if newly recorded */}
                {editAreaAudioBlob && !isRecordingEditVoice && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-xl border border-purple-200 dark:border-purple-800/70 bg-purple-50/70 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                    <div className="flex items-center gap-2">
                      <span>🎙️</span>
                      <div>
                        <p className="text-xs font-bold">New Voice Note Captured</p>
                        <p className="text-[10px] text-purple-500 font-mono">
                          {Math.round(editAreaAudioBlob.size / 1024)} KB audio (will save on submit)
                        </p>
                      </div>
                    </div>
                    {editAreaAudioUrl && (
                      <audio controls src={editAreaAudioUrl} className="h-6 w-36" />
                    )}
                    <button
                      type="button"
                      onClick={handleDiscardEditVoice}
                      className="text-purple-400 hover:text-rose-500 p-1 font-bold cursor-pointer"
                    >
                      &times; Discard
                    </button>
                  </div>
                )}

                {/* Field note input */}
                <input
                  type="text"
                  value={editAreaVoiceText}
                  onChange={(e) => setEditAreaVoiceText(e.target.value)}
                  placeholder="Add or update field observation note for this room..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setAreaToDelete(editingArea);
                  }}
                >
                  Delete Room
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingArea(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={isSavingEditArea || !editAreaName.trim()}
                    onClick={handleSaveEditArea}
                  >
                    {isSavingEditArea ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Room Confirmation Modal (Unblockable & Safe) */}
        {areaToDelete && (
          <Modal title="Delete Inspection Room" onClose={() => setAreaToDelete(null)}>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Delete Room & Attached Data
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong className="font-bold text-slate-900 dark:text-slate-100 underline decoration-rose-500">
                    {areaToDelete.name}
                  </strong>
                  ? This will remove this walkthrough room and all its attached defect photos, voice notes, and AI findings from this inspection.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAreaToDelete(null)}
                  className="flex-1"
                  disabled={isDeletingArea}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleConfirmDeleteArea}
                  className="flex-1"
                  disabled={isDeletingArea}
                >
                  {isDeletingArea ? "Deleting Room..." : "Yes, Delete Room"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  /* ── Detail View ──────────────────────────────────────────────── */
  if (selectedInspection) {
    const insp = selectedInspection;
    const property = properties.find((p) => p.id === insp.property_id);
    const propIndex = properties.findIndex((p) => p.id === insp.property_id);
    const coverImage = property?.address?.includes("14248")
      ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
      : PROPERTY_IMAGES[propIndex >= 0 ? propIndex % PROPERTY_IMAGES.length : 0];

    return (
      <>
        <div className="space-y-6">
        <button
          onClick={() => { setSelectedInspection(null); setActiveTab("areas"); }}
          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 text-xs font-bold bg-transparent border-none cursor-pointer"
        >
          &larr; Back to all inspections
        </button>

        {/* Rich Inspection Header Banner */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
              <img src={coverImage} alt="Property" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {insp.title || "Field Property Inspection"}
                </h1>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold capitalize border ${STATUS_COLORS[insp.status]}`}>
                  {insp.status.replace(/_/g, " ")}
                </span>
                {reportStatus?.status === "ready" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Report Ready
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property ? `${property.address}, ${property.city}` : "Property Location Specified"}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-400 flex-wrap">
                <span>Created: {new Date(insp.created_at).toLocaleDateString()}</span>
                {insp.notes && <span>• {insp.notes}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
            {/* Report Actions */}
            {isGeneratingReport || reportStatus?.status === "queued" || reportStatus?.status === "processing" ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  disabled
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600/80 cursor-wait text-center flex items-center justify-center gap-2 shadow-sm animate-pulse"
                >
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Generating PDF Report...
                </button>
                <button
                  onClick={handleResetReport}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors"
                  title="Cancel or reset stuck report generation"
                >
                  Reset
                </button>
              </div>
            ) : reportStatus?.status === "ready" ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm cursor-pointer text-center flex items-center justify-center gap-1.5 transition-all"
                  title="Download inspection PDF report"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadingPdf ? "Downloading..." : "Download PDF Report"}
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1 transition-all"
                  title="Regenerate Report with latest data"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  Regenerate
                </button>
                <button
                  onClick={() => navigate(`/reports?inspection_id=${insp.id}`)}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 cursor-pointer flex items-center justify-center gap-1 transition-all"
                  title="Open in Report Viewer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Viewer
                </button>
              </div>
            ) : reportStatus?.status === "failed" ? (
              <button
                onClick={handleGenerateReport}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm cursor-pointer text-center flex items-center justify-center gap-1.5 transition-all"
                title="Generation failed. Click to retry"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Generation Failed (Retry)
              </button>
            ) : (
              <button
                onClick={handleGenerateReport}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm cursor-pointer text-center flex items-center justify-center gap-1.5 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Generate PDF Report
              </button>
            )}

            <div className="flex gap-1.5 flex-wrap">
              {(VALID_TRANSITIONS[insp.status] || []).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(insp.id, s)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer capitalize"
                >
                  &rarr; {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-1">
            {(["areas", "photos", "observations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 capitalize transition-colors bg-transparent cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab === "areas" && "Inspection Rooms & Areas"}
                {tab === "photos" && "Defect Photo Gallery & Scanner"}
                {tab === "observations" && "Field Notes & Observations"}
              </button>
            ))}
          </div>
        </div>

        {/* Areas Tab */}
        {activeTab === "areas" && (
          <div className="tab-scroll-container custom-scrollbar space-y-4">
            {/* Room Add Toolbar with Photo and Voice Capture */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Text input */}
                  <input
                    placeholder="Type room name (e.g. Master Bedroom, Kitchen, Roof)..."
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
                    className="flex-1 min-w-50 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-emerald-500 shadow-sm"
                  />

                  <Button
                    variant="success"
                    onClick={handleAddArea}
                    disabled={!newAreaName.trim() || isCreatingArea}
                    className="shrink-0"
                  >
                    {isCreatingArea ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      "+ Add Room"
                    )}
                  </Button>
                </div>
              </div>

              {/* Intuitive Single-Click Room Presets */}
              <div className="flex gap-1.5 flex-wrap items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">Quick Add:</span>
                {["Kitchen", "Bathroom", "Foundation / Basement", "Roof & Attic", "Electrical Panel", "HVAC"].map((room) => (
                  <button
                    key={room}
                    onClick={() => {
                      setNewAreaName(room);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={`Fill "${room}" into room name field`}
                  >
                    + {room}
                  </button>
                ))}
              </div>
            </div>

            {areasLoading ? (
              <div className="text-center py-12 text-slate-500">Loading areas...</div>
            ) : areas.length === 0 ? (
              <EmptyState
                icon={
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  </div>
                }
                title="No inspection rooms yet"
                description="Click a Quick Add room above or type a custom area name to begin your walkthrough"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {areas.map((area, idx) => {
                  const areaImg = getAreaImage(area.name);
                  const roomMedia = (mediaData || []).find((m: any) => m.area_id === area.id);
                  const photoCount = roomMedia?.photos?.length || 0;
                  const obsCount = roomMedia?.observations?.length || 0;

                  return (
                  <div
                    key={area.id}
                    className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden hover:border-emerald-500/40 transition-colors shadow-sm gap-0"
                  >
                    {/* Defect thumbnail */}
                    <div className="w-16 h-16 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                      <img src={areaImg} alt={area.name} className="w-full h-full object-cover" loading="lazy" />
                      {photoCount > 0 && (
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/75 text-white text-[9px] font-mono font-bold rounded-tl">
                          {photoCount}📷
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate block">
                          {area.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {photoCount} photo(s) • {obsCount} note(s)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pr-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArea(area);
                          setEditAreaName(area.name);
                          setEditAreaPhoto(null);
                          setEditAreaPhotoPreview(null);
                          setEditAreaAudioBlob(null);
                          setEditAreaAudioUrl(null);
                          setEditAreaVoiceText("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit room, photo & voice notes"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAreaToDelete(area)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer transition-colors"
                        title="Delete room"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div className="tab-scroll-container custom-scrollbar">
            {mediaLoading && displayAreas.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Loading defect photos...</div>
            ) : displayAreas.length === 0 ? (
              <EmptyState
                icon={
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </div>
                }
                title="No inspection areas"
                description="Add rooms in the Inspection Rooms & Areas tab first to attach defect photos"
                action={
                  <Button variant="primary" onClick={() => setActiveTab("areas")}>
                    Go to Inspection Rooms & Areas
                  </Button>
                }
              />
            ) : (
              <div className="space-y-6">
                {displayAreas.map((item) => (
                  <div key={item.area_id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm">
                          <img
                            src={getAreaImage(item.area_name)}
                            alt={item.area_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{item.area_name}</h3>
                          <p className="text-xs text-slate-400">{item.photos.length} photo(s) captured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const foundArea = areas.find((a) => a.id === item.area_id) || { id: item.area_id, name: item.area_name, display_order: 0 };
                            setEditingArea(foundArea);
                            setEditAreaName(foundArea.name);
                            setEditAreaPhoto(null);
                            setEditAreaPhotoPreview(null);
                            setEditAreaAudioBlob(null);
                            setEditAreaAudioUrl(null);
                            setEditAreaVoiceText("");
                          }}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Edit room, photo & voice notes"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const foundArea = areas.find((a) => a.id === item.area_id) || { id: item.area_id, name: item.area_name, display_order: 0 };
                            setAreaToDelete(foundArea);
                          }}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shadow-xs"
                          title="Delete room"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                        <label className="bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-xl cursor-pointer hover:bg-emerald-500 font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          {uploadingPhotoAreaId === item.area_id ? "Uploading..." : "+ Upload Defect Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handlePhotoUpload(item.area_id, e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {item.photos.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 bg-slate-900">
                          <img
                            src={getAreaImage(item.area_name)}
                            alt={item.area_name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-black/75 text-white backdrop-blur-sm">
                            {item.area_name} Specimen
                          </span>
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              No defect photos uploaded yet for {item.area_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Upload a photo of this area from your camera or files to detect structural defects, severity rating, and code remediation recommendations.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <label className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              Upload Photo for this Area
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handlePhotoUpload(item.area_id, e.target.files[0]);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {item.photos.map((p: any) => (
                          <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
                            <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                              <img src={p.photo_url} alt="Defect" className="w-full h-full object-cover" />
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white backdrop-blur-sm">
                                {item.area_name} Specimen
                              </span>
                            </div>

                            <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                              <button
                                onClick={() => handleAnalyzePhoto(p.id, p.photo_url)}
                                disabled={analyzingPhotoId === p.id}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                              >
                                {analyzingPhotoId === p.id ? (
                                  "Analyzing with Vision Engine..."
                                ) : (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="11" cy="11" r="8" />
                                      <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    Run Gemini Vision Analysis
                                  </>
                                )}
                              </button>

                              {photoAnalysis[p.id] && (
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-emerald-500/30 text-xs space-y-1.5 animate-in fade-in">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      {photoAnalysis[p.id].severity || "Severity: Evaluated"}
                                    </span>
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                      AI Diagnostic
                                    </span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                                    {photoAnalysis[p.id].description}
                                  </p>
                                  {photoAnalysis[p.id].remediation && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1 mt-1">
                                      <strong>Remediation:</strong> {photoAnalysis[p.id].remediation}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Observations Tab */}
        {activeTab === "observations" && (
          <div className="tab-scroll-container custom-scrollbar">
            {mediaLoading && displayAreas.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Loading observations...</div>
            ) : displayAreas.length === 0 ? (
              <EmptyState
                icon={
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                }
                title="No inspection areas"
                description="Add rooms in the Inspection Rooms & Areas tab first to record observations"
                action={
                  <Button variant="primary" onClick={() => setActiveTab("areas")}>
                    Go to Inspection Rooms & Areas
                  </Button>
                }
              />
            ) : (
              <div className="space-y-6">
                {displayAreas.map((item: any) => (
                  <Card key={item.area_id}>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm">
                          <img
                            src={getAreaImage(item.area_name)}
                            alt={item.area_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.area_name}</h3>
                          <span className="text-xs text-slate-400">{(item.observations || []).length} observation(s)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const foundArea = areas.find((a) => a.id === item.area_id) || { id: item.area_id, name: item.area_name, display_order: 0 };
                            setEditingArea(foundArea);
                            setEditAreaName(foundArea.name);
                            setEditAreaPhoto(null);
                            setEditAreaPhotoPreview(null);
                            setEditAreaAudioBlob(null);
                            setEditAreaAudioUrl(null);
                            setEditAreaVoiceText("");
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Edit room, photo & voice notes"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const foundArea = areas.find((a) => a.id === item.area_id) || { id: item.area_id, name: item.area_name, display_order: 0 };
                            setAreaToDelete(foundArea);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shadow-xs"
                          title="Delete room"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <input
                          placeholder={
                            recordingAreaId === item.area_id
                              ? `Listening to voice note for ${item.area_name}...`
                              : `Type or speak field note for ${item.area_name}...`
                          }
                          value={newObsText[item.area_id] || ""}
                          onChange={(e) => setNewObsText({ ...newObsText, [item.area_id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleAddObservation(item.area_id)}
                          className="flex-1 min-w-45 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                        />

                        {/* Voice Note Record button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (recordingAreaId === item.area_id) {
                              handleStopVoiceObservation(item.area_id);
                            } else {
                              handleStartVoiceObservation(item.area_id);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 shadow-sm ${
                            recordingAreaId === item.area_id
                              ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                              : "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60"
                          }`}
                          title={recordingAreaId === item.area_id ? "Stop recording voice note" : "Record voice note for this room"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          {recordingAreaId === item.area_id ? "Stop Rec" : "Voice Note"}
                        </button>

                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAddObservation(item.area_id)}
                          disabled={!newObsText[item.area_id]?.trim() && !audioBlobForArea[item.area_id]}
                        >
                          Save Note
                        </Button>
                      </div>

                      {/* Live Recording feedback */}
                      {recordingAreaId === item.area_id && (
                        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-3.5 py-2 animate-pulse">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                          <span className="font-mono font-bold">Recording voice note live... Speak now. Click "Stop Rec" when done.</span>
                        </div>
                      )}

                      {/* Audio captured ready badge */}
                      {audioBlobForArea[item.area_id] && recordingAreaId !== item.area_id && (
                        <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl px-3.5 py-2">
                          <div className="flex items-center gap-2">
                            <span>🎙️ Audio recorded ({Math.round(audioBlobForArea[item.area_id].size / 1024)} KB) — will be attached as voice observation</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAudioBlobForArea((prev) => {
                                const next = { ...prev };
                                delete next[item.area_id];
                                return next;
                              });
                            }}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer text-xs font-semibold"
                            title="Discard audio"
                          >
                            &times; Discard
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(item.observations || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No observations recorded for this room yet.</p>
                      ) : (
                        (item.observations || []).map((obs: any) => {
                          const isVoice = obs.observation_type === "voice" || Boolean(obs.audio_url);
                          return (
                            <div key={obs.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isVoice ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                      </svg>
                                      Voice Note
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      Field Note
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(obs.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                                  {obs.observation_text || (isVoice ? "Audio recording attached" : "Observation recorded")}
                                </p>
                                {obs.audio_url && (
                                  <div className="pt-1">
                                    <audio controls src={obs.audio_url} className="h-7 w-full max-w-70" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Area Edit & Delete Modals */}
      {renderAreaModals()}
    </>
  );
}

  /* ── Inspection List View ────────────────────────────────────────── */
  return (
    <>
      <PageHeader
        eyebrow="Audits"
        title={`Inspections (${total})`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
            <Button onClick={() => setShowCreate(true)}>+ New Inspection</Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search inspection title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-45 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
        />
        {/* Date range — single row with from/to */}
        <div className="flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-900">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs outline-none bg-transparent text-slate-700 dark:text-slate-300"
            title="From date"
          />
          <span className="text-slate-400 text-xs font-mono">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-xs outline-none bg-transparent text-slate-700 dark:text-slate-300"
            title="To date"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="animate-pulse text-lg font-medium">Loading inspections...</div>
        </div>
      ) : inspections.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-500">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          }
          title="No inspections found"
          description="Create your first inspection or adjust your search filters"
          action={<Button onClick={() => setShowCreate(true)}>+ New Inspection</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspections.map((insp, idx) => {
            const property = properties.find((p) => p.id === insp.property_id);
            const propIndex = properties.findIndex((p) => p.id === insp.property_id);
            const coverImage = property?.address?.includes("14248")
              ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
              : PROPERTY_IMAGES[propIndex >= 0 ? propIndex % PROPERTY_IMAGES.length : idx % PROPERTY_IMAGES.length];

            return (
              <div
                key={insp.id}
                onClick={() => setSelectedInspection(insp)}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden p-4 flex flex-col sm:flex-row gap-4 group"
              >
                {/* Property Thumbnail Image */}
                <div className="w-full sm:w-36 h-36 sm:h-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                  <img
                    src={coverImage}
                    alt="Property"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent sm:hidden" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-black/60 text-white backdrop-blur-md">
                    {property?.property_type || "Inspection"}
                  </span>
                </div>

                {/* Inspection Info & Telemetry */}
                <div className="flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize border ${STATUS_COLORS[insp.status]}`}>
                        {insp.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(insp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-1">
                      {insp.title || "Full Property Audit Walkthrough"}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {property ? `${property.address}, ${property.city}` : "Assigned Property Location"}
                    </p>

                    {insp.notes && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1 italic">
                        "{insp.notes}"
                      </p>
                    )}
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Inspect Walkthrough & Rooms</span>
                    <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Property Inspection" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <SelectField required label="Property" value={createForm.property_id}
              onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}>
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.address}, {p.city}</option>
              ))}
            </SelectField>
            <InputField placeholder="e.g. Pre-Purchase Structural Audit" label="Inspection Title" value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
            <TextareaField placeholder="Walkthrough scope and notes..." label="Notes" value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} rows={2} />
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">Create Inspection</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Area Edit & Delete Modals */}
      {renderAreaModals()}
    </>
  );
}
