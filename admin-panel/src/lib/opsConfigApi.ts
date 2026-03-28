import { getSession } from "./adminApi";

const opsBaseUrl = import.meta.env.VITE_OPS_API_URL || "/v1/ops";

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

export type OpsConfig = {
  config_key: string;
  value: any;
  updated_at?: string;
};

export type OpsConfigList = {
  configs: OpsConfig[];
};

export type RuntimeQueueInfo = {
  queue: string;
  size: number;
  pending: number;
  active: number;
  scheduled: number;
  retry: number;
  archived: number;
  completed: number;
  processed: number;
  failed: number;
  processed_total: number;
  failed_total: number;
  latency_ms: number;
  paused: boolean;
  timestamp: string;
  memory_usage: number;
};

export type RuntimeServerInfo = {
  id: string;
  host: string;
  pid: number;
  concurrency: number;
  queues: Record<string, number>;
  started: string;
  status: string;
  active_workers: number;
};

export type RuntimeQueuesResponse = {
  generated_at: string;
  queues: RuntimeQueueInfo[];
  servers: RuntimeServerInfo[];
};

export const listOpsConfigs = async (): Promise<OpsConfigList> => {
  const resp = await fetch(`${opsBaseUrl}/configs`, {
    headers: buildHeaders(),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};

export const getOpsConfig = async (key: string): Promise<OpsConfig> => {
  const resp = await fetch(`${opsBaseUrl}/configs/${encodeURIComponent(key)}`, {
    headers: buildHeaders(),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};

export const setOpsConfig = async (key: string, value: any): Promise<OpsConfig> => {
  const resp = await fetch(`${opsBaseUrl}/configs/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ value }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};

export const getRuntimeQueues = async (): Promise<RuntimeQueuesResponse> => {
  const resp = await fetch(`${opsBaseUrl}/runtime/queues`, {
    headers: buildHeaders(),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Request failed");
  }
  return resp.json();
};
