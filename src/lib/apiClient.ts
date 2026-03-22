import {
  buildApiCacheKey,
  getCachedJson,
  invalidateCachedJson,
  setCachedJson,
} from './apiCache';
import { getAuthItem, getVisitorId, setAuthItem } from './authStorage';

export type ApiError = {
  status: number;
  code?: string;
  message?: string;
};

const getEnv = (key: string) => {
  try {
    return (import.meta as any).env?.[key] as string | undefined;
  } catch {
    return undefined;
  }
};

const getStored = (key: string) => {
  if (typeof window === 'undefined') return undefined;
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const setStored = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {}
};

const getHeaderValue = (headers: HeadersInit | undefined, key: string) => {
  try {
    return new Headers(headers ?? {}).get(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const getBaseUrl = () => getStored('soko:api_base_url') ?? getEnv('VITE_API_BASE_URL') ?? '';
const getTenantId = () => getAuthItem('soko:tenant_id') ?? getEnv('VITE_TENANT_ID');
const getUserId = () => getAuthItem('soko:user_id') ?? getEnv('VITE_USER_ID') ?? '';
const getAuthToken = () => getAuthItem('soko:auth_token') ?? getEnv('VITE_AUTH_TOKEN') ?? '';
const getRole = () => getAuthItem('soko:role') ?? getEnv('VITE_ROLE') ?? '';
const getCorrelationId = () => {
  const stored = getStored('soko:correlation_id');
  if (stored) return stored;
  const candidate =
    (globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  setStored('soko:correlation_id', candidate);
  return candidate;
};

const buildHeaders = (extra?: HeadersInit): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const tenantId = getTenantId();
  const userId = getUserId();
  const token = getAuthToken();
  const role = getRole();
  const correlationId = getCorrelationId();
  const visitorId = !token ? getVisitorId() : undefined;

  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (userId) headers['X-User-Id'] = userId;
  if (visitorId) headers['X-Visitor-Id'] = visitorId;
  if (correlationId) headers['X-Correlation-Id'] = correlationId;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (role) headers['X-Role'] = role;
  return {
    ...headers,
    ...(extra ?? {}),
  } as HeadersInit;
};

type CachePolicy = {
  ttlMs: number;
  preferIndexedDb?: boolean;
};

const getCachePolicy = (path: string): CachePolicy | null => {
  const pathOnly = path.split('?')[0];
  const rules: Array<{ pattern: RegExp; policy: CachePolicy }> = [
    { pattern: /^\/v1\/intelligence(?:\/|$)/, policy: { ttlMs: 5_000, preferIndexedDb: true } },
    { pattern: /^\/v1\/search\/(?:suggestions|trending|recommendations|saved|recent|watchlist|alerts)(?:\/|$)/, policy: { ttlMs: 5 * 60_000 } },
    { pattern: /^\/v1\/search(?:\/|$)/, policy: { ttlMs: 5_000, preferIndexedDb: true } },
    { pattern: /^\/v1\/analytics\/(?:dashboard|funnel|inventory|buyers|market|anomalies)(?:\/|$)/, policy: { ttlMs: 15_000 } },
    { pattern: /^\/v1\/seller\/(?:growth|financial|channel-mix|market|customers|alerts|live-buyers|peak-hours|timeseries|sales|top-products)(?:\/|$)/, policy: { ttlMs: 15_000, preferIndexedDb: true } },
    { pattern: /^\/v1\/feed(?:\/|$)/, policy: { ttlMs: 5_000, preferIndexedDb: true } },
    { pattern: /^\/v1\/cart\/(?:summary|insights|taxes|recommendations|recovery\/status)/, policy: { ttlMs: 5_000 } },
    { pattern: /^\/v1\/profile\/insights(?:\/|$)/, policy: { ttlMs: 5_000 } },
    { pattern: /^\/v1\/seller\/(?:rank|metrics|marketing\/kpis|marketing\/demand-hotspots)/, policy: { ttlMs: 5_000 } },
    { pattern: /^\/v1\/groupbuy\/instances(?:\/|$)/, policy: { ttlMs: 5 * 60_000 } },
    { pattern: /^\/v1\/profile(?:\/|$)/, policy: { ttlMs: 2 * 60_000 } },
    { pattern: /^\/v1\/seller\/profile(?:\/|$)/, policy: { ttlMs: 2 * 60_000 } },
    { pattern: /^\/v1\/seller\/products(?:\/|$)/, policy: { ttlMs: 2 * 60_000 } },
    { pattern: /^\/v1\/notifications(?:\/|$)/, policy: { ttlMs: 2 * 60_000 } },
    { pattern: /^\/v1\/rewards\/(?:balance|streaks|ledger|receipts|fraud-alerts|referrals|stars\/summary|stars\/leaderboard)(?:\/|$)/, policy: { ttlMs: 2 * 60_000 } },
    { pattern: /^\/v1\/settings\/(?:comparison-preferences|ui-preferences|data-summary)(?:\/|$)/, policy: { ttlMs: 10 * 60_000 } },
    { pattern: /^\/v1\/ops\/configs(?:\/|$)/, policy: { ttlMs: 60 * 60_000 } },
    { pattern: /^\/v1\/paths(?:\/|$)/, policy: { ttlMs: 60 * 60_000, preferIndexedDb: true } },
    { pattern: /^\/v1\/navigation(?:\/|$)/, policy: { ttlMs: 60 * 60_000, preferIndexedDb: true } },
  ];
  const match = rules.find(({ pattern }) => pattern.test(pathOnly));
  return match?.policy ?? null;
};

const getInvalidationPrefixes = (path: string) => {
  const pathOnly = path.split('?')[0];
  if (/^\/v1\/search(?:\/|$)/.test(pathOnly) || /^\/v1\/paths(?:\/|$)/.test(pathOnly) || /^\/v1\/navigation(?:\/|$)/.test(pathOnly)) {
    return ['/v1/search', '/v1/intelligence', '/v1/paths', '/v1/navigation'];
  }
  if (/^\/v1\/analytics(?:\/|$)/.test(pathOnly)) {
    return ['/v1/analytics'];
  }
  if (/^\/v1\/seller(?:\/|$)/.test(pathOnly)) {
    return ['/v1/seller', '/v1/analytics'];
  }
  if (/^\/v1\/profile(?:\/|$)/.test(pathOnly)) {
    return ['/v1/profile'];
  }
  if (/^\/v1\/seller\/(?:profile|products|rank|metrics|marketing)(?:\/|$)/.test(pathOnly)) {
    return ['/v1/seller/profile', '/v1/seller/products', '/v1/seller/rank', '/v1/seller/metrics', '/v1/seller/marketing'];
  }
  if (/^\/v1\/cart(?:\/|$)/.test(pathOnly)) {
    return ['/v1/cart'];
  }
  if (/^\/v1\/groupbuy(?:\/|$)/.test(pathOnly)) {
    return ['/v1/groupbuy'];
  }
  if (/^\/v1\/feed(?:\/|$)/.test(pathOnly) || /^\/v1\/posts(?:\/|$)/.test(pathOnly) || /^\/v1\/live(?:\/|$)/.test(pathOnly)) {
    return ['/v1/feed', '/v1/posts', '/v1/live', '/v1/following'];
  }
  if (/^\/v1\/rewards(?:\/|$)/.test(pathOnly)) {
    return ['/v1/rewards'];
  }
  if (/^\/v1\/notifications(?:\/|$)/.test(pathOnly)) {
    return ['/v1/notifications'];
  }
  if (/^\/v1\/settings(?:\/|$)/.test(pathOnly)) {
    return ['/v1/settings'];
  }
  if (/^\/v1\/assistant(?:\/|$)/.test(pathOnly)) {
    return ['/v1/assistant'];
  }
  return [];
};

const parseError = async (res: Response): Promise<ApiError> => {
  const error: ApiError = { status: res.status };
  try {
    const body = await res.json();
    if (body?.error) {
      error.code = body.error.code;
    }
  } catch {}
  if (res.status >= 500) {
    error.message = 'Service temporarily unavailable.';
  } else {
    error.message = 'Request failed. Please try again.';
  }
  return error;
};

export const apiFetch = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('Service unavailable. Please try again later.');
  }
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new Error('Tenant ID is required. Please select your tenant.');
  }

  const method = (options.method || 'GET').toUpperCase();
  const requestHeaders = buildHeaders(options.headers);
  const cachePolicy = method === 'GET' ? getCachePolicy(path) : null;
  const locationConsent = getHeaderValue(requestHeaders, 'X-Location-Consent') ?? '';
  const cacheKey = buildApiCacheKey({
    method,
    path,
    tenantId,
    userId: getUserId(),
    role: getRole(),
    locationConsent,
  });

  if (cachePolicy) {
    const cached = await getCachedJson<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: requestHeaders,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json()) as T;
  if (cachePolicy) {
    await setCachedJson(cacheKey, data, cachePolicy.ttlMs, cachePolicy.preferIndexedDb ?? false);
  }

  if (method !== 'GET') {
    const prefixes = getInvalidationPrefixes(path);
    if (prefixes.length > 0) {
      await invalidateCachedJson(prefixes);
    }
  }

  return data;
};

export const apiFetchRaw = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('Service unavailable. Please try again later.');
  }
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new Error('Tenant ID is required. Please select your tenant.');
  }
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });
};

export const getApiBaseUrl = () => getBaseUrl();

export const setApiBaseUrl = (url: string) => {
  if (typeof window === 'undefined') return;
  try {
    if (url) {
      localStorage.setItem('soko:api_base_url', url);
    } else {
      localStorage.removeItem('soko:api_base_url');
    }
  } catch {}
};

export const setAuthContext = (payload: {
  authToken?: string;
  tenantId?: string;
  userId?: string;
  role?: string;
  sessionId?: string;
}) => {
  if (payload.authToken !== undefined) {
    if (payload.authToken) {
      setAuthItem('soko:auth_token', payload.authToken);
    } else {
      setAuthItem('soko:auth_token', '');
    }
  }
  if (payload.tenantId !== undefined) {
    if (payload.tenantId) {
      setAuthItem('soko:tenant_id', payload.tenantId);
    } else {
      setAuthItem('soko:tenant_id', '');
    }
  }
  if (payload.userId !== undefined) {
    if (payload.userId) {
      setAuthItem('soko:user_id', payload.userId);
    } else {
      setAuthItem('soko:user_id', '');
    }
  }
  if (payload.role !== undefined) {
    if (payload.role) {
      setAuthItem('soko:role', payload.role);
    } else {
      setAuthItem('soko:role', '');
    }
  }
  if (payload.sessionId !== undefined) {
    if (payload.sessionId) {
      setAuthItem('soko:session_id', payload.sessionId);
    } else {
      setAuthItem('soko:session_id', '');
    }
  }
};
