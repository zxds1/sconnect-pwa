import { useState } from "react";
import { setSession } from "../lib/adminApi";

export const Login = () => {
  const [tenantId, setTenantId] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/v1/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          phone,
          pin,
          device: { fingerprint: "admin-panel" },
        }),
      });
      if (!resp.ok) {
        throw new Error("Invalid admin credentials");
      }
      const data = await resp.json();
      setSession({
        accessToken: data.access_token,
        roles: data.roles || ["support"],
        tenantId,
        userId: data.user_id || "admin",
      });
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360 }}>
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          Authenticate with your admin credentials.
        </p>
        {error && <div className="badge warn" style={{ marginBottom: 12 }}>{error}</div>}
        <label>
          Tenant ID
          <input className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="tenant_001" required />
        </label>
        <div style={{ height: 10 }} />
        <label>
          Phone
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." required />
        </label>
        <div style={{ height: 10 }} />
        <label>
          PIN
          <input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} required />
        </label>
        <div style={{ height: 16 }} />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};
