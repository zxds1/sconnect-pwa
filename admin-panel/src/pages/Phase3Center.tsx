import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ShieldCheck, TrendingUp, ReceiptText, Activity } from "lucide-react";
import { getPhase3Snapshot } from "../lib/phase3AdminApi";

const fmt = (value?: string | number | null) => (value === undefined || value === null || value === "" ? "—" : value);

const badgeClass = (value?: string) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("ready") || status.includes("active") || status.includes("paid") || status.includes("eligible")) return "badge success";
  if (status.includes("insufficient") || status.includes("past_due") || status.includes("failed") || status.includes("dunning")) return "badge warn";
  return "badge info";
};

export const Phase3Center = () => {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setStatus(null);
    }
    try {
      setData(await getPhase3Snapshot());
    } catch (err: any) {
      if (!silent) setStatus(err?.message || "Unable to load Phase 3 data.");
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
    return {
      score: Number(data?.health?.sokoscore || 0),
      confidence: Number(data?.projection?.confidence || 0),
      invoices: (data?.invoices || []).length,
      events: (data?.billingEvents || []).length,
      status: data?.projection?.status || "insufficient_data",
    };
  }, [data]);

  return (
    <div className="page" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h2>Phase 3 Center</h2>
          <p>Growth forecasts, SokoScore, subscription state, and billing reconciliation in one view.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => load()}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {loading && <div className="status">Loading growth and billing data…</div>}

      <div className="card-grid">
        <div className="card"><h3>SokoScore</h3><strong>{summary.score}</strong><p className="muted">Repayment-risk signal from live growth inputs.</p></div>
        <div className="card"><h3>Projection</h3><strong>{summary.confidence}%</strong><p className="muted">{summary.status.replaceAll("_", " ")}</p></div>
        <div className="card"><h3>Invoices</h3><strong>{summary.invoices}</strong><p className="muted">Current billing cycles and payment state.</p></div>
        <div className="card"><h3>Billing Events</h3><strong>{summary.events}</strong><p className="muted">Reconciliation trail from callbacks and rollups.</p></div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Growth Forecast</h3>
              <p className="muted">Explicit status, confidence, and reason codes.</p>
            </div>
            <TrendingUp size={18} />
          </div>
          <div className="card-grid" style={{ marginBottom: 0 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Status</h3>
              <span className={badgeClass(data?.projection?.status)}>{fmt(data?.projection?.status)}</span>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Confidence</h3>
              <strong>{fmt(data?.projection?.confidence)}%</strong>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Risk</h3>
              <span className={badgeClass(data?.health?.repayment_risk)}>{fmt(data?.health?.repayment_risk)}</span>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Loan limit</h3>
              <strong>{fmt(data?.health?.loan_limit)}</strong>
            </div>
          </div>
          <div className="card" style={{ background: "rgba(8,10,18,0.35)", marginTop: 12 }}>
            <h3>Reasons</h3>
            <p className="muted">{(data?.projection?.reasons || []).length ? data.projection.reasons.join(", ") : "No blockers reported."}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Subscription State</h3>
              <p className="muted">Plan, renewal, and usage rollup.</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Plan</h3>
              <p className="muted">{fmt(data?.subscription?.subscription?.plan_tier)} · {fmt(data?.subscription?.subscription?.status)}</p>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Renewal</h3>
              <p className="muted">{fmt(data?.subscription?.subscription?.renewal_date)} · auto renew {String(data?.subscription?.subscription?.auto_renew ?? false)}</p>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Usage</h3>
              <p className="muted">
                Messages {fmt(data?.subscription?.usage?.messages_used)} · API {fmt(data?.subscription?.usage?.api_calls)} · Storage {fmt(data?.subscription?.usage?.storage_mb)} MB · Bulk buys {fmt(data?.subscription?.usage?.group_buys)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Invoices</h3>
              <p className="muted">Billing cycles with payment status.</p>
            </div>
            <ReceiptText size={18} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {(data?.invoices || []).slice(0, 6).map((item: any) => (
              <div key={item.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <strong>{fmt(item.period_start)} - {fmt(item.period_end)}</strong>
                  <span className={badgeClass(item.status)}>{fmt(item.status)}</span>
                </div>
                <p className="muted">Amount {fmt(item.amount_due)} · Method {fmt(item.method)} · Paid {fmt(item.paid_at)}</p>
              </div>
            ))}
            {(data?.invoices || []).length === 0 && <p className="muted">No invoices found.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Billing Events</h3>
              <p className="muted">Webhook, rollup, and dunning trail.</p>
            </div>
            <Activity size={18} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {(data?.billingEvents || []).slice(0, 6).map((item: any) => (
              <div key={item.id} className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <strong>{fmt(item.kind)}</strong>
                  <span className={badgeClass(item.status)}>{fmt(item.status)}</span>
                </div>
                <p className="muted">{fmt(item.source)} · {fmt(item.created_at)}</p>
                <p className="muted">{item.error_text ? item.error_text : "No error reported."}</p>
              </div>
            ))}
            {(data?.billingEvents || []).length === 0 && <p className="muted">No billing events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
