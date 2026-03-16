import { apiFetch } from './apiClient';

export type CartItem = {
  id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
  updated_at?: string;
};

export type Cart = {
  id: string;
  buyer_id?: string;
  status?: string;
  items?: CartItem[];
  updated_at?: string;
};

export type DeliveryEstimate = {
  id?: string;
  cart_id?: string;
  distance_km?: number;
  eta_minutes?: number;
  cost_amount?: number;
  currency?: string;
};

export type CartSummary = {
  cart_id?: string;
  total?: number;
  tax?: number;
  currency?: string;
};

export type CartInsights = {
  items?: number;
  seller_count?: number;
  total?: number;
};

export type CartRecommendation = {
  id: string;
  cart_id?: string;
  original_product_id: string;
  candidate_product_id: string;
  score?: number;
  reason?: string;
  created_at?: string;
};

export type CartAlert = {
  id?: string;
  product_id?: string;
  target_price?: number;
  created_at?: string;
};

export type RoutePoint = {
  lat: number;
  lng: number;
};

export type CartRoute = {
  id?: string;
  cart_id?: string;
  route_wkt?: string;
  created_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getCart = async (): Promise<Cart> => apiFetch('/v1/cart');

export const addCartItem = async (payload: {
  product_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
}) =>
  apiFetch('/v1/cart/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateCartItem = async (id: string, payload: { quantity: number; unit_price?: number }) =>
  apiFetch(`/v1/cart/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteCartItem = async (id: string) =>
  apiFetch(`/v1/cart/items/${id}`, {
    method: 'DELETE',
  });

export const getCartSummary = async (): Promise<CartSummary> => apiFetch('/v1/cart/summary');

export const getCartInsights = async (): Promise<CartInsights> => apiFetch('/v1/cart/insights');

export const estimateDelivery = async (payload: { cart_id?: string; origin_lat: number; origin_lng: number }) =>
  apiFetch<DeliveryEstimate>('/v1/cart/estimate-delivery', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCartRecommendations = async (): Promise<CartRecommendation[]> =>
  unwrapList(await apiFetch('/v1/cart/recommendations'));

export const swapCartItem = async (payload: {
  original_product_id: string;
  candidates: Array<{ product_id: string; availability: number; price_score: number; similarity: number; margin: number }>;
}) =>
  apiFetch('/v1/cart/swap', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const autoSwapCartItem = async (payload: {
  original_product_id: string;
  original_stock: number;
  reserved_pct: number;
  price_delta_pct: number;
  same_brand: boolean;
  same_category: boolean;
  same_canonical: boolean;
  candidates: Array<{ product_id: string; availability: number; price_score: number; similarity: number; margin: number }>;
}) =>
  apiFetch('/v1/cart/swap/auto', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const switchAllCartItems = async () =>
  apiFetch('/v1/cart/switch-all', {
    method: 'POST',
  });

export const applyCartCoupon = async (payload: { cart_id: string; code: string; discount_amount: number }) =>
  apiFetch('/v1/cart/apply-coupon', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCartTaxes = async (): Promise<{ cart_id?: string; tax?: number; currency?: string }> =>
  apiFetch('/v1/cart/taxes');

export const createCartRoute = async (payload: { cart_id: string; points: RoutePoint[] }): Promise<CartRoute> =>
  apiFetch('/v1/cart/route', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCartRoute = async (id: string): Promise<CartRoute> =>
  apiFetch(`/v1/cart/route/${id}`);

export const createCartAlert = async (payload: { cart_id: string; product_id: string; target_price: number }) =>
  apiFetch('/v1/cart/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCartAlerts = async (): Promise<CartAlert[]> =>
  unwrapList(await apiFetch('/v1/cart/alerts'));

export const notifyCartRecovery = async () =>
  apiFetch('/v1/cart/recovery/notify', { method: 'POST' });

export const getCartRecoveryStatus = async (): Promise<{ status?: string }> =>
  apiFetch('/v1/cart/recovery/status');

const buildIdempotencyKey = () => `idemp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const checkoutCart = async (payload?: { client_total?: number }) =>
  apiFetch('/v1/cart/checkout', {
    method: 'POST',
    headers: { 'Idempotency-Key': buildIdempotencyKey() },
    body: payload ? JSON.stringify(payload) : undefined,
  });

export const checkoutCartSplit = async (payload?: { client_total?: number }) =>
  apiFetch('/v1/cart/checkout/split', {
    method: 'POST',
    headers: { 'Idempotency-Key': buildIdempotencyKey() },
    body: payload ? JSON.stringify(payload) : undefined,
  });

export const getOrderStatus = async (id: string) =>
  apiFetch(`/v1/orders/${id}/status`);

export const scheduleOrderFollowup = async (id: string, payload: { follow_type?: string; due_at?: string }) =>
  apiFetch(`/v1/orders/${id}/followup`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitOrderRating = async (id: string, payload: { seller_id?: string; rating: number; comment?: string }) =>
  apiFetch(`/v1/orders/${id}/rating`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
