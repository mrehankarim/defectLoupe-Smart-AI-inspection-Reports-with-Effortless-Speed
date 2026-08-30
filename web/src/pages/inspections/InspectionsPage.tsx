/**
 * Inspections page — list with filters, create flow, detail with tabbed area management.
 * M2 scope: list with status badges + filters + create + detail + area reorder + templates.
 * Drop into M1's React+Vite scaffold at src/pages/inspections/InspectionsPage.tsx
 */
import { useState, useEffect, useCallback } from "react";
import { api, buildQuery, ApiError } from "../../services/api";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-200 text-gray-800",
  scheduled: "bg-yellow-200 text-yellow-800",
  in_progress: "bg-blue-200 text-blue-800",
  completed: "bg-green-200 text-green-800",
  report_generated: "bg-purple-200 text-purple-800",
  archived: "bg-gray-300 text-gray-600",
  cancelled: "bg-red-200 text-red-800",
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

// ── Toast / Error display ──────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "error" | "success"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "error" ? "bg-red-600" : "bg-green-600";
  return (
    <div className={`fixed top-4 right-4 ${bg} text-white px-4 py-3 rounded-lg shadow-lg z-[100] max-w-sm`}>
      <div className="flex justify-between items-center gap-3">
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white font-bold">&times;</button>
      </div>
    </div>
  );
}

export default function InspectionsPage() {
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
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const showToast = (message: string, type: "error" | "success" = "success") => setToast({ message, type });

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery({ status: statusFilter || null, search: search || null, date_from: dateFrom || null, date_to: dateTo || null, limit: 50 });
      const data = await api.get<ListResponse<Inspection>>(`/inspections${q}`);
      setInspections(data.items);
      setTotal(data.total);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to load inspections", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, dateFrom, dateTo]);

  const fetchAreas = useCallback(async (inspectionId: string) => {
    setAreasLoading(true);
    try {
      const data = await api.get<Area[]>(`/inspections/${inspectionId}/areas`);
      setAreas(data);
    } catch { setAreas([]); }
    finally { setAreasLoading(false); }
  }, []);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);
  useEffect(() => { if (selectedInspection) fetchAreas(selectedInspection.id); }, [selectedInspection, fetchAreas]);

  // Load properties for the create-inspection dropdown
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
      showToast(`Status → ${newStatus.replace("_", " ")}`);
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
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to add area", "error");
    }
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm("Delete this area?")) return;
    try {
      await api.delete(`/areas/${areaId}`);
      if (selectedInspection) fetchAreas(selectedInspection.id);
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
    } catch (err) {
      showToast((err as ApiError).detail || "Template apply failed", "error");
    }
  }

  function handleExportCSV() {
    const q = buildQuery({ status: statusFilter || null });
    window.open(`/api/v1/inspections/export/csv${q}`, "_blank");
  }

  // ── Detail View ─────────────────────────────────────────────────────
  if (selectedInspection) {
    const insp = selectedInspection;

    return (
      <div className="p-6">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <button onClick={() => { setSelectedInspection(null); setActiveTab("areas"); }}
          className="text-blue-600 hover:underline mb-4 block text-sm">&larr; Back to list</button>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{insp.title || "Untitled Inspection"}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm capitalize ${STATUS_COLORS[insp.status]}`}>
                {insp.status.replace("_", " ")}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(insp.created_at).toLocaleDateString()}
              </span>
            </div>
            {insp.notes && <p className="text-gray-600 text-sm mt-2">{insp.notes}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(VALID_TRANSITIONS[insp.status] || []).map((s) => (
              <button key={s} onClick={() => handleStatusChange(insp.id, s)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 capitalize">
                → {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="border-b mb-4">
          <div className="flex gap-6">
            {(["areas", "photos", "observations"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium border-b-2 capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Areas Tab ─────────────────────────────────────────────── */}
        {activeTab === "areas" && (
          <div>
            <div className="flex gap-2 mb-4">
              <input placeholder="New area name..." value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              <button onClick={handleAddArea} disabled={!newAreaName.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                + Add
              </button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="text-xs text-gray-500 self-center">Templates:</span>
              {["standard_residential", "commercial", "pre_purchase"].map((t) => (
                <button key={t} onClick={() => handleApplyTemplate(t)}
                  className="bg-gray-100 border px-3 py-1 rounded text-xs hover:bg-gray-200 capitalize">
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>

            {areasLoading ? (
              <div className="text-center py-8 text-gray-400">Loading areas...</div>
            ) : areas.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg mb-1">No areas yet</p>
                <p className="text-sm">Add areas manually or apply a template above</p>
              </div>
            ) : (
              <div className="space-y-1">
                {areas.map((area, idx) => (
                  <div key={area.id} className="flex justify-between items-center border rounded p-3 hover:bg-gray-50 group">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-6 text-right text-sm">{area.display_order}.</span>
                      <span className="font-medium">{area.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleMoveArea(idx, "up")} disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move up">↑</button>
                      <button onClick={() => handleMoveArea(idx, "down")} disabled={idx === areas.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move down">↓</button>
                      <button onClick={() => handleDeleteArea(area.id)}
                        className="p-1 text-red-400 hover:text-red-600 ml-2" title="Delete">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Photos Tab ────────────────────────────────────────────── */}
        {activeTab === "photos" && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-1">Photos</p>
            <p className="text-sm">Photo management is handled by the media service (M3)</p>
            <p className="text-xs mt-2">Photos will appear here once uploaded through the inspection area workflow</p>
          </div>
        )}

        {/* ── Observations Tab ──────────────────────────────────────── */}
        {activeTab === "observations" && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-1">Observations</p>
            <p className="text-sm">Observation management is handled by the media service (M3)</p>
            <p className="text-xs mt-2">Text and voice observations will appear here once created</p>
          </div>
        )}
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inspections ({total})</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200 text-sm">
            Export CSV
          </button>
          <button onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            + New Inspection
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded text-sm">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        <input type="text" placeholder="Search title..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] p-2 border rounded text-sm" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="p-2 border rounded text-sm" title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="p-2 border rounded text-sm" title="To date" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-pulse text-lg">Loading inspections...</div>
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">No inspections found</p>
          <p className="text-sm">Create your first inspection or adjust your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <div key={insp.id} onClick={() => setSelectedInspection(insp)}
              className="border rounded-lg p-4 hover:shadow-md cursor-pointer flex justify-between items-center transition-shadow">
              <div>
                <h3 className="font-bold">{insp.title || "Untitled"}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created {new Date(insp.created_at).toLocaleDateString()}
                  {insp.notes && <span className="ml-2 text-gray-400">— {insp.notes.slice(0, 60)}</span>}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap ${STATUS_COLORS[insp.status]}`}>
                {insp.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-lg w-[420px] space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">New Inspection</h2>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Property *</label>
              <select required value={createForm.property_id}
                onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none">
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.address}, {p.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Title</label>
              <input placeholder="e.g. Pre-Purchase Inspection" value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Notes</label>
              <textarea placeholder="Optional notes..." value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">Create</button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200 flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
