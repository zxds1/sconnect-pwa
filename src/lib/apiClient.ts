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

const getBaseUrl = () => getEnv('VITE_API_BASE_URL') ?? '';
const getTenantId = () => getStored('soko:tenant_id') ?? getEnv('VITE_TENANT_ID') ?? '';
const getUserId = () => getStored('soko:user_id') ?? getEnv('VITE_USER_ID') ?? '';
const getAuthToken = () => getStored('soko:auth_token') ?? getEnv('VITE_AUTH_TOKEN') ?? '';
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
  const correlationId = getCorrelationId();

  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (userId) headers['X-User-Id'] = userId;
  if (correlationId) headers['X-Correlation-Id'] = correlationId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return {
    ...headers,
    ...(extra ?? {}),
  } as HeadersInit;
};

const parseError = async (res: Response): Promise<ApiError> => {
  const error: ApiError = { status: res.status };
  try {
    const body = await res.json();
    if (body?.error) {
      error.code = body.error.code;
      error.message = body.error.message;
    }
  } catch {}
  if (!error.message) {
    error.message = res.statusText || 'Request failed';
  }
  return error;
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('Missing VITE_API_BASE_URL');
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
};

export const apiFetchRaw = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('Missing VITE_API_BASE_URL');
  }
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });
};
