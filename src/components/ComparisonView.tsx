import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft, ShoppingBag, Star, BarChart3, MapPin, Map as MapIcon, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';
import { Product } from '../types';
import { addCartItem } from '../lib/cartApi';
import { listPopularPaths, listUserLocations, recordPath, type PathPoint, type UserLocation } from '../lib/searchApi';
import { createRouteTelemetryTracker } from '../lib/routeTelemetry';
import {
  detectCityKey,
  getCityMultiplier,
  getDefaultRouteMultipliers,
  getProfileMultiplier,
  getStepRoadMultiplier,
  loadRouteMultipliers,
  type RouteMultipliersConfig
} from '../lib/routeMultipliers';
import {
  CompareMapItem,
  CompareOffer,
  CompareProduct,
  CompareListItem,
  getCompareAnalysis,
  getCompareList,
  getCompareMap,
  getCompareHistory,
  CompareHistoryItem,
  removeCompareItem
} from '../lib/compareApi';
import { getComparisonPreferences, updateComparisonPreferences, getUiPreferences, updateUiPreferences } from '../lib/settingsApi';

type CompareProductView = {
  id: string;
  name?: string;
  brand?: string;
  categoryId?: string;
  imageUrl?: string;
  bestOffer?: CompareOffer | null;
  offers: CompareOffer[];
  mapItems: CompareMapItem[];
  fallbackName?: string;
  fallbackImageUrl?: string;
};

interface ComparisonViewProps {
  onClose: () => void;
  onProductOpen: (product: Product) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onClose, onProductOpen }) => {
  const [activeMapProduct, setActiveMapProduct] = useState<CompareProductView | null>(null);
  const [products, setProducts] = useState<CompareProductView[]>([]);
  const [compareTabs, setCompareTabs] = useState<string[]>([
    'Best Value',
    'Fastest Pickup',
    'Trusted Sellers',
    'Nearby',
    'Best Warranty'
  ]);
  const [activeCompareTab, setActiveCompareTab] = useState('Best Value');
  const [comparisonThresholds, setComparisonThresholds] = useState({
    best_value: 85,
    fastest_pickup: 30,
    trusted_seller: 80,
    nearby: 3
  });
  const [comparisonWeights, setComparisonWeights] = useState({
    price: 30,
    convenience: 25,
    trust: 20,
    quality: 15,
    ownership: 10
  });
  const [comparisonProfile, setComparisonProfile] = useState('default');
  const [mapLoadingProductId, setMapLoadingProductId] = useState<string | null>(null);
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'add' | 'remove' | 'view'>('all');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareRouteInfo, setCompareRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [compareRouteSteps, setCompareRouteSteps] = useState<Array<{ instruction: string; distance: number; duration: number }>>([]);
  const [compareUserCoords, setCompareUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [compareMapReady, setCompareMapReady] = useState(false);
  const [compareRouteProfile, setCompareRouteProfile] = useState<'driving' | 'walking' | 'cycling' | 'motorbike' | 'scooter' | 'tuktuk'>('driving');
  const [locationSourceLabel, setLocationSourceLabel] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [routeConfig, setRouteConfig] = useState<RouteMultipliersConfig>(() => getDefaultRouteMultipliers());
  const routeTelemetry = useMemo(() => createRouteTelemetryTracker('comparison_map'), []);

  useEffect(() => {
    let active = true;
    loadRouteMultipliers().then((config) => {
      if (active) setRouteConfig(config);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadPrefs = async () => {
      try {
        const prefs = await getComparisonPreferences();
        if (!alive) return;
        if (prefs?.deal_thresholds) {
          setComparisonThresholds({
            best_value: Number(prefs.deal_thresholds.best_value ?? 85),
            fastest_pickup: Number(prefs.deal_thresholds.fastest_pickup ?? 30),
            trusted_seller: Number(prefs.deal_thresholds.trusted_seller ?? 80),
            nearby: Number(prefs.deal_thresholds.nearby ?? 3)
          });
        }
        if (prefs?.comparison_weights) {
          setComparisonWeights({
            price: Number(prefs.comparison_weights.price ?? 30),
            convenience: Number(prefs.comparison_weights.convenience ?? 25),
            trust: Number(prefs.comparison_weights.trust ?? 20),
            quality: Number(prefs.comparison_weights.quality ?? 15),
            ownership: Number(prefs.comparison_weights.ownership ?? 10)
          });
        }
        if (prefs?.comparison_profile) {
          setComparisonProfile(prefs.comparison_profile);
        }
      } catch {}
    };
    loadPrefs();
    return () => {
      alive = false;
    };
  }, []);

  const toMapboxProfile = (profile: typeof compareRouteProfile) => {
    if (profile === 'walking' || profile === 'cycling') return profile;
    return 'driving-traffic';
  };
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingPoints, setRecordingPoints] = useState<PathPoint[]>([]);
  const [recordingDistance, setRecordingDistance] = useState(0);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [recordingShared, setRecordingShared] = useState(true);
  const [recordingStatus, setRecordingStatus] = useState<string | null>(null);
  const [voiceDirectionsEnabled, setVoiceDirectionsEnabled] = useState(false);
  const compareMapContainerRef = useRef<HTMLDivElement | null>(null);
  const compareMapRef = useRef<any>(null);
  const compareUserMarkerRef = useRef<any>(null);
  const compareSellerMarkerRef = useRef<any>(null);
  const mapboxModuleRef = useRef<any>(null);
  const mapboxLoadingRef = useRef<Promise<any> | null>(null);
  const compareRouteManeuversRef = useRef<Array<{ instruction: string; location: [number, number] }>>([]);
  const compareRouteStepIndexRef = useRef(0);
  const recordingWatchIdRef = useRef<number | null>(null);
  const navWatchIdRef = useRef<number | null>(null);
  const mapboxToken = typeof (import.meta as any)?.env?.VITE_MAPBOX_TOKEN === 'string'
    ? (import.meta as any).env.VITE_MAPBOX_TOKEN
    : '';

  const ensureMapbox = async () => {
    if (mapboxModuleRef.current) {
      return mapboxModuleRef.current;
    }
    if (!mapboxLoadingRef.current) {
      mapboxLoadingRef.current = Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl.css')
      ]).then(([module]) => {
        const loaded = (module as any).default ?? module;
        mapboxModuleRef.current = loaded;
        return loaded;
      });
    }
    return mapboxLoadingRef.current;
  };

  const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1000;
  };

  const normalizeTab = (tab: string) => tab.trim().toLowerCase();

  const rankOffersByTab = (offers: CompareOffer[], tab: string) => {
    const normalized = normalizeTab(tab);
    const withFallback = [...offers];
    const byValue = (a: CompareOffer, b: CompareOffer) => (b.value_score ?? 0) - (a.value_score ?? 0);
    if (normalized.includes('fastest pickup')) {
      return withFallback.sort((a, b) => {
        const aEta = a.pickup_eta_minutes && a.pickup_eta_minutes > 0 ? a.pickup_eta_minutes : 9999;
        const bEta = b.pickup_eta_minutes && b.pickup_eta_minutes > 0 ? b.pickup_eta_minutes : 9999;
        if (aEta !== bEta) return aEta - bEta;
        return byValue(a, b);
      });
    }
    if (normalized.includes('trusted')) {
      const trusted = withFallback.filter((o) => (o.trust_score ?? 0) >= comparisonThresholds.trusted_seller);
      return (trusted.length ? trusted : withFallback).sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0));
    }
    if (normalized.includes('nearby')) {
      return withFallback.sort((a, b) => {
        const aDist = typeof a.distance_km === 'number' && a.distance_km > 0 ? a.distance_km : 9999;
        const bDist = typeof b.distance_km === 'number' && b.distance_km > 0 ? b.distance_km : 9999;
        if (aDist !== bDist) return aDist - bDist;
        return byValue(a, b);
      });
    }
    if (normalized.includes('warranty')) {
      return withFallback.sort((a, b) => {
        const aW = a.warranty_months ?? 0;
        const bW = b.warranty_months ?? 0;
        if (aW !== bW) return bW - aW;
        return byValue(a, b);
      });
    }
    return withFallback.sort(byValue);
  };

  const priceBandMeta = (label?: string) => {
    const normalized = (label || '').toLowerCase();
    if (normalized.includes('below')) {
      return { label: 'Below Average', color: 'bg-emerald-500', text: 'text-emerald-700' };
    }
    if (normalized.includes('premium')) {
      return { label: 'Premium', color: 'bg-rose-500', text: 'text-rose-700' };
    }
    if (normalized.includes('average')) {
      return { label: 'Average', color: 'bg-amber-500', text: 'text-amber-700' };
    }
    return { label: 'Unknown', color: 'bg-zinc-300', text: 'text-zinc-500' };
  };

  const handleProfileSwitch = async (profile: string) => {
    setComparisonProfile(profile);
    try {
      const updated = await updateComparisonPreferences({ comparison_profile: profile });
      if (updated?.comparison_profile) {
        setComparisonProfile(updated.comparison_profile);
      }
      if (updated?.comparison_weights) {
        setComparisonWeights({
          price: Number(updated.comparison_weights.price ?? comparisonWeights.price),
          convenience: Number(updated.comparison_weights.convenience ?? comparisonWeights.convenience),
          trust: Number(updated.comparison_weights.trust ?? comparisonWeights.trust),
          quality: Number(updated.comparison_weights.quality ?? comparisonWeights.quality),
          ownership: Number(updated.comparison_weights.ownership ?? comparisonWeights.ownership)
        });
      }
      if (updated?.deal_thresholds) {
        setComparisonThresholds({
          best_value: Number(updated.deal_thresholds.best_value ?? comparisonThresholds.best_value),
          fastest_pickup: Number(updated.deal_thresholds.fastest_pickup ?? comparisonThresholds.fastest_pickup),
          trusted_seller: Number(updated.deal_thresholds.trusted_seller ?? comparisonThresholds.trusted_seller),
          nearby: Number(updated.deal_thresholds.nearby ?? comparisonThresholds.nearby)
        });
      }
      await loadCompare();
    } catch {}
  };

  const speak = (text: string) => {
    if (!voiceDirectionsEnabled) return;
    if ('speechSynthesis' in window && text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const loadCompare = async (alive?: { current: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const listResp = await getCompareList();
      if (alive && !alive.current) return;
      const items = Array.isArray(listResp?.items) ? listResp.items : [];
      const analysisResponses = await Promise.all(
        items.map(async (item: CompareListItem) => {
          try {
            const analysis = await getCompareAnalysis({ product_id: item.product_id });
            return { item, analysis } as const;
          } catch {
            return { item, analysis: null } as const;
          }
        })
      );
      if (alive && !alive.current) return;
      const view = analysisResponses.map(({ item, analysis }, index) => {
        const product: CompareProduct | undefined = analysis?.product;
        const offers = analysis?.offers || [];
        if (index === 0 && Array.isArray(analysis?.tabs) && analysis.tabs.length) {
          setCompareTabs(analysis.tabs);
          if (!analysis.tabs.includes(activeCompareTab)) {
            setActiveCompareTab(analysis.tabs[0]);
          }
        }
        return {
          id: item.product_id,
          name: product?.name || item.product_name,
          brand: product?.brand,
          categoryId: product?.category_id,
          imageUrl: product?.image_url || item.product_image_url,
          offers,
          mapItems: [],
          fallbackName: item.product_name,
          fallbackImageUrl: item.product_image_url
        } as CompareProductView;
      });
      setProducts(view);
    } catch (err: any) {
      if (alive && !alive.current) return;
      setError(err?.message || 'Unable to load compare list.');
    } finally {
      if (alive && !alive.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    const alive = { current: true };
    loadCompare(alive);
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getUiPreferences()
      .then((prefs) => {
        if (!alive) return;
        setVoiceDirectionsEnabled(Boolean(prefs?.voice_directions_enabled));
      })
      .catch(() => {
        if (!alive) return;
        setVoiceDirectionsEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!compareMapRef.current) return;
    const raf = window.requestAnimationFrame(() => {
      compareMapRef.current?.resize?.();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [compareMapReady, isMapExpanded, activeMapProduct]);

  useEffect(() => {
    let active = true;
    const hasCoords = (loc?: UserLocation | null) =>
      Boolean(loc && loc.lat !== undefined && loc.lng !== undefined && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng)));
    const resolveBuyerLocation = async () => {
      try {
        const locations = await listUserLocations().catch(() => []);
        if (!active || compareUserCoords) return;
        const preferred = (locations || []).find((location) => location.is_default && hasCoords(location))
          || (locations || []).find((location) => hasCoords(location));
        if (preferred && hasCoords(preferred)) {
          setCompareUserCoords({ lat: Number(preferred.lat), lng: Number(preferred.lng) });
          setLocationSourceLabel(preferred.label || preferred.address_line || 'Saved Location');
          return;
        }
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!active || compareUserCoords) return;
            setCompareUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocationSourceLabel('My Location');
          },
          () => {}
        );
      } catch {}
    };
    resolveBuyerLocation();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeMapProduct || !activeMapProduct.mapItems?.[0]) return;
    if (!mapboxToken) return;
    if (!compareMapContainerRef.current) return;
    const item = activeMapProduct.mapItems[0];
    if (!Number.isFinite(item.lng) || !Number.isFinite(item.lat)) return;
    let active = true;
    ensureMapbox().then((mapboxgl) => {
      if (!active) return;
      mapboxgl.accessToken = mapboxToken;
      if (compareMapRef.current) return;
      const map = new mapboxgl.Map({
        container: compareMapContainerRef.current as HTMLElement,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [Number(item.lng), Number(item.lat)],
        zoom: 13
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.on('load', () => {
        setCompareMapReady(true);
        if (!map.getSource('route-line')) {
          map.addSource('route-line', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route-line',
            paint: {
              'line-color': '#4f46e5',
              'line-width': 4
            }
          });
        }
        if (!map.getSource('popular-paths')) {
          map.addSource('popular-paths', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
          map.addLayer({
            id: 'popular-paths',
            type: 'line',
            source: 'popular-paths',
            paint: {
              'line-color': '#f97316',
              'line-width': 3,
              'line-opacity': 0.6
            }
          });
        }
        if (!map.getSource('recording-path')) {
          map.addSource('recording-path', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
          map.addLayer({
            id: 'recording-path',
            type: 'line',
            source: 'recording-path',
            paint: {
              'line-color': '#ef4444',
              'line-width': 4
            }
          });
        }
      });
      compareMapRef.current = map;
      const sellerMarker = new mapboxgl.Marker({ color: '#4f46e5' })
        .setLngLat([Number(item.lng), Number(item.lat)])
        .addTo(map);
      compareSellerMarkerRef.current = sellerMarker;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCompareUserCoords(coords);
            setLocationSourceLabel('My Location');
            if (compareMapRef.current) {
              compareUserMarkerRef.current?.remove();
              compareUserMarkerRef.current = new mapboxgl.Marker({ color: '#10b981' })
                .setLngLat([coords.lng, coords.lat])
                .addTo(compareMapRef.current);
            }
          },
          () => {
            // ignore geo errors
          }
        );
      }
      (async () => {
        try {
          const pad = 0.05;
          const bbox = [
            Number(item.lng) - pad,
            Number(item.lat) - pad,
            Number(item.lng) + pad,
            Number(item.lat) + pad
          ].join(',');
          const paths = await listPopularPaths({ bbox, limit: 30 });
          const source = map.getSource('popular-paths') as any;
          if (source) {
            const features = paths
              .map((path) => path.line_geojson ? ({
                type: 'Feature',
                geometry: path.line_geojson,
                properties: { id: path.id, name: path.name, usage_count: path.usage_count || 0 }
              }) : null)
              .filter(Boolean);
            source.setData({ type: 'FeatureCollection', features } as any);
          }
        } catch {
          // ignore
        }
      })();
    });
    return () => {
      active = false;
    };
  }, [activeMapProduct, mapboxToken]);

  useEffect(() => {
    if (!compareMapReady || !compareMapRef.current) return;
    const source = compareMapRef.current.getSource('recording-path') as any;
    if (!source) return;
    if (recordingPoints.length < 2) {
      source.setData({ type: 'FeatureCollection', features: [] } as any);
      return;
    }
    const line = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: recordingPoints.map((p) => [p.lng, p.lat])
          },
          properties: {}
        }
      ]
    };
    source.setData(line as any);
  }, [compareMapReady, recordingPoints]);

  useEffect(() => {
    if (!compareMapReady || !compareMapRef.current || !compareUserCoords || !activeMapProduct) return;
    const item = activeMapProduct.mapItems?.[0];
    if (!item) return;
    const fromLng = compareUserCoords.lng;
    const fromLat = compareUserCoords.lat;
    const toLng = Number(item.lng);
    const toLat = Number(item.lat);
    if (!Number.isFinite(toLng) || !Number.isFinite(toLat)) return;
    const fetchRoute = async () => {
      try {
        const profile = toMapboxProfile(compareRouteProfile);
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return;
        const geojson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: route.geometry,
              properties: {}
            }
          ]
        };
        const source = compareMapRef.current?.getSource('route-line') as any;
        source?.setData(geojson as any);
        const steps = route.legs?.[0]?.steps || [];
        const cityKey = detectCityKey(activeMapItem?.location?.address || activeMapItem?.seller_address || activeMapItem?.address);
        const cityMultiplier = getCityMultiplier(routeConfig, cityKey, compareRouteProfile);
        const profileMultiplier = getProfileMultiplier(routeConfig, compareRouteProfile);
        const adjustedSteps: Array<{ instruction: string; distance: number; duration: number }> = steps.map((step: any) => ({
          instruction: step.maneuver?.instruction || 'Continue',
          distance: Math.round(step.distance || 0),
          duration: Math.round((step.duration || 0) * profileMultiplier * cityMultiplier * getStepRoadMultiplier(routeConfig, step))
        }));
        const adjustedDuration = adjustedSteps.reduce((sum: number, step) => sum + (step.duration || 0), 0);
        setCompareRouteInfo({
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMin: Math.max(1, Math.round(adjustedDuration / 60))
        });
        setCompareRouteSteps(adjustedSteps);
        routeTelemetry({
          profile: compareRouteProfile,
          city: cityKey,
          distance_km: Math.round((route.distance / 1000) * 10) / 10,
          duration_min: Math.max(1, Math.round(adjustedDuration / 60)),
          source: 'comparison'
        });
        compareRouteManeuversRef.current = steps
          .map((step: any) => ({
            instruction: step.maneuver?.instruction || 'Continue',
            location: step.maneuver?.location as [number, number]
          }))
          .filter((item: any) => Array.isArray(item.location) && item.location.length === 2);
        compareRouteStepIndexRef.current = 0;
      } catch {
        // ignore
      }
    };
    fetchRoute();
  }, [activeMapProduct, compareMapReady, compareRouteProfile, compareUserCoords, mapboxToken]);

  useEffect(() => {
    if (!activeMapProduct && compareMapRef.current) {
      compareMapRef.current.remove();
      compareMapRef.current = null;
      compareUserMarkerRef.current = null;
      compareSellerMarkerRef.current = null;
      setCompareMapReady(false);
      setCompareRouteInfo(null);
      setCompareRouteSteps([]);
      stopNavWatch();
      if (recordingWatchIdRef.current) {
        navigator.geolocation.clearWatch(recordingWatchIdRef.current);
        recordingWatchIdRef.current = null;
      }
      setIsRecording(false);
      setRecordingPaused(false);
      setShowRecordingPanel(false);
      setRecordingPoints([]);
      setRecordingDistance(0);
      setRecordingStart(null);
    }
  }, [activeMapProduct]);

  const stopNavWatch = () => {
    if (navWatchIdRef.current) {
      navigator.geolocation.clearWatch(navWatchIdRef.current);
      navWatchIdRef.current = null;
    }
  };

  const beginNavWatch = () => {
    if (!navigator.geolocation || navWatchIdRef.current) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCompareUserCoords(point);
        if (compareUserMarkerRef.current && compareMapRef.current) {
          compareUserMarkerRef.current.setLngLat([point.lng, point.lat]);
        }
        if (compareRouteManeuversRef.current.length > 0) {
          const idx = compareRouteStepIndexRef.current;
          const next = compareRouteManeuversRef.current[idx];
          if (next?.location) {
            const dist = haversine({ lat: point.lat, lng: point.lng }, { lat: next.location[1], lng: next.location[0] });
            if (dist < 25 && idx < compareRouteManeuversRef.current.length - 1) {
              compareRouteStepIndexRef.current = idx + 1;
              speak(next.instruction);
            }
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    navWatchIdRef.current = id;
  };

  useEffect(() => {
    if (!voiceDirectionsEnabled || !activeMapProduct || !compareMapReady || isRecording) {
      stopNavWatch();
      return;
    }
    if (!compareRouteManeuversRef.current.length) {
      stopNavWatch();
      return;
    }
    beginNavWatch();
    return () => stopNavWatch();
  }, [activeMapProduct, compareMapReady, compareRouteSteps.length, isRecording, voiceDirectionsEnabled]);

  const beginRecordingWatch = () => {
    if (!navigator.geolocation) {
      setRecordingStatus('Geolocation not supported.');
      return;
    }
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude, recorded_at: new Date().toISOString() };
        setRecordingPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segment = haversine({ lat: last.lat, lng: last.lng }, { lat: point.lat, lng: point.lng });
            setRecordingDistance((dist) => dist + segment);
          }
          return [...prev, point];
        });
        if (compareMapRef.current) {
          compareMapRef.current.easeTo({ center: [point.lng, point.lat], duration: 500 });
        }
      },
      () => {
        setRecordingStatus('Unable to read GPS location.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    recordingWatchIdRef.current = id;
  };

  const startRecording = () => {
    setRecordingPoints([]);
    setRecordingDistance(0);
    setRecordingStart(Date.now());
    setIsRecording(true);
    setRecordingPaused(false);
    setRecordingStatus(null);
    beginRecordingWatch();
  };

  const pauseRecording = () => {
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
      recordingWatchIdRef.current = null;
    }
    setRecordingPaused(true);
  };

  const resumeRecording = () => {
    if (!isRecording) return;
    setRecordingPaused(false);
    beginRecordingWatch();
  };

  const stopRecording = () => {
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
      recordingWatchIdRef.current = null;
    }
    setRecordingPaused(false);
    setIsRecording(false);
    setShowRecordingPanel(true);
  };

  const saveRecording = async () => {
    if (recordingPoints.length < 2) {
      setRecordingStatus('Record at least two points.');
      return;
    }
    try {
      const saved = await recordPath({
        name: recordingName || 'Recorded path',
        shared: recordingShared,
        seller_id: activeMapItem?.seller_id || undefined,
        points: recordingPoints
      });
      setRecordingStatus(saved?.id ? 'Path saved.' : 'Path saved.');
      setShowRecordingPanel(false);
      setRecordingName('');
      setRecordingShared(true);
      setRecordingPoints([]);
      setRecordingDistance(0);
      setRecordingStart(null);
    } catch (err: any) {
      setRecordingStatus(err?.message || 'Unable to save path.');
    }
  };

  useEffect(() => {
    let alive = true;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const limit = showAllHistory ? 50 : 10;
        const items = await getCompareHistory(limit);
        if (!alive) return;
        setHistory(items || []);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to load compare history.');
      } finally {
        if (alive) setHistoryLoading(false);
      }
    };
    loadHistory();
    return () => {
      alive = false;
    };
  }, [showAllHistory]);

  const handleRemove = async (productId: string) => {
    try {
      await removeCompareItem(productId);
      await loadCompare();
    } catch (err: any) {
      setError(err?.message || 'Unable to remove compare item.');
    }
  };

  const handleAddToCart = async (product: CompareProductView) => {
    const price = product.bestOffer?.price;
    const sellerId = product.bestOffer?.seller_id;
    if (!price || !sellerId) return;
    try {
      await addCartItem({ product_id: product.id, seller_id: sellerId, quantity: 1, unit_price: price });
    } catch (err: any) {
      setError(err?.message || 'Unable to add to cart.');
    }
  };

  const handleOpenMap = async (product: CompareProductView) => {
    setMapLoadingProductId(product.id);
    try {
      const resp = await getCompareMap({ product_id: product.id });
      const items = Array.isArray(resp?.items) ? resp.items : [];
      setProducts(prev => prev.map(p => (
        p.id === product.id ? { ...p, mapItems: items } : p
      )));
      setActiveMapProduct({ ...product, mapItems: items });
    } catch (err: any) {
      setError(err?.message || 'Unable to load compare map.');
    } finally {
      setMapLoadingProductId(null);
    }
  };

  const formattedProducts = useMemo(() => {
    return products
      .filter(p => p.id)
      .map((product) => {
        const ranked = rankOffersByTab(product.offers || [], activeCompareTab);
        return {
          ...product,
          offers: ranked,
          bestOffer: ranked[0] || null
        };
      });
  }, [products, activeCompareTab]);
  const activeMapItem = activeMapProduct?.mapItems?.[0];

  if (!loading && formattedProducts.length === 0) {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="p-4 border-b bg-white flex items-center gap-3 sticky top-0 z-10">
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full" aria-label="Go back">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Product Comparison</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <BarChart3 className="w-16 h-16 text-zinc-200 mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Comparison List Empty</h2>
          <p className="text-sm text-zinc-500">Add products from search or detail views to compare them side-by-side.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-50 flex flex-col">
      <div className="p-4 border-b bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Product Comparison</h1>
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
            <span title="Value Score uses your weights. Badges use your thresholds. Change profile to re-rank.">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
            </span>
            <span className="hidden sm:inline">How scoring works</span>
          </div>
        </div>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{formattedProducts.length} Items</span>
      </div>
      <div className="px-4 py-3 bg-white border-b flex flex-wrap gap-2">
        {compareTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveCompareTab(tab)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              activeCompareTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {['default', 'aggressive_deals', 'deal_hunter', 'trust_first', 'speed_priority'].map((profile) => (
            <button
              key={profile}
              onClick={() => handleProfileSwitch(profile)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                comparisonProfile === profile
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {profile.replace(/_/g, ' ')}
            </button>
          ))}
          <button
            onClick={() => handleProfileSwitch('default')}
            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-white"
            title="Reset comparison profile to default"
          >
            Reset Default
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-6 text-[11px] font-bold text-zinc-500">Loading comparison...</div>
      )}

      {!loading && (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="mb-4 bg-white rounded-2xl border border-zinc-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Compare History</p>
              <div className="flex items-center gap-2">
                {historyLoading && <span className="text-[10px] font-bold text-zinc-400">Loading...</span>}
                <button
                  onClick={() => setShowAllHistory(prev => !prev)}
                  className="text-[10px] font-bold text-indigo-600"
                >
                  {showAllHistory ? 'View Less' : 'View All'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold">
              {['all', 'add', 'remove', 'view'].map((value) => (
                <button
                  key={value}
                  onClick={() => setHistoryFilter(value as 'all' | 'add' | 'remove' | 'view')}
                  className={`px-2 py-1 rounded-lg ${
                    historyFilter === value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {value === 'all' ? 'All' : value}
                </button>
              ))}
            </div>
            {history.length === 0 && !historyLoading && (
              <div className="text-[10px] font-bold text-zinc-500">No compare history yet.</div>
            )}
            {history.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {history
                  .filter((item) => {
                    if (historyFilter === 'all') return true;
                    const raw = (item.event_type || '').toLowerCase();
                    if (historyFilter === 'add') return raw.includes('add');
                    if (historyFilter === 'remove') return raw.includes('remove');
                    if (historyFilter === 'view') return raw.includes('view') || raw.includes('open');
                    return true;
                  })
                  .map(item => (
                  <div key={item.id} className="p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700 flex items-center justify-between">
                    <span className="line-clamp-1">{item.product_name || item.product_id}</span>
                    <span className="text-[9px] text-zinc-400 uppercase">{item.event_type || 'view'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 min-w-max h-full">
            {formattedProducts.map((product) => {
              const offer = product.bestOffer;
              const deliveryDetails = (offer?.delivery_details || {}) as Record<string, any>;
              const priceBand = priceBandMeta(offer?.price_position);
              const sellerMode = offer?.seller_mode || 'seller';
              const sellerIndicator = (() => {
                const visualMarkerLabel = offer?.visual_marker
                  ? (/^https?:\/\//i.test(String(offer.visual_marker)) ? 'Photo marker' : String(offer.visual_marker))
                  : 'Marker';
                switch (sellerMode) {
                  case 'fixed_shop':
                    return 'Fixed Shop · Address + hours';
                  case 'open_market_stall':
                    return `Stall · ${offer?.market_name || 'Market'} · ${visualMarkerLabel}`;
                  case 'ground_trader':
                    return `Ground Trader · ${visualMarkerLabel} · WhatsApp`;
                  case 'solopreneur':
                    return `Solopreneur · Delivery ${offer?.delivery_radius_km ?? '—'} km`;
                  case 'hybrid':
                    return 'Hybrid · Shop + delivery';
                  default:
                    return sellerMode.replace('_', ' ');
                }
              })();

              return (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-72 bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col overflow-hidden"
                >
                <div className="relative aspect-square">
                  {product.imageUrl || product.fallbackImageUrl ? (
                    <img src={product.imageUrl || product.fallbackImageUrl} className="w-full h-full object-cover" alt={product.name || product.id} />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                      {product.name?.slice(0, 2).toUpperCase() || product.fallbackName?.slice(0, 2).toUpperCase() || 'NA'}
                    </div>
                  )}
                  <button 
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-zinc-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <span className="text-white font-black text-sm">
                      {(product.bestOffer?.currency || 'KES')} {product.bestOffer?.price ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-6 flex-1">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-lg mb-1 leading-tight">{product.name || product.fallbackName || product.id}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{product.categoryId || product.brand || '—'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase">
                        Profile: {comparisonProfile.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {offer?.badges?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {offer.badges.map((badge) => (
                          <span key={badge} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black">
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 text-[9px] text-zinc-400 font-bold">
                      Thresholds: Best ≥{comparisonThresholds.best_value} · Pickup ≤{comparisonThresholds.fastest_pickup}m · Trust ≥{comparisonThresholds.trusted_seller} · Nearby ≤{comparisonThresholds.nearby}km
                    </div>
                  </div>

                  <div className="space-y-4">
                    {product.bestOffer?.location && (
                      <div className="p-3 bg-zinc-50 rounded-2xl">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Location</p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-zinc-700 line-clamp-1">
                              {product.bestOffer?.seller_name || 'Seller'} • {(product.bestOffer?.distance_km ?? 0).toFixed(1)} km
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenMap(product)}
                            disabled={mapLoadingProductId === product.id}
                            className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {mapLoadingProductId === product.id ? 'Loading...' : 'Map View'}
                          </button>
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-600 font-bold">
                          {sellerIndicator}
                        </div>
                        {(product.bestOffer?.market_name) && (
                          <div className="mt-1 text-[10px] text-zinc-500">
                            Market zone: {product.bestOffer.market_name}
                          </div>
                        )}
                        {(product.bestOffer?.seller_mode || product.bestOffer?.market_name || product.bestOffer?.visual_marker) && (
                          <div className="mt-2 text-[10px] text-zinc-600 font-bold">
                            {product.bestOffer?.seller_mode ? product.bestOffer.seller_mode.replace('_', ' ') : 'Seller'} ·{' '}
                            {[product.bestOffer?.market_name, product.bestOffer?.visual_marker].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        {(product.bestOffer?.whatsapp_number || typeof product.bestOffer?.delivery_radius_km === 'number') && (
                          <div className="mt-1 text-[10px] text-zinc-500">
                            {product.bestOffer?.whatsapp_number && `WhatsApp: ${product.bestOffer.whatsapp_number}`}
                            {product.bestOffer?.whatsapp_number && typeof product.bestOffer?.delivery_radius_km === 'number' ? ' · ' : ''}
                            {typeof product.bestOffer?.delivery_radius_km === 'number' && `Delivery ${product.bestOffer.delivery_radius_km} km`}
                          </div>
                        )}
                        <div className="mt-1 text-[10px] text-zinc-500">
                          Pickup ETA: {product.bestOffer?.pickup_eta_minutes ? `${product.bestOffer.pickup_eta_minutes} min` : '—'}
                          {' • '}Delivery ETA: {product.bestOffer?.delivery_eta_minutes ? `${product.bestOffer.delivery_eta_minutes} min` : '—'}
                        </div>
                        {typeof product.bestOffer?.delivery_radius_km === 'number' && typeof product.bestOffer?.distance_km === 'number' && product.bestOffer.distance_km > 0 && (
                          <div className="mt-1 text-[10px] text-zinc-500">
                            Delivery coverage: {product.bestOffer.distance_km <= product.bestOffer.delivery_radius_km ? 'Within radius' : 'Outside radius'}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Price Analysis</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">Your Value Score</span>
                        <span className="text-xs font-bold text-zinc-900">{product.bestOffer?.value_score ?? '—'}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-zinc-500 font-bold">
                        <div>Price {comparisonWeights.price}%</div>
                        <div>Convenience {comparisonWeights.convenience}%</div>
                        <div>Trust {comparisonWeights.trust}%</div>
                        <div>Quality {comparisonWeights.quality}%</div>
                        <div>Ownership {comparisonWeights.ownership}%</div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                          <span>Market Band</span>
                          <span className={priceBand.text}>{priceBand.label}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-zinc-200 overflow-hidden">
                          <div className={`h-full ${priceBand.color}`} style={{ width: '100%' }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Price Position</span>
                        <span className="text-[10px] font-black text-zinc-400">{product.bestOffer?.price_position || '—'}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Social Proof</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">Rating</span>
                        {typeof product.bestOffer?.rating === 'number' ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-black text-zinc-900">{product.bestOffer.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-black text-zinc-400">—</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Trust Label</span>
                        <span className="text-xs font-black text-zinc-900">{product.bestOffer?.trust_label || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Warranty</span>
                        <span className="text-xs font-black text-zinc-900">
                          {product.bestOffer?.warranty_months ? `${product.bestOffer.warranty_months} mo` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Return Policy</span>
                        <span className="text-xs font-black text-zinc-900">
                          {product.bestOffer?.return_policy_days ? `${product.bestOffer.return_policy_days} days` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Condition</span>
                        <span className="text-xs font-black text-zinc-900">
                          {product.bestOffer?.refurb_status || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Authenticity</span>
                        <span className="text-xs font-black text-zinc-900">
                          {product.bestOffer?.authenticity_verified ? 'Verified' : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Bundle/Accessories</span>
                        <span className="text-xs font-black text-zinc-900">
                          {typeof product.bestOffer?.accessories_score === 'number' ? product.bestOffer.accessories_score : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Installation</span>
                        <span className="text-xs font-black text-zinc-900">
                          {typeof product.bestOffer?.installation_score === 'number' ? product.bestOffer.installation_score : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Availability</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">Status</span>
                        <span className="text-xs font-black text-zinc-900">{product.bestOffer?.availability_status || product.bestOffer?.stock_status || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Stock Signal</span>
                        <span className="text-xs font-black text-zinc-900">{product.bestOffer?.stock_status || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Coordination</span>
                        <span className="text-xs font-black text-zinc-900">{product.bestOffer?.coordination_required ? 'Required' : 'Standard'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Same-Day</span>
                        <span className="text-xs font-black text-zinc-900">{deliveryDetails.same_day_available ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Service</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">Delivery Fee</span>
                        <span className="text-xs font-black text-zinc-900">
                          {deliveryDetails.delivery_fee_flat
                            ? `KES ${deliveryDetails.delivery_fee_flat}`
                            : deliveryDetails.delivery_fee_per_km
                              ? `KES ${deliveryDetails.delivery_fee_per_km}/km`
                              : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Payment</span>
                        <span className="text-[10px] font-black text-zinc-900">
                          {Array.isArray(deliveryDetails.payment_options) && deliveryDetails.payment_options.length
                            ? deliveryDetails.payment_options.join(', ')
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">Install</span>
                        <span className="text-[10px] font-black text-zinc-900">{deliveryDetails.installation_services || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-600">After Sales</span>
                        <span className="text-[10px] font-black text-zinc-900">{deliveryDetails.after_sales_support || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-auto flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        if (!product.name || product.bestOffer?.price === undefined) return;
                        onProductOpen({
                          id: product.id,
                          sellerId: product.bestOffer?.seller_id || '',
                          name: product.name,
                          description: '',
                          price: product.bestOffer?.price || 0,
                          category: product.categoryId || '',
                          mediaUrl: product.imageUrl || '',
                          mediaType: 'image',
                          tags: [],
                          stockLevel: 0
                        });
                      }}
                      className="w-full py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" /> View Details
                    </button>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.bestOffer?.price || !product.bestOffer?.seller_id}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeMapProduct && activeMapItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${isMapExpanded ? 'fixed inset-0 w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl'} bg-white overflow-hidden shadow-2xl flex flex-col`}>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <MapIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900">Location Map</p>
                  {locationSourceLabel && (
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">
                      Using {locationSourceLabel}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 font-bold">
                    {activeMapItem.seller_name || 'Seller'} • {activeMapItem.distance_km?.toFixed(1) || '—'} km
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveMapProduct(null)}
                className="p-2 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`${isMapExpanded ? 'flex-1 min-h-0' : 'relative h-[360px]'} bg-zinc-100 relative`}>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setIsMapExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-xl text-[10px] font-black text-zinc-700"
                >
                  {isMapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  {isMapExpanded ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
              </div>
              <div ref={compareMapContainerRef} className="absolute inset-0" />
              {!mapboxToken && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-zinc-900/70">
                  Mapbox token missing. Add VITE_MAPBOX_TOKEN to enable maps.
                </div>
              )}
              {compareRouteInfo && (
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-bold text-zinc-700">
                  Route: {compareRouteInfo.distanceKm} km · {compareRouteInfo.durationMin} min
                </div>
              )}
              {isRecording && (
                <div className="absolute top-12 left-3 bg-rose-600/90 text-white px-3 py-1.5 rounded-2xl text-[10px] font-bold shadow space-y-1">
                  <div>
                    Recording… {Math.round(recordingDistance)}m · {Math.floor((recordingStart ? (Date.now() - recordingStart) : 0) / 60000)}m
                  </div>
                  <div className="text-[9px] text-white/80">Points: {recordingPoints.length} / 10</div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2">
                <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white shadow-xl flex flex-wrap gap-1 text-[9px] font-bold text-zinc-700">
                  {[
                    { label: 'Drive', value: 'driving' },
                    { label: 'Motorbike', value: 'motorbike' },
                    { label: 'Scooter', value: 'scooter' },
                    { label: 'TukTuk', value: 'tuktuk' },
                    { label: 'Cycle', value: 'cycling' },
                    { label: 'Walk', value: 'walking' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCompareRouteProfile(opt.value as any)}
                      className={`px-2 py-1 rounded-full ${compareRouteProfile === opt.value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white shadow-xl flex items-center gap-1 text-[9px] font-bold text-zinc-700">
                  <button
                    onClick={() => {
                      const next = !voiceDirectionsEnabled;
                      setVoiceDirectionsEnabled(next);
                      void updateUiPreferences({ voice_directions_enabled: next }).catch(() => {});
                    }}
                    className={`px-3 py-1 rounded-full ${voiceDirectionsEnabled ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {voiceDirectionsEnabled ? 'Voice On' : 'Voice Off'}
                  </button>
                  <button
                    onClick={() => {
                      if (isRecording) {
                        stopRecording();
                      } else {
                        startRecording();
                      }
                    }}
                    className={`px-3 py-1 rounded-full ${isRecording ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
                  >
                    {isRecording ? 'Stop' : 'Record'}
                  </button>
                  {isRecording && (
                    <button
                      onClick={recordingPaused ? resumeRecording : pauseRecording}
                      className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700"
                    >
                      {recordingPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 pb-3 px-3">
                <div className="bg-white/95 backdrop-blur-md rounded-t-3xl border border-white shadow-2xl p-4 max-h-[40vh] overflow-hidden">
                  {compareRouteSteps.length > 0 && (
                    <div className="max-h-28 overflow-auto text-[10px] text-zinc-700 space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Directions</div>
                      {compareRouteSteps.slice(0, 5).map((step, idx) => (
                        <div key={`cmp-route-step-${idx}`} className="flex items-center justify-between gap-2">
                          <span className="font-bold">{step.instruction}</span>
                          <span className="text-[9px] text-zinc-500">
                            {Math.max(1, Math.round(step.distance / 10) * 10)}m · {Math.max(1, Math.round(step.duration / 60))}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {compareRouteSteps.length === 0 && compareRouteInfo && (
                    <div className="text-[10px] font-bold text-zinc-600">
                      Directions unavailable. Enable location services and try again.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showRecordingPanel && (
              <div className="p-4 border-t bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-black text-zinc-900">Save Recorded Path</div>
                  <button
                    onClick={() => {
                      setShowRecordingPanel(false);
                      setRecordingPoints([]);
                      setRecordingDistance(0);
                      setRecordingStart(null);
                    }}
                    className="text-[10px] font-bold text-zinc-400"
                  >
                    Discard
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Name this path"
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl text-xs font-bold"
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <input
                      type="checkbox"
                      checked={recordingShared}
                      onChange={(e) => setRecordingShared(e.target.checked)}
                    />
                    Share with community
                  </label>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500">
                    <span>Recording progress</span>
                    <span>{recordingPoints.length} / 10 points</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((recordingPoints.length / 10) * 100))}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={saveRecording}
                  disabled={recordingPoints.length < 2}
                  className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                >
                  Save Path
                </button>
                {recordingStatus && (
                  <div className="mt-2 text-[10px] font-bold text-zinc-500">{recordingStatus}</div>
                )}
              </div>
            )}

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeMapProduct.imageUrl || activeMapProduct.fallbackImageUrl ? (
                  <img src={activeMapProduct.imageUrl || activeMapProduct.fallbackImageUrl} className="w-12 h-12 rounded-xl object-cover" alt="product" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">NA</div>
                )}
                <div>
                  <p className="text-sm font-bold text-zinc-900">{activeMapProduct.name || activeMapProduct.fallbackName || activeMapProduct.id}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">KES {activeMapItem.price ?? '—'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveMapProduct(null);
                  if (activeMapProduct.name && activeMapProduct.bestOffer?.price !== undefined) {
                    onProductOpen({
                      id: activeMapProduct.id,
                      sellerId: activeMapProduct.bestOffer?.seller_id || '',
                      name: activeMapProduct.name,
                      description: '',
                      price: activeMapProduct.bestOffer?.price || 0,
                      category: activeMapProduct.categoryId || '',
                      mediaUrl: activeMapProduct.imageUrl || '',
                      mediaType: 'image',
                      tags: [],
                      stockLevel: 0
                    });
                  }
                }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
