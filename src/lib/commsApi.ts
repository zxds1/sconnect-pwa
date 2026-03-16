import { apiFetch } from './apiClient';

export type Broadcast = {
  id?: string;
  name?: string;
  status?: string;
  channel?: string;
  scheduled_at?: string;
  created_at?: string;
};

export type SendStatus = {
  id?: string;
  status?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const createBroadcast = async (payload: {
  name: string;
  channel: string;
  segment_id?: string;
  segment_criteria?: Record<string, any>;
  template_id?: string;
  scheduled_at?: string;
}): Promise<Broadcast> =>
  apiFetch('/v1/seller/comms/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listBroadcasts = async (limit = 50): Promise<Broadcast[]> =>
  unwrapList(await apiFetch(`/v1/seller/comms/broadcasts?limit=${limit}`));

export const sendWhatsApp = async (payload: { content: string }): Promise<SendStatus> =>
  apiFetch('/v1/seller/comms/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getWhatsAppStatus = async (id: string): Promise<SendStatus> =>
  apiFetch(`/v1/seller/comms/whatsapp/status/${id}`);

export const sendSMS = async (payload: { content: string }): Promise<SendStatus> =>
  apiFetch('/v1/seller/comms/sms/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const sendPush = async (payload: { content: string }): Promise<SendStatus> =>
  apiFetch('/v1/seller/comms/push/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
