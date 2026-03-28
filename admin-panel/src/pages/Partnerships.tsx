import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Layers, MapPin, RefreshCcw, Search, ShieldCheck, Star } from "lucide-react";
import {
  connectPartner,
  disconnectPartner,
  getPartnerHealth,
  getPartnerStatus,
  listPartners,
  healthCheckPartner,
  pausePartner,
  refreshPartner,
  resumePartner,
  revokePartnerTokens,
  rotatePartnerTokens,
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
  nextSync?: string;
  failureReason?: string;
  retryCount?: number;
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
  if (lowered.includes("pause") || lowered.includes("inactive") || lowered.includes("error") || lowered.includes("revok")) return "paused";
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
  const [connectTarget, setConnectTarget] = useState<PartnerRow | null>(null);
  const [connectForm, setConnectForm] = useState({
    auth_method: "oauth2",
    access_token: "",
    refresh_token: "",
    expires_at: "",
    schema_version: "v1",
  });
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);
  const [copiedField, setCopiedField] = useState<"access" | "refresh" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const isValidRfc3339 = (value: string) => {
    if (!value.trim()) return true;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed);
  };

  const showToast = (message: string) => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 2400);
  };

  const copyToClipboard = async (value: string, field: "access" | "refresh") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
    } catch {
      setStatus("Unable to copy token to clipboard.");
    }
  };

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
              nextSync: formatTimestamp(integration?.next_sync_at),
              failureReason: integration?.error_state,
              retryCount: numberOrZero(integration?.retry_count),
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
              nextSync: formatTimestamp((entry as any).next_sync_at),
              failureReason: (entry as any).error_state,
              retryCount: numberOrZero((entry as any).retry_count),
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

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
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

  const openConnect = (partner: PartnerRow) => {
    setConnectTarget(partner);
    setConnectError(null);
    setShowAccessToken(false);
    setShowRefreshToken(false);
    setConnectForm({
      auth_method: "oauth2",
      access_token: "",
      refresh_token: "",
      expires_at: "",
      schema_version: "v1",
    });
  };

  const handleConnect = async () => {
    if (!connectTarget) return;
    if (!isValidRfc3339(connectForm.expires_at)) {
      setConnectError("Expires At must be a valid RFC3339 timestamp, or left blank.");
      return;
    }
    setConnectError(null);
    try {
      await connectPartner({
        partner_id: connectTarget.id,
        ...connectForm,
      });
      setConnectTarget(null);
      showToast("Partner connected successfully.");
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to connect partner.");
    }
  };

  const handleRefresh = async (partner: PartnerRow) => {
    try {
      await refreshPartner(partner.id);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to refresh partner tokens.");
    }
  };

  const handleRotate = async (partner: PartnerRow) => {
    try {
      await rotatePartnerTokens(partner.id);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to rotate partner tokens.");
    }
  };

  const handleHealthCheck = async (partner: PartnerRow) => {
    try {
      await healthCheckPartner(partner.id);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to run partner health check.");
    }
  };

  const handleRevoke = async (partner: PartnerRow) => {
    try {
      await revokePartnerTokens(partner.id);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to revoke partner tokens.");
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
            "POST /v1/partners/{id}/refresh",
            "POST /v1/partners/{id}/rotate",
            "POST /v1/partners/{id}/revoke",
            "POST /v1/partners/{id}/health-check",
            "POST /v1/partners/{id}/pause",
            "POST /v1/partners/{id}/resume",
            "POST /v1/partners/connect",
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
      {toast && (
        <div
          className="status"
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 60,
            background: "rgba(34,197,94,0.16)",
            borderColor: "rgba(74,222,128,0.4)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          }}
        >
          {toast}
        </div>
      )}

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
              <div>Next sync: {partner.nextSync || "—"}</div>
              <div>Failure reason: {partner.failureReason || "—"}</div>
              <div>Retry count: {partner.retryCount ?? 0}</div>
            </div>
            {partner.systems.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {partner.systems.map((system) => (
                  <span key={system} className="badge info">{system}</span>
                ))}
              </div>
            )}
            <div className="actions" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn secondary" onClick={() => openConnect(partner)}>
                Connect
              </button>
              <button className="btn secondary" onClick={() => handleHealthCheck(partner)}>
                Health Check
              </button>
              <button className="btn secondary" onClick={() => handleRefresh(partner)}>
                Refresh
              </button>
              <button className="btn secondary" onClick={() => handleRotate(partner)}>
                Rotate
              </button>
              <button className="btn secondary" onClick={() => handleTogglePause(partner)}>
                {partner.status === "paused" ? "Resume" : "Pause"}
              </button>
              <button className="btn secondary" onClick={() => handleSync(partner)} disabled={syncing[partner.id]}>
                {syncing[partner.id] ? "Syncing..." : "Sync"}
              </button>
              <button className="btn secondary" onClick={() => handleRevoke(partner)}>
                Revoke Tokens
              </button>
              <button className="btn secondary" onClick={() => handleDisconnect(partner)}>
                Disconnect
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

      {connectTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.72)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 24,
          }}
          onClick={() => setConnectTarget(null)}
        >
          <div
            className="card"
            style={{ width: "min(720px, 100%)", background: "rgba(15,23,42,0.96)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h3>Connect Partner</h3>
                <p className="muted">{connectTarget.name}</p>
                <p className="muted">Tokens are masked while you edit them.</p>
              </div>
            </div>
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 16 }}>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3>Auth Method</h3>
                <input className="input" value={connectForm.auth_method} onChange={(e) => setConnectForm((prev) => ({ ...prev, auth_method: e.target.value }))} />
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3>Schema Version</h3>
                <input className="input" value={connectForm.schema_version} onChange={(e) => setConnectForm((prev) => ({ ...prev, schema_version: e.target.value }))} />
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)", gridColumn: "span 2" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <h3>Access Token</h3>
                  <div className="actions">
                    <button className="btn secondary" type="button" onClick={() => copyToClipboard(connectForm.access_token, "access")}>
                      Copy
                    </button>
                    <button className="btn secondary" type="button" onClick={() => setShowAccessToken((prev) => !prev)}>
                      {showAccessToken ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <input
                  className="input"
                  type={showAccessToken ? "text" : "password"}
                  value={connectForm.access_token}
                  onChange={(e) => setConnectForm((prev) => ({ ...prev, access_token: e.target.value }))}
                  placeholder="Paste access token"
                  autoComplete="off"
                />
                {copiedField === "access" && <p className="muted" style={{ marginTop: 8, color: "#86efac" }}>Copied to clipboard.</p>}
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)", gridColumn: "span 2" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <h3>Refresh Token</h3>
                  <div className="actions">
                    <button className="btn secondary" type="button" onClick={() => copyToClipboard(connectForm.refresh_token, "refresh")}>
                      Copy
                    </button>
                    <button className="btn secondary" type="button" onClick={() => setShowRefreshToken((prev) => !prev)}>
                      {showRefreshToken ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <input
                  className="input"
                  type={showRefreshToken ? "text" : "password"}
                  value={connectForm.refresh_token}
                  onChange={(e) => setConnectForm((prev) => ({ ...prev, refresh_token: e.target.value }))}
                  placeholder="Paste refresh token"
                  autoComplete="off"
                />
                {copiedField === "refresh" && <p className="muted" style={{ marginTop: 8, color: "#86efac" }}>Copied to clipboard.</p>}
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)", gridColumn: "span 2" }}>
                <h3>Expires At</h3>
                <input
                  className="input"
                  value={connectForm.expires_at}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConnectForm((prev) => ({ ...prev, expires_at: value }));
                    if (connectError && isValidRfc3339(value)) {
                      setConnectError(null);
                    }
                  }}
                  placeholder="2026-03-27T12:00:00Z"
                  autoComplete="off"
                />
                {connectError && <p className="muted" style={{ color: "#fca5a5", marginTop: 8 }}>{connectError}</p>}
                {!connectError && <p className="muted" style={{ marginTop: 8 }}>Leave blank if the token expiry is not known yet.</p>}
              </div>
            </div>
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => setConnectTarget(null)}>
                Cancel
              </button>
              <button className="btn" onClick={handleConnect} disabled={Boolean(connectError)}>
                Connect Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
