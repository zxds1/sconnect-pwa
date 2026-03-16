import { apiFetch } from './apiClient';

export type ShopReview = {
  id?: string;
  user_name?: string;
  rating?: number;
  comment?: string;
  product_name?: string;
  created_at?: string;
  replies?: Array<{ id?: string; seller_name?: string; comment?: string; created_at?: string }>;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listShopReviews = async (sellerId: string): Promise<ShopReview[]> =>
  unwrapList(await apiFetch(`/v1/shop/${sellerId}/reviews`));

export const replyShopReview = async (sellerId: string, reviewId: string, payload: { comment: string }) =>
  apiFetch(`/v1/shop/${sellerId}/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
