import { postAnalyticsEvent } from './analyticsApi';

type RouteTelemetryPayload = {
  profile: string;
  city?: string;
  distance_km?: number;
  duration_min?: number;
  path_id?: string | null;
  seller_id?: string | null;
  product_id?: string | null;
  source?: string;
};

export const createRouteTelemetryTracker = (source: string) => {
  let lastKey = '';
  let lastAt = 0;
  return async (payload: RouteTelemetryPayload) => {
    const now = Date.now();
    const key = JSON.stringify(payload);
    if (key === lastKey && now - lastAt < 30000) {
      return;
    }
    lastKey = key;
    lastAt = now;
    try {
      await postAnalyticsEvent({
        name: 'route_eta_adjusted',
        action: 'estimate',
        source,
        properties: payload,
      });
    } catch {}
  };
};
