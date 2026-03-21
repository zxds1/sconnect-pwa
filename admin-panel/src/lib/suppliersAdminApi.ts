import { getSession } from "./adminApi";

const coreBaseUrl = import.meta.env.VITE_API_BASE_URL || "/v1";

const buildHeaders = () => {
  const session = getSession();
  const headers = new Headers();
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (session?.tenantId) headers.set("X-Tenant-Id", session.tenantId);
  if (session?.userId) headers.set("X-User-Id", session.userId);
  if (session?.roles?.length) headers.set("X-Role", session.roles[0]);
  headers.set("Content-Type", "application/json");
  return headers;
};

export type SupplierApplication = {
  id?: string;
  seller_id?: string;
  business_name?: string;
  category?: string;
  lat?: number;
  lng?: number;
  address?: string;
  notes?: string;
  status?: string;
  decision_reason?: string;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listSupplierApplicationsAdmin = async (status?: string): Promise<SupplierApplication[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const resp = await fetch(`${coreBaseUrl}/suppliers/applications/admin${query}`, {
    headers: buildHeaders(),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  const data = await resp.json();
  return unwrapList<SupplierApplication>(data);
};

export const approveSupplierApplication = async (id: string, payload?: { decision_reason?: string }) => {
  const resp = await fetch(`${coreBaseUrl}/suppliers/applications/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: buildHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};

export const rejectSupplierApplication = async (id: string, payload?: { decision_reason?: string }) => {
  const resp = await fetch(`${coreBaseUrl}/suppliers/applications/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    headers: buildHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};
