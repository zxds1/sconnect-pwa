import { apiFetch } from './apiClient';

export type ConsentRecord = {
  consent_type: string;
  consent_given: boolean;
  version?: number;
  expiry_date?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
};

export type ConsentHistoryRecord = {
  consent_type: string;
  consent_given: boolean;
  version?: number;
  expiry_date?: string | null;
  snapshot?: Record<string, any>;
  created_at?: string;
};

export type ConsentsResponse = {
  current?: ConsentRecord[];
  history?: ConsentHistoryRecord[];
};

export type SettingsSummary = {
  searches?: number;
  receipts?: number;
  purchases?: number;
  reviews?: number;
};

export type SettingsExportResponse = Record<string, any>;
export type SettingsDeleteResponse = Record<string, any>;
export type ComparisonPreferences = {
  comparison_weights?: Record<string, number>;
  deal_thresholds?: Record<string, number>;
  comparison_profile?: string;
};

export type UiPreferences = {
  theme?: 'light' | 'dark' | 'system';
  voice_feedback_enabled?: boolean;
  voice_directions_enabled?: boolean;
};

export const getConsents = async (): Promise<ConsentsResponse> =>
  apiFetch('/v1/settings/consents');

export const updateConsentByType = async (consentType: string, payload: { consent_given: boolean; expiry_date?: string | null; metadata?: Record<string, any> }) =>
  apiFetch(`/v1/settings/consents/${encodeURIComponent(consentType)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateConsents = async (payload: { consents: Array<{ consent_type: string; consent_given: boolean; expiry_date?: string | null; metadata?: Record<string, any> }> }) =>
  apiFetch('/v1/settings/consents', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getSettingsSummary = async (): Promise<SettingsSummary> =>
  apiFetch('/v1/settings/data-summary');

export const requestSettingsExport = async (payload: { export_type: string; verification_method: string; recent_login_at?: string }) : Promise<SettingsExportResponse> =>
  apiFetch('/v1/settings/export', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestSettingsDeletion = async (payload: { verification_method: string; mfa: boolean; verified_device: boolean; support_ticket_id: string }) : Promise<SettingsDeleteResponse> =>
  apiFetch('/v1/settings/delete-account', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getComparisonPreferences = async (): Promise<ComparisonPreferences> =>
  apiFetch('/v1/settings/comparison-preferences');

export const updateComparisonPreferences = async (payload: ComparisonPreferences): Promise<ComparisonPreferences> =>
  apiFetch('/v1/settings/comparison-preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getUiPreferences = async (): Promise<UiPreferences> =>
  apiFetch('/v1/settings/ui-preferences');

export const updateUiPreferences = async (payload: UiPreferences): Promise<UiPreferences> =>
  apiFetch('/v1/settings/ui-preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
