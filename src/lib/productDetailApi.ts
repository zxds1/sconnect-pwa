import { apiFetch } from './apiClient';

export type ProductDetail = Record<string, any>;
export type ProductMedia = Record<string, any>;
export type PriceHistoryPoint = { date?: string; price?: number; timestamp?: string };
export type PriceBenchmark = Record<string, any>;
export type GoodDeal = Record<string, any>;
export type ProductReview = Record<string, any>;
export type ProductQuestion = Record<string, any>;

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
};

const buildQuery = (params: Record<string, string | number | boolean | undefined>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '' && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export const getProductDetail = async (id: string): Promise<ProductDetail> =>
  apiFetch(`/v1/products/${id}`);

export const getProductMedia = async (id: string): Promise<ProductMedia[]> =>
  unwrapList(await apiFetch(`/v1/products/${id}/media`));

export const getProductPriceHistory = async (id: string): Promise<PriceHistoryPoint[]> =>
  unwrapList(await apiFetch(`/v1/products/${id}/price-history`));

export const getProductBenchmark = async (id: string, params?: { neighborhood?: string; category_id?: string }): Promise<PriceBenchmark> =>
  apiFetch(`/v1/products/${id}/benchmark${buildQuery(params || {})}`);

export const getProductGoodDeal = async (id: string, params?: { seller_product_id?: string }): Promise<GoodDeal> =>
  apiFetch(`/v1/products/${id}/good-deal${buildQuery(params || {})}`);

export const listProductReviews = async (id: string): Promise<ProductReview[]> =>
  unwrapList(await apiFetch(`/v1/products/${id}/reviews`));

export const createProductReview = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/products/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const replyProductReview = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/reviews/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listProductQuestions = async (id: string): Promise<ProductQuestion[]> =>
  unwrapList(await apiFetch(`/v1/products/${id}/questions`));

export const createProductQuestion = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/products/${id}/questions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const answerProductQuestion = async (id: string, payload: { comment: string }) =>
  apiFetch(`/v1/questions/${id}/answers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const watchProduct = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/products/${id}/watch`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateWatch = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/products/${id}/watch`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const unwatchProduct = async (id: string) =>
  apiFetch(`/v1/products/${id}/watch`, { method: 'DELETE' });

export const shareProduct = async (id: string, payload: Record<string, any>) =>
  apiFetch(`/v1/products/${id}/share`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
