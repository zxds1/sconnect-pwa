import { apiFetch } from './apiClient';

export type FeedList = { items?: any[]; next_cursor?: string };

export const getFeed = async (params: { cursor?: string; limit?: number; neighborhood?: string } = {}): Promise<FeedList> => {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.neighborhood) query.set('neighborhood', params.neighborhood);
  const suffix = query.toString() ? `?${query}` : '';
  return apiFetch(`/v1/feed${suffix}`);
};

export const getFeedNext = async (params: { cursor?: string; limit?: number; neighborhood?: string } = {}): Promise<FeedList> => {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.neighborhood) query.set('neighborhood', params.neighborhood);
  const suffix = query.toString() ? `?${query}` : '';
  return apiFetch(`/v1/feed/next${suffix}`);
};

export const getTrendingFeed = async (params: { category?: string; cursor?: string; limit?: number; neighborhood?: string } = {}): Promise<FeedList> => {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.neighborhood) query.set('neighborhood', params.neighborhood);
  const suffix = query.toString() ? `?${query}` : '';
  return apiFetch(`/v1/feed/trending${suffix}`);
};

export const getFollowingFeed = async (params: { cursor?: string; limit?: number } = {}): Promise<FeedList> => {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query}` : '';
  return apiFetch(`/v1/feed/following${suffix}`);
};

export const getFollowedSellers = async (): Promise<string[]> => {
  const data = await apiFetch('/v1/following/sellers');
  const items = Array.isArray(data) ? data : (data?.items && Array.isArray(data.items) ? data.items : []);
  return items.map((item: any) => (typeof item === 'string' ? item : item?.id || item?.seller_id)).filter(Boolean);
};

export const likeFeedItem = async (payload: { target_id?: string; post_id?: string }) =>
  apiFetch('/v1/feed/like', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const unlikeFeedItem = async (productId: string) =>
  apiFetch(`/v1/feed/like/${productId}`, {
    method: 'DELETE',
  });

export const saveFeedItem = async (payload: { target_id?: string; post_id?: string }) =>
  apiFetch('/v1/feed/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const unsaveFeedItem = async (productId: string) =>
  apiFetch(`/v1/feed/save/${productId}`, {
    method: 'DELETE',
  });

export const shareFeedItem = async (payload: { target_type: string; target_id: string; channel?: string }) =>
  apiFetch('/v1/feed/share', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const reportFeedItem = async (payload: { target_type: string; target_id: string; report_type?: string; reason?: string }) =>
  apiFetch('/v1/feed/report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const followSeller = async (sellerId: string) =>
  apiFetch(`/v1/feed/follow/${sellerId}`, {
    method: 'POST',
  });

export const unfollowSeller = async (sellerId: string) =>
  apiFetch(`/v1/feed/follow/${sellerId}`, {
    method: 'DELETE',
  });

export const createPost = async (payload: { content: string; media_urls?: string[]; category_id?: string; neighborhood_id?: string; product_id?: string }) =>
  apiFetch('/v1/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listLiveSessions = async (params: { cursor?: string; limit?: number; status?: string } = {}): Promise<any[]> => {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  const suffix = query.toString() ? `?${query}` : '';
  const data = await apiFetch(`/v1/live${suffix}`);
  const items = Array.isArray(data) ? data : (data?.items && Array.isArray(data.items) ? data.items : []);
  return items.map((item: any) => item?.live || item);
};

export const joinLiveSession = async (id: string) =>
  apiFetch(`/v1/live/${id}/join`, { method: 'POST' });

export const leaveLiveSession = async (id: string) =>
  apiFetch(`/v1/live/${id}/leave`, { method: 'POST' });
