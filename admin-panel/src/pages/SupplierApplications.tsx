import { useEffect, useState } from "react";
import {
  approveSupplierApplication,
  listSupplierApplicationsAdmin,
  rejectSupplierApplication,
  type SupplierApplication,
} from "../lib/suppliersAdminApi";

export const SupplierApplications = () => {
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [decisionReasons, setDecisionReasons] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const items = await listSupplierApplicationsAdmin(filter || undefined);
      setApplications(items || []);
    } catch (err: any) {
      setStatus(err?.message || "Unable to load supplier applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleApprove = async (id: string) => {
    setStatus(null);
    try {
      await approveSupplierApplication(id, { decision_reason: decisionReasons[id] || "" });
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to approve application.");
    }
  };

  const handleReject = async (id: string) => {
    setStatus(null);
    try {
      await rejectSupplierApplication(id, { decision_reason: decisionReasons[id] || "" });
      await load();
    } catch (err: any) {
      setStatus(err?.message || "Unable to reject application.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Supplier Applications</h2>
          <p>Admin review queue for supplier onboarding.</p>
        </div>
        <div className="actions">
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn secondary" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {loading && <div className="status">Loading applications...</div>}

      <div className="card-grid">
        {applications.map((app) => (
          <div key={app.id || `${app.seller_id}-${app.created_at}`} className="card">
            <div className="card-header">
              <div>
                <h3>{app.business_name || "Business"}</h3>
                <p className="muted">
                  {app.category || "Category"} • Seller {app.seller_id || "—"}
                </p>
                {app.address && <p className="muted">{app.address}</p>}
              </div>
              <span className="badge info">{app.status || "pending"}</span>
            </div>
            {app.notes && <p className="muted">Notes: {app.notes}</p>}
            <input
              className="input"
              placeholder="Decision reason (optional)"
              value={decisionReasons[app.id || ""] || ""}
              onChange={(e) =>
                setDecisionReasons((prev) => ({ ...prev, [app.id || ""]: e.target.value }))
              }
            />
            <div className="actions" style={{ marginTop: 12 }}>
              <button
                className="btn primary"
                onClick={() => app.id && handleApprove(app.id)}
                disabled={!app.id || app.status !== "pending"}
              >
                Approve
              </button>
              <button
                className="btn secondary"
                onClick={() => app.id && handleReject(app.id)}
                disabled={!app.id || app.status !== "pending"}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {!loading && applications.length === 0 && (
          <div className="card">
            <p className="muted">No supplier applications in the queue.</p>
          </div>
        )}
      </div>
    </div>
  );
};
