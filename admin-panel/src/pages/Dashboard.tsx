import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";
import { getPartnerStatus, listPartners, type PartnerRecord } from "../lib/partnersAdminApi";

type PartnerIssue = {
  id: string;
  name: string;
  type: string;
  status: string;
  health: string;
  lastSync: string;
  failedJobs: number;
};

export const Dashboard = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [risk, setRisk] = useState<any[]>([]);
  const [partnerSummary, setPartnerSummary] = useState({
    total: 0,
    live: 0,
    paused: 0,
    healthy: 0,
    degraded: 0,
    error: 0,
  });
  const [pausedPartners, setPausedPartners] = useState<PartnerIssue[]>([]);
  const [failedPartners, setFailedPartners] = useState<PartnerIssue[]>([]);

  useEffect(() => {
    adminFetch("/kpis").then(setKpis).catch(() => null);
    adminFetch("/alerts").then((data) => setAlerts(data.alerts || [])).catch(() => null);
    adminFetch("/risk/scores?limit=5").then((data) => setRisk(data.scores || [])).catch(() => null);
    listPartners()
      .then(async (items: PartnerRecord[]) => {
        const valid = items.filter((item) => Boolean(item.id || item.partner_id));
        const enriched = await Promise.all(
          valid.map(async (item): Promise<PartnerIssue | null> => {
            const id = item.id || item.partner_id || "";
            if (!id) return null;
            const statusResp = await getPartnerStatus(id).catch(() => undefined);
            const integration = statusResp?.integration;
            const jobs = Array.isArray(statusResp?.recent_jobs) ? statusResp?.recent_jobs : [];
            const failedJobs = jobs.filter((job: any) => String(job?.status || "").toLowerCase() === "failed").length;
            const status = String(integration?.status || item.status || "").toLowerCase();
            const health = String(item.health || item.sync_health || "").toLowerCase();
            return {
              id,
              name: item.name || item.display_name || id,
              type: String(item.type || "partner"),
              status: status || "unknown",
              health: health || "healthy",
              lastSync: String(integration?.last_sync_at || item.last_sync_at || item.last_sync || item.updated_at || "—"),
              failedJobs,
            };
          })
        );
        const rows = enriched.filter(Boolean) as PartnerIssue[];
        const statusCounts = rows.reduce(
          (acc, item) => {
            if (item.status.includes("pause") || item.status.includes("inactive") || item.status.includes("error")) {
              acc.paused += 1;
            } else {
              acc.live += 1;
            }
            if (item.health.includes("error")) acc.error += 1;
            else if (item.health.includes("degraded")) acc.degraded += 1;
            else acc.healthy += 1;
            return acc;
          },
          { total: rows.length, live: 0, paused: 0, healthy: 0, degraded: 0, error: 0 }
        );
        setPartnerSummary(statusCounts);
        setPausedPartners(rows.filter((item) => item.status.includes("pause") || item.status.includes("inactive")).slice(0, 5));
        setFailedPartners(rows.filter((item) => item.failedJobs > 0 || item.health.includes("error") || item.health.includes("degraded")).slice(0, 5));
      })
      .catch(() => setPartnerSummary({ total: 0, live: 0, paused: 0, healthy: 0, degraded: 0, error: 0 }));
  }, []);

  return (
    <div>
      <h2>Platform Health</h2>
      <div className="card-grid">
        <div className="card">
          <h3>Total Orders</h3>
          <strong>{kpis?.total_orders ?? "—"}</strong>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <strong>KES {kpis?.total_revenue ?? "—"}</strong>
        </div>
        <div className="card">
          <h3>Active Users</h3>
          <strong>{kpis?.active_users ?? "—"}</strong>
        </div>
        <div className="card">
          <h3>Active Alerts</h3>
          <strong>{kpis?.active_alerts ?? "—"}</strong>
        </div>
        <div className="card">
          <h3>Partnership APIs</h3>
          <strong>{partnerSummary.total}</strong>
          <p className="muted">Backend partner records available to admin.</p>
          <a className="btn secondary" href="/partnerships" style={{ display: "inline-flex", marginTop: 12 }}>
            Open Partnerships
          </a>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Latest Alerts</h3>
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} style={{ marginBottom: 8 }}>
              <div>{alert.alert_type}</div>
              <span className="badge warn">{alert.status}</span>
            </div>
          ))}
          {alerts.length === 0 && <p style={{ color: "var(--muted)" }}>No active alerts.</p>}
        </div>
        <div className="card">
          <h3>Top Risk Scores</h3>
          {risk.map((row) => (
            <div key={row.user_id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>{row.user_id}</span>
              <span className="badge info">{row.score}</span>
            </div>
          ))}
          {risk.length === 0 && <p style={{ color: "var(--muted)" }}>No scores yet.</p>}
        </div>
        <div className="card">
          <h3>Partnership Health</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Live</span>
              <span className="badge info">{partnerSummary.live}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Paused</span>
              <span className="badge warn">{partnerSummary.paused}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Healthy</span>
              <span className="badge success">{partnerSummary.healthy}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Degraded</span>
              <span className="badge warn">{partnerSummary.degraded}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Error</span>
              <span className="badge warn">{partnerSummary.error}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Recent Sync Failures</h3>
          <p className="muted">Based on latest partner job states returned by the backend.</p>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {failedPartners.map((partner) => (
              <div key={partner.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{partner.name}</span>
                <span className="badge warn">{partner.failedJobs > 0 ? `${partner.failedJobs} failed` : partner.health}</span>
              </div>
            ))}
            {failedPartners.length === 0 && <p style={{ color: "var(--muted)" }}>No recent failures found.</p>}
          </div>
        </div>
        <div className="card">
          <h3>Paused Partners</h3>
          <p className="muted">Last 5 paused integrations from the backend.</p>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {pausedPartners.map((partner) => (
              <div key={partner.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{partner.name}</span>
                <span className="badge warn">Paused</span>
              </div>
            ))}
            {pausedPartners.length === 0 && <p style={{ color: "var(--muted)" }}>No paused partners.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
