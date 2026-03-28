import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Mail, RefreshCcw, Send, ShieldCheck, Smartphone, Workflow } from "lucide-react";
import { getDeliverySnapshot, getTemplateVersions, type WhatsAppTemplateVersion } from "../lib/deliveryAdminApi";

const fmt = (value?: string | number | null) => (value === undefined || value === null || value === "" ? "—" : value);

const statusClass = (value?: string) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("approved") || status.includes("delivered") || status.includes("sent") || status.includes("active") || status.includes("live")) return "badge success";
  if (status.includes("fail") || status.includes("error") || status.includes("blocked") || status.includes("paused")) return "badge warn";
  return "badge info";
};

export const DeliveryCenter = () => {
  const [data, setData] = useState<any>(null);
  const [versions, setVersions] = useState<Record<string, WhatsAppTemplateVersion[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setStatus(null);
    }
    try {
      const snapshot = await getDeliverySnapshot();
      setData(snapshot);
      const templateIds = (snapshot.templates || []).slice(0, 3).map((template: any) => template.id);
      const versionPairs = await Promise.all(
        templateIds.map(async (id) => [id, await getTemplateVersions(id).catch(() => [])] as const),
      );
      setVersions(Object.fromEntries(versionPairs));
    } catch (err: any) {
      if (!silent) setStatus(err?.message || "Unable to load delivery center.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    const notifications = data?.notifications || [];
    const broadcasts = data?.commsBroadcasts || [];
    const audiences = data?.marketingAudiences || [];
    return {
      notifications: notifications.length,
      queuedNotifications: notifications.filter((item: any) => String(item.status || "").toLowerCase().includes("queued")).length,
      approvedTemplates: (data?.templates || []).filter((item: any) => String(item.status || "").toLowerCase().includes("approved")).length,
      broadcasts: broadcasts.length,
      scheduledBroadcasts: broadcasts.filter((item: any) => String(item.status || "").toLowerCase().includes("scheduled")).length,
      audiences: audiences.length,
    };
  }, [data]);

  return (
    <div className="page" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h2>Delivery Center</h2>
          <p>Notifications, broadcasts, template approvals, and live audience resolution in one view.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => load()}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {loading && <div className="status">Loading delivery data…</div>}

      <div className="card-grid">
        <div className="card"><h3>Notifications</h3><strong>{summary.notifications}</strong><p className="muted">{summary.queuedNotifications} queued items.</p></div>
        <div className="card"><h3>Templates</h3><strong>{summary.approvedTemplates}</strong><p className="muted">Approved WhatsApp versions.</p></div>
        <div className="card"><h3>Broadcasts</h3><strong>{summary.broadcasts}</strong><p className="muted">{summary.scheduledBroadcasts} scheduled broadcasts.</p></div>
        <div className="card"><h3>Audiences</h3><strong>{summary.audiences}</strong><p className="muted">Live cohorts resolved from backend data.</p></div>
      </div>

      <div className="card-grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <div>
              <h3>Notification Delivery</h3>
              <p className="muted">Consent, channels, and recent sends.</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="card-grid" style={{ marginBottom: 0 }}>
            <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3>Preferences</h3>
              <p className="muted">Frequency {fmt(data?.preferences?.frequency)} · Quiet {fmt(data?.preferences?.quiet_hours_start)} - {fmt(data?.preferences?.quiet_hours_end)}</p>
            </div>
            <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3>Channels</h3>
              <p className="muted">
                WhatsApp {String(data?.channels?.whatsapp ?? false)} · SMS {String(data?.channels?.sms ?? false)} · Email {String(data?.channels?.email ?? false)} · Push {String(data?.channels?.push ?? false)}
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {(data?.notifications || []).slice(0, 5).map((item: any) => (
              <div key={item.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>{item.title || item.type}</strong>
                    <p className="muted" style={{ marginTop: 4 }}>{item.body || "No body"}</p>
                  </div>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(item.channels || []).map((channel: string) => (
                    <span key={channel} className="badge info">{channel}</span>
                  ))}
                </div>
              </div>
            ))}
            {(data?.notifications || []).length === 0 && <p className="muted">No notification history yet.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Templates</h3>
              <p className="muted">Approval status and version history.</p>
            </div>
            <BadgeCheck size={18} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {(data?.templates || []).slice(0, 4).map((template: any) => (
              <div key={template.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>{template.name}</strong>
                    <p className="muted" style={{ marginTop: 4 }}>v{fmt(template.version || 1)}</p>
                  </div>
                  <span className={statusClass(template.status)}>{template.status}</span>
                </div>
                <p className="muted" style={{ marginBottom: 8 }}>{template.content}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(versions[template.id] || []).slice(0, 2).map((version) => (
                    <span key={version.id} className="badge info">
                      v{version.version} {version.status}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {(data?.templates || []).length === 0 && <p className="muted">No template records yet.</p>}
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Comms</h3>
              <p className="muted">Broadcast batches, scheduled sends, and segments.</p>
            </div>
            <Workflow size={18} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {(data?.commsBroadcasts || []).slice(0, 4).map((item: any) => (
              <div key={item.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="muted" style={{ marginTop: 4 }}>{fmt(item.channel)} · {fmt(item.scheduled_at)}</p>
                  </div>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </div>
                <p className="muted">Template {fmt(item.template_id)} · segment {fmt(item.segment_criteria?.segment || "live")}</p>
              </div>
            ))}
            {(data?.commsBroadcasts || []).length === 0 && <p className="muted">No broadcasts yet.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Scheduled Sends</h3>
              <p className="muted">Queued executions with per-channel timing.</p>
            </div>
            <Send size={18} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {(data?.commsScheduled || []).slice(0, 4).map((item: any) => (
              <div key={item.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <strong>{item.channel}</strong>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </div>
                <p className="muted">{item.content}</p>
                <p className="muted">Runs at {fmt(item.scheduled_at)}</p>
              </div>
            ))}
            {(data?.commsScheduled || []).length === 0 && <p className="muted">No scheduled sends yet.</p>}
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Live Audiences</h3>
              <p className="muted">Resolved from current seller activity and rollups.</p>
            </div>
            <Smartphone size={18} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {(data?.marketingAudiences || []).slice(0, 6).map((item: any) => (
              <div key={item.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <strong>{item.audience_segment}</strong>
                  <span className="badge info">{item.channel}</span>
                </div>
                <p className="muted">Resolved count {fmt(item.resolved_count)}</p>
              </div>
            ))}
            {(data?.marketingAudiences || []).length === 0 && <p className="muted">No audiences yet.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Channel Health</h3>
              <p className="muted">Backend signals tied to delivery and audience work.</p>
            </div>
            <Mail size={18} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Comms Metrics</h3>
              <p className="muted">Sent {fmt(data?.commsMetrics?.sent)} · Delivered {fmt(data?.commsMetrics?.delivered)}</p>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Segments</h3>
              <p className="muted">{(data?.commsSegments || []).length} live seller segments</p>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Marketing</h3>
              <p className="muted">Campaign KPIs loaded and audience counts resolved from live backend state.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
