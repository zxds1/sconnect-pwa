import { useEffect, useState } from "react";
import { adminFetch, coreFetch } from "../lib/adminApi";

export const Compliance = () => {
  const [status, setStatus] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [exports, setExports] = useState<any[]>([]);
  const [holds, setHolds] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      adminFetch("/compliance/status").catch(() => null),
      coreFetch("/security/compliance/reports").then((data) => data.reports || []).catch(() => []),
      coreFetch("/data/export").then((data) => data.exports || []).catch(() => []),
      coreFetch("/compliance/holds").then((data) => data.holds || []).catch(() => []),
    ]).then(([statusData, reportItems, exportItems, holdItems]) => {
      setStatus(statusData);
      setReports(reportItems);
      setExports(exportItems);
      setHolds(holdItems);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Compliance Status</h2>
          <p>Consent coverage, export jobs, legal holds, and reproducible reports.</p>
        </div>
      </div>
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
          <strong>{status?.active_holds ?? holds.filter((hold) => hold.status === "active").length ?? "—"}</strong>
        </div>
      </div>
      <div className="card">
        <h3>Compliance Reports</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Score</th>
              <th>Source Run</th>
              <th>Generated</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.overall_status}</td>
                <td>{report.weighted_score}</td>
                <td>{report.source_run_id || "—"}</td>
                <td>{report.generated_at?.slice?.(0, 19) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Export Jobs</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Completed</th>
              <th>Retries</th>
            </tr>
          </thead>
          <tbody>
            {exports.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.export_type}</td>
                <td>{item.status}</td>
                <td>{item.completed_at?.slice?.(0, 19) ?? "—"}</td>
                <td>{item.retry_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Legal Holds</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Case</th>
              <th>Status</th>
              <th>Released</th>
              <th>Failure</th>
            </tr>
          </thead>
          <tbody>
            {holds.map((hold) => (
              <tr key={hold.id}>
                <td>{hold.id}</td>
                <td>{hold.case_id}</td>
                <td>{hold.status}</td>
                <td>{hold.released_at?.slice?.(0, 19) ?? "—"}</td>
                <td>{hold.failure_reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
