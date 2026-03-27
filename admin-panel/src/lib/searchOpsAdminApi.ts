import { coreFetch } from "./adminApi";

export type SearchOpsHealth = {
  tenant_id?: string;
  worker?: string;
  embeddings_status?: number | string;
  queued_media_jobs?: number;
  failed_media_jobs?: number;
  embedding_failures?: number;
};

export type SearchIndexRun = {
  id: string;
  tenant_id?: string;
  scope?: string;
  status?: string;
  requested_by?: string;
  requested_via?: string;
  total_docs?: number;
  processed_docs?: number;
  failed_docs?: number;
  last_error?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type SearchMediaJob = {
  id: string;
  tenant_id?: string;
  user_id?: string;
  job_type?: string;
  status: string;
  source_query?: string;
  intent?: string;
  media_key?: string;
  media_url?: string;
  mime_type?: string;
  transcript?: string;
  ocr_text?: string;
  query_id?: string;
  result?: Record<string, any>;
  metadata?: Record<string, any>;
  error_text?: string;
  attempts?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
};

const unwrapList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return query ? `?${query}` : "";
};

export const getSearchOpsHealth = async (): Promise<SearchOpsHealth> =>
  coreFetch("/search/ops/health");

export const listSearchReindexRuns = async (limit = 20): Promise<SearchIndexRun[]> =>
  unwrapList(await coreFetch(`/search/ops/reindex${buildQuery({ limit })}`));

export const createSearchReindexRun = async (): Promise<SearchIndexRun> =>
  coreFetch("/search/ops/reindex", { method: "POST" });

export const listSearchMediaJobs = async (params: {
  status?: string;
  limit?: number;
} = {}): Promise<SearchMediaJob[]> =>
  unwrapList(await coreFetch(`/search/ops/media-jobs${buildQuery({
    status: params.status,
    limit: params.limit,
  })}`));

export const retrySearchMediaJob = async (jobId: string): Promise<{ status?: string }> =>
  coreFetch(`/search/ops/media-jobs/${encodeURIComponent(jobId)}/retry`, { method: "POST" });
