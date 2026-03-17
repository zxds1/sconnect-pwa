import { apiFetch } from './apiClient';

export type AnalyticsEvent = {
  name: string;
  action?: string;
  source?: string;
  version?: number;
  timestamp?: string;
  properties?: Record<string, any>;
};

export type DataSummary = {
  total_records?: number;
  last_updated?: string;
  categories?: Record<string, number>;
  searches?: number;
  receipts?: number;
  purchases?: number;
  reviews?: number;
};

export type DataUsageItem = {
  id?: string;
  name?: string;
  count?: number;
  metric?: string;
  period?: string;
  last_accessed?: string;
  updated_at?: string;
};

export type ConsentRecord = {
  type?: string;
  consent_type?: string;
  consent_given?: boolean;
  status?: string;
  updated_at?: string;
  source?: string;
};

export type ExportResponse = {
  id?: string;
  status?: string;
  created_at?: string;
  expires_at?: string;
  download_url?: string;
  format?: string;
  export_type?: string;
  s3_export_path?: string;
};

export type DataUsageResponse = {
  usage?: DataUsageItem[];
};

export type ConsentsResponse = {
  current?: ConsentRecord[];
};

export type ExportListResponse = {
  exports?: ExportResponse[];
};

const normalizeEvent = (event: AnalyticsEvent) => ({
  name: event.name,
  action: event.action ?? '',
  source: event.source ?? 'pwa',
  version: event.version ?? 1,
  timestamp: event.timestamp ?? new Date().toISOString(),
  properties: event.properties ?? {},
});

export const postAnalyticsEvent = async (event: AnalyticsEvent) => {
  const normalized = normalizeEvent(event);
  try {
    const correlationId = localStorage.getItem('soko:correlation_id');
    if (correlationId) {
      normalized.properties = {
        ...normalized.properties,
        correlation_id: correlationId,
      };
    }
    const sessionId = localStorage.getItem('soko:session_id');
    if (sessionId) {
      normalized.properties = {
        ...normalized.properties,
        session_id: sessionId,
      };
    }
  } catch {}
  return apiFetch('/v1/audit/events', {
    method: 'POST',
    body: JSON.stringify({
      event_type: normalized.name,
      event_time: normalized.timestamp,
      payload: normalized,
    }),
  });
};

export const getDataSummary = async (): Promise<DataSummary> => apiFetch('/v1/data/summary');

export const getDataUsage = async (): Promise<DataUsageResponse> => apiFetch('/v1/data/usage');

export const requestDataExport = async (payload?: { export_type?: string; verification_method?: string; recent_login_at?: string; format?: string; scope?: string }): Promise<ExportResponse> =>
  apiFetch('/v1/data/exports', {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });

export const getDataExports = async (): Promise<ExportListResponse> => apiFetch('/v1/data/exports');

export const getDataExportById = async (id: string): Promise<ExportResponse> => apiFetch(`/v1/data/exports/${id}`);

export const getConsents = async (): Promise<ConsentsResponse> => apiFetch('/v1/consents');

export const updateConsentByType = async (type: string, payload: Partial<ConsentRecord>): Promise<ConsentRecord> =>
  apiFetch(`/v1/consents/${type}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const requestDataDeletion = async (payload?: { reason?: string; verification_method?: string; mfa?: boolean; verified_device?: boolean; support_ticket_id?: string }) =>
  apiFetch('/v1/data/deletion', {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
