import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";
import { getSearchCacheMetrics } from "../lib/adminApi";
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
  const [activitySummary, setActivitySummary] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
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
  const [cacheMetrics, setCacheMetrics] = useState<any>(null);

  useEffect(() => {
    adminFetch("/kpis").then(setKpis).catch(() => null);
    adminFetch("/alerts").then((data) => setAlerts(data.alerts || [])).catch(() => null);
    adminFetch("/risk/scores?limit=5").then((data) => setRisk(data.scores || [])).catch(() => null);
    adminFetch("/activity/summary?limit=25").then(setActivitySummary).catch(() => null);
    adminFetch("/flags").then((data) => setFlags(data.flags || [])).catch(() => setFlags([]));
    adminFetch("/experiments").then((data) => setExperiments(data.experiments || [])).catch(() => setExperiments([]));
    getSearchCacheMetrics().then(setCacheMetrics).catch(() => null);
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

  const activityTypes = Object.entries(activitySummary?.by_account_type || {}) as [string, number][];
  const activityFeatures = Object.entries(activitySummary?.by_feature || {}) as [string, number][];
  const activityActions = Object.entries(activitySummary?.by_action || {}) as [string, number][];
  const totalActivity = activitySummary?.total ?? 0;
  const maxActivityBucket = Math.max(
    1,
    ...activityTypes.map(([, value]) => value),
    ...activityFeatures.map(([, value]) => value),
    ...activityActions.map(([, value]) => value),
  );

  const controlSurfaces = [
    { title: "Feature Flags", count: flags.length, href: "/flags", note: "Kill switches and rollouts." },
    { title: "Experiments", count: experiments.length, href: "/experiments", note: "A/B and staged releases." },
    { title: "Ops Configs", count: "Live", href: "/ops-configs", note: "Platform configuration values." },
    { title: "Assistant Models", count: "Managed", href: "/assistant-models", note: "Prompt and model governance." },
    { title: "Supplier Apps", count: "Queue", href: "/supplier-applications", note: "Onboarding review flow." },
    { title: "Security", count: "Watch", href: "/security", note: "Controls, alerts, and overview." },
  ];

  const renderBars = (items: [string, number][]) => (
    <div style={{ display: "grid", gap: 12 }}>
      {items.length === 0 && <p className="muted">No data yet.</p>}
      {items.map(([label, value]) => (
        <div key={label} style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{label}</span>
            <span className="badge info">{value}</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(6, (value / maxActivityBucket) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page" style={{ gap: 24 }}>
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(167,139,250,0.12) 45%, rgba(34,197,94,0.08))",
          borderColor: "rgba(125,211,252,0.24)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
        }}
      >
        <div className="page-header" style={{ alignItems: "flex-end" }}>
          <div>
            <h2>Control Center</h2>
            <p>Business health, platform activity, and system governance in one place.</p>
          </div>
          <div className="actions">
            <a className="btn secondary" href="/activity">Open Activity</a>
            <a className="btn secondary" href="/ops-configs">Open Configs</a>
          </div>
        </div>
        <div className="card-grid" style={{ marginTop: 20, marginBottom: 0 }}>
          <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
            <h3>Total Orders</h3>
            <strong>{kpis?.total_orders ?? "—"}</strong>
          </div>
          <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
            <h3>Total Revenue</h3>
            <strong>KES {kpis?.total_revenue ?? "—"}</strong>
          </div>
          <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
            <h3>Active Users</h3>
            <strong>{kpis?.active_users ?? "—"}</strong>
          </div>
          <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
            <h3>Active Alerts</h3>
            <strong>{kpis?.active_alerts ?? "—"}</strong>
          </div>
          <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
            <h3>Search Cache</h3>
            <strong>{cacheMetrics?.cache_hit_rate_pct ?? "—"}%</strong>
            <p className="muted">
              {cacheMetrics?.cache_hits ?? 0} hits, {cacheMetrics?.cache_misses ?? 0} misses, {cacheMetrics?.cache_writes ?? 0} writes
            </p>
          </div>
          <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
            <h3>Platform Activity</h3>
            <strong>{totalActivity}</strong>
            <p className="muted">Recorded events across buyer, seller, supplier, and admin flows.</p>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <div>
              <h3>Activity Mix</h3>
              <p className="muted">Breakdown by account type, feature, and action.</p>
            </div>
            <span className="badge info">{totalActivity} events</span>
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 0 }}>
            <div>
              <h3>Account Types</h3>
              {renderBars(activityTypes)}
            </div>
            <div>
              <h3>Features</h3>
              {renderBars(activityFeatures.slice(0, 5))}
            </div>
            <div>
              <h3>Actions</h3>
              {renderBars(activityActions.slice(0, 5))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Management Surface</h3>
              <p className="muted">Configuration and workflow controls.</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {controlSurfaces.map((surface) => (
              <a
                key={surface.href}
                href={surface.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{surface.title}</div>
                  <div className="muted" style={{ marginTop: 4 }}>{surface.note}</div>
                </div>
                <span className="badge info" style={{ alignSelf: "center" }}>{surface.count}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Risk Radar</h3>
              <p className="muted">Fast read on the most active user scores.</p>
            </div>
          </div>
          {risk.map((row) => (
            <div key={row.user_id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span>{row.user_id}</span>
              <span className="badge info">{row.score}</span>
            </div>
          ))}
          {risk.length === 0 && <p className="muted">No scores yet.</p>}
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Latest Alerts</h3>
              <p className="muted">Security and platform alerts that need attention.</p>
            </div>
          </div>
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{alert.alert_type}</span>
                <span className="badge warn">{alert.status}</span>
              </div>
            </div>
          ))}
          {alerts.length === 0 && <p className="muted">No active alerts.</p>}
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Partnership Health</h3>
              <p className="muted">Live integration status at a glance.</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              ["Live", partnerSummary.live, "info"],
              ["Paused", partnerSummary.paused, "warn"],
              ["Healthy", partnerSummary.healthy, "success"],
              ["Degraded", partnerSummary.degraded, "warn"],
              ["Error", partnerSummary.error, "warn"],
            ].map(([label, value, tone]) => (
              <div key={String(label)} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{label}</span>
                <span className={`badge ${tone}`}>{value as number}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Recent Sync Failures</h3>
              <p className="muted">Latest partner jobs returned by the backend.</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {failedPartners.map((partner) => (
              <div key={partner.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{partner.name}</span>
                <span className="badge warn">{partner.failedJobs > 0 ? `${partner.failedJobs} failed` : partner.health}</span>
              </div>
            ))}
            {failedPartners.length === 0 && <p className="muted">No recent failures found.</p>}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Paused Partners</h3>
              <p className="muted">Integrations that need manual attention.</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {pausedPartners.map((partner) => (
              <div key={partner.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{partner.name}</span>
                <span className="badge warn">Paused</span>
              </div>
            ))}
            {pausedPartners.length === 0 && <p className="muted">No paused partners.</p>}
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Management workflows</h3>
          <p className="muted">Use the sidebar for users, tenants, flags, experiments, audits, risk, compliance, and supplier review.</p>
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
    </div>
  );
};
