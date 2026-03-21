import { clearSession, getSession } from "../lib/adminApi";

export const Topbar = () => {
  const session = getSession();
  return (
    <div className="topbar">
      <div>
        <strong>Tenant:</strong> {session?.tenantId || "unknown"}
      </div>
      <button
        className="button"
        onClick={() => {
          clearSession();
          window.location.reload();
        }}
      >
        Sign Out
      </button>
    </div>
  );
};
