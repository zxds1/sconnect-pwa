import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Flags = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [featureKey, setFeatureKey] = useState("");

  const load = () => {
    adminFetch("/flags").then((data) => setFlags(data.flags || [])).catch(() => setFlags([]));
  };

  const create = async () => {
    await adminFetch("/flags", {
      method: "POST",
      body: JSON.stringify({ feature_key: featureKey, enabled: true, rollout_pct: 100, control_pct: 10000 }),
    });
    setFeatureKey("");
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Feature Flags</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input className="input" placeholder="feature_key" value={featureKey} onChange={(e) => setFeatureKey(e.target.value)} />
        <button className="button" onClick={create}>Create</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Enabled</th>
            <th>Rollout</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.id}>
              <td>{flag.feature_key}</td>
              <td>{flag.enabled ? "Yes" : "No"}</td>
              <td>{flag.rollout_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
