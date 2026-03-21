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

export type PartnerRecord = {
  id?: string;
  partner_id?: string;
  name?: string;
  display_name?: string;
  type?: string;
  status?: string;
  rating?: number;
  location?: string | { address?: string; lat?: number; lng?: number };
  systems?: string[];
  products?: number;
  total_products?: number;
  stars_earned?: number;
  starsEarned?: number;
  last_sync_at?: string;
  last_sync?: string;
  updated_at?: string;
  health?: string;
  sync_health?: string;
};

export type PartnerStatusResponse = {
  integration?: {
    id?: string;
    status?: string;
    last_sync_at?: string;
    updated_at?: string;
  };
  recent_jobs?: any[];
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.partners && Array.isArray(data.partners)) return data.partners;
  return [];
};

const fetchJson = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const resp = await fetch(`${coreBaseUrl}${path}`, {
    ...options,
    headers: buildHeaders(),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
};

export const listPartners = async (): Promise<PartnerRecord[]> =>
  unwrapList(await fetchJson("/partners"));

export const getPartnerStatus = async (id: string): Promise<PartnerStatusResponse> =>
  fetchJson(`/partners/${encodeURIComponent(id)}/status`);

export const getPartnerHealth = async (id: string): Promise<any> =>
  fetchJson(`/partners/${encodeURIComponent(id)}/health`);

export const syncPartner = async (id: string) =>
  fetchJson(`/partners/${encodeURIComponent(id)}/sync`, { method: "POST" });

export const pausePartner = async (id: string) =>
  fetchJson(`/partners/${encodeURIComponent(id)}/pause`, { method: "POST" });

export const resumePartner = async (id: string) =>
  fetchJson(`/partners/${encodeURIComponent(id)}/resume`, { method: "POST" });

export const disconnectPartner = async (payload: { partner_id?: string; integration_id?: string }) =>
  fetchJson("/partners/disconnect", {
    method: "POST",
    body: JSON.stringify(payload),
  });
