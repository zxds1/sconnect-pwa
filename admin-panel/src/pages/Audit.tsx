import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Audit = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((evt) =>
      [evt.action, evt.target_type, evt.target_id, evt.admin_user_id]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(q))
    );
  }, [events, query]);

  useEffect(() => {
    adminFetch("/audit/admin?limit=50").then((data) => setEvents(data.events || [])).catch(() => setEvents([]));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Audit Trail</h2>
          <p>Track admin actions, with quick filter support.</p>
        </div>
      </div>
      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          className="input"
          placeholder="Filter by action, target, or admin (e.g. assistant_model_options_upsert)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="button" onClick={() => setQuery("assistant_model_options_upsert")}>
          Assistant Model Updates
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            <th>Admin</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((evt) => (
            <tr key={evt.id}>
              <td>{evt.action}</td>
              <td>{evt.target_type} / {evt.target_id}</td>
              <td>{evt.admin_user_id}</td>
              <td>{evt.created_at?.slice(0, 19)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
