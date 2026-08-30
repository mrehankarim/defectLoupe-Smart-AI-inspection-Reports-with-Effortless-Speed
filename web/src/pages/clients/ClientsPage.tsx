/**
 * Clients page — list, create, edit, delete clients.
 * M2 scope: table with search/filter + create/edit modal + empty/loading states.
 * Drop into M1's React+Vite scaffold at src/pages/clients/ClientsPage.tsx
 */
import { useState, useEffect, useCallback } from "react";
import { api, buildQuery, ApiError } from "../../services/api";

interface Client {
  id: string; first_name: string; last_name: string;
  email: string; phone_number: string | null;
  inspector_id: string | null; company_id: string | null;
  created_at: string; updated_at: string;
}

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone_number: "" });
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const showToast = (message: string, type: "error" | "success" = "success") => setToast({ message, type });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery({ search: search || null, limit: 50 });
      const data = await api.get<ListResponse<Client>>(`/clients${q}`);
      setClients(data.items);
      setTotal(data.total);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to load clients", "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function openCreate() {
    setEditingClient(null);
    setForm({ first_name: "", last_name: "", email: "", phone_number: "" });
    setShowForm(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setForm({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone_number: client.phone_number || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingClient) {
        await api.patch(`/clients/${editingClient.id}`, form);
        showToast("Client updated");
      } else {
        await api.post("/clients", form);
        showToast("Client created");
      }
      setShowForm(false);
      fetchClients();
    } catch (err) {
      showToast((err as ApiError).detail || "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? This also removes all their properties and inspections.")) return;
    try {
      await api.delete(`/clients/${id}`);
      showToast("Client deleted");
      fetchClients();
    } catch (err) {
      showToast((err as ApiError).detail || "Delete failed", "error");
    }
  }

  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients ({total})</h1>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + New Client
        </button>
      </div>

      <input type="text" placeholder="Search by name or email..." value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-pulse text-lg">Loading clients...</div>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">No clients yet</p>
          <p className="text-sm">Click "+ New Client" to add your first client</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Created</th>
                <th className="p-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="p-3 text-sm text-gray-600">{c.email}</td>
                  <td className="p-3 text-sm text-gray-600">{c.phone_number || "—"}</td>
                  <td className="p-3 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right space-x-3">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-lg w-[420px] space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">{editingClient ? "Edit Client" : "New Client"}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">First name *</label>
                <input required minLength={1} maxLength={100} placeholder="Ali" value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Last name *</label>
                <input required minLength={1} maxLength={100} placeholder="Khan" value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Email *</label>
              <input required type="email" placeholder="ali@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Phone</label>
              <input placeholder="+92-300-1234567" value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1 disabled:opacity-50">
                {submitting ? "Saving..." : (editingClient ? "Update" : "Create")}
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
