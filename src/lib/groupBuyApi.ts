import { apiFetch } from './apiClient';

export type GroupBuyTier = {
  qty: number;
  price: number;
  discount?: string;
};

export type GroupBuyInstance = {
  id: string;
  source_type?: string;
  source_id?: string;
  seller_id?: string;
  product_sku?: string;
  tiers?: GroupBuyTier[];
  min_group_size?: number;
  target_tier_qty?: number;
  current_size?: number;
  inventory_remaining?: number;
  status?: string;
  group_chat_id?: string;
  share_link?: string;
  market_name?: string;
  expires_at?: string;
  seller_name?: string;
  seller_mode?: string;
  visual_marker?: string;
  whatsapp_number?: string;
  delivery_radius_km?: number;
  delivery_details?: Record<string, any>;
  lat?: number;
  lng?: number;
  distance_km?: number;
  category_id?: string;
  current_price?: number;
};

export type GroupBuyFilters = {
  lat?: number;
  lng?: number;
  radius_km?: number;
  market_name?: string;
  category_id?: string;
  status?: string;
  price_max?: number;
  min_size?: number;
  max_size?: number;
  sort?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const listGroupBuyInstances = async (filters: GroupBuyFilters = {}): Promise<GroupBuyInstance[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const query = params.toString();
  const data = await apiFetch(`/v1/groupbuy/instances${query ? `?${query}` : ''}`);
  return unwrapList<GroupBuyInstance>(data);
};

export const createBuyerGroupRequest = async (payload: {
  product_sku: string;
  target_quantity: number;
  target_price?: number;
}) =>
  apiFetch('/v1/groupbuy/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createGroupBuyOffer = async (payload: {
  product_sku: string;
  tiers: GroupBuyTier[];
  min_group_size?: number;
  max_groups?: number;
  duration_hours?: number;
}) =>
  apiFetch('/v1/groupbuy/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const joinGroupBuyInstance = async (id: string, payload?: { quantity?: number }) =>
  apiFetch(`/v1/groupbuy/instances/${id}/join`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
