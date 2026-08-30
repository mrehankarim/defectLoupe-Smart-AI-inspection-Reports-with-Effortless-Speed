/**
 * Client Detail page — shows client info, their properties, and inspection history.
 * M2 scope: detail view with property list and inspection timeline.
 * Drop into M1's scaffold at src/pages/clients/ClientDetailPage.tsx
 */
import { useState, useEffect } from "react";
import { api, ApiError } from "../../services/api";

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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-[100] max-w-sm">
      <div className="flex justify-between items-center gap-3">
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white font-bold">&times;</button>
      </div>
    </div>
  );
}

export default function ClientDetailPage({ clientId }: { clientId: string }) {
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

        // Fetch inspection history for each property
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
        setError((err as ApiError).detail || "Failed to load client details");
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-pulse text-lg">Loading client details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Toast message={error} onClose={() => setError(null)} />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">Client not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">{client.first_name} {client.last_name}</h1>
      <p className="text-gray-600">{client.email} · {client.phone_number || "No phone"}</p>
      <p className="text-sm text-gray-400 mb-6">Client since {new Date(client.created_at).toLocaleDateString()}</p>

      <h2 className="text-xl font-bold mb-3">Properties ({properties.length})</h2>
      {properties.length === 0 ? (
        <p className="text-gray-400 text-sm">No properties for this client yet.</p>
      ) : (
        <div className="space-y-6">
          {properties.map((prop) => (
            <div key={prop.id} className="border rounded-lg p-4">
              <h3 className="font-bold">{prop.address}, {prop.city}</h3>
              <p className="text-sm text-gray-500 capitalize">{prop.property_type} · Built {prop.year_built || "N/A"}</p>

              <h4 className="font-medium mt-3 mb-2">Inspection History</h4>
              {(history[prop.id] || []).length === 0 ? (
                <p className="text-sm text-gray-400">No inspections yet</p>
              ) : (
                <div className="space-y-1">
                  {(history[prop.id] || []).map((insp) => (
                    <div key={insp.id} className="flex justify-between items-center text-sm border-b py-1">
                      <span>{insp.title || "Untitled"}</span>
                      <span className="text-gray-500 capitalize">{insp.status.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
