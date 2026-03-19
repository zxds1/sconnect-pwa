type WsAuthParams = {
  tenantId?: string;
  userId?: string;
  role?: string;
  token?: string;
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

const resolveBaseUrl = () => getStored('soko:api_base_url') ?? getEnv('VITE_API_BASE_URL') ?? '';

const resolveAuth = (): WsAuthParams => ({
  tenantId: getStored('soko:tenant_id') ?? getEnv('VITE_TENANT_ID') ?? 'tenant_001',
  userId: getStored('soko:user_id') ?? getEnv('VITE_USER_ID') ?? '',
  role: getStored('soko:role') ?? getEnv('VITE_ROLE') ?? '',
  token: getStored('soko:auth_token') ?? getEnv('VITE_AUTH_TOKEN') ?? ''
});

export const buildWsUrl = (path: string, params?: Record<string, string | number | boolean | undefined>) => {
  const base = resolveBaseUrl();
  let origin = base;
  if (!origin) {
    origin = typeof window !== 'undefined' ? window.location.origin : '';
  }
  if (origin.startsWith('http://')) {
    origin = origin.replace('http://', 'ws://');
  } else if (origin.startsWith('https://')) {
    origin = origin.replace('https://', 'wss://');
  } else if (origin && !origin.startsWith('ws')) {
    origin = `wss://${origin}`;
  }
  const auth = resolveAuth();
  const query = new URLSearchParams();
  if (auth.tenantId) query.set('tenant_id', auth.tenantId);
  if (auth.userId) query.set('user_id', auth.userId);
  if (auth.role) query.set('role', auth.role);
  if (auth.token) query.set('token', auth.token);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
  }
  const suffix = query.toString();
  return `${origin}${path}${suffix ? `?${suffix}` : ''}`;
};
