import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, Server, Workflow } from "lucide-react";
import { Drawer } from "../components/Drawer";
import { getRuntimeQueues, type RuntimeQueuesResponse } from "../lib/opsConfigApi";
import { workerFamilies } from "../lib/workerRegistry";

const formatNumber = (value?: number) => Number(value || 0).toLocaleString();
const formatTime = (value?: string) => (value ? new Date(value).toLocaleString() : "—");

const statusBadgeClass = (value?: string) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("healthy") || status.includes("running") || status.includes("ok")) return "badge success";
  if (status.includes("down") || status.includes("fail") || status.includes("error")) return "badge warn";
  return "badge info";
};

const queueStatsFor = (queues: RuntimeQueuesResponse["queues"], queueNames: string[]) => {
  const items = queues.filter((item) => queueNames.includes(item.queue));
  return items.reduce(
    (acc, item) => {
      acc.pending += Number(item.pending || 0);
      acc.active += Number(item.active || 0);
      acc.retry += Number(item.retry || 0);
      acc.failed += Number(item.failed || 0);
      acc.processed += Number(item.processed_total || item.processed || 0);
      if (item.paused) acc.paused += 1;
      return acc;
    },
    { pending: 0, active: 0, retry: 0, failed: 0, processed: 0, paused: 0 },
  );
};

const serverCountFor = (servers: RuntimeQueuesResponse["servers"], queueNames: string[]) => {
  return servers.filter((server) => Object.keys(server.queues || {}).some((queue) => queueNames.includes(queue))).length;
};

export const Workers = () => {
  const [data, setData] = useState<RuntimeQueuesResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFamilyKey, setSelectedFamilyKey] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setStatus(null);
    }
    try {
      const resp = await getRuntimeQueues();
      setData(resp);
      if (!silent) setStatus(null);
    } catch (err: any) {
      if (!silent) setStatus(err?.message || "Unable to load workers.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    const queues = data?.queues || [];
    const servers = data?.servers || [];
    return {
      families: workerFamilies.length,
      queues: queues.length,
      servers: servers.length,
      pending: queues.reduce((acc, item) => acc + Number(item.pending || 0), 0),
      retry: queues.reduce((acc, item) => acc + Number(item.retry || 0), 0),
      failed: queues.reduce((acc, item) => acc + Number(item.failed || 0), 0),
      activeWorkers: servers.reduce((acc, item) => acc + Number(item.active_workers || 0), 0),
    };
  }, [data]);

  const selectedFamily = workerFamilies.find((family) => family.key === selectedFamilyKey) || null;
  const selectedQueues = selectedFamily ? (data?.queues || []).filter((item) => selectedFamily.queues.includes(item.queue)) : [];
  const selectedServers = selectedFamily
    ? (data?.servers || []).filter((server) => Object.keys(server.queues || {}).some((queue) => selectedFamily.queues.includes(queue)))
    : [];
  const selectedQueueStats = selectedFamily
    ? selectedQueues.reduce(
        (acc, item) => {
          acc.pending += Number(item.pending || 0);
          acc.active += Number(item.active || 0);
          acc.retry += Number(item.retry || 0);
          acc.failed += Number(item.failed || 0);
          acc.processed += Number(item.processed_total || item.processed || 0);
          return acc;
        },
        { pending: 0, active: 0, retry: 0, failed: 0, processed: 0 },
      )
    : null;

  return (
    <div className="page" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h2>Workers</h2>
          <p>All live queue workers, their families, and current backlog across the platform.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => load()}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {loading && <div className="status">Loading worker telemetry…</div>}

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Families</h3>
              <p className="muted">Configured worker groups in the platform.</p>
            </div>
            <Workflow size={18} />
          </div>
          <strong>{summary.families}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Queues</h3>
              <p className="muted">Tracked asynchronous queues.</p>
            </div>
            <Workflow size={18} />
          </div>
          <strong>{summary.queues}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Pending</h3>
              <p className="muted">Waiting jobs across all workers.</p>
            </div>
            <AlertTriangle size={18} />
          </div>
          <strong>{formatNumber(summary.pending)}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Retries</h3>
              <p className="muted">Jobs currently retrying.</p>
            </div>
            <AlertTriangle size={18} />
          </div>
          <strong>{formatNumber(summary.retry)}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Failed</h3>
              <p className="muted">Jobs that need operator attention.</p>
            </div>
            <AlertTriangle size={18} />
          </div>
          <strong>{formatNumber(summary.failed)}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Active Workers</h3>
              <p className="muted">Total active worker processes reported by Redis.</p>
            </div>
            <Server size={18} />
          </div>
          <strong>{formatNumber(summary.activeWorkers)}</strong>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Worker Families</h3>
            <p className="muted">Service-owned job groups mapped onto live queue telemetry.</p>
          </div>
          <span className="badge info">Updated {formatTime(data?.generated_at)}</span>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {workerFamilies.map((family) => {
            const queueStats = queueStatsFor(data?.queues || [], family.queues);
            const serverCount = serverCountFor(data?.servers || [], family.queues);
            const statusText = queueStats.failed > 0 ? "degraded" : serverCount > 0 ? "running" : "unknown";
            return (
              <div
                key={family.key}
                className="card"
                style={{ padding: 16, background: "rgba(8,10,18,0.35)", cursor: "pointer" }}
                onClick={() => setSelectedFamilyKey(family.key)}
              >
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{family.label}</h3>
                    <p className="muted">{family.description}</p>
                  </div>
                  <span className={statusBadgeClass(statusText)}>{statusText}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {family.queues.map((queue) => (
                    <span key={queue} className="badge info">
                      {queue}
                    </span>
                  ))}
                </div>
                <div className="card-grid" style={{ marginBottom: 0 }}>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Servers</h3>
                    <strong>{formatNumber(serverCount)}</strong>
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Pending</h3>
                    <strong>{formatNumber(queueStats.pending)}</strong>
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Retry</h3>
                    <strong>{formatNumber(queueStats.retry)}</strong>
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Failed</h3>
                    <strong>{formatNumber(queueStats.failed)}</strong>
                  </div>
                </div>
                <p className="muted" style={{ marginTop: 12 }}>
                  Click to inspect live queues, retries, and server assignments.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        open={Boolean(selectedFamily)}
        title={selectedFamily?.label || "Worker family"}
        subtitle={selectedFamily ? selectedFamily.description : undefined}
        onClose={() => setSelectedFamilyKey(null)}
      >
        {selectedFamily && (
          <div style={{ display: "grid", gap: 16 }}>
            <div className="card-grid">
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3>Queues</h3>
                <strong>{selectedQueues.length}</strong>
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3>Servers</h3>
                <strong>{selectedServers.length}</strong>
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3>Pending</h3>
                <strong>{formatNumber(selectedQueueStats?.pending)}</strong>
              </div>
              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <h3>Retry</h3>
                <strong>{formatNumber(selectedQueueStats?.retry)}</strong>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Queue Breakdown</h3>
                  <p className="muted">Live queue stats for {selectedFamily.label}.</p>
                </div>
                <span className={statusBadgeClass(selectedQueueStats && selectedQueueStats.failed > 0 ? "degraded" : selectedServers.length > 0 ? "running" : "unknown")}>
                  {selectedQueueStats && selectedQueueStats.failed > 0 ? "degraded" : selectedServers.length > 0 ? "running" : "unknown"}
                </span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {selectedQueues.map((queue) => (
                  <div key={queue.queue} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                    <div className="card-header" style={{ marginBottom: 8 }}>
                      <strong>{queue.queue}</strong>
                      <span className={statusBadgeClass(queue.paused ? "paused" : "running")}>{queue.paused ? "Paused" : "Running"}</span>
                    </div>
                    <p className="muted">
                      Pending {formatNumber(queue.pending)} · Active {formatNumber(queue.active)} · Retry {formatNumber(queue.retry)} · Failed {formatNumber(queue.failed)} · Processed {formatNumber(queue.processed_total || queue.processed)}
                    </p>
                    <p className="muted">Latency {queue.latency_ms}ms · Memory {formatNumber(queue.memory_usage)} bytes · Updated {formatTime(queue.timestamp)}</p>
                  </div>
                ))}
                {selectedQueues.length === 0 && <p className="muted">No queue snapshot available for this family.</p>}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Worker Servers</h3>
                  <p className="muted">Live Redis workers handling this family.</p>
                </div>
                <Server size={18} />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {selectedServers.map((server) => (
                  <div key={server.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                    <div className="card-header" style={{ marginBottom: 8 }}>
                      <div>
                        <strong>{server.host}</strong>
                        <p className="muted" style={{ marginTop: 4 }}>
                          PID {server.pid} · concurrency {server.concurrency} · started {formatTime(server.started)}
                        </p>
                      </div>
                      <span className={statusBadgeClass(server.status)}>{server.status || "unknown"}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(server.queues || {})
                        .filter(([queue]) => selectedFamily.queues.includes(queue))
                        .map(([queue, weight]) => (
                          <span key={queue} className="badge info">
                            {queue}: {weight}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
                {selectedServers.length === 0 && <p className="muted">No active worker server is currently registered for this family.</p>}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
