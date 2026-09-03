import { useState, useEffect, useCallback } from "react";
import { api, buildQuery, ApiError } from "../../services/api";
import { useToast } from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { InputField, SelectField } from "../../components/FormFields";
import { Card } from "../../components/Card";

interface Property {
  id: string; client_id: string; address: string; city: string;
  state: string; zip_code: string; country: string;
  property_type: string; year_built: number | null;
  square_footage: number | null; created_at: string; updated_at: string;
}

interface Client { id: string; first_name: string; last_name: string; }
interface ListResponse<T> { items: T[]; total: number; }

const EMPTY_FORM = {
  client_id: "", address: "", city: "", state: "", zip_code: "", country: "US",
  property_type: "residential", year_built: "", square_footage: "",
};

export default function PropertiesPage() {
  const { showToast } = useToast();
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
  }, [selectedClient, search, showToast]);

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
        client_id: form.client_id, address: form.address, city: form.city,
        state: form.state, zip_code: form.zip_code, country: form.country,
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
    <>
      <PageHeader
        eyebrow="Locations"
        title={`Properties (${total})`}
        actions={<Button onClick={openCreate}>+ New Property</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by address or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-text-muted">
          <div className="animate-pulse text-lg">Loading properties...</div>
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No properties found"
          description="Create a property or adjust your filters"
          action={<Button onClick={openCreate}>+ New Property</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <h3 className="font-bold text-text-primary text-lg">{p.address}</h3>
              <p className="text-sm text-text-secondary">{p.city}, {p.state} {p.zip_code}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-block bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                  {p.property_type}
                </span>
                {p.year_built && (
                  <span className="text-xs text-text-muted">Built {p.year_built}</span>
                )}
              </div>
              {p.square_footage && (
                <p className="text-xs text-text-muted mt-1.5">{p.square_footage.toLocaleString()} sq ft</p>
              )}
              <div className="mt-4 pt-3 border-t border-border flex gap-3">
                <button onClick={() => openEdit(p)} className="text-brand-500 hover:underline text-sm font-medium bg-transparent border-none cursor-pointer">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-sm font-medium bg-transparent border-none cursor-pointer">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal title={editingProp ? "Edit Property" : "New Property"} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <SelectField required label="Client" value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </SelectField>

            <InputField required placeholder="123 Main St" label="Address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />

            <div className="grid grid-cols-2 gap-3">
              <InputField required placeholder="Lahore" label="City" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <InputField required placeholder="Punjab" label="State" value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField required placeholder="54000" label="Zip code" value={form.zip_code}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
              <InputField placeholder="US" label="Country" value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>

            <SelectField label="Property type" value={form.property_type}
              onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="other">Other</option>
            </SelectField>

            <div className="grid grid-cols-2 gap-3">
              <InputField type="number" placeholder="2020" min="1800" max="2030" label="Year built" value={form.year_built}
                onChange={(e) => setForm({ ...form, year_built: e.target.value })} />
              <InputField type="number" placeholder="3500" min="0" label="Square footage" value={form.square_footage}
                onChange={(e) => setForm({ ...form, square_footage: e.target.value })} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Saving..." : (editingProp ? "Update" : "Create")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
