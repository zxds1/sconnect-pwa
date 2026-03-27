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
  intent?: string;
  results?: SearchResult[];
  matches?: SearchDocumentMatch[];
  cached?: boolean;
};

export type SearchDocumentMatch = {
  entity_type: string;
  entity_id: string;
  title?: string;
  body?: string;
  image_url?: string;
  score?: number;
  distance?: number;
  payload?: Record<string, any>;
};

export type IntelligenceSeller = {
  seller_id: string;
  seller_name: string;
  logo_url?: string;
  category_ids?: string[];
  address?: string;
  lat?: number;
  lng?: number;
  distance_km?: number;
  verified?: boolean;
  rank_score?: number;
  average_rating?: number;
  products_synced?: number;
};

export type IntelligenceGroupBuy = {
  id: string;
  seller_id: string;
  seller_name: string;
  product_id: string;
  product_name: string;
  target_quantity: number;
  current_size: number;
  status: string;
  expiry_at?: string;
  created_at: string;
};

export type IntelligencePath = {
  path_id: string;
  route_wkt?: string;
  usage_count?: number;
  last_used_at?: string;
};

export type IntelligenceResponse = {
  query_id?: string;
  cached?: boolean;
  query?: string;
  products?: SearchResult[];
  sellers?: IntelligenceSeller[];
  group_buys?: IntelligenceGroupBuy[];
  paths?: IntelligencePath[];
  trending?: string[];
  recommendations?: SearchResult[];
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

export type SearchMediaJob = {
  id: string;
  status: string;
  job_type?: string;
  source_query?: string;
  intent?: string;
  media_key?: string;
  media_url?: string;
  query_id?: string;
  transcript?: string;
  ocr_text?: string;
  result?: SearchResponse;
  error_text?: string;
  attempts?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type MediaSearchRequest = {
  query?: string;
  transcript?: string;
  language?: string;
  media_key?: string;
  media_url?: string;
  image_data?: string;
  mime_type?: string;
  duration_sec?: number;
};

export type PathPoint = {
  lat: number;
  lng: number;
  recorded_at?: string;
};

export type RecordedPath = {
  id: string;
  name?: string;
  seller_id?: string | null;
  shared?: boolean;
  verified?: boolean;
  usage_count?: number;
  distance_meters?: number;
  duration_seconds?: number;
  speed_avg_kmh?: number;
  recorded_at?: string;
  line_geojson?: any;
  is_primary?: boolean;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  start_label?: string;
  end_label?: string;
};

export type PathLandmark = {
  id?: string;
  path_id?: string;
  label: string;
  type?: string;
  image_url: string;
  lat?: number | null;
  lng?: number | null;
  sequence?: number | null;
  created_at?: string;
};

export type PathWaypoint = {
  index: number;
  lat: number;
  lng: number;
  distance_from_start_meters?: number;
};

export type NavigationResponse = {
  path_id?: string;
  source?: string;
  waypoints?: PathWaypoint[];
  internal_waypoints?: PathWaypoint[];
  routes?: any[];
};

export type Region = {
  id: string;
  type: string;
  name: string;
  parent_id?: string;
  centroid_lat?: number;
  centroid_lng?: number;
  metadata?: Record<string, any>;
};

export type Place = {
  id: string;
  type: string;
  name: string;
  region_id?: string;
  address_line?: string;
  lat?: number;
  lng?: number;
  metadata?: Record<string, any>;
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

export const getIntelligence = async (params: {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  status?: string;
  limit?: number;
  locationConsent?: boolean;
} = {}): Promise<IntelligenceResponse> =>
  apiFetch(`/v1/intelligence${buildQuery({
    q: params.q,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    category: params.category,
    status: params.status,
    limit: params.limit,
  })}`, withLocationConsent(params.locationConsent));

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

export const listRegions = async (): Promise<Region[]> =>
  unwrapList(await apiFetch('/v1/locations/regions'));

export const listPlaces = async (): Promise<Place[]> =>
  unwrapList(await apiFetch('/v1/locations/places'));

export const createRegion = async (payload: Region): Promise<Region> =>
  apiFetch('/v1/locations/regions', { method: 'POST', body: JSON.stringify(payload) });

export const createPlace = async (payload: Place): Promise<Place> =>
  apiFetch('/v1/locations/places', { method: 'POST', body: JSON.stringify(payload) });

export const updateRegion = async (id: string, payload: Region): Promise<Region> =>
  apiFetch(`/v1/locations/regions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteRegion = async (id: string): Promise<void> => {
  await apiFetch(`/v1/locations/regions/${id}`, { method: 'DELETE' });
};

export const updatePlace = async (id: string, payload: Place): Promise<Place> =>
  apiFetch(`/v1/locations/places/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deletePlace = async (id: string): Promise<void> => {
  await apiFetch(`/v1/locations/places/${id}`, { method: 'DELETE' });
};

export type UserLocation = {
  id: string;
  user_id?: string;
  label: string;
  address_line?: string;
  region_id?: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const listUserLocations = async (): Promise<UserLocation[]> =>
  unwrapList(await apiFetch('/v1/locations/user'));

export const createUserLocation = async (payload: UserLocation): Promise<UserLocation> =>
  apiFetch('/v1/locations/user', { method: 'POST', body: JSON.stringify(payload) });

export const updateUserLocation = async (id: string, payload: UserLocation): Promise<UserLocation> =>
  apiFetch(`/v1/locations/user/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteUserLocation = async (id: string): Promise<void> => {
  await apiFetch(`/v1/locations/user/${id}`, { method: 'DELETE' });
};

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

export const queueVoiceSearch = async (payload?: MediaSearchRequest): Promise<SearchMediaJob> =>
  apiFetch('/v1/search/voice', { method: 'POST', body: JSON.stringify(payload || {}) });

export const queuePhotoSearch = async (payload?: MediaSearchRequest): Promise<SearchResponse> =>
  apiFetch('/v1/search/photo', { method: 'POST', body: JSON.stringify(payload || {}) });

export const queueVideoSearch = async (payload?: MediaSearchRequest): Promise<SearchMediaJob> =>
  apiFetch('/v1/search/video', { method: 'POST', body: JSON.stringify(payload || {}) });

export const queueOCRSearch = async (payload?: MediaSearchRequest): Promise<SearchMediaJob> =>
  apiFetch('/v1/search/ocr', { method: 'POST', body: JSON.stringify(payload || {}) });

export const queueHybridSearch = async (payload?: MediaSearchRequest): Promise<SearchResponse> =>
  apiFetch('/v1/search/hybrid', { method: 'POST', body: JSON.stringify(payload || {}) });

export const getSearchMediaJob = async (jobId: string): Promise<SearchMediaJob> =>
  apiFetch(`/v1/search/jobs/${jobId}`);

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

export const recordPath = async (payload: {
  name?: string;
  seller_id?: string | null;
  shared?: boolean;
  start_label?: string;
  end_label?: string;
  points: PathPoint[];
}): Promise<RecordedPath> =>
  apiFetch('/v1/paths/record', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listMyPaths = async (): Promise<RecordedPath[]> =>
  unwrapList(await apiFetch('/v1/paths'));

export const listPopularPaths = async (payload: {
  bbox: string;
  limit?: number;
}): Promise<RecordedPath[]> =>
  unwrapList(await apiFetch(`/v1/paths/popular${buildQuery({
    bbox: payload.bbox,
    limit: payload.limit
  })}`));

export const listSellerPaths = async (sellerId: string, includePrivate = false): Promise<RecordedPath[]> =>
  unwrapList(await apiFetch(`/v1/paths/seller/${sellerId}${buildQuery({ include_private: includePrivate })}`));

export const recordPathUse = async (pathId: string): Promise<void> => {
  await apiFetch(`/v1/paths/${pathId}/use`, { method: 'POST' });
};

export const verifyPath = async (pathId: string): Promise<{ verified?: boolean }> =>
  apiFetch(`/v1/paths/${pathId}/verify`, { method: 'POST' });

export const setPrimaryPath = async (pathId: string, primary: boolean): Promise<{ updated?: boolean }> =>
  apiFetch(`/v1/paths/${pathId}/primary`, { method: 'POST', body: JSON.stringify({ primary }) });

export const listPathLandmarks = async (pathId: string, includePrivate = false): Promise<PathLandmark[]> =>
  unwrapList(await apiFetch(`/v1/paths/${pathId}/landmarks${buildQuery({ include_private: includePrivate })}`));

export const addPathLandmark = async (pathId: string, payload: PathLandmark): Promise<PathLandmark> =>
  apiFetch(`/v1/paths/${pathId}/landmarks`, { method: 'POST', body: JSON.stringify(payload) });

export const precomputePathWaypoints = async (pathId: string, params?: { max_distance_m?: number; max_points?: number }) =>
  apiFetch(`/v1/paths/${pathId}/waypoints${buildQuery({
    max_distance_m: params?.max_distance_m,
    max_points: params?.max_points
  })}`, { method: 'POST' });

export const listPathWaypoints = async (pathId: string): Promise<PathWaypoint[]> =>
  unwrapList(await apiFetch(`/v1/paths/${pathId}/waypoints`));

export const deletePath = async (pathId: string): Promise<void> => {
  await apiFetch(`/v1/paths/${pathId}`, { method: 'DELETE' });
};

export const getCustomNavigation = async (payload: {
  path_id: string;
  from_lng?: number;
  from_lat?: number;
  to_lng?: number;
  to_lat?: number;
  profile?: string;
  max_distance_m?: number;
  max_points?: number;
}): Promise<NavigationResponse> => {
  const query = buildQuery({
    from: payload.from_lng !== undefined && payload.from_lat !== undefined ? `${payload.from_lng},${payload.from_lat}` : undefined,
    to: payload.to_lng !== undefined && payload.to_lat !== undefined ? `${payload.to_lng},${payload.to_lat}` : undefined,
    profile: payload.profile,
    max_distance_m: payload.max_distance_m,
    max_points: payload.max_points
  });
  return apiFetch(`/v1/navigation/custom/${payload.path_id}${query}`);
};

export const verifyNavigationPath = async (pathId: string): Promise<{ valid?: boolean }> =>
  apiFetch(`/v1/navigation/verify/${pathId}`, { method: 'POST' });

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
