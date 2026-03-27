import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, RefreshCcw, ScanSearch, Server, Workflow } from "lucide-react";
import { getSearchCacheMetrics } from "../lib/adminApi";
import {
  createSearchReindexRun,
  getSearchOpsHealth,
  listSearchMediaJobs,
  listSearchReindexRuns,
  retrySearchMediaJob,
  type SearchIndexRun,
  type SearchMediaJob,
  type SearchOpsHealth,
} from "../lib/searchOpsAdminApi";

const formatTimestamp = (value?: string) => (value ? new Date(value).toLocaleString() : "—");

const statusBadgeClass = (status?: string) => {
  const value = (status || "").toLowerCase();
  if (value.includes("complete") || value.includes("healthy") || value === "ok") return "badge success";
  if (value.includes("error") || value.includes("fail") || value.includes("down")) return "badge warn";
  if (value.includes("queue") || value.includes("running")) return "badge info";
  return "badge";
};

const pretty = (value?: string) => value ? value.replace(/_/g, " ") : "—";

const workerLabel = (health: SearchOpsHealth | null) => {
  const worker = String(health?.worker || "").trim();
  return worker || "unknown";
};

const embeddingsLabel = (health: SearchOpsHealth | null) => {
  const value = health?.embeddings_status;
  if (typeof value === "number") return `${value}`;
  if (typeof value === "string" && value.trim()) return value;
  return "unknown";
};

export const SearchOps = () => {
  const [health, setHealth] = useState<SearchOpsHealth | null>(null);
  const [runs, setRuns] = useState<SearchIndexRun[]>([]);
  const [jobs, setJobs] = useState<SearchMediaJob[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState("");

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setStatus(null);
    }
    try {
      const [healthResp, runResp, jobResp, cacheResp] = await Promise.all([
        getSearchOpsHealth(),
        listSearchReindexRuns(10).catch(() => []),
        listSearchMediaJobs({ status: jobFilter || undefined, limit: 12 }).catch(() => []),
        getSearchCacheMetrics().catch(() => null),
      ]);
      setHealth(healthResp || null);
      setRuns(Array.isArray(runResp) ? runResp : []);
      setJobs(Array.isArray(jobResp) ? jobResp : []);
      setCacheMetrics(cacheResp || null);
      if (!silent) setStatus(null);
    } catch (err: any) {
      if (!silent) setStatus(err?.message || "Unable to load search ops.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      load(true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [jobFilter]);

  const handleReindex = async () => {
    setReindexing(true);
    setStatus(null);
    try {
      await createSearchReindexRun();
      setStatus("Full search reindex queued.");
      await load(true);
    } catch (err: any) {
      setStatus(err?.message || "Unable to queue reindex.");
    } finally {
      setReindexing(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    setRetryingId(jobId);
    setStatus(null);
    try {
      await retrySearchMediaJob(jobId);
      setStatus("Media job queued for retry.");
      await load(true);
    } catch (err: any) {
      setStatus(err?.message || "Unable to retry media job.");
    } finally {
      setRetryingId(null);
    }
  };

  const activeRun = useMemo(
    () => runs.find((item) => ["queued", "running"].includes(String(item.status || "").toLowerCase())),
    [runs]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Search Ops</h2>
          <p>Admin controls for vector indexing, async media jobs, embeddings health, and search cache behavior.</p>
        </div>
        <div className="actions">
          <select className="input" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} style={{ minWidth: 180 }}>
            <option value="">All media jobs</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn secondary" onClick={() => load()}>
            <RefreshCcw size={14} />
            Refresh
          </button>
          <button className="btn primary" onClick={handleReindex} disabled={reindexing}>
            <Workflow size={14} />
            {reindexing ? "Queueing…" : "Run Full Reindex"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>API Surface</h3>
            <p className="muted">Search operations this admin page manages.</p>
          </div>
          {activeRun && (
            <span className={statusBadgeClass(activeRun.status)}>
              {pretty(activeRun.status)} reindex
            </span>
          )}
        </div>
        <div className="card-grid">
          {[
            "GET /v1/search/ops/health",
            "GET /v1/search/ops/reindex",
            "POST /v1/search/ops/reindex",
            "GET /v1/search/ops/media-jobs",
            "POST /v1/search/ops/media-jobs/{id}/retry",
            "GET /v1/search/jobs/{id}",
          ].map((endpoint) => (
            <div key={endpoint} className="card" style={{ padding: 12 }}>
              <code style={{ fontSize: 12 }}>{endpoint}</code>
            </div>
          ))}
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {loading && <div className="status">Loading search operations…</div>}

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Worker</h3>
              <p className="muted">Search worker heartbeat.</p>
            </div>
            <Server size={18} />
          </div>
          <strong>{workerLabel(health)}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Embeddings</h3>
              <p className="muted">Embeddings service availability.</p>
            </div>
            <BrainCircuit size={18} />
          </div>
          <strong>{embeddingsLabel(health)}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Queued Media</h3>
              <p className="muted">Voice, OCR, and video jobs waiting or running.</p>
            </div>
            <ScanSearch size={18} />
          </div>
          <strong>{Number(health?.queued_media_jobs || 0)}</strong>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Failures</h3>
              <p className="muted">Media job and embedding failure backlog.</p>
            </div>
            <AlertTriangle size={18} />
          </div>
          <strong>{Number(health?.failed_media_jobs || 0) + Number(health?.embedding_failures || 0)}</strong>
          <p className="muted" style={{ marginTop: 8 }}>
            {Number(health?.failed_media_jobs || 0)} media, {Number(health?.embedding_failures || 0)} embeddings
          </p>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Cache Hit Rate</h3>
              <p className="muted">Search response cache efficiency.</p>
            </div>
          </div>
          <strong>{cacheMetrics?.cache_hit_rate_pct ?? "—"}%</strong>
          <p className="muted" style={{ marginTop: 8 }}>
            {cacheMetrics?.cache_hits ?? 0} hits, {cacheMetrics?.cache_misses ?? 0} misses
          </p>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Active Reindex</h3>
              <p className="muted">Current tenant indexing job.</p>
            </div>
          </div>
          <strong>{activeRun ? pretty(activeRun.status) : "Idle"}</strong>
          <p className="muted" style={{ marginTop: 8 }}>
            {activeRun ? `${activeRun.processed_docs || 0}/${activeRun.total_docs || 0} docs` : "No queued or running job."}
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <div>
              <h3>Reindex Runs</h3>
              <p className="muted">Most recent embedding backfill and manual reindex attempts.</p>
            </div>
            <span className="badge info">{runs.length} runs</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Requested Via</th>
                <th>Progress</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td><span className={statusBadgeClass(run.status)}>{pretty(run.status)}</span></td>
                  <td>{pretty(run.requested_via)}</td>
                  <td>
                    {(run.processed_docs || 0) + (run.failed_docs || 0)} / {run.total_docs || 0}
                  </td>
                  <td>{formatTimestamp(run.started_at || run.created_at)}</td>
                  <td>{formatTimestamp(run.completed_at)}</td>
                  <td className="muted" style={{ maxWidth: 240, wordBreak: "break-word" }}>{run.last_error || "—"}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No reindex runs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <div>
              <h3>Async Media Jobs</h3>
              <p className="muted">Operational queue for OCR, voice, and video search processing.</p>
            </div>
            <span className="badge info">{jobs.length} jobs</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Intent</th>
                <th>Query</th>
                <th>Attempts</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{pretty(job.job_type)}</td>
                  <td><span className={statusBadgeClass(job.status)}>{pretty(job.status)}</span></td>
                  <td>{pretty(job.intent)}</td>
                  <td style={{ maxWidth: 240, wordBreak: "break-word" }}>
                    {job.source_query || job.transcript || job.ocr_text || "—"}
                    {job.error_text && (
                      <div className="muted" style={{ marginTop: 6 }}>{job.error_text}</div>
                    )}
                  </td>
                  <td>{job.attempts || 0}</td>
                  <td>{formatTimestamp(job.updated_at || job.created_at)}</td>
                  <td>
                    {String(job.status || "").toLowerCase() === "failed" ? (
                      <button
                        className="btn secondary"
                        onClick={() => handleRetry(job.id)}
                        disabled={retryingId === job.id}
                      >
                        {retryingId === job.id ? "Retrying…" : "Retry"}
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">No media jobs matched this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
