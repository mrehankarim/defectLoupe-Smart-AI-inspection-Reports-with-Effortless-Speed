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
          className="flex-1 min-w-50 px-4 py-2.5 border border-border rounded-lg text-sm outline-none
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
          icon={
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          }
          title="No properties found"
          description="Create a property or adjust your filters"
          action={<Button onClick={openCreate}>+ New Property</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p, idx) => {
            const client = clients.find((c) => c.id === p.client_id);
            const typeKey = (p.property_type || "residential").toLowerCase();
            const imagePool = [
              "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80",
            ];
            const coverImage = imagePool[idx % imagePool.length];

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Property Cover Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={coverImage}
                    alt={p.address}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-black/20" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 text-white border border-white/20 backdrop-blur-md">
                      {p.property_type}
                    </span>
                  </div>
                  {p.year_built && (
                    <div className="absolute top-3 right-3 text-[11px] font-mono text-white/90 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      Built {p.year_built}
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="font-bold text-white text-base truncate drop-shadow-sm">
                      {p.address}
                    </h3>
                    <p className="text-xs text-slate-200 truncate drop-shadow-sm">
                      {p.city}, {p.state} {p.zip_code}
                    </p>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Client Owner Tag */}
                    {client && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                          {client.first_name} {client.last_name}
                        </span>
                      </div>
                    )}

                    {/* Specs Pills */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {p.square_footage && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                          {p.square_footage.toLocaleString()} sq ft
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 uppercase">
                        {p.country || "US"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Property
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs font-medium text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
