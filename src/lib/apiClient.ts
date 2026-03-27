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

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const isDevRuntime = () => {
  try {
    return Boolean((import.meta as any).env?.DEV);
  } catch {
    return false;
  }
};

const isLocalHost = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1';

const resolveRuntimeBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
};

const normalizeBaseUrl = (value: string) => {
  const raw = trimTrailingSlash(value || '');
  if (!raw) return isDevRuntime() ? '' : resolveRuntimeBaseUrl();
  if (typeof window === 'undefined') return raw;

  if (raw.startsWith('/')) {
    return trimTrailingSlash(`${window.location.origin}${raw}`);
  }

  try {
    const parsed = new URL(raw);
    const browserHost = window.location.hostname;
    // In local dev we prefer relative /v1 requests so Vite proxy handles backend routing.
    if (isDevRuntime() && isLocalHost(parsed.hostname)) {
      return '';
    }
    if (isLocalHost(parsed.hostname) && !isLocalHost(browserHost)) {
      return isDevRuntime() ? '' : `${parsed.protocol}//${browserHost}:${parsed.port || '8000'}`;
    }
    return trimTrailingSlash(parsed.toString());
  } catch {
    return raw;
  }
};

const getBaseUrl = () => {
  if (isDevRuntime()) return '';
  const configured = getStored('soko:api_base_url') ?? getEnv('VITE_API_BASE_URL') ?? '';
  return normalizeBaseUrl(configured);
};
const getGuestTenantId = () => getEnv('VITE_GUEST_TENANT_ID') ?? getEnv('VITE_TENANT_ID') ?? '';
const getTenantId = (opts?: { token?: string; visitorId?: string }) => {
  const explicit = getAuthItem('soko:tenant_id') ?? getEnv('VITE_TENANT_ID');
  if (explicit) return explicit;
  const token = opts?.token ?? getAuthToken();
  if (token) return undefined;
  const visitorId = opts?.visitorId ?? getVisitorId();
  if (visitorId) return getGuestTenantId();
  return undefined;
};
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

const clearAuthSession = () => {
  const keys = [
    'soko:auth_token',
    'soko:refresh_token',
    'soko:user_id',
    'soko:role',
    'soko:session_id',
  ];
  for (const key of keys) {
    setAuthItem(key, '');
  }
};

const isAuthBootstrapPath = (path: string) => {
  const pathOnly = path.split('?')[0];
  return /^\/v1\/auth\/(?:login|register|password\/reset\/request|password\/reset\/confirm)(?:\/|$)/.test(pathOnly);
};

const buildHeaders = (extra?: HeadersInit, opts?: { suppressUserContext?: boolean }): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const userId = getUserId();
  const token = getAuthToken();
  const role = getRole();
  const correlationId = getCorrelationId();
  const visitorId = !token && !opts?.suppressUserContext ? getVisitorId() : undefined;
  const tenantId = getTenantId({ token, visitorId });

  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (!opts?.suppressUserContext && userId) headers['X-User-Id'] = userId;
  if (visitorId) headers['X-Visitor-Id'] = visitorId;
  if (correlationId) headers['X-Correlation-Id'] = correlationId;
  if (!opts?.suppressUserContext && token) headers['Authorization'] = `Bearer ${token}`;
  if (!opts?.suppressUserContext && role) headers['X-Role'] = role;
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
      const message = typeof body.error.message === 'string' ? body.error.message.trim() : '';
      if (message && message !== 'Request failed.' && message !== 'Something went wrong.') {
        error.message = message;
      }
    }
  } catch {}
  if (error.message) {
    return error;
  }
  if (res.status >= 500) {
    error.message = 'Service temporarily unavailable.';
  } else {
    error.message = 'Request failed. Please try again.';
  }
  return error;
};

const maybeHandleExpiredSession = (requestHeaders: HeadersInit, res: Response, errorCode?: string) => {
  const authHeader = getHeaderValue(requestHeaders, 'Authorization') ?? '';
  const hadBearerToken = /^Bearer\s+\S+/i.test(authHeader);
  const tokenFailureCode = String(errorCode || '').toLowerCase();
  const isTokenFailure =
    tokenFailureCode === 'invalid_token'
    || tokenFailureCode === 'token_expired'
    || tokenFailureCode === 'expired_token';

  if (!(res.status === 401 && hadBearerToken && isTokenFailure)) {
    return false;
  }

  clearAuthSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('soko:auth-required'));
  }
  return true;
};

export const apiFetch = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getBaseUrl();
  const suppressUserContext = isAuthBootstrapPath(path);
  const token = getAuthToken();
  const visitorId = !token && !suppressUserContext ? getVisitorId() : undefined;
  const tenantId = getTenantId({ token, visitorId });
  if (!tenantId && !suppressUserContext) {
    throw new Error('Username is required. Please enter your username.');
  }

  const method = (options.method || 'GET').toUpperCase();
  const requestHeaders = buildHeaders(options.headers, { suppressUserContext });
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
    const error = await parseError(res);
    if (maybeHandleExpiredSession(requestHeaders, res, error.code)) {
      error.message = 'Session expired. Please sign in again.';
    }
    throw error;
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
  const suppressUserContext = isAuthBootstrapPath(path);
  const token = getAuthToken();
  const visitorId = !token && !suppressUserContext ? getVisitorId() : undefined;
  const tenantId = getTenantId({ token, visitorId });
  if (!tenantId && !suppressUserContext) {
    throw new Error('Username is required. Please enter your username.');
  }
  const requestHeaders = buildHeaders(options.headers, { suppressUserContext });
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: requestHeaders,
  });
  if (!res.ok) {
    try {
      const parsed = await parseError(res.clone());
      if (maybeHandleExpiredSession(requestHeaders, res, parsed.code)) {
        // Let callers keep reading the original response while the app session is reset.
      }
    } catch {}
  }
  return res;
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
