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
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  report_generated: "bg-purple-100 text-purple-700",
  archived: "bg-gray-200 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
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

  useEffect(() => { fetchInspections(); }, [fetchInspections]);
  useEffect(() => {
    if (selectedInspection) fetchAreas(selectedInspection.id);
  }, [selectedInspection, fetchAreas]);

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
          <EmptyState
            icon="📷"
            title="Photos"
            description="Photo management is handled by the media service. Photos will appear here once uploaded."
          />
        )}

        {/* Observations Tab */}
        {activeTab === "observations" && (
          <EmptyState
            icon="📝"
            title="Observations"
            description="Text and voice observations will appear here once created through the inspection workflow."
          />
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
