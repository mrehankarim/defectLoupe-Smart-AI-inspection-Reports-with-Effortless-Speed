/**
 * Clients page — list, create, edit, delete clients.
 * M2 scope: table with search/filter + create modal + detail view.
 * Drop into M1's React+Vite scaffold at src/pages/clients/ClientsPage.tsx
 */
import { useState, useEffect } from "react";

const API_BASE = "/api/v1";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone_number: "" });

  async function fetchClients() {
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`${API_BASE}/clients?${params}`, { credentials: "include" });
    const data = await res.json();
    setClients(data.items);
    setTotal(data.total);
  }

  useEffect(() => { fetchClients(); }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingClient
      ? `${API_BASE}/clients/${editingClient.id}`
      : `${API_BASE}/clients`;
    const method = editingClient ? "PATCH" : "POST";
    await fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setEditingClient(null);
    setForm({ first_name: "", last_name: "", email: "", phone_number: "" });
    fetchClients();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    await fetch(`${API_BASE}/clients/${id}`, { method: "DELETE", credentials: "include" });
    fetchClients();
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setForm({ first_name: client.first_name, last_name: client.last_name, email: client.email, phone_number: client.phone_number || "" });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients ({total})</h1>
        <button onClick={() => { setShowForm(true); setEditingClient(null); setForm({ first_name: "", last_name: "", email: "", phone_number: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Client
        </button>
      </div>

      <input type="text" placeholder="Search by name or email..." value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4" />

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Created</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{c.first_name} {c.last_name}</td>
              <td className="p-3">{c.email}</td>
              <td className="p-3">{c.phone_number || "—"}</td>
              <td className="p-3">{new Date(c.created_at).toLocaleDateString()}</td>
              <td className="p-3 space-x-2">
                <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-96 space-y-4">
            <h2 className="text-xl font-bold">{editingClient ? "Edit Client" : "New Client"}</h2>
            <input required placeholder="First name" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full p-2 border rounded" />
            <input required placeholder="Last name" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full p-2 border rounded" />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 border rounded" />
            <input placeholder="Phone (optional)" value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">
                {editingClient ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
