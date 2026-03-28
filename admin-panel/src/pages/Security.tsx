import { useEffect, useState } from "react";
import { adminFetch, coreFetch } from "../lib/adminApi";

export const Security = () => {
  const [overview, setOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [blocklists, setBlocklists] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      adminFetch("/security/overview").catch(() => null),
      adminFetch("/alerts").then((data) => data.alerts || []).catch(() => []),
      coreFetch("/security/blocklists").then((data) => data.blocklists || []).catch(() => []),
    ]).then(([securityOverview, alertItems, blocklistItems]) => {
      setOverview(securityOverview);
      setAlerts(alertItems);
      setBlocklists(blocklistItems);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Security Overview</h2>
          <p>Alerts, enforcement, and active blocklists.</p>
        </div>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3>Active Alerts</h3>
          <strong>{overview?.active_alerts ?? "—"}</strong>
        </div>
        <div className="card">
          <h3>Active Blocklists</h3>
          <strong>{overview?.active_blocklists ?? "—"}</strong>
        </div>
      </div>
      <div className="card">
        <h3>Recent Alerts</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.alert_type}</td>
                <td>{alert.status}</td>
                <td>{alert.confidence_score}</td>
                <td>{alert.created_at?.slice?.(0, 19) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Active Blocklist Entries</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Identifier</th>
              <th>Expires</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {blocklists.map((entry) => (
              <tr key={`${entry.type}:${entry.identifier}`}>
                <td>{entry.type}</td>
                <td>{entry.identifier}</td>
                <td>{entry.expires_at?.slice?.(0, 19) ?? "—"}</td>
                <td>{entry.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
