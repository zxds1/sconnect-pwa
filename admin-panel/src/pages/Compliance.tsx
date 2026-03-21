import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Compliance = () => {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    adminFetch("/compliance/status").then(setStatus).catch(() => null);
  }, []);

  return (
    <div>
      <h2>Compliance Status</h2>
      <div className="card-grid">
        <div className="card">
          <h3>Consent Coverage</h3>
          <strong>{status?.consent_coverage_pct?.toFixed?.(1) ?? "—"}%</strong>
        </div>
        <div className="card">
          <h3>Pending Exports</h3>
          <strong>{status?.pending_exports ?? "—"}</strong>
        </div>
        <div className="card">
          <h3>Active Legal Holds</h3>
          <strong>{status?.active_holds ?? "—"}</strong>
        </div>
      </div>
    </div>
  );
};
