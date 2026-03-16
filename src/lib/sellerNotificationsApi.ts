import { apiFetch } from './apiClient';

export type SellerNotificationPreferences = {
  email?: boolean;
  in_app?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
  followers?: boolean;
  marketing?: boolean;
  rewards?: boolean;
  support?: boolean;
  frequency?: string;
  updated_at?: string;
};

export const getSellerNotificationPreferences = async (): Promise<SellerNotificationPreferences> =>
  apiFetch('/v1/seller/notifications/preferences');

export const updateSellerNotificationPreferences = async (payload: SellerNotificationPreferences) =>
  apiFetch('/v1/seller/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
