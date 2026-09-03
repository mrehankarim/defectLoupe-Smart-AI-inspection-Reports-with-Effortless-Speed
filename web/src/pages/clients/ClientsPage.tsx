import { useState, useEffect, useCallback } from "react";
import { api, buildQuery, ApiError } from "../../services/api";
import { useToast } from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { InputField, SelectField } from "../../components/FormFields";
import { Card } from "../../components/Card";

interface Client {
  id: string; first_name: string; last_name: string;
  email: string; phone_number: string | null;
  inspector_id: string | null; company_id: string | null;
  created_at: string; updated_at: string;
}

interface ListResponse<T> { items: T[]; total: number; }

export default function ClientsPage() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone_number: "" });

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
  }, [search, showToast]);

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
    <>
      <PageHeader
        eyebrow="People"
        title={`Clients (${total})`}
        actions={<Button onClick={openCreate}>+ New Client</Button>}
      />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-border rounded-lg text-sm outline-none
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-text-muted">
          <div className="animate-pulse text-lg">Loading clients...</div>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No clients yet"
          description='Click "+ New Client" to add your first client'
          action={<Button onClick={openCreate}>+ New Client</Button>}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-sm">{c.first_name} {c.last_name}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{c.email}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{c.phone_number || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openEdit(c)} className="text-brand-500 hover:underline text-sm font-medium mr-3 bg-transparent border-none cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-sm font-medium bg-transparent border-none cursor-pointer">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal title={editingClient ? "Edit Client" : "New Client"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField required minLength={1} maxLength={100} placeholder="Ali" label="First name" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <InputField required minLength={1} maxLength={100} placeholder="Khan" label="Last name" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <InputField required type="email" placeholder="ali@example.com" label="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <InputField placeholder="+92-300-1234567" label="Phone" value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Saving..." : (editingClient ? "Update" : "Create")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
