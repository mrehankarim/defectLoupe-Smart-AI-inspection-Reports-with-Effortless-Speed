import { useState, useEffect, useCallback } from "react";
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

interface Property { id: string; address: string; city: string; }
interface Area { id: string; name: string; display_order: number; }
interface ListResponse<T> { items: T[]; total: number; }

export default function InspectionsPage() {
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

  useEffect(() => { fetchInspections(); }, [fetchInspections]);
  useEffect(() => {
    if (selectedInspection) {
      fetchAreas(selectedInspection.id);
      fetchMedia(selectedInspection.id);
    }
  }, [selectedInspection, fetchAreas, fetchMedia]);

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

  async function handleAddArea() {
    if (!newAreaName.trim() || !selectedInspection) return;
    try {
      await api.post(`/inspections/${selectedInspection.id}/areas`, { name: newAreaName });
      setNewAreaName("");
      fetchAreas(selectedInspection.id);
      fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to add area", "error");
    }
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm("Delete this area?")) return;
    try {
      await api.delete(`/areas/${areaId}`);
      if (selectedInspection) {
        fetchAreas(selectedInspection.id);
        fetchMedia(selectedInspection.id);
      }
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to delete area", "error");
    }
  }

  async function handleMoveArea(index: number, direction: "up" | "down") {
    if (!selectedInspection) return;
    const newOrder = [...areas];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[index], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[index]];
    try {
      await api.put(`/inspections/${selectedInspection.id}/areas/reorder`, {
        area_ids: newOrder.map((a) => a.id),
      });
      fetchAreas(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Reorder failed", "error");
    }
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
      // Fetch image blob first to pass to analyze route
      const imgRes = await fetch(photoUrl);
      const blob = await imgRes.blob();
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");

      const res = await fetch(`/api/v1/photos/${photoId}/analyze`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Analysis failed");
      const analysis = await res.json();
      setPhotoAnalysis((prev) => ({ ...prev, [photoId]: analysis }));
      showToast("AI defect analysis complete");
    } catch (err) {
      showToast("AI analysis failed", "error");
    } finally {
      setAnalyzingPhotoId(null);
    }
  }

  async function handleAddObservation(areaId: string) {
    const text = newObsText[areaId];
    if (!text || !text.trim()) return;
    try {
      await api.post("/observations", {
        inspection_area_id: areaId,
        observation_type: "text",
        observation_text: text.trim(),
      });
      setNewObsText((prev) => ({ ...prev, [areaId]: "" }));
      showToast("Observation added");
      if (selectedInspection) fetchMedia(selectedInspection.id);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to add observation", "error");
    }
  }

  function handleExportCSV() {
    const q = buildQuery({ status: statusFilter || null });
    window.open(`/api/v1/inspections/export/csv${q}`, "_blank");
  }

  /* ── Detail View ──────────────────────────────────────────────── */
  if (selectedInspection) {
    const insp = selectedInspection;

    return (
      <div>
        <button
          onClick={() => { setSelectedInspection(null); setActiveTab("areas"); }}
          className="text-brand-500 hover:underline mb-5 block text-sm font-medium bg-transparent border-none cursor-pointer"
        >
          &larr; Back to list
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{insp.title || "Untitled Inspection"}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[insp.status]}`}>
                {insp.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-text-muted">
                {new Date(insp.created_at).toLocaleDateString()}
              </span>
            </div>
            {insp.notes && <p className="text-sm text-text-secondary mt-2">{insp.notes}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(VALID_TRANSITIONS[insp.status] || []).map((s) => (
              <Button key={s} size="sm" onClick={() => handleStatusChange(insp.id, s)}>
                &rarr; {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-6">
            {(["areas", "photos", "observations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-sm font-medium border-b-2 capitalize transition-colors bg-transparent cursor-pointer ${
                  activeTab === tab
                    ? "border-brand-500 text-brand-500"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Areas Tab */}
        {activeTab === "areas" && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                placeholder="New area name..."
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm outline-none
                  focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
              />
              <Button variant="success" onClick={handleAddArea} disabled={!newAreaName.trim()}>
                + Add
              </Button>
            </div>
            <div className="flex gap-2 mb-5 flex-wrap items-center">
              <span className="text-xs text-text-muted">Templates:</span>
              {["standard_residential", "commercial", "pre_purchase"].map((t) => (
                <button
                  key={t}
                  onClick={() => handleApplyTemplate(t)}
                  className="bg-gray-100 border border-border px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 capitalize transition-colors cursor-pointer"
                >
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {areasLoading ? (
              <div className="text-center py-12 text-text-muted">Loading areas...</div>
            ) : areas.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No areas yet"
                description="Add areas manually or apply a template above"
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                {areas.map((area, idx) => (
                  <div key={area.id} className="flex justify-between items-center border border-border rounded-lg px-4 py-3 hover:bg-gray-50/50 group transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted w-6 text-right text-sm font-mono">{area.display_order}.</span>
                      <span className="font-medium text-text-primary">{area.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleMoveArea(idx, "up")} disabled={idx === 0}
                        className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded-md hover:bg-gray-100 transition-colors cursor-pointer" title="Move up">&uarr;</button>
                      <button onClick={() => handleMoveArea(idx, "down")} disabled={idx === areas.length - 1}
                        className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded-md hover:bg-gray-100 transition-colors cursor-pointer" title="Move down">&darr;</button>
                      <button onClick={() => handleDeleteArea(area.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 ml-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer" title="Delete">&times;</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div>
            {mediaLoading ? (
              <div className="text-center py-12 text-text-muted">Loading photos...</div>
            ) : mediaData.length === 0 ? (
              <EmptyState icon="📷" title="No inspection areas" description="Add areas first to upload photos" />
            ) : (
              <div className="space-y-6">
                {mediaData.map((item) => (
                  <Card key={item.area_id}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-text-primary">{item.area_name}</h3>
                      <label className="bg-brand-500 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-brand-600 font-medium">
                        {uploadingPhotoAreaId === item.area_id ? "Uploading..." : "+ Upload Photo"}
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
                    {item.photos.length === 0 ? (
                      <p className="text-xs text-text-muted">No photos for this area yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {item.photos.map((p: any) => (
                          <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-gray-50">
                            <img src={p.photo_url} alt="Defect" className="w-full h-40 object-cover" />
                            <div className="p-2.5">
                              <button
                                onClick={() => handleAnalyzePhoto(p.id, p.photo_url)}
                                disabled={analyzingPhotoId === p.id}
                                className="w-full bg-indigo-100 text-indigo-700 text-xs font-semibold py-1.5 rounded-md hover:bg-indigo-200"
                              >
                                {analyzingPhotoId === p.id ? "Analyzing AI..." : "🤖 AI Vision Analysis"}
                              </button>
                              {photoAnalysis[p.id] && (
                                <div className="mt-2 text-xs bg-white p-2 rounded border border-indigo-100">
                                  <p className="font-bold text-indigo-900">{photoAnalysis[p.id].defect_type || "Defect Detected"}</p>
                                  <p className="text-gray-600 mt-0.5">{photoAnalysis[p.id].summary}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Observations Tab */}
        {activeTab === "observations" && (
          <div>
            {mediaLoading ? (
              <div className="text-center py-12 text-text-muted">Loading observations...</div>
            ) : mediaData.length === 0 ? (
              <EmptyState icon="📝" title="No inspection areas" description="Add areas first to record observations" />
            ) : (
              <div className="space-y-6">
                {mediaData.map((item) => (
                  <Card key={item.area_id}>
                    <h3 className="font-bold text-text-primary mb-3">{item.area_name}</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        placeholder="Add text observation..."
                        value={newObsText[item.area_id] || ""}
                        onChange={(e) => setNewObsText({ ...newObsText, [item.area_id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleAddObservation(item.area_id)}
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-xs outline-none focus:border-brand-500"
                      />
                      <Button size="sm" onClick={() => handleAddObservation(item.area_id)}>Add Note</Button>
                    </div>

                    {item.observations.length === 0 ? (
                      <p className="text-xs text-text-muted">No observations recorded.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {item.observations.map((obs: any) => (
                          <div key={obs.id} className="py-2 text-xs">
                            <span className="font-semibold uppercase text-brand-600 mr-2">[{obs.observation_type}]</span>
                            <span className="text-text-primary">{obs.observation_text || "Voice note recorded"}</span>
                            {obs.transcription && (
                              <p className="mt-1 text-indigo-700 bg-indigo-50 p-2 rounded">
                                🎙️ Transcript: {obs.transcription.text}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── List View ────────────────────────────────────────────────── */
  return (
    <>
      <PageHeader
        eyebrow="Field Work"
        title={`Inspections (${total})`}
        actions={
          <>
            <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
            <Button onClick={() => setShowCreate(true)}>+ New Inspection</Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white"
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
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          title="To date"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-text-muted">
          <div className="animate-pulse text-lg">Loading inspections...</div>
        </div>
      ) : inspections.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No inspections found"
          description="Create your first inspection or adjust your filters"
          action={<Button onClick={() => setShowCreate(true)}>+ New Inspection</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              onClick={() => setSelectedInspection(insp)}
              className="border border-border rounded-xl px-5 py-4 hover:shadow-md cursor-pointer flex justify-between items-center transition-shadow bg-surface-card"
            >
              <div>
                <h3 className="font-bold text-text-primary">{insp.title || "Untitled"}</h3>
                <p className="text-sm text-text-muted mt-1">
                  Created {new Date(insp.created_at).toLocaleDateString()}
                  {insp.notes && (
                    <span className="ml-2 text-text-muted/70">&mdash; {insp.notes.slice(0, 60)}</span>
                  )}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${STATUS_COLORS[insp.status]}`}>
                {insp.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Inspection" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <SelectField required label="Property" value={createForm.property_id}
              onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}>
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.address}, {p.city}</option>
              ))}
            </SelectField>
            <InputField placeholder="e.g. Pre-Purchase Inspection" label="Title" value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
            <TextareaField placeholder="Optional notes..." label="Notes" value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} rows={2} />
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">Create</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
