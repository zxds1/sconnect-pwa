import { apiFetch } from './apiClient';

export type ListingSession = {
  session_id?: string;
};

export const createListingSession = async (): Promise<ListingSession> =>
  apiFetch('/v1/seller/listing/assistant/session', { method: 'POST' });

export const sendListingMessage = async (payload: { session_id: string; role: string; content: string }) =>
  apiFetch('/v1/seller/listing/assistant/message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const applyListingSession = async (payload: { session_id: string }) =>
  apiFetch('/v1/seller/listing/assistant/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
