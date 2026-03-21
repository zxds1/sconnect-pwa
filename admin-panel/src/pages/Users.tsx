import { useEffect, useState } from "react";
import { adminFetch } from "../lib/adminApi";

export const Users = () => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const load = () => {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    adminFetch(`/users${params}`).then((data) => setUsers(data.users || [])).catch(() => setUsers([]));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>User Management</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input className="input" placeholder="Search by name or id" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="button" onClick={load}>Search</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Roles</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.display_name || "—"}</td>
              <td>{user.user_type}</td>
              <td><span className="badge info">{user.status}</span></td>
              <td>{(user.admin_roles || []).join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
