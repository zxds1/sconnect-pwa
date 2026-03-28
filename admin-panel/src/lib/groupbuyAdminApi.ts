import { coreFetch } from "./adminApi";

export type GroupBuyInstance = {
  id: string;
  source_type?: string;
  source_id?: string;
  seller_id?: string;
  product_sku?: string;
  tiers?: Array<{ qty: number; price: number; discount?: string }>;
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
  delivery_details?: Record<string, unknown>;
  lat?: number;
  lng?: number;
  distance_km?: number;
  category_id?: string;
  current_price?: number;
};

export type GroupBuyStatus = {
  group_id: string;
  members?: number;
  target?: number;
  momentum?: number;
  tier_price?: number;
  tier?: string;
  status?: string;
};

export type GroupBuyTier = {
  group_buy_id: string;
  tier: string;
  min_members: number;
  max_members: number;
  discount: number;
  price: number;
  updated_at?: string;
};

export type GroupBuyPayment = {
  id: string;
  group_buy_id: string;
  escrow_amount?: string;
  supplier_split?: string;
  platform_fee?: string;
  status?: string;
  created_at?: string;
};

export type GroupBuyStateEvent = {
  id: string;
  group_buy_id: string;
  from_status?: string;
  to_status?: string;
  action: string;
  actor_id?: string;
  details?: Record<string, unknown>;
  created_at?: string;
};

export type GroupBuyStateEventFilters = {
  limit?: number;
  action?: string;
  actor_id?: string;
  from_status?: string;
  to_status?: string;
  from_date?: string;
  to_date?: string;
};

const unwrapList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const listGroupBuyInstances = async (params: Record<string, string | number | undefined> = {}): Promise<GroupBuyInstance[]> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return unwrapList<GroupBuyInstance>(await coreFetch(`/groupbuy/instances${suffix}`));
};

export const getGroupBuy = async (id: string): Promise<GroupBuyInstance> =>
  coreFetch(`/group-buy/${encodeURIComponent(id)}`);

export const getGroupBuyStatus = async (id: string): Promise<GroupBuyStatus> =>
  coreFetch(`/group-buy/${encodeURIComponent(id)}/status`);

export const getGroupBuyTiers = async (id: string): Promise<GroupBuyTier[]> =>
  unwrapList<GroupBuyTier>(await coreFetch(`/group-buy/${encodeURIComponent(id)}/tiers`));

export const getGroupBuyPayments = async (id: string): Promise<GroupBuyPayment[]> =>
  unwrapList<GroupBuyPayment>(await coreFetch(`/group-buy/${encodeURIComponent(id)}/payments`));

export const getGroupBuyEvents = async (id: string, filters: GroupBuyStateEventFilters = {}): Promise<GroupBuyStateEvent[]> => {
  const query = new URLSearchParams();
  query.set("limit", String(filters.limit ?? 50));
  if (filters.action) query.set("action", filters.action);
  if (filters.actor_id) query.set("actor_id", filters.actor_id);
  if (filters.from_status) query.set("from_status", filters.from_status);
  if (filters.to_status) query.set("to_status", filters.to_status);
  if (filters.from_date) query.set("from_date", filters.from_date);
  if (filters.to_date) query.set("to_date", filters.to_date);
  return unwrapList<GroupBuyStateEvent>(await coreFetch(`/group-buy/${encodeURIComponent(id)}/events?${query.toString()}`));
};
