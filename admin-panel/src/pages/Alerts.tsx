import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  const load = () => {
    adminFetch("/alerts").then((data) => setAlerts(data.alerts || [])).catch(() => setAlerts([]));
  };

  const ack = async (id: string) => {
    await adminFetch(`/alerts/${id}`, { method: "POST", body: JSON.stringify({ status: "acknowledged" }) });
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Security Alerts</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Status</th>
            <th>Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{alert.alert_type}</td>
              <td>{alert.status}</td>
              <td>{alert.confidence_score}</td>
              <td>
                <button className="button" onClick={() => ack(alert.id)}>Ack</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
