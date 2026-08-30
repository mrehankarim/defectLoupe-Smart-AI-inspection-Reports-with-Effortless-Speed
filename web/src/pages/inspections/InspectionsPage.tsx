/**
 * Inspections page — list with filters, create flow, detail with area management.
 * M2 scope: list with status badges + filters + create + detail + area reorder.
 * Drop into M1's scaffold at src/pages/inspections/InspectionsPage.tsx
 */
import { useState, useEffect } from "react";

const API_BASE = "/api/v1";
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-200 text-gray-800",
  scheduled: "bg-yellow-200 text-yellow-800",
  in_progress: "bg-blue-200 text-blue-800",
  completed: "bg-green-200 text-green-800",
  report_generated: "bg-purple-200 text-purple-800",
  archived: "bg-gray-300 text-gray-600",
  cancelled: "bg-red-200 text-red-800",
};

interface Inspection {
  id: string; property_id: string; inspector_id: string;
  title: string | null; status: string; notes: string | null;
  created_at: string; updated_at: string;
}

interface Area { id: string; name: string; display_order: number; }

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ property_id: "", title: "" });
  const [newAreaName, setNewAreaName] = useState("");

  async function fetchInspections() {
    const params = new URLSearchParams({ limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`${API_BASE}/inspections?${params}`, { credentials: "include" });
    const data = await res.json();
    setInspections(data.items);
    setTotal(data.total);
  }

  async function fetchAreas(inspectionId: string) {
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/areas`, { credentials: "include" });
    setAreas(await res.json());
  }

  useEffect(() => { fetchInspections(); }, [statusFilter, search]);
  useEffect(() => { if (selectedInspection) fetchAreas(selectedInspection.id); }, [selectedInspection]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${API_BASE}/inspections`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    setShowCreate(false);
    fetchInspections();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await fetch(`${API_BASE}/inspections/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchInspections();
    if (selectedInspection?.id === id) {
      setSelectedInspection({ ...selectedInspection, status: newStatus });
    }
  }

  async function handleAddArea() {
    if (!newAreaName.trim() || !selectedInspection) return;
    await fetch(`${API_BASE}/inspections/${selectedInspection.id}/areas`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAreaName }),
    });
    setNewAreaName("");
    fetchAreas(selectedInspection.id);
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm("Delete this area?")) return;
    await fetch(`${API_BASE}/areas/${areaId}`, { method: "DELETE", credentials: "include" });
    if (selectedInspection) fetchAreas(selectedInspection.id);
  }

  async function handleApplyTemplate(templateName: string) {
    if (!selectedInspection) return;
    await fetch(`${API_BASE}/inspections/${selectedInspection.id}/areas/template`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_name: templateName }),
    });
    fetchAreas(selectedInspection.id);
  }

  async function handleExportCSV() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    window.open(`${API_BASE}/inspections/export/csv?${params}`, "_blank");
  }

  // ── Detail View ─────────────────────────────────────────────────────
  if (selectedInspection) {
    const insp = selectedInspection;
    const nextStatuses: Record<string, string[]> = {
      draft: ["scheduled", "cancelled"], scheduled: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"], completed: ["report_generated"],
      report_generated: ["archived"], archived: [], cancelled: [],
    };

    return (
      <div className="p-6">
        <button onClick={() => setSelectedInspection(null)} className="text-blue-600 hover:underline mb-4 block">&larr; Back to list</button>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{insp.title || "Untitled Inspection"}</h1>
            <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${STATUS_COLORS[insp.status]}`}>
              {insp.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex gap-2">
            {(nextStatuses[insp.status] || []).map((s) => (
              <button key={s} onClick={() => handleStatusChange(insp.id, s)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 capitalize">
                → {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Areas ({areas.length})</h2>
          <div className="flex gap-2 mb-4">
            <input placeholder="New area name" value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="flex-1 p-2 border rounded" />
            <button onClick={handleAddArea} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Add</button>
          </div>
          <div className="flex gap-2 mb-4">
            <span className="text-sm text-gray-500 self-center">Templates:</span>
            {["standard_residential", "commercial", "pre_purchase"].map((t) => (
              <button key={t} onClick={() => handleApplyTemplate(t)}
                className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300 capitalize">
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {areas.map((area) => (
              <div key={area.id} className="flex justify-between items-center border rounded p-3 hover:bg-gray-50">
                <div>
                  <span className="text-gray-400 mr-2">{area.display_order}.</span>
                  <span className="font-medium">{area.name}</span>
                </div>
                <button onClick={() => handleDeleteArea(area.id)} className="text-red-600 hover:underline text-sm">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inspections ({total})</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Export CSV</button>
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Inspection</button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>
          ))}
        </select>
        <input type="text" placeholder="Search by title..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="flex-1 p-2 border rounded" />
      </div>

      <div className="space-y-3">
        {inspections.map((insp) => (
          <div key={insp.id} onClick={() => setSelectedInspection(insp)}
            className="border rounded-lg p-4 hover:shadow-md cursor-pointer flex justify-between items-center">
            <div>
              <h3 className="font-bold">{insp.title || "Untitled"}</h3>
              <p className="text-sm text-gray-500">Created {new Date(insp.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[insp.status]}`}>
              {insp.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg w-96 space-y-4">
            <h2 className="text-xl font-bold">New Inspection</h2>
            <input required placeholder="Property ID (UUID)" value={createForm.property_id}
              onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}
              className="w-full p-2 border rounded" />
            <input placeholder="Title (optional)" value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
