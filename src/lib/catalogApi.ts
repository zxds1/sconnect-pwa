import { apiFetch } from './apiClient';

export type ProductMedia = {
  id?: string;
  product_id?: string;
  url?: string;
  media_type?: string;
  status?: string;
  created_at?: string;
};

export type ProductReview = {
  id?: string;
  user_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
  replies?: Array<{ id?: string; seller_name?: string; comment?: string; created_at?: string }>;
};

export const getProduct = async (id: string): Promise<any> => apiFetch(`/v1/products/${id}`);

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listProductMedia = async (id: string): Promise<ProductMedia[]> =>
  unwrapList(await apiFetch(`/v1/products/${id}/media`));

export const listProductReviews = async (id: string): Promise<ProductReview[]> =>
  unwrapList(await apiFetch(`/v1/products/${id}/reviews`));

export const replyProductReview = async (reviewId: string, payload: { comment: string }) =>
  apiFetch(`/v1/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
