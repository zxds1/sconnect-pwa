import { apiFetch } from './apiClient';

export type SellerPreferences = {
  tenant_id?: string;
  seller_id?: string;
  marketing?: Record<string, any>;
  growth?: Record<string, any>;
  comms?: Record<string, any>;
  analytics?: Record<string, any>;
  procurement?: Record<string, any>;
  updated_at?: string;
};

export const getSellerPreferences = async (): Promise<SellerPreferences> =>
  apiFetch('/v1/seller/preferences');

export const updateSellerPreferences = async (payload: {
  marketing?: Record<string, any>;
  growth?: Record<string, any>;
  comms?: Record<string, any>;
  analytics?: Record<string, any>;
  procurement?: Record<string, any>;
}): Promise<SellerPreferences> =>
  apiFetch('/v1/seller/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
