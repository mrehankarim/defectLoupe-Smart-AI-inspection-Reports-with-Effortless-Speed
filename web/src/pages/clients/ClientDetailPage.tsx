import { useState, useEffect } from "react";
import { api, ApiError } from "../../services/api";
import { useToast } from "../../components/Layout";
import { Card } from "../../components/Card";

interface Client {
  id: string; first_name: string; last_name: string;
  email: string; phone_number: string | null;
  created_at: string; updated_at: string;
}

interface Property {
  id: string; address: string; city: string; state: string;
  property_type: string; year_built: number | null;
}

interface Inspection {
  id: string; title: string | null; status: string;
  created_at: string; updated_at: string;
}

interface ListResponse<T> { items: T[]; total: number; }

export default function ClientDetailPage({ clientId }: { clientId: string }) {
  const { showToast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [history, setHistory] = useState<Record<string, Inspection[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);

    Promise.all([
      api.get<Client>(`/clients/${clientId}`),
      api.get<ListResponse<Property>>(`/properties?client_id=${clientId}&limit=100`),
    ])
      .then(async ([clientData, propsData]) => {
        setClient(clientData);
        setProperties(propsData.items);

        const historyEntries = await Promise.all(
          propsData.items.map(async (p) => {
            const inspData = await api.get<ListResponse<Inspection>>(
              `/inspections?property_id=${p.id}&limit=50`
            );
            return { propertyId: p.id, inspections: inspData.items };
          })
        );
        const historyMap: Record<string, Inspection[]> = {};
        historyEntries.forEach((e) => { historyMap[e.propertyId] = e.inspections; });
        setHistory(historyMap);
      })
      .catch((err) => {
        const msg = (err as ApiError).detail || "Failed to load client details";
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  }, [clientId, showToast]);

  if (loading) {
    return (
      <div className="text-center py-16 text-text-muted">
        <div className="animate-pulse text-lg">Loading client details...</div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-lg">Client not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Client header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.13em] font-extrabold text-brand-500 uppercase mb-1">CLIENT PROFILE</p>
        <h1 className="text-2xl font-bold text-text-primary">{client.first_name} {client.last_name}</h1>
        <p className="text-sm text-text-secondary mt-1">{client.email} &middot; {client.phone_number || "No phone"}</p>
        <p className="text-xs text-text-muted mt-1">Client since {new Date(client.created_at).toLocaleDateString()}</p>
      </div>

      {/* Properties */}
      <h2 className="text-lg font-bold text-text-primary mb-4">Properties ({properties.length})</h2>
      {properties.length === 0 ? (
        <p className="text-sm text-text-secondary">No properties for this client yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {properties.map((prop) => (
            <Card key={prop.id}>
              <h3 className="font-bold text-text-primary">{prop.address}, {prop.city}</h3>
              <p className="text-sm text-text-secondary capitalize mt-0.5">
                {prop.property_type} &middot; Built {prop.year_built || "N/A"}
              </p>

              <h4 className="font-semibold text-text-primary mt-4 mb-2 text-sm">Inspection History</h4>
              {(history[prop.id] || []).length === 0 ? (
                <p className="text-sm text-text-muted">No inspections yet</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {(history[prop.id] || []).map((insp) => (
                    <div key={insp.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-b-0">
                      <span className="text-text-primary">{insp.title || "Untitled"}</span>
                      <span className="inline-block bg-brand-50 text-brand-600 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                        {insp.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
