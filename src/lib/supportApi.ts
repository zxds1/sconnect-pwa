import { apiFetch } from './apiClient';

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const createChatThread = async (payload: Record<string, any>) =>
  apiFetch('/v1/chat/threads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listChatMessages = async (threadId: string): Promise<any[]> =>
  unwrapList(await apiFetch(`/v1/chat/threads/${threadId}/messages`));

export const createChatMessage = async (threadId: string, payload: Record<string, any>) =>
  apiFetch(`/v1/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const escalateChatThread = async (threadId: string) =>
  apiFetch(`/v1/chat/threads/${threadId}/escalate`, { method: 'POST' });

export const createSupportTicket = async (payload: Record<string, any>) =>
  apiFetch('/v1/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getSupportTicket = async (id: string) =>
  apiFetch(`/v1/support/tickets/${id}`);

export const createSupportTicketMessage = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/support/tickets/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createSupportTicketAttachment = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/support/tickets/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const closeSupportTicket = async (id: string) =>
  apiFetch(`/v1/support/tickets/${id}/close`, { method: 'POST' });

export const createCounterfeitReport = async (payload: Record<string, any>) =>
  apiFetch('/v1/reports/counterfeit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCounterfeitReport = async (id: string) =>
  apiFetch(`/v1/reports/counterfeit/${id}`);

export const updateCounterfeitReport = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/reports/counterfeit/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getCounterfeitSummary = async () =>
  apiFetch('/v1/reports/counterfeit/summary');

export const createDispute = async (payload: Record<string, any>) =>
  apiFetch('/v1/disputes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getDispute = async (id: string) =>
  apiFetch(`/v1/disputes/${id}`);

export const uploadDisputeEvidence = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/disputes/${id}/evidence`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const resolveDispute = async (id: string, payload?: Record<string, any>) =>
  apiFetch(`/v1/disputes/${id}/resolve`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });

export const getDisputeSummary = async () =>
  apiFetch('/v1/disputes/summary');

export const createModerationReview = async (payload: Record<string, any>) =>
  apiFetch('/v1/moderation/review', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getSellerReputation = async (id: string) =>
  apiFetch(`/v1/sellers/${id}/reputation`);
