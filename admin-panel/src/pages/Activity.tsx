import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/adminApi";

type ActivityRow = {
  id: string;
  tenant_id: string;
  account_type: string;
  actor_id: string;
  visitor_id?: string;
  session_id?: string;
  source_service: string;
  feature: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
};

export const Activity = () => {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [query, setQuery] = useState("");
  const [accountType, setAccountType] = useState("");

  useEffect(() => {
    adminFetch(`/activity?limit=100${accountType ? `&account_type=${encodeURIComponent(accountType)}` : ""}`)
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [accountType]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((evt) =>
      [evt.account_type, evt.actor_id, evt.visitor_id, evt.source_service, evt.feature, evt.action, evt.target_type, evt.target_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Platform Activity</h2>
          <p>Track buyer, seller, supplier, and admin actions across the platform.</p>
        </div>
      </div>
      <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          placeholder="Filter by actor, feature, or action"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 260, flex: 1 }}
        />
        <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="">All account types</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="supplier">Supplier</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Actor</th>
            <th>Feature</th>
            <th>Action</th>
            <th>Target</th>
            <th>Source</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((evt) => (
            <tr key={evt.id}>
              <td>{evt.account_type}</td>
              <td>{evt.visitor_id || evt.actor_id}</td>
              <td>{evt.feature}</td>
              <td>{evt.action}</td>
              <td>{evt.target_type ? `${evt.target_type} / ${evt.target_id || "—"}` : "—"}</td>
              <td>{evt.source_service}</td>
              <td>{evt.created_at?.slice(0, 19)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p style={{ color: "var(--muted)" }}>No activity events yet.</p>}
    </div>
  );
};
