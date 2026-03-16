import { apiFetch } from './apiClient';

export type WhatsAppMessage = {
  id?: string;
  external_id?: string;
  status?: string;
  content?: string;
  created_at?: string;
};

export type WhatsAppTemplate = {
  id?: string;
  name?: string;
  content?: string;
  status?: string;
  created_at?: string;
};

export type WhatsAppEvent = {
  id?: string;
  type?: string;
  payload?: Record<string, string>;
  created_at?: string;
};

export type WhatsAppConsent = {
  status?: string;
  consent_version?: string;
  consent_given_at?: string;
  updated_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const sendWhatsAppMessage = async (payload: {
  phone: string;
  content: string;
  type?: string;
  critical?: boolean;
  metadata?: Record<string, string>;
  template?: string;
  channel?: string;
  event_type?: string;
}): Promise<WhatsAppMessage> =>
  apiFetch('/v1/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getWhatsAppStatus = async (messageId: string): Promise<WhatsAppMessage> =>
  apiFetch(`/v1/whatsapp/${messageId}/status`);

export const getWhatsAppStatusByExternalId = async (externalId: string): Promise<WhatsAppMessage> =>
  apiFetch(`/v1/whatsapp/status/${externalId}`);

export const listWhatsAppTemplates = async (): Promise<WhatsAppTemplate[]> =>
  unwrapList(await apiFetch('/v1/whatsapp/templates'));

export const createWhatsAppTemplate = async (payload: { name: string; content: string }): Promise<WhatsAppTemplate> =>
  apiFetch('/v1/whatsapp/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listWhatsAppEvents = async (limit = 20): Promise<WhatsAppEvent[]> =>
  unwrapList(await apiFetch(`/v1/whatsapp/events?limit=${limit}`));

export const createWhatsAppEvent = async (payload: { type: string; payload?: Record<string, string> }): Promise<WhatsAppEvent> =>
  apiFetch('/v1/whatsapp/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getWhatsAppConsent = async (): Promise<WhatsAppConsent> =>
  apiFetch('/v1/whatsapp/consent');

export const optInWhatsApp = async (payload?: { consent_version?: string }): Promise<WhatsAppConsent> =>
  apiFetch('/v1/whatsapp/optin', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });

export const optOutWhatsApp = async (payload?: { consent_version?: string }): Promise<WhatsAppConsent> =>
  apiFetch('/v1/whatsapp/optout', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
