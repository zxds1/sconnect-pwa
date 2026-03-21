import { useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Tenants = () => {
  const [tenantId, setTenantId] = useState("");
  const [activity, setActivity] = useState<any[]>([]);

  const load = async () => {
    if (!tenantId) return;
    const data = await adminFetch(`/tenants/${tenantId}/activity`);
    setActivity(data.activity || []);
  };

  return (
    <div>
      <h2>Tenant Activity</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input className="input" placeholder="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <button className="button" onClick={load}>Load</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
            <th>Completion %</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((row) => (
            <tr key={`${row.seller_id}-${row.activity_date}`}>
              <td>{row.seller_id}</td>
              <td>{row.activity_date?.slice(0, 10)}</td>
              <td>{row.revenue_amount}</td>
              <td>{row.order_count}</td>
              <td>{row.order_completion_rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
