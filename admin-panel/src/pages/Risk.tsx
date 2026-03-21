import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Risk = () => {
  const [scores, setScores] = useState<any[]>([]);

  const load = () => {
    adminFetch("/risk/scores?limit=50").then((data) => setScores(data.scores || [])).catch(() => setScores([]));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Risk Radar</h2>
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Score</th>
            <th>Fraud</th>
            <th>Abuse</th>
            <th>Health</th>
            <th>Compliance</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((row) => (
            <tr key={row.user_id}>
              <td>{row.user_id}</td>
              <td>{row.score}</td>
              <td>{row.fraud_risk}</td>
              <td>{row.abuse_risk}</td>
              <td>{row.business_health}</td>
              <td>{row.compliance_risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
