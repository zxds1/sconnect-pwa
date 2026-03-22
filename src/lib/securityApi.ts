import { apiFetch } from './apiClient';
import { getAuthItem } from './authStorage';

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
    return getAuthItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const getTenantId = () => getStored('soko:tenant_id') ?? getEnv('VITE_TENANT_ID') ?? '';

export const createAuditEvent = async (payload: Record<string, any>) => {
  const tenantId = payload.tenant_id || getTenantId();
  const eventType = payload.event_type || payload.action || 'event';
  const eventTime = payload.event_time || new Date().toISOString();
  const composedPayload = payload.payload || (
    payload.entity_type || payload.entity_id
      ? { entity_type: payload.entity_type, entity_id: payload.entity_id }
      : undefined
  );

  return apiFetch('/v1/audit/events', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      tenant_id: tenantId,
      event_type: eventType,
      event_time: eventTime,
      payload: composedPayload,
    }),
  });
};
