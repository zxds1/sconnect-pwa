import { useEffect, useMemo, useState } from "react";
import { Building2, Layers, MapPin, RefreshCcw, Search, ShieldCheck, Star } from "lucide-react";
import {
  disconnectPartner,
  getPartnerHealth,
  getPartnerStatus,
  listPartners,
  pausePartner,
  resumePartner,
  syncPartner,
  type PartnerRecord,
} from "../lib/partnersAdminApi";

type PartnerRow = {
  id: string;
  name: string;
  type: string;
  rating: number;
  location?: string;
  systems: string[];
  products: number;
  starsEarned: number;
  lastSync: string;
  status: "live" | "paused";
  health?: string;
  integrationId?: string;
};

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const parseLocation = (location?: string | { address?: string }) => {
  if (!location) return undefined;
  if (typeof location === "string") return location;
  return location.address;
};

const extractHealthLabel = (value: any) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.status || value.health || value.state || undefined;
};

const normalizeStatus = (status?: string): "live" | "paused" => {
  const lowered = (status || "").toLowerCase();
  if (lowered.includes("pause") || lowered.includes("inactive") || lowered.includes("error")) return "paused";
  return "live";
};

const normalizeType = (type?: string) => {
  if (!type) return "Integration";
  const lowered = type.toLowerCase();
  if (lowered === "pos") return "POS";
  if (lowered === "erp") return "ERP";
  if (lowered === "crm") return "CRM";
  if (lowered === "csv") return "CSV";
  if (lowered === "sheet" || lowered === "sheets") return "Sheets";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatTimestamp = (value?: string) => value || "—";

export const Partnerships = () => {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const resp = await listPartners();
      const rows = await Promise.all(
        resp.map(async (entry: PartnerRecord): Promise<PartnerRow | null> => {
          const id = entry.id || entry.partner_id || "";
          if (!id) return null;
          try {
            const [health, state] = await Promise.all([
              getPartnerHealth(id).catch(() => undefined),
              getPartnerStatus(id).catch(() => undefined),
            ]);
            const integration = state?.integration;
            return {
              id,
              name: entry.name || entry.display_name || "Unknown partner",
              type: normalizeType(entry.type),
              rating: numberOrZero(entry.rating),
              location: parseLocation(entry.location),
              systems: entry.systems || [],
              products: numberOrZero(entry.products ?? entry.total_products),
              starsEarned: numberOrZero(entry.stars_earned ?? entry.starsEarned),
              lastSync: formatTimestamp(integration?.last_sync_at || entry.last_sync_at || entry.last_sync || entry.updated_at),
              status: normalizeStatus(integration?.status || entry.status),
              health: extractHealthLabel(health),
              integrationId: integration?.id,
            };
          } catch {
            return {
              id,
              name: entry.name || entry.display_name || "Unknown partner",
              type: normalizeType(entry.type),
              rating: numberOrZero(entry.rating),
              location: parseLocation(entry.location),
              systems: entry.systems || [],
              products: numberOrZero(entry.products ?? entry.total_products),
              starsEarned: numberOrZero(entry.stars_earned ?? entry.starsEarned),
              lastSync: formatTimestamp(entry.last_sync_at || entry.last_sync || entry.updated_at),
              status: normalizeStatus(entry.status),
              health: extractHealthLabel(entry.health || entry.sync_health),
            };
          }
        })
      );
      setPartners(rows.filter(Boolean) as PartnerRow[]);
    } catch (err: any) {
      setStatus(err?.message || "Unable to load partner APIs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return partners;
    return partners.filter((partner) =>
      [partner.name, partner.type, partner.location, partner.status, partner.health]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [partners, query]);

  const handleTogglePause = async (partner: PartnerRow) => {
    try {
      if (partner.status === "paused") {
        await resumePartner(partner.id);
        setPartners((prev) => prev.map((item) => item.id === partner.id ? { ...item, status: "live" } : item));
      } else {
        await pausePartner(partner.id);
        setPartners((prev) => prev.map((item) => item.id === partner.id ? { ...item, status: "paused" } : item));
      }
    } catch (err: any) {
      setStatus(err?.message || "Unable to update partner status.");
    }
  };

  const handleSync = async (partner: PartnerRow) => {
    setSyncing((prev) => ({ ...prev, [partner.id]: true }));
    try {
      await syncPartner(partner.id);
      setPartners((prev) => prev.map((item) => item.id === partner.id ? { ...item, lastSync: new Date().toISOString() } : item));
    } catch (err: any) {
      setStatus(err?.message || "Unable to sync partner.");
    } finally {
      setSyncing((prev) => ({ ...prev, [partner.id]: false }));
    }
  };

  const handleDisconnect = async (partner: PartnerRow) => {
    try {
      let integrationId = partner.integrationId;
      if (!integrationId) {
        const state = await getPartnerStatus(partner.id);
        integrationId = state?.integration?.id;
      }
      if (!integrationId) {
        setStatus("Integration not found for this partner.");
        return;
      }
      await disconnectPartner({ integration_id: integrationId });
      setPartners((prev) => prev.filter((item) => item.id !== partner.id));
    } catch (err: any) {
      setStatus(err?.message || "Unable to revoke partner.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Partnership APIs</h2>
          <p>Admin controls for backend partner records, sync state, and integration health.</p>
        </div>
        <div className="actions">
          <input
            className="input"
            placeholder="Search partners..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn secondary" onClick={load}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>API Surface</h3>
            <p>These are the backend endpoints the admin panel uses for partnerships.</p>
          </div>
        </div>
        <div className="card-grid">
          {[
            "GET /v1/partners",
            "GET /v1/partners/{id}/status",
            "GET /v1/partners/{id}/health",
            "POST /v1/partners/{id}/sync",
            "POST /v1/partners/{id}/pause",
            "POST /v1/partners/{id}/resume",
            "POST /v1/partners/disconnect",
          ].map((endpoint) => (
            <div key={endpoint} className="card" style={{ padding: 12 }}>
              <code style={{ fontSize: 12 }}>{endpoint}</code>
            </div>
          ))}
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {loading && <div className="status">Loading partner records...</div>}

      <div className="card-grid">
        {filtered.map((partner) => (
          <div key={partner.id} className="card">
            <div className="card-header">
              <div>
                <h3>{partner.name}</h3>
                <p className="muted">{partner.type} • {partner.status.toUpperCase()}</p>
              </div>
              <span className="badge info">{partner.rating.toFixed(1)}</span>
            </div>
            <div className="muted" style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={14} />
                <span>{partner.location || "Online"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={14} />
                <span>{partner.products} products</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={14} />
                <span>{partner.health || "healthy"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={14} />
                <span>{partner.starsEarned} stars earned</span>
              </div>
              <div>Last sync: {partner.lastSync}</div>
            </div>
            {partner.systems.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {partner.systems.map((system) => (
                  <span key={system} className="badge info">{system}</span>
                ))}
              </div>
            )}
            <div className="actions" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn secondary" onClick={() => handleTogglePause(partner)}>
                {partner.status === "paused" ? "Resume" : "Pause"}
              </button>
              <button className="btn secondary" onClick={() => handleSync(partner)} disabled={syncing[partner.id]}>
                {syncing[partner.id] ? "Syncing..." : "Sync"}
              </button>
              <button className="btn secondary" onClick={() => handleDisconnect(partner)}>
                Revoke
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="card">
            <p className="muted">No partners matched your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
