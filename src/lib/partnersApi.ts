import { apiFetch } from './apiClient';

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

export type PartnerStatus = Record<string, any>;
export type PartnerHealth = Record<string, any>;
export type IntegrationRecord = {
  id?: string;
  seller_id?: string;
  partner_id?: string;
  status?: string;
  last_sync_at?: string;
  updated_at?: string;
};
export type PartnerStatusResponse = {
  integration?: IntegrationRecord;
  recent_jobs?: any[];
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.partners && Array.isArray(data.partners)) return data.partners;
  return [];
};

export const listPartners = async (): Promise<PartnerRecord[]> =>
  unwrapList(await apiFetch('/v1/partners'));

export const getPartner = async (id: string): Promise<PartnerRecord> =>
  apiFetch(`/v1/partners/${id}`);

export const connectPartner = async (payload: Record<string, any>) =>
  apiFetch('/v1/partners/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const disconnectPartner = async (payload: { partner_id?: string; integration_id?: string }) =>
  apiFetch('/v1/partners/disconnect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const syncPartner = async (id: string) =>
  apiFetch(`/v1/partners/${id}/sync`, { method: 'POST' });

export const pausePartner = async (id: string) =>
  apiFetch(`/v1/partners/${id}/pause`, { method: 'POST' });

export const resumePartner = async (id: string) =>
  apiFetch(`/v1/partners/${id}/resume`, { method: 'POST' });

export const getPartnerStatus = async (id: string): Promise<PartnerStatusResponse> =>
  apiFetch(`/v1/partners/${id}/status`);

export const getPartnerHealth = async (id: string): Promise<PartnerHealth> =>
  apiFetch(`/v1/partners/${id}/health`);

export const listPartnerLogs = async (): Promise<any[]> =>
  unwrapList(await apiFetch('/v1/partners/logs'));
