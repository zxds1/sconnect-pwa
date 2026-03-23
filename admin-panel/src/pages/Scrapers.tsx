import { useEffect, useMemo, useState } from "react";
import { Upload, RefreshCcw, PlayCircle, XCircle, Search, BarChart3, TrendingUp, PieChart, Layers3 } from "lucide-react";
import {
  cancelScraperBatch,
  getScraperBatch,
  ingestScraperCsv,
  listScraperBatchItems,
  listScraperBatches,
  retryScraperBatch,
  updateScraperBatchStatus,
  type ScraperBatch,
  type ScraperBatchItem,
} from "../lib/scrapersAdminApi";

const statusBadgeClass = (status?: string) => {
  const value = (status || "").toLowerCase();
  if (value.includes("complete")) return "badge success";
  if (value.includes("error") || value.includes("fail")) return "badge danger";
  if (value.includes("cancel")) return "badge";
  if (value.includes("queue") || value.includes("process")) return "badge info";
  return "badge";
};

const pretty = (value?: string) => value ? value.replace(/_/g, " ") : "—";

const palette = {
  complete: "rgba(34,197,94,0.9)",
  queued: "rgba(56,189,248,0.9)",
  processing: "rgba(167,139,250,0.9)",
  error: "rgba(248,113,113,0.9)",
  cancel: "rgba(148,163,184,0.82)",
  other: "rgba(100,116,139,0.88)",
};

const chartTrack = "rgba(255,255,255,0.06)";

const bucketStatus = (status?: string) => {
  const value = (status || "").toLowerCase();
  if (value.includes("complete")) return "complete";
  if (value.includes("error") || value.includes("fail")) return "error";
  if (value.includes("cancel")) return "cancel";
  if (value.includes("queue")) return "queued";
  if (value.includes("process")) return "processing";
  return "other";
};

const formatShortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const formatClock = (value?: string) =>
  value ? new Date(value).toLocaleString() : "—";

type ChartSeriesPoint = {
  label: string;
  total: number;
  complete: number;
  queued: number;
  processing: number;
  error: number;
  cancel: number;
  other: number;
};

const buildTimeline = (rows: ScraperBatch[]) => {
  const byDay = new Map<string, ChartSeriesPoint>();
  rows.forEach((batch) => {
    const day = new Date(batch.created_at);
    const key = day.toISOString().slice(0, 10);
    const current = byDay.get(key) || {
      label: formatShortDate(day),
      total: 0,
      complete: 0,
      queued: 0,
      processing: 0,
      error: 0,
      cancel: 0,
      other: 0,
    };
    const kind = bucketStatus(batch.status) as keyof Omit<ChartSeriesPoint, "label" | "total">;
    current.total += 1;
    current[kind] += 1;
    byDay.set(key, current);
  });
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value)
    .slice(-10);
};

const buildSourceSeries = (rows: ScraperBatch[]) => {
  const bySource = new Map<string, number>();
  rows.forEach((batch) => {
    const key = batch.source_name || "unknown";
    bySource.set(key, (bySource.get(key) || 0) + 1);
  });
  return Array.from(bySource.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, total]) => ({ label, total }));
};

const buildSourcePerformance = (rows: ScraperBatch[]) => {
  const bySource = new Map<string, { label: string; total: number; complete: number; error: number; queued: number }>();
  rows.forEach((batch) => {
    const key = batch.source_name || "unknown";
    const current = bySource.get(key) || { label: key, total: 0, complete: 0, error: 0, queued: 0 };
    current.total += 1;
    const kind = bucketStatus(batch.status);
    if (kind === "complete") current.complete += 1;
    else if (kind === "error") current.error += 1;
    else if (kind === "queued" || kind === "processing") current.queued += 1;
    bySource.set(key, current);
  });
  return Array.from(bySource.values()).sort((a, b) => b.total - a.total).slice(0, 6);
};

type TenantTimelinePoint = {
  label: string;
  total: number;
  tenants: Record<string, number>;
};

const buildTenantTimeline = (rows: ScraperBatch[]) => {
  const topTenants = Array.from(
    rows.reduce((acc, batch) => {
      const key = batch.tenant_id || "unknown";
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tenant]) => tenant);

  const byDay = new Map<string, TenantTimelinePoint>();
  rows.forEach((batch) => {
    const day = new Date(batch.created_at);
    const key = day.toISOString().slice(0, 10);
    const tenant = topTenants.includes(batch.tenant_id || "unknown") ? (batch.tenant_id || "unknown") : "other";
    const current = byDay.get(key) || {
      label: formatShortDate(day),
      total: 0,
      tenants: {},
    };
    current.total += 1;
    current.tenants[tenant] = (current.tenants[tenant] || 0) + 1;
    byDay.set(key, current);
  });

  return {
    topTenants,
    points: Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)
      .slice(-10),
  };
};

const buildFailureRanks = (items: ScraperBatchItem[]) => {
  const failures = items.filter((item) => {
    const status = (item.status || "").toLowerCase();
    return Boolean(item.error) || status.includes("error") || status.includes("fail");
  });
  const byShop = new Map<string, number>();
  const byProduct = new Map<string, number>();
  failures.forEach((item) => {
    const shopKey = item.source_shop_key || "unknown shop";
    const productKey = item.source_product_key || "unknown product";
    byShop.set(shopKey, (byShop.get(shopKey) || 0) + 1);
    byProduct.set(productKey, (byProduct.get(productKey) || 0) + 1);
  });
  return {
    total: failures.length,
    shops: Array.from(byShop.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value })),
    products: Array.from(byProduct.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value })),
  };
};

const buildStatusSeries = (rows: ScraperBatch[]) => {
  const counts = rows.reduce(
    (acc, batch) => {
      acc[bucketStatus(batch.status)] += 1;
      return acc;
    },
    { complete: 0, queued: 0, processing: 0, error: 0, cancel: 0, other: 0 }
  );
  return [
    { label: "Completed", value: counts.complete, key: "complete" },
    { label: "Queued", value: counts.queued, key: "queued" },
    { label: "Processing", value: counts.processing, key: "processing" },
    { label: "Errored", value: counts.error, key: "error" },
    { label: "Cancelled", value: counts.cancel, key: "cancel" },
    { label: "Other", value: counts.other, key: "other" },
  ];
};

const HorizontalBars = ({ items }: { items: { label: string; value: number }[] }) => {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.length === 0 && <p className="muted">No data yet.</p>}
      {items.map((item, index) => {
        const tone = index % 3 === 0 ? "var(--accent)" : index % 3 === 1 ? "var(--accent-2)" : "rgba(34,197,94,0.9)";
        return (
          <div key={item.label} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{item.label}</span>
              <span className="badge info">{item.value}</span>
            </div>
            <div style={{ height: 8, background: chartTrack, borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.max(6, (item.value / max) * 100)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${tone}, rgba(255,255,255,0.12))`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SourcePerformance = ({ items }: { items: { label: string; total: number; complete: number; error: number; queued: number }[] }) => (
  <div style={{ display: "grid", gap: 12 }}>
    {items.length === 0 && <p className="muted">No source data yet.</p>}
    {items.map((item) => {
      const success = item.total ? Math.round((item.complete / item.total) * 100) : 0;
      const error = item.total ? Math.round((item.error / item.total) * 100) : 0;
      return (
        <div key={item.label} style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "grid" }}>
              <strong style={{ fontSize: 14 }}>{item.label}</strong>
              <span className="muted">{item.total} batches · {item.complete} complete · {item.error} errored</span>
            </div>
            <span className="badge info">{success}% / {error}%</span>
          </div>
          <div style={{ display: "flex", gap: 6, height: 12, borderRadius: 999, overflow: "hidden", background: chartTrack }}>
            <div style={{ width: `${success}%`, minWidth: item.complete ? 10 : 0, background: "linear-gradient(90deg, var(--success), rgba(34,197,94,0.35))" }} />
            <div style={{ width: `${error}%`, minWidth: item.error ? 10 : 0, background: "linear-gradient(90deg, var(--danger), rgba(248,113,113,0.35))" }} />
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)" }} />
          </div>
        </div>
      );
    })}
  </div>
);

const TenantTimeline = ({
  points,
  tenants,
}: {
  points: TenantTimelinePoint[];
  tenants: string[];
}) => {
  const colors = ["var(--accent)", "var(--accent-2)", "var(--success)", "rgba(248,113,113,0.9)", "rgba(148,163,184,0.88)"];
  const lookup = new Map<string, string>();
  tenants.forEach((tenant, index) => lookup.set(tenant, colors[index % colors.length]));
  lookup.set("other", "rgba(100,116,139,0.88)");
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {points.length === 0 && <p className="muted">No tenant activity yet.</p>}
      {points.map((point) => {
        const total = Math.max(1, point.total);
        const keys = [...tenants, "other"].filter((tenant) => (point.tenants[tenant] || 0) > 0);
        return (
          <div key={point.label} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong style={{ fontSize: 13 }}>{point.label}</strong>
              <span className="badge info">{point.total} batches</span>
            </div>
            <div style={{ display: "flex", gap: 6, height: 14, borderRadius: 999, overflow: "hidden", background: chartTrack }}>
              {keys.map((tenant) => {
                const value = point.tenants[tenant] || 0;
                const color = lookup.get(tenant) || "rgba(255,255,255,0.16)";
                return (
                  <div
                    key={tenant}
                    style={{
                      width: `${(value / total) * 100}%`,
                      minWidth: value ? 10 : 0,
                      background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.12))`,
                    }}
                    title={`${tenant}: ${value}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tenants.map((tenant, index) => {
          const color = colors[index % colors.length];
          return (
            <span key={tenant} className="badge" style={{ background: `${color}22`, color }}>
              {tenant}
            </span>
          );
        })}
        <span className="badge" style={{ background: "rgba(100,116,139,0.18)", color: "rgba(226,232,240,0.9)" }}>
          other
        </span>
      </div>
    </div>
  );
};

export const Scrapers = () => {
  const [batches, setBatches] = useState<ScraperBatch[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<ScraperBatch | null>(null);
  const [items, setItems] = useState<ScraperBatchItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [sourceName, setSourceName] = useState("scraper");
  const [csvUrl, setCsvUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const rows = await listScraperBatches({
        status: filterStatus || undefined,
        source_name: filterSource || undefined,
        limit: 50,
      });
      setBatches(rows);
      const next = selectedId || rows[0]?.id || "";
      if (next) {
        await loadBatch(next);
      } else {
        setSelectedId("");
        setSelectedBatch(null);
        setItems([]);
      }
    } catch (err: any) {
      setStatus(err?.message || "Unable to load scraper batches.");
    } finally {
      setLoading(false);
    }
  };

  const loadBatch = async (batchId: string) => {
    if (!batchId) return;
    const [batch, batchItems] = await Promise.all([
      getScraperBatch(batchId),
      listScraperBatchItems(batchId, { limit: 100 }),
    ]);
    setSelectedBatch(batch);
    setSelectedId(batchId);
    setItems(batchItems);
  };

  useEffect(() => {
    load().catch((err: any) => setStatus(err?.message || "Unable to load scraper batches."));
  }, []);

  const totals = useMemo(() => {
    const complete = batches.filter((b) => b.status.includes("complete")).length;
    const queued = batches.filter((b) => b.status.includes("queue") || b.status.includes("process")).length;
    const errored = batches.filter((b) => b.status.includes("error") || b.status.includes("fail")).length;
    return { complete, queued, errored };
  }, [batches]);
  const timeline = useMemo(() => buildTimeline(batches), [batches]);
  const sourceSeries = useMemo(() => buildSourceSeries(batches), [batches]);
  const statusSeries = useMemo(() => buildStatusSeries(batches), [batches]);
  const successRate = useMemo(() => {
    const total = batches.length || 0;
    if (!total) return 0;
    const completed = batches.filter((b) => bucketStatus(b.status) === "complete").length;
    return Math.round((completed / total) * 100);
  }, [batches]);
  const errorRate = useMemo(() => {
    const total = batches.length || 0;
    if (!total) return 0;
    const errored = batches.filter((b) => bucketStatus(b.status) === "error").length;
    return Math.round((errored / total) * 100);
  }, [batches]);
  const latestBatch = batches[0];
  const sourcePerformance = useMemo(() => buildSourcePerformance(batches), [batches]);
  const tenantTimeline = useMemo(() => buildTenantTimeline(batches), [batches]);
  const failureRanks = useMemo(() => buildFailureRanks(items), [items]);

  const submitIngest = async () => {
    if (!selectedFile && !csvUrl) {
      setStatus("Upload a CSV file or provide a CSV URL.");
      return;
    }
    setIngesting(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.set("source_name", sourceName || "scraper");
      if (fileName) form.set("file_name", fileName);
      if (csvUrl) form.set("csv_url", csvUrl);
      if (selectedFile) form.set("file", selectedFile);
      await ingestScraperCsv(form);
      setSelectedFile(null);
      setCsvUrl("");
      setFileName("");
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to ingest scraper CSV.");
    } finally {
      setIngesting(false);
    }
  };

  const handleUpdateStatus = async (batchId: string, nextStatus: string) => {
    setStatus(null);
    try {
      await updateScraperBatchStatus(batchId, nextStatus);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to update batch status.");
    }
  };

  const handleRetry = async (batchId: string) => {
    setStatus(null);
    try {
      await retryScraperBatch(batchId);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to retry batch.");
    }
  };

  const handleCancel = async (batchId: string) => {
    setStatus(null);
    try {
      await cancelScraperBatch(batchId);
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to cancel batch.");
    }
  };

  return (
    <div className="page" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h2>Scraper Control Center</h2>
          <p>Upload mined CSVs, inspect batch runs, and keep scraped catalog data in sync.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={load}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Ingest CSV</h3>
          <p className="muted">Upload a scraper export or paste a CSV URL. The admin backend forwards it securely to integrations.</p>
          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <input className="input" value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="source_name" />
              <input className="input" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="file_name" />
            </div>
            <input className="input" value={csvUrl} onChange={(e) => setCsvUrl(e.target.value)} placeholder="CSV URL (optional)" />
            <input
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button className="btn primary" onClick={submitIngest} disabled={ingesting}>
              <Upload size={14} />
              {ingesting ? "Ingesting…" : "Start Ingestion"}
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Batch Summary</h3>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: 12 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <h3>Queued</h3>
              <strong>{totals.queued}</strong>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <h3>Completed</h3>
              <strong>{totals.complete}</strong>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <h3>Errored</h3>
              <strong>{totals.errored}</strong>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <label className="muted">Filters</label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <input className="input" placeholder="status filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
              <input className="input" placeholder="source filter" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} />
              <button className="btn secondary" onClick={load}>
                <Search size={14} />
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <div>
              <h3>Batch Charts</h3>
              <p className="muted">Success, error, source mix, and recent throughput at a glance.</p>
            </div>
            <span className="badge info">{batches.length} batches</span>
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 0 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <div className="card-header" style={{ marginBottom: 10 }}>
                <div>
                  <h3>Success Rate</h3>
                  <p className="muted">Completed batches out of all ingestions.</p>
                </div>
                <span className="badge success">{successRate}%</span>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ height: 14, borderRadius: 999, overflow: "hidden", background: chartTrack }}>
                  <div style={{ width: `${successRate}%`, height: "100%", background: "linear-gradient(90deg, var(--success), rgba(34,197,94,0.45))" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Completed</h3>
                    <strong>{statusSeries.find((item) => item.key === "complete")?.value || 0}</strong>
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Total</h3>
                    <strong>{batches.length}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <div className="card-header" style={{ marginBottom: 10 }}>
                <div>
                  <h3>Error Rate</h3>
                  <p className="muted">Batches that ended in failure.</p>
                </div>
                <span className="badge danger">{errorRate}%</span>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ height: 14, borderRadius: 999, overflow: "hidden", background: chartTrack }}>
                  <div style={{ width: `${errorRate}%`, height: "100%", background: "linear-gradient(90deg, var(--danger), rgba(248,113,113,0.45))" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Errored</h3>
                    <strong>{statusSeries.find((item) => item.key === "error")?.value || 0}</strong>
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Queued</h3>
                    <strong>{statusSeries.find((item) => item.key === "queued")?.value || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <div className="card-header" style={{ marginBottom: 10 }}>
                <div>
                  <h3>Source Mix</h3>
                  <p className="muted">Where the latest imports are coming from.</p>
                </div>
                <span className="badge info">{sourceSeries.reduce((acc, item) => acc + item.total, 0)}</span>
              </div>
              <HorizontalBars items={sourceSeries} />
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <div className="card-header" style={{ marginBottom: 10 }}>
                <div>
                  <h3>Throughput Timeline</h3>
                  <p className="muted">Last 10 ingestion days with status breakdown.</p>
                </div>
                <span className="badge info">{latestBatch ? formatClock(latestBatch.created_at) : "No batches"}</span>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {timeline.length === 0 && <p className="muted">No chart data yet.</p>}
                {timeline.map((point) => {
                  const parts = [
                    { key: "complete", value: point.complete, color: palette.complete },
                    { key: "queued", value: point.queued, color: palette.queued },
                    { key: "processing", value: point.processing, color: palette.processing },
                    { key: "error", value: point.error, color: palette.error },
                    { key: "cancel", value: point.cancel, color: palette.cancel },
                    { key: "other", value: point.other, color: palette.other },
                  ].filter((part) => part.value > 0);
                  const total = Math.max(1, point.total);
                  return (
                    <div key={point.label} style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong style={{ fontSize: 13 }}>{point.label}</strong>
                        <span className="badge info">{point.total} batches</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, height: 14, borderRadius: 999, overflow: "hidden", background: chartTrack }}>
                        {parts.map((part) => (
                          <div
                            key={part.key}
                            style={{
                              width: `${(part.value / total) * 100}%`,
                              minWidth: part.value ? 12 : 0,
                              background: `linear-gradient(90deg, ${part.color}, rgba(255,255,255,0.14))`,
                            }}
                            title={`${part.key}: ${part.value}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Batch Signals</h3>
              <p className="muted">Fast health read for the current import set.</p>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              { label: "Completed", value: totals.complete, icon: BarChart3, tone: "var(--success)" },
              { label: "Queued", value: totals.queued, icon: Layers3, tone: "var(--accent)" },
              { label: "Errored", value: totals.errored, icon: TrendingUp, tone: "var(--danger)" },
              { label: "Sources", value: sourceSeries.length, icon: PieChart, tone: "var(--accent-2)" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="card" style={{ background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <span className="muted">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      background: `linear-gradient(135deg, ${item.tone}, rgba(255,255,255,0.08))`,
                      color: "#0b0c10",
                    }}
                  >
                    <Icon size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Source Performance</h3>
              <p className="muted">Success and error ratio by source_name.</p>
            </div>
            <span className="badge info">{sourcePerformance.length} sources</span>
          </div>
          <SourcePerformance items={sourcePerformance} />
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Tenant Throughput</h3>
              <p className="muted">Daily batch volume across the busiest tenants.</p>
            </div>
            <span className="badge info">{tenantTimeline.topTenants.length} tenants</span>
          </div>
          <TenantTimeline points={tenantTimeline.points} tenants={tenantTimeline.topTenants} />
        </div>
      </div>

      {status && <div className="card" style={{ borderColor: "rgba(248,113,113,0.35)", color: "#fecaca" }}>{status}</div>}

      <div className="card" style={{ overflowX: "auto" }}>
        <div className="card-header">
          <div>
            <h3>Ingestion Batches</h3>
            <p className="muted">Newest batches first. Select one to inspect the imported rows.</p>
          </div>
          <span className="badge info">{batches.length} batches</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>File</th>
              <th>Status</th>
              <th>Rows</th>
              <th>Created</th>
              <th>Errors</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} style={{ cursor: "pointer", background: batch.id === selectedId ? "rgba(59,130,246,0.08)" : "transparent" }} onClick={() => loadBatch(batch.id)}>
                <td>
                  <div style={{ display: "grid" }}>
                    <strong>{batch.source_name}</strong>
                    <span className="muted">{batch.source_type}</span>
                  </div>
                </td>
                <td>{batch.file_name || "—"}</td>
                <td><span className={statusBadgeClass(batch.status)}>{pretty(batch.status)}</span></td>
                <td>{batch.row_count}</td>
                <td>{new Date(batch.created_at).toLocaleString()}</td>
                <td>{batch.error_count}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn secondary" onClick={(e) => { e.stopPropagation(); handleRetry(batch.id); }}>
                      <PlayCircle size={14} />
                      Retry
                    </button>
                    <button className="btn secondary" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(batch.id, "processing"); }}>
                      <RefreshCcw size={14} />
                      Process
                    </button>
                    <button className="btn secondary" onClick={(e) => { e.stopPropagation(); handleCancel(batch.id); }}>
                      <XCircle size={14} />
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">No scraper batches yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBatch && (
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="card-header">
            <div>
              <h3>Batch Detail</h3>
              <p className="muted">{selectedBatch.source_name} · {selectedBatch.file_name || "uploaded CSV"}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={statusBadgeClass(selectedBatch.status)}>{pretty(selectedBatch.status)}</span>
              <span className="badge info">{selectedBatch.row_count} rows</span>
              <span className="badge">{selectedBatch.created_count} created</span>
              <span className="badge">{selectedBatch.updated_count} updated</span>
              <span className="badge danger">{selectedBatch.error_count} errors</span>
            </div>
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 12 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <h3>Batch ID</h3>
              <strong style={{ wordBreak: "break-all" }}>{selectedBatch.id}</strong>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <h3>Created</h3>
              <strong>{new Date(selectedBatch.created_at).toLocaleString()}</strong>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
              <h3>Completed</h3>
              <strong>{selectedBatch.completed_at ? new Date(selectedBatch.completed_at).toLocaleString() : "—"}</strong>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="card-header">
              <div>
                <h3>Imported Rows</h3>
                <p className="muted">Each row is mapped to a shop, product, and seller-product record when possible.</p>
              </div>
              <span className="badge info">{items.length} items</span>
            </div>
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
              <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
                <div className="card-header" style={{ marginBottom: 10 }}>
                  <div>
                    <h3>Top Failing Shops</h3>
                    <p className="muted">Rows with errors or failed status grouped by shop key.</p>
                  </div>
                  <span className="badge danger">{failureRanks.shops.length} shops</span>
                </div>
                <HorizontalBars items={failureRanks.shops} />
              </div>
              <div className="card" style={{ background: "rgba(8,10,18,0.45)" }}>
                <div className="card-header" style={{ marginBottom: 10 }}>
                  <div>
                    <h3>Top Failing Products</h3>
                    <p className="muted">Problem rows grouped by product key.</p>
                  </div>
                  <span className="badge danger">{failureRanks.products.length} products</span>
                </div>
                <HorizontalBars items={failureRanks.products} />
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Links</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "grid" }}>
                        <strong>{item.source_shop_key}</strong>
                        <span className="muted">{item.source_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid" }}>
                        <strong>{item.source_product_key}</strong>
                        <span className="muted">{item.product_id || "—"}</span>
                      </div>
                    </td>
                    <td><span className={statusBadgeClass(item.status)}>{pretty(item.status)}</span></td>
                    <td>
                      <div style={{ display: "grid", gap: 4 }}>
                        <span className="muted">seller: {item.seller_id || "—"}</span>
                        <span className="muted">product: {item.product_id || "—"}</span>
                      </div>
                    </td>
                    <td className="muted" style={{ maxWidth: 320, wordBreak: "break-word" }}>{item.error || "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">No rows in this batch.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
