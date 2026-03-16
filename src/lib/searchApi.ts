import { apiFetch } from './apiClient';

export type SearchResult = {
  canonical_id: string;
  name?: string;
  seller_id?: string;
  price?: number;
  distance_km?: number;
  lat?: number;
  lng?: number;
  score?: number;
  components?: Record<string, number>;
};

export type SearchResponse = {
  query_id?: string;
  results?: SearchResult[];
  cached?: boolean;
};

export type SavedSearch = {
  id: string;
  query: string;
  query_hash?: string;
  created_at?: string;
  alert_enabled?: boolean;
};

export type RecentSearch = {
  id: string;
  query: string;
  created_at?: string;
};

export type WatchlistItem = {
  id: string;
  canonical_id: string;
  target_price: number;
  created_at?: string;
  updated_at?: string;
};

export type SearchAlert = {
  id: string;
  query_hash?: string;
  frequency?: string;
  status?: string;
  created_at?: string;
};

export type SearchJob = {
  job_id: string;
  status: string;
  type: string;
};

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

const withLocationConsent = (locationConsent?: boolean) =>
  locationConsent ? { headers: { 'X-Location-Consent': 'true' } } : {};

export const search = async (params: {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  locationConsent?: boolean;
}): Promise<SearchResponse> =>
  apiFetch(`/v1/search${buildQuery({
    q: params.q,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
  })}`, withLocationConsent(params.locationConsent));

export const searchSuggestions = async (q: string): Promise<string[]> =>
  unwrapList(await apiFetch(`/v1/search/suggestions${buildQuery({ q })}`));

export const searchTrending = async (): Promise<string[]> =>
  unwrapList(await apiFetch('/v1/search/trending'));

export const searchRecommendations = async (): Promise<SearchResult[]> =>
  unwrapList(await apiFetch('/v1/search/recommendations'));

export const searchMap = async (params: {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  locationConsent?: boolean;
}): Promise<SearchResult[]> =>
  unwrapList(await apiFetch(`/v1/search/map${buildQuery({
    q: params.q,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
  })}`, withLocationConsent(params.locationConsent)));

export const searchNearby = async (payload: {
  query?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  filters?: Record<string, any>;
  locationConsent?: boolean;
}): Promise<SearchResponse> =>
  apiFetch('/v1/search/nearby', {
    method: 'POST',
    body: JSON.stringify({
      query: payload.query,
      lat: payload.lat,
      lng: payload.lng,
      radius_km: payload.radius_km,
      filters: payload.filters,
    }),
    ...withLocationConsent(payload.locationConsent),
  });

export const queueVoiceSearch = async (): Promise<SearchJob> =>
  apiFetch('/v1/search/voice', { method: 'POST' });

export const queuePhotoSearch = async (): Promise<SearchJob> =>
  apiFetch('/v1/search/photo', { method: 'POST' });

export const queueVideoSearch = async (): Promise<SearchJob> =>
  apiFetch('/v1/search/video', { method: 'POST' });

export const queueOCRSearch = async (): Promise<SearchJob> =>
  apiFetch('/v1/search/ocr', { method: 'POST' });

export const queueHybridSearch = async (): Promise<SearchJob> =>
  apiFetch('/v1/search/hybrid', { method: 'POST' });

export const listSavedSearches = async (): Promise<SavedSearch[]> =>
  unwrapList(await apiFetch('/v1/search/saved'));

export const saveSearch = async (query: string): Promise<SavedSearch> =>
  apiFetch('/v1/search/saved', { method: 'POST', body: JSON.stringify({ query }) });

export const deleteSavedSearch = async (id: string): Promise<void> => {
  await apiFetch(`/v1/search/saved/${id}`, { method: 'DELETE' });
};

export const listRecentSearches = async (): Promise<RecentSearch[]> =>
  unwrapList(await apiFetch('/v1/search/recent'));

export const clearRecentSearches = async (): Promise<void> => {
  await apiFetch('/v1/search/recent/clear', { method: 'POST' });
};

export const listWatchlist = async (): Promise<WatchlistItem[]> =>
  unwrapList(await apiFetch('/v1/search/watchlist'));

export const addWatchlistItem = async (payload: { canonical_id: string; target_price: number }): Promise<WatchlistItem> =>
  apiFetch('/v1/search/watchlist', { method: 'POST', body: JSON.stringify(payload) });

export const updateWatchlistItem = async (id: string, payload: { target_price: number }): Promise<WatchlistItem> =>
  apiFetch(`/v1/search/watchlist/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteWatchlistItem = async (id: string): Promise<void> => {
  await apiFetch(`/v1/search/watchlist/${id}`, { method: 'DELETE' });
};

export const listSearchAlerts = async (): Promise<SearchAlert[]> =>
  unwrapList(await apiFetch('/v1/search/alerts'));

export const createSearchAlert = async (payload: { query_hash: string; frequency: string }): Promise<SearchAlert> =>
  apiFetch('/v1/search/alerts', { method: 'POST', body: JSON.stringify(payload) });

export const updateSearchAlert = async (id: string, payload: { status: string }): Promise<void> => {
  await apiFetch(`/v1/search/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
};

export const deleteSearchAlert = async (id: string): Promise<void> => {
  await apiFetch(`/v1/search/alerts/${id}`, { method: 'DELETE' });
};

export const recordSearchEvent = async (payload: {
  query_id: string;
  event_type: string;
  canonical_id?: string;
  metadata?: Record<string, any>;
}): Promise<void> => {
  await apiFetch('/v1/search/events', { method: 'POST', body: JSON.stringify(payload) });
};

export const submitSearchFeedback = async (payload: {
  query_id: string;
  feedback: string;
  canonical_id?: string;
}): Promise<void> => {
  await apiFetch('/v1/search/feedback', { method: 'POST', body: JSON.stringify(payload) });
};

export const getSearchMetrics = async (): Promise<Record<string, any>> =>
  apiFetch('/v1/search/metrics');

export const explainSearch = async (queryId: string): Promise<Record<string, any>> =>
  apiFetch(`/v1/search/${queryId}/explain`);
