export const adminBaseUrl = import.meta.env.VITE_ADMIN_API_URL || "/v1/admin";

export type AdminSession = {
  accessToken: string;
  roles: string[];
  tenantId: string;
  userId: string;
};

export const getSession = (): AdminSession | null => {
  try {
    const raw = localStorage.getItem("soko:admin_session");
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
};

export const setSession = (session: AdminSession) => {
  localStorage.setItem("soko:admin_session", JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem("soko:admin_session");
};

export const adminFetch = async (path: string, options: RequestInit = {}) => {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  if (session?.tenantId) headers.set("X-Tenant-Id", session.tenantId);
  if (session?.userId) headers.set("X-User-Id", session.userId);
  if (session?.roles?.length) headers.set("X-Role", session.roles[0]);
  headers.set("Content-Type", "application/json");

  const resp = await fetch(`${adminBaseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};
