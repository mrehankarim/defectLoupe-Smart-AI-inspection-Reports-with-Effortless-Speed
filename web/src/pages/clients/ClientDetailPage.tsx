/**
 * Client Detail page — shows client info, their properties, and inspection history.
 * M2 scope: detail view with property list and inspection timeline.
 * Drop into M1's scaffold at src/pages/clients/ClientDetailPage.tsx
 */
import { useState, useEffect } from "react";

const API_BASE = "/api/v1";

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

export default function ClientDetailPage({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [history, setHistory] = useState<Record<string, Inspection[]>>({});

  useEffect(() => {
    if (!clientId) return;

    fetch(`${API_BASE}/clients/${clientId}`, { credentials: "include" })
      .then((r) => r.json()).then(setClient);

    fetch(`${API_BASE}/properties?client_id=${clientId}&limit=100`, { credentials: "include" })
      .then((r) => r.json()).then((data) => {
        setProperties(data.items);
        data.items.forEach((p: Property) => {
          fetch(`${API_BASE}/inspections?property_id=${p.id}&limit=50`, { credentials: "include" })
            .then((r) => r.json())
            .then((inspData) => setHistory((prev) => ({ ...prev, [p.id]: inspData.items })));
        });
      });
  }, [clientId]);

  if (!client) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">{client.first_name} {client.last_name}</h1>
      <p className="text-gray-600">{client.email} · {client.phone_number || "No phone"}</p>
      <p className="text-sm text-gray-400 mb-6">Client since {new Date(client.created_at).toLocaleDateString()}</p>

      <h2 className="text-xl font-bold mb-3">Properties ({properties.length})</h2>
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
    </div>
  );
}
