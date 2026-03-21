import { apiFetch } from './apiClient';

export type SellerNotificationPreferences = {
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

export const getSellerNotificationPreferences = async (): Promise<SellerNotificationPreferences> =>
  apiFetch('/v1/seller/notifications/preferences');

export const updateSellerNotificationPreferences = async (payload: SellerNotificationPreferences) =>
  apiFetch('/v1/seller/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
