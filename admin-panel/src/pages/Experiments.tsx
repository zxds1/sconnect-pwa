import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Experiments = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [featureKey, setFeatureKey] = useState("");

  const load = () => {
    adminFetch("/experiments").then((data) => setExperiments(data.experiments || [])).catch(() => setExperiments([]));
  };

  const create = async () => {
    await adminFetch("/experiments", {
      method: "POST",
      body: JSON.stringify({ feature_key: featureKey, status: "draft" }),
    });
    setFeatureKey("");
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Experiments</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input className="input" placeholder="feature_key" value={featureKey} onChange={(e) => setFeatureKey(e.target.value)} />
        <button className="button" onClick={create}>Create</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.id}>
              <td>{exp.feature_key}</td>
              <td>{exp.status}</td>
              <td>{exp.updated_at?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
