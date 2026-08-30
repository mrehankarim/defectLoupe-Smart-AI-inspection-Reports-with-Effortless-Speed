/**
 * Properties page — list, create, edit, delete properties.
 * M2 scope: grid/list per client + create form + link to client.
 * Drop into M1's scaffold at src/pages/properties/PropertiesPage.tsx
 */
import { useState, useEffect } from "react";

const API_BASE = "/api/v1";

interface Property {
  id: string;
  client_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  property_type: string;
  year_built: number | null;
  square_footage: number | null;
  created_at: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [form, setForm] = useState({
    client_id: "", address: "", city: "", state: "", zip_code: "", country: "US",
    property_type: "residential", year_built: "", square_footage: "",
  });

  async function fetchProperties() {
    const params = new URLSearchParams({ limit: "50" });
    if (selectedClient) params.set("client_id", selectedClient);
    if (search) params.set("search", search);
    const res = await fetch(`${API_BASE}/properties?${params}`, { credentials: "include" });
    const data = await res.json();
    setProperties(data.items);
    setTotal(data.total);
  }

  async function fetchClients() {
    const res = await fetch(`${API_BASE}/clients?limit=200`, { credentials: "include" });
    const data = await res.json();
    setClients(data.items);
  }

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => { fetchProperties(); }, [selectedClient, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: any = { ...form };
    if (form.year_built) body.year_built = parseInt(form.year_built);
    if (form.square_footage) body.square_footage = parseInt(form.square_footage);
    else { delete body.year_built; delete body.square_footage; }

    const url = editingProp ? `${API_BASE}/properties/${editingProp.id}` : `${API_BASE}/properties`;
    const method = editingProp ? "PATCH" : "POST";
    await fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditingProp(null);
    fetchProperties();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this property?")) return;
    await fetch(`${API_BASE}/properties/${id}`, { method: "DELETE", credentials: "include" });
    fetchProperties();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Properties ({total})</h1>
        <button onClick={() => { setShowForm(true); setEditingProp(null); setForm({ client_id: "", address: "", city: "", state: "", zip_code: "", country: "US", property_type: "residential", year_built: "", square_footage: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Property
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
          className="p-2 border rounded">
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
        <input type="text" placeholder="Search by address or city..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => (
          <div key={p.id} className="border rounded-lg p-4 hover:shadow-md">
            <h3 className="font-bold text-lg">{p.address}</h3>
            <p className="text-gray-600">{p.city}, {p.state} {p.zip_code}</p>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2 capitalize">
              {p.property_type}
            </span>
            {p.year_built && <p className="text-sm text-gray-500 mt-1">Built: {p.year_built}</p>}
            {p.square_footage && <p className="text-sm text-gray-500">{p.square_footage} sq ft</p>}
            <div className="mt-3 space-x-2">
              <button onClick={() => { setEditingProp(p); setForm({ client_id: p.client_id, address: p.address, city: p.city, state: p.state, zip_code: p.zip_code, country: p.country, property_type: p.property_type, year_built: p.year_built?.toString() || "", square_footage: p.square_footage?.toString() || "" }); setShowForm(true); }}
                className="text-blue-600 hover:underline text-sm">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-96 space-y-3 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{editingProp ? "Edit Property" : "New Property"}</h2>
            <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full p-2 border rounded">
              <option value="">Select Client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
            <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full p-2 border rounded" />
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="p-2 border rounded" />
              <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="p-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Zip code" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className="p-2 border rounded" />
              <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="p-2 border rounded" />
            </div>
            <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="w-full p-2 border rounded">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="other">Other</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Year built" value={form.year_built} onChange={(e) => setForm({ ...form, year_built: e.target.value })} className="p-2 border rounded" />
              <input type="number" placeholder="Square footage" value={form.square_footage} onChange={(e) => setForm({ ...form, square_footage: e.target.value })} className="p-2 border rounded" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">{editingProp ? "Update" : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
