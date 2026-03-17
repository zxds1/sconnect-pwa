import { apiFetch } from './apiClient';

export type AnalyticsEvent = {
  name: string;
  action?: string;
  source?: string;
  version?: number;
  timestamp?: string;
  properties?: Record<string, any>;
};

const normalizeEvent = (event: AnalyticsEvent) => ({
  name: event.name,
  action: event.action ?? '',
  source: event.source ?? 'pwa',
  version: event.version ?? 1,
  timestamp: event.timestamp ?? new Date().toISOString(),
  properties: event.properties ?? {},
});

export const postAnalyticsEvent = async (event: AnalyticsEvent) => {
  const normalized = normalizeEvent(event);
  try {
    const correlationId = localStorage.getItem('soko:correlation_id');
    if (correlationId) {
      normalized.properties = {
        ...normalized.properties,
        correlation_id: correlationId,
      };
    }
    const sessionId = localStorage.getItem('soko:session_id');
    if (sessionId) {
      normalized.properties = {
        ...normalized.properties,
        session_id: sessionId,
      };
    }
  } catch {}
  return apiFetch('/v1/audit/events', {
    method: 'POST',
    body: JSON.stringify({
      event_type: normalized.name,
      event_time: normalized.timestamp,
      payload: normalized,
    }),
  });
};
