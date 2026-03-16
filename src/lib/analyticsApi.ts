import { apiFetch } from './apiClient';

export type DataSummary = {
  searches?: number;
  receipts?: number;
  purchases?: number;
  reviews?: number;
};

export type DataUsageItem = {
  metric?: string;
  count?: number;
  period?: string;
  updated_at?: string;
};

export type DataUsageResponse = {
  usage?: DataUsageItem[];
};

export type ExportResponse = {
  id?: string;
  status?: string;
  export_type?: string;
  verification_method?: string;
  s3_export_path?: string;
  created_at?: string;
};

export type ExportRequest = {
  export_type: string;
  verification_method: 'mfa' | 'recent_login';
  recent_login_at?: string;
};

export type ExportListResponse = {
  exports?: ExportResponse[];
};

export type ConsentRecord = {
  consent_type: string;
  consent_given: boolean;
  version?: number;
  expiry_date?: string;
  metadata?: Record<string, any>;
  created_at?: string;
};

export type ConsentHistoryRecord = {
  consent_type: string;
  consent_given: boolean;
  version?: number;
  expiry_date?: string;
  snapshot?: Record<string, any>;
  created_at?: string;
};

export type ConsentsResponse = {
  current?: ConsentRecord[];
  history?: ConsentHistoryRecord[];
};

export type DeleteDataRequest = {
  verification_method: 'mfa';
  mfa: boolean;
  verified_device: boolean;
  support_ticket_id: string;
};

export type DeleteDataResponse = {
  id?: string;
  status?: string;
  verification_method?: string;
  created_at?: string;
};

export const getDataSummary = () => apiFetch<DataSummary>('/v1/data/summary');

export const getDataUsage = () => apiFetch<DataUsageResponse>('/v1/data/usage');

export const requestDataExport = (payload: ExportRequest) =>
  apiFetch<ExportResponse>('/v1/data/export', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getDataExports = () => apiFetch<ExportListResponse>('/v1/data/export');

export const getDataExportById = (id: string) => apiFetch<ExportResponse>(`/v1/data/export/${id}`);

export const getConsents = () => apiFetch<ConsentsResponse>('/v1/settings/consents');

export const updateConsentByType = (consentType: string, payload: { consent_given: boolean; expiry_date?: string; metadata?: Record<string, any> }) =>
  apiFetch<ConsentRecord>(`/v1/settings/consents/${consentType}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const requestDataDeletion = (payload: DeleteDataRequest) =>
  apiFetch<DeleteDataResponse>('/v1/data/delete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
