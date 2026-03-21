import { apiFetch } from './apiClient';

type OnboardingStepState = Record<string, string>;

export type OnboardingState = {
  steps?: OnboardingStepState;
  completion?: number;
  eligible?: boolean;
  grace_until?: string | null;
  last_updated?: string;
  shop_type?: string;
  seller_mode?: string;
  delivery_radius_km?: number;
  whatsapp_number?: string;
  connection?: {
    id?: string;
    platform?: string;
    connection_status?: string;
    api_base_url?: string;
    shop_domain?: string;
    auth_type?: string;
    scopes?: string;
    webhook_url?: string;
    products_endpoint?: string;
    orders_endpoint?: string;
    demand_endpoint?: string;
    csv_import_url?: string;
    last_sync_at?: string;
    sync_errors?: number;
    last_error?: string;
  } | null;
};

export type OnboardingEligibility = {
  eligible?: boolean;
  completion?: number;
};

export type Tutorial = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
};

export type VerificationStatus = {
  status?: string;
  verified?: boolean;
  submitted_at?: string;
};

export type SellerDiscovery = {
  is_public?: boolean;
  visibility_scope?: string;
  paused_at?: string | null;
  share_slug?: string;
  share_url?: string;
};

export type OnlineConnectRequest = {
  shop_type?: string;
  platform: string;
  shop_domain?: string;
  api_base_url?: string;
  api_key?: string;
  api_secret?: string;
  webhook_secret?: string;
  webhook_url?: string;
  products_endpoint?: string;
  orders_endpoint?: string;
  demand_endpoint?: string;
  csv_import_url?: string;
  auth_code?: string;
  scopes?: string;
};

export type OnlineConnectResponse = {
  connection?: OnboardingState['connection'];
  auth_url?: string;
};

export type OnlineOAuthStartRequest = {
  platform: string;
  shop_domain?: string;
  scopes?: string;
  redirect_url?: string;
};

export type OnlineOAuthStartResponse = {
  auth_url?: string;
  state?: string;
};

export type OnlineOAuthCallbackRequest = {
  platform: string;
  shop_domain?: string;
  code?: string;
  state?: string;
  hmac?: string;
  timestamp?: string;
  host?: string;
  consumer_key?: string;
  consumer_secret?: string;
  signature?: string;
  user_id?: string;
  scope?: string;
  return_url?: string;
  callback_url?: string;
};

export type ProductMappingItem = {
  external_sku: string;
  canonical_sku: string;
  platform: string;
  sync_enabled?: boolean;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getSellerOnboardingState = async (): Promise<OnboardingState> =>
  apiFetch('/v1/seller/onboarding/state');

export const completeSellerOnboarding = async () =>
  apiFetch('/v1/seller/onboarding/complete', { method: 'POST' });

export const resetSellerOnboarding = async () =>
  apiFetch('/v1/seller/onboarding/reset', { method: 'POST' });

export const recordSellerOnboardingEvent = async (payload: { step: string; status: string }) =>
  apiFetch('/v1/seller/onboarding/event', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getSellerOnboardingEligibility = async (): Promise<OnboardingEligibility> =>
  apiFetch('/v1/seller/onboarding/eligibility');

export const grantSellerOnboardingGrace = async (payload: { hours: number }) =>
  apiFetch('/v1/seller/onboarding/grace', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const completeVoiceOnboarding = async () =>
  apiFetch('/v1/seller/onboarding/voice', { method: 'POST' });

export const setSellerShopType = async (payload: { shop_type: string }) =>
  apiFetch('/v1/seller/onboarding/shop-type', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const connectOnlineStore = async (payload: OnlineConnectRequest): Promise<OnlineConnectResponse> =>
  apiFetch('/v1/onboarding/online/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const startOnlineOAuth = async (payload: OnlineOAuthStartRequest): Promise<OnlineOAuthStartResponse> =>
  apiFetch('/v1/seller/online/oauth/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const completeOnlineOAuth = async (payload: OnlineOAuthCallbackRequest) =>
  apiFetch('/v1/seller/online/oauth/callback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const bulkProductMappings = async (items: ProductMappingItem[]) =>
  apiFetch('/v1/onboarding/mappings/bulk', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });

export const getConnectionStatus = async (id: string) =>
  apiFetch(`/v1/seller/connections/${id}/status`);

export const triggerConnectionSync = async (id: string) =>
  apiFetch(`/v1/seller/sync/now/${id}`, { method: 'POST' });

export const listSellerTutorials = async (): Promise<Tutorial[]> =>
  unwrapList(await apiFetch('/v1/seller/tutorials'));

export const completeSellerTutorial = async (payload: { tutorial_id: string }) =>
  apiFetch('/v1/seller/tutorials/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const refreshSellerShareLink = async () =>
  apiFetch('/v1/seller/share-link/refresh', { method: 'POST' });

export const getSellerShareLink = async (): Promise<SellerDiscovery> =>
  apiFetch('/v1/seller/share-link');

export const requestSellerVerification = async () =>
  apiFetch('/v1/seller/verification/request', { method: 'POST' });

export const getSellerVerificationStatus = async (): Promise<VerificationStatus> =>
  apiFetch('/v1/seller/verification/status');
