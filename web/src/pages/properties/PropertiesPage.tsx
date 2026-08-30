/**
 * Properties page — list, create, edit, delete properties.
 * M2 scope: grid/list per client + create form + link to client + empty/loading states.
 * Drop into M1's scaffold at src/pages/properties/PropertiesPage.tsx
 */
import { useState, useEffect, useCallback } from "react";
import { api, buildQuery, ApiError } from "../../services/api";

interface Property {
  id: string; client_id: string; address: string; city: string;
  state: string; zip_code: string; country: string;
  property_type: string; year_built: number | null;
  square_footage: number | null; created_at: string; updated_at: string;
}

interface Client { id: string; first_name: string; last_name: string; }
interface ListResponse<T> { items: T[]; total: number; }

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

const EMPTY_FORM = {
  client_id: "", address: "", city: "", state: "", zip_code: "", country: "US",
  property_type: "residential", year_built: "", square_footage: "",
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const showToast = (message: string, type: "error" | "success" = "success") => setToast({ message, type });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery({
        client_id: selectedClient || null,
        search: search || null,
        limit: 50,
      });
      const data = await api.get<ListResponse<Property>>(`/properties${q}`);
      setProperties(data.items);
      setTotal(data.total);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to load properties", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedClient, search]);

  useEffect(() => {
    api.get<ListResponse<Client>>("/clients?limit=200")
      .then((data) => setClients(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  function openCreate() {
    setEditingProp(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(p: Property) {
    setEditingProp(p);
    setForm({
      client_id: p.client_id, address: p.address, city: p.city,
      state: p.state, zip_code: p.zip_code, country: p.country,
      property_type: p.property_type,
      year_built: p.year_built?.toString() || "",
      square_footage: p.square_footage?.toString() || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        client_id: form.client_id,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        country: form.country,
        property_type: form.property_type,
      };
      if (form.year_built) body.year_built = parseInt(form.year_built);
      if (form.square_footage) body.square_footage = parseInt(form.square_footage);

      if (editingProp) {
        await api.patch(`/properties/${editingProp.id}`, body);
        showToast("Property updated");
      } else {
        await api.post("/properties", body);
        showToast("Property created");
      }
      setShowForm(false);
      fetchProperties();
    } catch (err) {
      showToast((err as ApiError).detail || "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this property? This also removes its inspections.")) return;
    try {
      await api.delete(`/properties/${id}`);
      showToast("Property deleted");
      fetchProperties();
    } catch (err) {
      showToast((err as ApiError).detail || "Delete failed", "error");
    }
  }

  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Properties ({total})</h1>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + New Property
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
          className="p-2 border rounded text-sm">
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
        <input type="text" placeholder="Search by address or city..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] p-2 border rounded text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-pulse text-lg">Loading properties...</div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">No properties found</p>
          <p className="text-sm">Create a property or adjust your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg">{p.address}</h3>
              <p className="text-gray-600 text-sm">{p.city}, {p.state} {p.zip_code}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                  {p.property_type}
                </span>
                {p.year_built && (
                  <span className="text-xs text-gray-500">Built {p.year_built}</span>
                )}
              </div>
              {p.square_footage && (
                <p className="text-xs text-gray-500 mt-1">{p.square_footage.toLocaleString()} sq ft</p>
              )}
              <div className="mt-3 pt-3 border-t flex gap-3">
                <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-sm">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-lg w-[460px] space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{editingProp ? "Edit Property" : "New Property"}</h2>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Client *</label>
              <select required value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none">
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Address *</label>
              <input required placeholder="123 Main St" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">City *</label>
                <input required placeholder="Lahore" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">State *</label>
                <input required placeholder="Punjab" value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Zip code *</label>
                <input required placeholder="54000" value={form.zip_code}
                  onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Country</label>
                <input placeholder="US" value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Property type</label>
              <select value={form.property_type}
                onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Year built</label>
                <input type="number" placeholder="2020" min="1800" max="2030" value={form.year_built}
                  onChange={(e) => setForm({ ...form, year_built: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Square footage</label>
                <input type="number" placeholder="3500" min="0" value={form.square_footage}
                  onChange={(e) => setForm({ ...form, square_footage: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1 disabled:opacity-50">
                {submitting ? "Saving..." : (editingProp ? "Update" : "Create")}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200 flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
