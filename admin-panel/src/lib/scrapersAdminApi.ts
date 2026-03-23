import { adminFetch } from "./adminApi";

export type ScraperBatch = {
  id: string;
  tenant_id: string;
  source_name: string;
  source_type: string;
  file_name: string;
  status: string;
  row_count: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
};

export type ScraperBatchItem = {
  id: string;
  batch_id: string;
  tenant_id: string;
  source_name: string;
  source_shop_key: string;
  source_product_key: string;
  seller_id?: string;
  product_id?: string;
  seller_product_id?: string;
  status: string;
  error?: string;
  raw_row?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

const unwrapItems = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const listScraperBatches = async (params: { status?: string; source_name?: string; limit?: number; offset?: number } = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const resp = await adminFetch(`/scrapers${search.toString() ? `?${search.toString()}` : ""}`);
  return unwrapItems<ScraperBatch>(resp);
};

export const getScraperBatch = async (batchId: string): Promise<ScraperBatch> => {
  const resp = await adminFetch(`/scrapers/${encodeURIComponent(batchId)}`);
  return resp.batch as ScraperBatch;
};

export const listScraperBatchItems = async (batchId: string, params: { limit?: number; offset?: number } = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const resp = await adminFetch(`/scrapers/${encodeURIComponent(batchId)}/items${search.toString() ? `?${search.toString()}` : ""}`);
  return unwrapItems<ScraperBatchItem>(resp);
};

export const updateScraperBatchStatus = async (batchId: string, status: string) =>
  adminFetch(`/scrapers/${encodeURIComponent(batchId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const retryScraperBatch = async (batchId: string) =>
  adminFetch(`/scrapers/${encodeURIComponent(batchId)}/retry`, { method: "POST" });

export const cancelScraperBatch = async (batchId: string) =>
  adminFetch(`/scrapers/${encodeURIComponent(batchId)}/cancel`, { method: "POST" });

export const ingestScraperCsv = async (payload: FormData) =>
  adminFetch("/scrapers/ingest", {
    method: "POST",
    body: payload,
  });
