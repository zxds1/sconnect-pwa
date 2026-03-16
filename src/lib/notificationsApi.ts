import { apiFetch } from './apiClient';

export type NotificationItem = {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  status?: string;
  created_at?: string;
};

export type NotificationListResponse = {
  items?: NotificationItem[];
  unread_count?: number;
};

export type NotificationPreferences = {
  price_drops?: boolean;
  back_in_stock?: boolean;
  trending?: boolean;
  marketing?: boolean;
  rewards?: boolean;
  support?: boolean;
  system?: boolean;
  watched_items?: boolean;
  location_based?: boolean;
  frequency?: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  updated_at?: string;
};

export type NotificationChannels = {
  push?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
  email?: boolean;
  device_specific?: Record<string, string>;
  updated_at?: string;
};

export type NotificationFilter = {
  id: string;
  name?: string;
  rules?: Array<{ event?: string; channels?: string[]; allow?: boolean }>;
  channel?: string;
  frequency?: string;
  active?: boolean;
  updated_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listNotifications = async (params: { limit?: number; offset?: number } = {}): Promise<NotificationListResponse> => {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  const suffix = query.toString() ? `?${query}` : '';
  return apiFetch(`/v1/notifications${suffix}`);
};

export const updateNotification = async (id: string, payload: { status?: string }) =>
  apiFetch(`/v1/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const markNotificationRead = async (id: string) =>
  apiFetch(`/v1/notifications/${id}/read`, { method: 'POST' });

export const getNotificationPreferences = async (): Promise<NotificationPreferences> =>
  apiFetch('/v1/notifications/preferences');

export const updateNotificationPreferences = async (payload: NotificationPreferences) =>
  apiFetch('/v1/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getNotificationChannels = async (): Promise<NotificationChannels> =>
  apiFetch('/v1/notifications/channels');

export const updateNotificationChannels = async (payload: NotificationChannels) =>
  apiFetch('/v1/notifications/channels', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const listNotificationFilters = async (): Promise<NotificationFilter[]> =>
  unwrapList(await apiFetch('/v1/notifications/filters'));

export const createNotificationFilter = async (payload: {
  name: string;
  rules?: Array<{ event?: string; channels?: string[]; allow?: boolean }>;
  channel?: string;
  frequency?: string;
  active?: boolean;
}) =>
  apiFetch('/v1/notifications/filters', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateNotificationFilter = async (id: string, payload: Partial<NotificationFilter>) =>
  apiFetch(`/v1/notifications/filters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteNotificationFilter = async (id: string) =>
  apiFetch(`/v1/notifications/filters/${id}`, { method: 'DELETE' });
