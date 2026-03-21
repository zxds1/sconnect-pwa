import { apiFetch } from './apiClient';

export type RouteProfile = 'driving' | 'walking' | 'cycling' | 'motorbike' | 'scooter' | 'tuktuk';

export type RouteMultipliersConfig = {
  profile: Record<string, number>;
  city: Record<string, Record<string, number>>;
  roadClass: Record<string, number>;
};

const DEFAULT_CONFIG: RouteMultipliersConfig = {
  profile: {
    driving: 1,
    walking: 1,
    cycling: 1,
    motorbike: 0.85,
    scooter: 0.95,
    tuktuk: 1.15,
  },
  city: {
    mombasa: { motorbike: 0.82, scooter: 0.92, tuktuk: 1.08, driving: 1, cycling: 1.02, walking: 1 },
    nairobi: { motorbike: 0.9, scooter: 1, tuktuk: 1.2, driving: 1.05, cycling: 1.08, walking: 1.03 },
    kisumu: { motorbike: 0.88, scooter: 0.98, tuktuk: 1.12, driving: 1, cycling: 1.03, walking: 1 },
    nakuru: { motorbike: 0.87, scooter: 0.97, tuktuk: 1.13, driving: 1.02, cycling: 1.04, walking: 1.01 },
    default: { motorbike: 0.85, scooter: 0.95, tuktuk: 1.15, driving: 1, cycling: 1, walking: 1 },
  },
  roadClass: {
    motorway: 0.95,
    trunk: 0.98,
    primary: 1,
    secondary: 1.03,
    tertiary: 1.06,
    service: 1.12,
    residential: 1.08,
    track: 1.2,
  },
};

const OPS_CONFIG_KEY = 'route_multipliers';

export const getDefaultRouteMultipliers = () => DEFAULT_CONFIG;

const mergeConfig = (base: RouteMultipliersConfig, override?: RouteMultipliersConfig) => ({
  ...base,
  ...(override ?? {}),
  profile: { ...base.profile, ...(override?.profile ?? {}) },
  city: { ...base.city, ...(override?.city ?? {}) },
  roadClass: { ...base.roadClass, ...(override?.roadClass ?? {}) },
});

export const loadRouteMultipliers = async (): Promise<RouteMultipliersConfig> => {
  try {
    const configResp = await apiFetch<{ config_key?: string; value?: RouteMultipliersConfig }>(`/v1/ops/configs/${OPS_CONFIG_KEY}`);
    if (configResp?.value) {
      return mergeConfig(DEFAULT_CONFIG, configResp.value);
    }
  } catch {}
  return DEFAULT_CONFIG;
};

export const detectCityKey = (address?: string) => {
  const value = (address || '').toLowerCase();
  if (!value) return 'default';
  if (value.includes('mombasa')) return 'mombasa';
  if (value.includes('nairobi')) return 'nairobi';
  if (value.includes('kisumu')) return 'kisumu';
  if (value.includes('nakuru')) return 'nakuru';
  return 'default';
};

export const getProfileMultiplier = (config: RouteMultipliersConfig, profile: RouteProfile) =>
  config.profile?.[profile] ?? 1;

export const getCityMultiplier = (config: RouteMultipliersConfig, city: string, profile: RouteProfile) =>
  config.city?.[city]?.[profile] ?? config.city?.default?.[profile] ?? 1;

export const getRoadClassMultiplier = (config: RouteMultipliersConfig, classes: string[]) => {
  const set = new Set(classes.map((value) => value.toLowerCase()));
  for (const entry of Object.entries(config.roadClass || {})) {
    if (set.has(entry[0])) {
      return entry[1] ?? 1;
    }
  }
  return 1;
};

export const getStepRoadMultiplier = (config: RouteMultipliersConfig, step: any) => {
  const intersections = Array.isArray(step?.intersections) ? step.intersections : [];
  const classes: string[] = [];
  intersections.forEach((intersection: any) => {
    if (Array.isArray(intersection?.classes)) {
      intersection.classes.forEach((item: string) => classes.push(item));
    }
  });
  return classes.length ? getRoadClassMultiplier(config, classes) : 1;
};
