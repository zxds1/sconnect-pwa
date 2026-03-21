import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Security = () => {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    adminFetch("/security/overview").then(setOverview).catch(() => null);
  }, []);

  return (
    <div>
      <h2>Security Overview</h2>
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
    </div>
  );
};
