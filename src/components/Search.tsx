import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search as SearchIcon, 
  X, 
  ShoppingBag, 
  ArrowRightLeft, 
  ChevronRight, 
  MapPin, 
  Map as MapIcon, 
  Grid,
  Mic,
  Navigation,
  CheckCircle2,
  TrendingUp,
  Bell,
  Sparkles,
  Clock
} from 'lucide-react';
import { Product } from '../types';
import { getProduct } from '../lib/catalogApi';
import {
  listRecentSearches,
  listSavedSearches,
  listSearchAlerts,
  listWatchlist,
  addWatchlistItem,
  updateWatchlistItem,
  deleteWatchlistItem,
  queueHybridSearch,
  queueOCRSearch,
  queuePhotoSearch,
  queueVideoSearch,
  queueVoiceSearch,
  createSearchAlert,
  updateSearchAlert,
  deleteSearchAlert,
  recordPath,
  listMyPaths,
  listPopularPaths,
  recordPathUse,
  verifyPath,
  recordSearchEvent,
  saveSearch,
  deleteSavedSearch,
  search,
  searchMap,
  searchRecommendations,
  searchTrending,
  type SearchAlert,
  type SearchResult,
  type MediaSearchRequest,
  type PathPoint,
  type RecordedPath,
  type WatchlistItem,
  type SavedSearch,
  type RecentSearch
} from '../lib/searchApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import {
  addShopFavorite,
  getShopProfile,
  listShopFavorites,
  removeShopFavorite,
  searchShops,
  type ShopDirectoryEntry
} from '../lib/shopDirectoryApi';
import { createRouteTelemetryTracker } from '../lib/routeTelemetry';
import { getComparisonPreferences, getUiPreferences, updateUiPreferences } from '../lib/settingsApi';
import {
  detectCityKey,
  getCityMultiplier,
  getDefaultRouteMultipliers,
  getProfileMultiplier,
  getStepRoadMultiplier,
  loadRouteMultipliers,
  type RouteMultipliersConfig
} from '../lib/routeMultipliers';

interface SearchProps {
  onProductOpen: (product: Product) => void;
  comparisonList: Product[];
  onAddToComparison: (product: Product) => void;
  onOpenComparison: () => void;
  onAddToBag: (product: Product) => void;
  onShopOpen: (sellerId: string) => void;
  initialQuery?: string;
  initialAction?: 'voice' | 'photo' | 'video' | 'hybrid';
}

export const Search: React.FC<SearchProps> = ({ onProductOpen, comparisonList, onAddToComparison, onOpenComparison, onAddToBag, onShopOpen, initialQuery, initialAction }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [comparisonProfile, setComparisonProfile] = useState('default');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ id: string; label: string; lng: number; lat: number }>>([]);
  const [mapStatus, setMapStatus] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [routeSteps, setRouteSteps] = useState<Array<{ instruction: string; distance: number; duration: number }>>([]);
  const [routeProfile, setRouteProfile] = useState<'driving' | 'walking' | 'cycling' | 'motorbike' | 'scooter' | 'tuktuk'>('driving');
  const [routeConfig, setRouteConfig] = useState<RouteMultipliersConfig>(() => getDefaultRouteMultipliers());
  const routeTelemetry = useMemo(() => createRouteTelemetryTracker('search_map'), []);

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
    const loadComparisonProfile = async () => {
      try {
        const prefs = await getComparisonPreferences();
        if (!alive) return;
        if (prefs?.comparison_profile) setComparisonProfile(prefs.comparison_profile);
      } catch {}
    };
    loadComparisonProfile();
    return () => {
      alive = false;
    };
  }, []);

  const toMapboxProfile = (profile: typeof routeProfile) => {
    if (profile === 'walking' || profile === 'cycling') return profile;
    return 'driving-traffic';
  };
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingPoints, setRecordingPoints] = useState<PathPoint[]>([]);
  const [recordingDistance, setRecordingDistance] = useState(0);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [recordingShared, setRecordingShared] = useState(false);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [showPathsPanel, setShowPathsPanel] = useState(false);
  const [showPopularPaths, setShowPopularPaths] = useState(true);
  const [showMyPaths, setShowMyPaths] = useState(true);
  const [popularPaths, setPopularPaths] = useState<RecordedPath[]>([]);
  const [myPaths, setMyPaths] = useState<RecordedPath[]>([]);
  const [pathVerifying, setPathVerifying] = useState<Record<string, boolean>>({});
  const [isListening, setIsListening] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const recognitionTimeoutRef = React.useRef<number | null>(null);
  const cameraStreamRef = React.useRef<MediaStream | null>(null);
  const videoPreviewRef = React.useRef<string | null>(null);
  const capturedPreviewRef = React.useRef<string | null>(null);
  const mediaInputRef = React.useRef<HTMLInputElement | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const mediaStatusTimerRef = React.useRef<number | null>(null);
  const mediaAbortRef = React.useRef<AbortController | null>(null);
  const mediaCancelRef = React.useRef(false);
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const userMarkerRef = React.useRef<any>(null);
  const mapReadyRef = React.useRef(false);
  const mapPopupRef = React.useRef<any>(null);
  const routeTargetRef = React.useRef<{ lng: number; lat: number } | null>(null);
  const recordingWatchIdRef = React.useRef<number | null>(null);
  const routeManeuversRef = React.useRef<Array<{ instruction: string; location: [number, number] }>>([]);
  const routeStepIndexRef = React.useRef(0);
  const [detectedLanguage, setDetectedLanguage] = useState<'English' | 'Swahili' | 'Sheng'>('English');
  const [transcriptChips, setTranscriptChips] = useState<string[]>([]);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
  const [voiceDirectionsEnabled, setVoiceDirectionsEnabled] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [watchlistProducts, setWatchlistProducts] = useState<Product[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<SearchAlert[]>([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([]);
  const [shopResults, setShopResults] = useState<ShopDirectoryEntry[]>([]);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [mapProducts, setMapProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [trendingQueries, setTrendingQueries] = useState<string[]>([]);
  const [searchQueryId, setSearchQueryId] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sellerMeta, setSellerMeta] = useState<Record<string, { rating?: number; verified?: boolean; location?: { lat?: number; lng?: number; address?: string } }>>({});
  const [alertFrequency, setAlertFrequency] = useState<Record<string, string>>({});
  const [watchlistTargets, setWatchlistTargets] = useState<Record<string, string>>({});
  const sellerMetaRef = React.useRef(sellerMeta);
  const searchRunRef = React.useRef(0);
  const skipAutoSearchRef = React.useRef(false);
  const mapItemsRef = React.useRef<Product[]>([]);
  const navWatchIdRef = React.useRef<number | null>(null);
  const mapboxModuleRef = React.useRef<any>(null);
  const mapboxLoadingRef = React.useRef<Promise<any> | null>(null);

  useEffect(() => {
    sellerMetaRef.current = sellerMeta;
  }, [sellerMeta]);

  useEffect(() => {
    if (!isListening) {
      setVoiceSeconds(0);
      return;
    }
    const start = Date.now();
    const timer = window.setInterval(() => {
      setVoiceSeconds(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [isListening]);


  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    videoPreviewRef.current = videoPreview;
  }, [videoPreview]);

  useEffect(() => {
    if (capturedPreviewRef.current && capturedPreviewRef.current !== capturedPreview) {
      URL.revokeObjectURL(capturedPreviewRef.current);
    }
    capturedPreviewRef.current = capturedPreview;
  }, [capturedPreview]);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === 'voice') {
      handleStartListening();
    }
    if (initialAction === 'photo') {
      handleOpenCamera();
    }
    if (initialAction === 'video') {
      mediaInputRef.current?.click();
    }
    if (initialAction === 'hybrid') {
      handleOpenCamera();
    }
  }, [initialAction]);

  useEffect(() => {
    let alive = true;
    getUiPreferences()
      .then((prefs) => {
        if (!alive) return;
        setVoiceFeedbackEnabled(Boolean(prefs?.voice_feedback_enabled));
        setVoiceDirectionsEnabled(Boolean(prefs?.voice_directions_enabled));
      })
      .catch(() => {
        if (!alive) return;
        setVoiceFeedbackEnabled(false);
        setVoiceDirectionsEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const numberOrZero = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371e3;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sin1 = Math.sin(dLat / 2);
    const sin2 = Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2), Math.sqrt(1 - (sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2)));
    return R * c;
  };

  const speak = (text: string) => {
    if (!voiceFeedbackEnabled) return;
    if ('speechSynthesis' in window && text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const mapboxToken = (() => {
    const token = (import.meta as any)?.env?.VITE_MAPBOX_TOKEN;
    return typeof token === 'string' ? token : '';
  })();

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

  const fetchMapboxSuggestions = async (query: string) => {
    if (!mapboxToken || !query.trim()) return [];
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?access_token=${mapboxToken}&autocomplete=true&types=place,locality,neighborhood,poi,address&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch locations');
    const data = await res.json();
    return (data.features || []).map((feature: any) => ({
      id: feature.id,
      label: feature.place_name,
      lng: feature.center?.[0],
      lat: feature.center?.[1]
    })).filter((item: any) => Number.isFinite(item.lng) && Number.isFinite(item.lat));
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    if (!mapboxToken) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,locality,neighborhood,poi,address&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    return {
      label: feature.place_name,
      lng: feature.center?.[0],
      lat: feature.center?.[1]
    };
  };

  const updateRoute = React.useCallback(async (toLng: number, toLat: number) => {
    if (!mapboxToken || !userCoords || !mapRef.current || !mapReadyRef.current) return;
    routeTargetRef.current = { lng: toLng, lat: toLat };
    const fromLng = userCoords.lng;
    const fromLat = userCoords.lat;
    const profile = toMapboxProfile(routeProfile);
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
    try {
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
      const source = mapRef.current.getSource('route-line') as any;
      source?.setData(geojson as any);
      const steps = route.legs?.[0]?.steps || [];
      const cityKey = detectCityKey(locationQuery);
      const cityMultiplier = getCityMultiplier(routeConfig, cityKey, routeProfile);
      const profileMultiplier = getProfileMultiplier(routeConfig, routeProfile);
      const adjustedSteps: Array<{ instruction: string; distance: number; duration: number }> = steps.map((step: any) => ({
        instruction: step.maneuver?.instruction || 'Continue',
        distance: Math.round(step.distance || 0),
        duration: Math.round((step.duration || 0) * profileMultiplier * cityMultiplier * getStepRoadMultiplier(routeConfig, step))
      }));
      const adjustedDuration = adjustedSteps.reduce((sum: number, step) => sum + (step.duration || 0), 0);
      setRouteInfo({
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMin: Math.max(1, Math.round(adjustedDuration / 60))
      });
      setRouteSteps(adjustedSteps);
      routeTelemetry({
        profile: routeProfile,
        city: cityKey,
        distance_km: Math.round((route.distance / 1000) * 10) / 10,
        duration_min: Math.max(1, Math.round(adjustedDuration / 60)),
        source: 'search',
      });
      routeManeuversRef.current = steps
        .map((step: any) => ({
          instruction: step.maneuver?.instruction || 'Continue',
          location: step.maneuver?.location as [number, number]
        }))
        .filter((item: any) => Array.isArray(item.location) && item.location.length === 2);
      routeStepIndexRef.current = 0;
    } catch {
      // Ignore route errors.
    }
  }, [mapboxToken, routeProfile, routeConfig, locationQuery, userCoords, routeTelemetry]);

  const ensureMap = React.useCallback(async () => {
    if (!mapboxToken) {
      setMapStatus('Mapbox token missing.');
      return;
    }
    if (!mapContainerRef.current || mapRef.current) return;
    const mapboxgl = await ensureMapbox();
    mapboxgl.accessToken = mapboxToken;
    const center = userCoords ? [userCoords.lng, userCoords.lat] : [39.6682, -4.0435];
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: userCoords ? 12 : 11
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.on('load', () => {
      mapReadyRef.current = true;
      setMapStatus(null);
      setMapReadyVersion((prev) => prev + 1);
      if (!map.getSource('products')) {
        map.addSource('products', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14
        });
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'products',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#4f46e5',
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 26],
            'circle-opacity': 0.85
          }
        });
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'products',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: {
            'text-color': '#ffffff'
          }
        });
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'products',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#ffffff',
            'circle-radius': 8,
            'circle-stroke-color': '#4f46e5',
            'circle-stroke-width': 3
          }
        });
        map.on('click', 'clusters', (event: any) => {
          const features = map.queryRenderedFeatures(event.point, { layers: ['clusters'] });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource('products') as any;
          if (!source || clusterId == null) return;
          (source as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            const coordinates = (features[0].geometry as any).coordinates;
            map.easeTo({ center: coordinates, zoom });
          });
          (source as any).getClusterLeaves(clusterId, 6, 0, (err: any, leaves: any[]) => {
            if (err || !leaves?.length) return;
            const previewCards = leaves
              .map((leaf) => {
                const id = leaf?.properties?.productId;
                const product = mapItemsRef.current.find((item) => item.id === id);
                if (!product) return '';
                const img = product.mediaUrl ? `<img src="${product.mediaUrl}" class="h-8 w-8 rounded-lg object-cover" />` : '';
                const name = product.name ? `<div class="text-[9px] font-bold text-zinc-900 truncate">${product.name}</div>` : '';
                const price = product.price ? `<div class="text-[9px] font-bold text-indigo-600">KES ${product.price}</div>` : '';
                return `<div class="flex items-center gap-2">${img}<div class="min-w-0">${name}${price}</div></div>`;
              })
              .filter(Boolean)
              .slice(0, 4)
              .join('');
            if (!previewCards) return;
            mapPopupRef.current?.remove();
            mapPopupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, offset: 12 })
              .setLngLat((features[0].geometry as any).coordinates)
              .setHTML(`<div class="space-y-2">${previewCards}<div class="text-[9px] font-bold text-zinc-500">+${Math.max(0, leaves.length - 4)} more nearby</div></div>`)
              .addTo(map);
          });
        });
        map.on('click', 'unclustered-point', (event: any) => {
          const feature = event.features?.[0];
          const props: any = feature?.properties || {};
          const productId = props.productId;
          const lng = Number(props.lng);
          const lat = Number(props.lat);
          const product = mapItemsRef.current.find((item) => item.id === productId);
          if (product) {
            onProductOpen(product);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
              updateRoute(lng, lat);
            }
          }
          if (Number.isFinite(lng) && Number.isFinite(lat)) {
            mapPopupRef.current?.remove();
            mapPopupRef.current = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, offset: 12 })
              .setLngLat([lng, lat])
              .setHTML(`<div class="text-[10px] font-bold text-zinc-900">${product?.name || 'Product'}</div>`)
              .addTo(map);
          }
        });
        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'unclustered-point', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', () => {
          map.getCanvas().style.cursor = '';
        });
      }
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
            'line-color': '#3bb2d0',
            'line-width': 5
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
      if (!map.getSource('my-paths')) {
        map.addSource('my-paths', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
          id: 'my-paths',
          type: 'line',
          source: 'my-paths',
          paint: {
            'line-color': '#10b981',
            'line-width': 3,
            'line-opacity': 0.7
          }
        });
      }
    });
    map.on('click', async (event: any) => {
      const coords = event.lngLat;
      const picked = await reverseGeocode(coords.lng, coords.lat);
      if (picked) {
        setLocationQuery(picked.label);
        setUserCoords({ lat: picked.lat, lng: picked.lng });
        setIsNearMeActive(true);
        setMaxDistance((prev) => prev ?? 10);
        setLocationSuggestions([]);
      }
    });
    mapRef.current = map;
  }, [mapboxToken, userCoords, updateRoute, onProductOpen]);

  const normalizeLocation = (raw: any) => {
    if (!raw) return undefined;
    if (typeof raw === 'string') return { address: raw };
    const address = raw.address || raw.label || raw.name || raw.city || '';
    const latRaw = raw.lat ?? raw.latitude ?? raw.location?.lat ?? raw.location?.latitude ?? raw.geo?.lat;
    const lngRaw = raw.lng ?? raw.longitude ?? raw.location?.lng ?? raw.location?.longitude ?? raw.geo?.lng;
    const lat = Number.isFinite(Number(latRaw)) ? Number(latRaw) : undefined;
    const lng = Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : undefined;
    return { address, lat, lng };
  };

  const resolveMediaUrl = (detail: any) => {
    if (!detail) return '';
    const direct = detail.media_url || detail.image_url || detail.cover_url || detail.thumbnail_url || detail.mediaUrl;
    if (direct) return direct;
    const media = detail.media || detail.media_items || detail.mediaItems || detail.images || detail.media_urls || detail.mediaUrls;
    if (Array.isArray(media) && media.length > 0) {
      const item = media[0];
      if (typeof item === 'string') return item;
      return item?.url || item?.media_url || item?.src || item?.path || '';
    }
    return '';
  };

  const uploadToPresignedUrl = async (file: File, presign: any, signal?: AbortSignal) => {
    const uploadUrl = presign?.upload_url || presign?.url;
    if (!uploadUrl) throw new Error('Missing upload URL');
    const method = (presign?.method || (presign?.fields ? 'POST' : 'PUT')).toUpperCase();
    if (presign?.fields) {
      const form = new FormData();
      Object.entries(presign.fields).forEach(([key, value]) => form.append(key, value as string));
      form.append('file', file);
      const res = await fetch(uploadUrl, { method: 'POST', body: form, signal });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      return presign.fields.key || presign.s3_key || presign.key || '';
    }
    const headers: Record<string, string> = { ...(presign?.headers || {}) };
    if (!headers['Content-Type'] && file.type) headers['Content-Type'] = file.type;
    const res = await fetch(uploadUrl, { method, headers, body: file, signal });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return presign?.s3_key || presign?.key || '';
  };

  const uploadMediaFile = async (file: File, context: string, signal?: AbortSignal) => {
    const presign = await requestUploadPresign({
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      content_length: file.size,
      context
    });
    const mediaKey = await uploadToPresignedUrl(file, presign, signal);
    return {
      mediaKey,
      mediaUrl: presign?.url
    };
  };

  const buildProductFromSearch = (result: SearchResult, detail?: any): Product => {
    const sellerId = result.seller_id || detail?.seller_id || detail?.sellerId || '';
    const locationAddress = sellerMetaRef.current[sellerId]?.location?.address || '';
    const location = (result.lat !== undefined || result.lng !== undefined)
      ? {
          lat: numberOrZero(result.lat),
          lng: numberOrZero(result.lng),
          address: locationAddress
        }
      : undefined;
    const mediaUrl = resolveMediaUrl(detail);
    return {
      id: result.canonical_id || detail?.id || '',
      sellerId,
      name: detail?.name || result.name || 'Product',
      description: detail?.description || detail?.summary || '',
      price: numberOrZero(detail?.current_price ?? detail?.price ?? result.price),
      category: detail?.category || detail?.category_id || 'general',
      mediaUrl,
      mediaType: (detail?.media_type as 'video' | 'image') || (detail?.media?.[0]?.media_type as 'video' | 'image') || 'image',
      tags: Array.isArray(detail?.tags) ? detail.tags : [],
      stockLevel: numberOrZero(detail?.stock_level ?? detail?.stockLevel),
      stockStatus: detail?.stock_status || detail?.stockStatus,
      location,
      discountPrice: detail?.discount_price ?? detail?.discountPrice,
      competitorPrice: detail?.competitor_price ?? detail?.competitorPrice,
      isGoodDeal: detail?.is_good_deal ?? detail?.good_deal
    };
  };

  const loadSellerProfiles = React.useCallback(async (sellerIds: string[]) => {
    const uniqueIds = Array.from(new Set(sellerIds.filter(Boolean)));
    const missing = uniqueIds.filter((id) => !sellerMetaRef.current[id]);
    if (missing.length === 0) return;
    const results = await Promise.all(
      missing.map(async (id) => {
        try {
          const profile = await getShopProfile(id);
          return { id, profile };
        } catch {
          return { id, profile: null };
        }
      })
    );
    setSellerMeta((prev) => {
      const next = { ...prev };
      results.forEach(({ id, profile }) => {
        if (!profile) return;
        next[id] = {
          rating: numberOrZero(profile.rating ?? profile.stars ?? profile.score ?? profile.trust_score),
          verified: Boolean(profile.verified ?? profile.is_verified ?? profile.isVerified ?? profile.verification?.status === 'verified'),
          location: normalizeLocation(profile.location ?? profile.address ?? profile.shop_location)
        };
      });
      return next;
    });
  }, []);

  const hydrateProductsFromResults = React.useCallback(async (results: SearchResult[]) => {
    const sellerIds = results.map((item) => item.seller_id || '').filter(Boolean);
    await loadSellerProfiles(sellerIds);
    const products = await Promise.all(
      results.map(async (item) => {
        try {
          const detail = await getProduct(item.canonical_id);
          return buildProductFromSearch(item, detail);
        } catch {
          return buildProductFromSearch(item);
        }
      })
    );
    return products.filter((p) => p.id);
  }, [loadSellerProfiles]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const [saved, recent, watchlist, alerts, favorites, trending, recs] = await Promise.all([
          listSavedSearches(),
          listRecentSearches(),
          listWatchlist(),
          listSearchAlerts(),
          listShopFavorites(),
          searchTrending(),
          searchRecommendations()
        ]);
        if (ignore) return;
        setSavedSearches(saved);
        setRecentSearches(recent);
        setWatchlistItems(watchlist);
        setSearchAlerts(alerts);
        setFavoriteShopIds(favorites.map((item: any) => item.seller_id || item.id).filter(Boolean));
        setTrendingQueries(trending);
        const recProducts = await hydrateProductsFromResults(recs);
        if (!ignore) setRecommendedProducts(recProducts);
      } catch (err) {
        if (!ignore) {
          setSavedSearches([]);
          setRecentSearches([]);
          setWatchlistItems([]);
          setSearchAlerts([]);
          setFavoriteShopIds([]);
          setTrendingQueries([]);
          setRecommendedProducts([]);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [hydrateProductsFromResults]);

  const handleUseMyLocation = () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      setLocationQuery('');
      setMaxDistance(null);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMaxDistance(10); // Default to 10km for "Near Me"
          setIsNearMeActive(true);
          setLocationQuery('My Location');
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please check permissions.");
        }
      );
    }
  };

  const handleOpenCamera = async () => {
    if (mediaUploading) return;
    if (isCameraOpen) {
      handleCloseCamera();
      return;
    }
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraOpen(true);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      if (!videoRef.current) {
        throw new Error('Camera view unavailable.');
      }
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play();
    } catch {
      alert('Could not access camera.');
    }
  };

  const handleCloseCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    if (mediaUploading) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (!blob) throw new Error('Unable to capture image.');
      const file = new File([blob], `search_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleMediaFile(file);
    } catch (err: any) {
      setMediaError(err?.message || 'Photo search failed.');
    } finally {
      handleCloseCamera();
    }
  };

  const runSearch = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchProducts([]);
      setSearchQueryId(null);
      setSearchError(null);
      return;
    }
    const runId = ++searchRunRef.current;
    setSearchLoading(true);
    setSearchError(null);
    const lat = isNearMeActive ? userCoords?.lat : undefined;
    const lng = isNearMeActive ? userCoords?.lng : undefined;
    const radius = isNearMeActive ? maxDistance ?? undefined : undefined;
    try {
      const response = await search({
        q: query,
        lat,
        lng,
        radius,
        locationConsent: Boolean(isNearMeActive && userCoords)
      });
      if (runId !== searchRunRef.current) return;
      setSearchQueryId(response.query_id || null);
      const results = response.results || [];
      const hydrated = await hydrateProductsFromResults(results);
      if (runId !== searchRunRef.current) return;
      setSearchProducts(hydrated);
      const recent = await listRecentSearches();
      if (runId === searchRunRef.current) setRecentSearches(recent);
    } catch (err: any) {
      if (runId === searchRunRef.current) {
        setSearchError(err?.message || 'Search failed');
        setSearchProducts([]);
      }
    } finally {
      if (runId === searchRunRef.current) setSearchLoading(false);
    }
  }, [hydrateProductsFromResults, isNearMeActive, maxDistance, userCoords]);

  const handleMediaFile = React.useCallback(async (file: File) => {
    if (mediaUploading) return;
    mediaCancelRef.current = false;
    setMediaUploading(true);
    setMediaError(null);
    if (mediaStatusTimerRef.current) {
      window.clearTimeout(mediaStatusTimerRef.current);
      mediaStatusTimerRef.current = null;
    }
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setMediaUploading(false);
      setMediaError('Unsupported media type.');
      return;
    }
    setMediaStatus(isVideo ? 'Video search queued' : 'Image search queued (OCR + visual)');
    if (isVideo) {
      if (videoPreviewRef.current) {
        URL.revokeObjectURL(videoPreviewRef.current);
      }
      setVideoPreview(URL.createObjectURL(file));
    } else {
      const previewUrl = URL.createObjectURL(file);
      setCapturedPreview(previewUrl);
    }
    try {
      const controller = new AbortController();
      mediaAbortRef.current = controller;
      const context = isVideo ? 'search_video' : 'search_photo';
      const uploaded = await uploadMediaFile(file, context, controller.signal);
      if (mediaCancelRef.current) return;
      const query = searchQuery.trim();
      const payload: MediaSearchRequest = {
        query: query || undefined,
        media_key: uploaded.mediaKey || undefined,
        media_url: uploaded.mediaUrl || undefined,
        mime_type: file.type
      };
      if (isVideo) {
        if (mediaCancelRef.current) return;
        await queueVideoSearch(payload);
        if (mediaCancelRef.current) return;
        if (query) {
          runSearch(query);
        } else {
          setMediaError('Video uploaded. Add a text query to refine results.');
        }
        return;
      }
      if (mediaCancelRef.current) return;
      await Promise.allSettled([
        queueOCRSearch(payload),
        query ? queueHybridSearch(payload) : queuePhotoSearch(payload)
      ]);
      if (mediaCancelRef.current) return;
      if (query) {
        runSearch(query);
      } else {
        setMediaError('Image processed. Add a text query to refine results.');
      }
    } catch (err: any) {
      if (mediaCancelRef.current || err?.name === 'AbortError') {
        setMediaStatus('Media search canceled.');
      } else {
        setMediaError(err?.message || 'Media search failed.');
      }
    } finally {
      mediaAbortRef.current = null;
      setMediaUploading(false);
      if (mediaStatusTimerRef.current) {
        window.clearTimeout(mediaStatusTimerRef.current);
        mediaStatusTimerRef.current = null;
      }
      mediaStatusTimerRef.current = window.setTimeout(() => {
        setMediaStatus(null);
        mediaStatusTimerRef.current = null;
      }, mediaCancelRef.current ? 2500 : 8000);
    }
  }, [mediaUploading, runSearch, searchQuery]);

  const cancelMediaSearch = () => {
    if (!mediaUploading) return;
    mediaCancelRef.current = true;
    if (mediaAbortRef.current) {
      mediaAbortRef.current.abort();
      mediaAbortRef.current = null;
    }
    if (videoPreviewRef.current) {
      URL.revokeObjectURL(videoPreviewRef.current);
    }
    if (capturedPreviewRef.current) {
      URL.revokeObjectURL(capturedPreviewRef.current);
    }
    setVideoPreview(null);
    setCapturedPreview(null);
    setMediaUploading(false);
    setMediaError(null);
    setMediaStatus('Media search canceled.');
  };

  const handleReadResults = () => {
    if (!voiceFeedbackEnabled) {
      alert('Enable Voice-First Feedback in Settings.');
      return;
    }
    const summary = filteredProducts.slice(0, 3).map(p => `${p.name} for ${p.price} shillings`).join('. ');
    if ('speechSynthesis' in window && summary) {
      const utter = new SpeechSynthesisUtterance(`Results: ${summary}.`);
      utter.lang = 'sw-KE';
      window.speechSynthesis.speak(utter);
      return;
    }
    alert('Voice feedback not supported on this browser.');
  };

  const fitPathOnMap = (path: RecordedPath) => {
    if (!mapRef.current || !path.line_geojson) return;
    const mapboxgl = mapboxModuleRef.current;
    if (!mapboxgl) return;
    const coords = path.line_geojson.coordinates || [];
    if (!Array.isArray(coords) || coords.length === 0) return;
    const bounds = coords.reduce(
      (b: any, coord: number[]) => b.extend(coord as [number, number]),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );
    mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 16 });
  };

  const detectLanguage = (text: string): 'English' | 'Swahili' | 'Sheng' => {
    const lower = text.toLowerCase();
    const swahiliHints = ['natafuta', 'bei', 'karibu', 'bidhaa', 'duka', 'risiti', 'sasa', 'hapa', 'tafadhali', 'kesho'];
    const shengHints = ['sasa hivi', 'msee', 'niko', 'poa', 'fiti', 'kitu', 'hii', 'ivo'];
    const swMatch = swahiliHints.some(h => lower.includes(h));
    const shMatch = shengHints.some(h => lower.includes(h));
    if (shMatch) return 'Sheng';
    if (swMatch) return 'Swahili';
    return 'English';
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (recognitionTimeoutRef.current) {
      window.clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    setIsListening(false);
  };

  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported on this browser.');
      return;
    }
    if (isListening && recognitionRef.current) {
      stopListening();
      return;
    }
    setMediaError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = detectedLanguage === 'Swahili' ? 'sw-KE' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (recognitionTimeoutRef.current) {
        window.clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (recognitionTimeoutRef.current) {
        window.clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }
    };
    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      try {
        recognition.stop();
      } catch {}
      if (!transcript) {
        setIsListening(false);
        recognitionRef.current = null;
        return;
      }
      skipAutoSearchRef.current = true;
      setSearchQuery(transcript);
      const nextLang = detectLanguage(transcript);
      setDetectedLanguage(nextLang);
      setTranscriptChips(prev => [transcript, ...prev].slice(0, 5));
      try {
        await queueVoiceSearch({
          query: transcript,
          transcript,
          language: nextLang === 'Swahili' ? 'sw-KE' : 'en-US'
        });
      } catch {}
      await runSearch(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
    recognitionTimeoutRef.current = window.setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }, 12000);
  };

  const trackSearchEvent = React.useCallback((eventType: string, productId?: string) => {
    if (!searchQueryId || !productId) return;
    recordSearchEvent({
      query_id: searchQueryId,
      event_type: eventType,
      canonical_id: productId
    }).catch(() => {});
  }, [searchQueryId]);

  const refreshAlerts = React.useCallback(async () => {
    try {
      const alerts = await listSearchAlerts();
      setSearchAlerts(alerts);
    } catch {}
  }, []);

  const refreshWatchlist = React.useCallback(async () => {
    try {
      const items = await listWatchlist();
      setWatchlistItems(items);
    } catch {}
  }, []);

  const handleCreateAlert = async (saved: SavedSearch) => {
    if (!saved.query_hash) return;
    const frequency = alertFrequency[saved.id] || 'daily';
    try {
      await createSearchAlert({ query_hash: saved.query_hash, frequency });
      refreshAlerts();
    } catch {}
  };

  const handleRemoveSavedSearch = async (saved: SavedSearch) => {
    try {
      await deleteSavedSearch(saved.id);
      const nextSaved = savedSearches.filter((item) => item.id !== saved.id);
      setSavedSearches(nextSaved);
      refreshAlerts();
    } catch {}
  };

  const handleToggleAlert = async (alert: SearchAlert) => {
    const nextStatus = alert.status === 'paused' ? 'active' : 'paused';
    try {
      await updateSearchAlert(alert.id, { status: nextStatus });
      refreshAlerts();
    } catch {}
  };

  const handleAddWatchlist = async (product: Product) => {
    const raw = window.prompt('Target price (KES)', String(product.price));
    if (!raw) return;
    const target = Number(raw);
    if (!Number.isFinite(target) || target <= 0) {
      alert('Enter a valid target price.');
      return;
    }
    try {
      await addWatchlistItem({ canonical_id: product.id, target_price: target });
      refreshWatchlist();
    } catch {}
  };

  const handleUpdateWatchlist = async (item: WatchlistItem) => {
    const raw = watchlistTargets[item.id] ?? String(item.target_price);
    const target = Number(raw);
    if (!Number.isFinite(target) || target <= 0) {
      alert('Enter a valid target price.');
      return;
    }
    try {
      await updateWatchlistItem(item.id, { target_price: target });
      refreshWatchlist();
    } catch {}
  };

  const handleRemoveWatchlist = async (item: WatchlistItem) => {
    try {
      await deleteWatchlistItem(item.id);
      refreshWatchlist();
    } catch {}
  };

  const handleRemoveAlert = async (alert: SearchAlert) => {
    try {
      await deleteSearchAlert(alert.id);
      refreshAlerts();
    } catch {}
  };

  const handleSaveSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      const saved = await saveSearch(query);
      setSavedSearches((prev) => [saved, ...prev.filter((item) => item.query !== saved.query)].slice(0, 8));
    } catch {}
  };

  const recordSearch = () => {
    runSearch(searchQuery);
  };

  const toggleFavoriteShop = async (shopId: string) => {
    try {
      if (favoriteShopIds.includes(shopId)) {
        await removeShopFavorite(shopId);
        setFavoriteShopIds((prev) => prev.filter((id) => id !== shopId));
      } else {
        await addShopFavorite(shopId);
        setFavoriteShopIds((prev) => [shopId, ...prev]);
      }
    } catch {}
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchProducts([]);
      setSearchQueryId(null);
      return;
    }
    if (skipAutoSearchRef.current) {
      skipAutoSearchRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      runSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timeout);
  }, [runSearch, searchQuery]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (recognitionTimeoutRef.current) {
        window.clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }
      if (videoPreviewRef.current) {
        URL.revokeObjectURL(videoPreviewRef.current);
      }
      if (capturedPreviewRef.current) {
        URL.revokeObjectURL(capturedPreviewRef.current);
      }
      if (mediaStatusTimerRef.current) {
        window.clearTimeout(mediaStatusTimerRef.current);
        mediaStatusTimerRef.current = null;
      }
      if (mediaAbortRef.current) {
        mediaAbortRef.current.abort();
        mediaAbortRef.current = null;
      }
      if (recordingWatchIdRef.current) {
        navigator.geolocation.clearWatch(recordingWatchIdRef.current);
        recordingWatchIdRef.current = null;
      }
      mapPopupRef.current?.remove();
      mapPopupRef.current = null;
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      mapReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const items = Array.from(event.clipboardData.items || []);
      const fileItem = items.find((item) => item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/')));
      if (!fileItem) return;
      const file = fileItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      handleMediaFile(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleMediaFile]);

  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!searchQuery.trim()) {
      setMapProducts([]);
      return;
    }
    let ignore = false;
    const run = async () => {
      const lat = isNearMeActive ? userCoords?.lat : undefined;
      const lng = isNearMeActive ? userCoords?.lng : undefined;
      const radius = isNearMeActive ? maxDistance ?? undefined : undefined;
      try {
        const items = await searchMap({
          q: searchQuery,
          lat,
          lng,
          radius,
          locationConsent: Boolean(isNearMeActive && userCoords)
        });
        const hydrated = await hydrateProductsFromResults(items);
        if (!ignore) setMapProducts(hydrated);
      } catch {
        if (!ignore) setMapProducts([]);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [viewMode, searchQuery, isNearMeActive, userCoords, maxDistance, hydrateProductsFromResults]);

  useEffect(() => {
    if (viewMode !== 'map') return;
    void ensureMap();
  }, [ensureMap, viewMode]);

  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return;
    const source = mapRef.current.getSource('recording-path') as any;
    if (!source) return;
    const coords = recordingPoints.map((p) => [p.lng, p.lat]);
    const data = coords.length >= 2
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: coords
              },
              properties: {}
            }
          ]
        }
      : { type: 'FeatureCollection', features: [] };
    source.setData(data as any);
  }, [recordingPoints, mapReadyVersion]);

  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return;
    const popularSource = mapRef.current.getSource('popular-paths') as any;
    if (popularSource) {
      const features = showPopularPaths
        ? popularPaths.map((path) => path.line_geojson ? ({
            type: 'Feature',
            geometry: path.line_geojson,
            properties: {
              id: path.id,
              name: path.name,
              usage_count: path.usage_count || 0
            }
          }) : null).filter(Boolean)
        : [];
      popularSource.setData({ type: 'FeatureCollection', features } as any);
    }
    const mySource = mapRef.current.getSource('my-paths') as any;
    if (mySource) {
      const features = showMyPaths
        ? myPaths.map((path) => path.line_geojson ? ({
            type: 'Feature',
            geometry: path.line_geojson,
            properties: {
              id: path.id,
              name: path.name,
              shared: path.shared
            }
          }) : null).filter(Boolean)
        : [];
      mySource.setData({ type: 'FeatureCollection', features } as any);
    }
  }, [mapReadyVersion, myPaths, popularPaths, showMyPaths, showPopularPaths]);

  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapRef.current || !userCoords) return;
    const mapboxgl = mapboxModuleRef.current;
    if (!mapboxgl) return;
    mapRef.current.setCenter([userCoords.lng, userCoords.lat]);
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-lg';
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userCoords.lng, userCoords.lat])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([userCoords.lng, userCoords.lat]);
    }
  }, [userCoords, viewMode]);

  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapRef.current || !mapReadyRef.current) return;
    let timeout: number | null = null;
    const handleIdle = () => {
      if (!mapRef.current || !mapReadyRef.current) return;
      const bounds = mapRef.current.getBounds();
      if (!bounds) return;
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ].join(',');
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(async () => {
        try {
          const [popular, mine] = await Promise.all([
            listPopularPaths({ bbox, limit: 50 }),
            listMyPaths()
          ]);
          setPopularPaths(popular);
          setMyPaths(mine);
        } catch {}
      }, 300);
    };
    mapRef.current.on('idle', handleIdle);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      mapRef.current?.off('idle', handleIdle);
    };
  }, [viewMode]);

  useEffect(() => {
    if (!userCoords || viewMode !== 'map') return;
    const target = routeTargetRef.current;
    if (!target) return;
    updateRoute(target.lng, target.lat);
  }, [routeProfile, updateRoute, userCoords, viewMode]);

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
        setUserCoords(point);
        if (routeManeuversRef.current.length > 0) {
          const idx = routeStepIndexRef.current;
          const next = routeManeuversRef.current[idx];
          if (next?.location) {
            const dist = haversine({ lat: point.lat, lng: point.lng }, { lat: next.location[1], lng: next.location[0] });
            if (dist < 25 && idx < routeManeuversRef.current.length - 1) {
              routeStepIndexRef.current = idx + 1;
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
    if (!voiceDirectionsEnabled || viewMode !== 'map' || isRecording) {
      stopNavWatch();
      return;
    }
    if (!routeManeuversRef.current.length) {
      stopNavWatch();
      return;
    }
    beginNavWatch();
    return () => stopNavWatch();
  }, [isRecording, routeSteps.length, viewMode, voiceDirectionsEnabled]);

  const beginRecordingWatch = () => {
    if (!navigator.geolocation) {
      setMapStatus('Geolocation not supported.');
      return;
    }
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          recorded_at: new Date().toISOString()
        };
        setRecordingPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segment = haversine({ lat: last.lat, lng: last.lng }, { lat: point.lat, lng: point.lng });
            setRecordingDistance((dist) => dist + segment);
          }
          return [...prev, point];
        });
        if (routeManeuversRef.current.length > 0) {
          const idx = routeStepIndexRef.current;
          const next = routeManeuversRef.current[idx];
          if (next?.location) {
            const dist = haversine({ lat: point.lat, lng: point.lng }, { lat: next.location[1], lng: next.location[0] });
            if (dist < 25 && idx < routeManeuversRef.current.length - 1) {
              routeStepIndexRef.current = idx + 1;
              speak(next.instruction);
            }
          }
        }
      },
      () => {
        setMapStatus('Unable to read GPS location.');
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
    speak('Recording started. Follow your path.');
    beginRecordingWatch();
  };

  const pauseRecording = () => {
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
      recordingWatchIdRef.current = null;
    }
    setRecordingPaused(true);
    speak('Recording paused.');
  };

  const resumeRecording = () => {
    if (!isRecording) return;
    setRecordingPaused(false);
    speak('Recording resumed.');
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
      setMapStatus('Record at least two points.');
      return;
    }
    try {
      const saved = await recordPath({
        name: recordingName || 'Recorded path',
        shared: recordingShared,
        points: recordingPoints
      });
      setMyPaths((prev) => [saved, ...prev]);
      setShowRecordingPanel(false);
      setRecordingName('');
      setRecordingShared(false);
      setRecordingPoints([]);
      setRecordingDistance(0);
      setRecordingStart(null);
      setMapStatus('Path saved.');
    } catch (err: any) {
      setMapStatus(err?.message || 'Unable to save path.');
    }
  };

  const handleVerifyPath = async (pathId: string) => {
    setPathVerifying((prev) => ({ ...prev, [pathId]: true }));
    setMapStatus(null);
    try {
      const resp = await verifyPath(pathId);
      const verified = Boolean(resp?.verified);
      setPopularPaths((prev) => prev.map((p) => (p.id === pathId ? { ...p, verified } : p)));
      setMyPaths((prev) => prev.map((p) => (p.id === pathId ? { ...p, verified } : p)));
      if (!verified) {
        setMapStatus('Verification recorded. More confirmations needed.');
      }
    } catch (err: any) {
      setMapStatus(err?.message || 'Unable to verify path.');
    } finally {
      setPathVerifying((prev) => ({ ...prev, [pathId]: false }));
    }
  };

  useEffect(() => {
    if (viewMode !== 'map') return;
    if (userCoords) return;
    setRouteInfo(null);
    setRouteSteps([]);
    if (mapRef.current && mapReadyRef.current) {
      const source = mapRef.current.getSource('route-line') as any;
      source?.setData({ type: 'FeatureCollection', features: [] } as any);
    }
  }, [userCoords, viewMode]);

  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationSuggestions([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const results = await fetchMapboxSuggestions(locationQuery);
        if (active) setLocationSuggestions(results);
      } catch {
        if (active) setLocationSuggestions([]);
      }
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locationQuery]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const shops = await searchShops({
          query: searchQuery || undefined,
          category: selectedCategory || undefined,
          minRating: minRating || undefined,
          lat: isNearMeActive ? userCoords?.lat : undefined,
          lng: isNearMeActive ? userCoords?.lng : undefined,
          radiusKm: isNearMeActive ? maxDistance ?? undefined : undefined
        });
        if (!ignore) setShopResults(shops);
      } catch {
        if (!ignore) setShopResults([]);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [searchQuery, selectedCategory, minRating, isNearMeActive, userCoords, maxDistance]);

  useEffect(() => {
    if (watchlistItems.length === 0) {
      setWatchlistProducts([]);
      return;
    }
    let ignore = false;
    const run = async () => {
      const results: SearchResult[] = watchlistItems.map((item) => ({
        canonical_id: item.canonical_id
      }));
      try {
        const hydrated = await hydrateProductsFromResults(results);
        if (!ignore) setWatchlistProducts(hydrated);
      } catch {
        if (!ignore) setWatchlistProducts([]);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [watchlistItems, hydrateProductsFromResults]);

  useEffect(() => {
    if (Object.keys(sellerMeta).length === 0) return;
    const applyMeta = (items: Product[]) =>
      items.map((item) => {
        const meta = sellerMeta[item.sellerId];
        if (!meta?.location) return item;
        return {
          ...item,
          location: {
            lat: item.location?.lat ?? meta.location.lat ?? 0,
            lng: item.location?.lng ?? meta.location.lng ?? 0,
            address: meta.location.address || item.location?.address || ''
          }
        };
      });
    setSearchProducts((prev) => applyMeta(prev));
    setMapProducts((prev) => applyMeta(prev));
    setRecommendedProducts((prev) => applyMeta(prev));
    setWatchlistProducts((prev) => applyMeta(prev));
  }, [sellerMeta]);

  const categories = useMemo(() => {
    const pool = [...searchProducts, ...recommendedProducts, ...watchlistProducts];
    return Array.from(new Set(pool.map((p) => p.category).filter(Boolean)));
  }, [searchProducts, recommendedProducts, watchlistProducts]);

  const watchlistById = useMemo(() => {
    const map = new Map<string, WatchlistItem>();
    watchlistItems.forEach((item) => map.set(item.canonical_id, item));
    return map;
  }, [watchlistItems]);

  const alertSummary = useMemo(() => {
    return searchAlerts.map((alert) => {
      const match = savedSearches.find((item) => item.query_hash === alert.query_hash);
      return {
        id: alert.id,
        query: match?.query || alert.query_hash || 'Alert',
        frequency: alert.frequency || 'daily',
        status: alert.status || 'active'
      };
    });
  }, [searchAlerts, savedSearches]);

  const alertByHash = useMemo(() => {
    const map = new Map<string, SearchAlert>();
    searchAlerts.forEach((alert) => {
      if (alert.query_hash) map.set(alert.query_hash, alert);
    });
    return map;
  }, [searchAlerts]);

  const filteredProducts = useMemo(() => {
    let results = [...searchProducts];
    if (selectedCategory) {
      results = results.filter((p) => p.category === selectedCategory);
    }
    results = results.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (minRating > 0) {
      results = results.filter((p) => (sellerMeta[p.sellerId]?.rating || 0) >= minRating);
    }
    if (verifiedOnly) {
      results = results.filter((p) => Boolean(sellerMeta[p.sellerId]?.verified));
    }

    if (isNearMeActive && userCoords) {
      results = results.filter((p) => {
        if (!p.location) return false;
        const dist = calculateDistance(userCoords.lat, userCoords.lng, p.location.lat, p.location.lng);
        return dist <= (maxDistance || 10);
      });
    } else if (locationQuery && locationQuery !== 'My Location') {
      const query = locationQuery.toLowerCase();
      results = results.filter((p) => {
        const address = p.location?.address || sellerMeta[p.sellerId]?.location?.address || '';
        return address.toLowerCase().includes(query);
      });
    }

    if (sortBy === 'price_asc') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') {
      results.sort((a, b) => {
        const rA = (sellerMeta[a.sellerId]?.rating || 0) + (sellerMeta[a.sellerId]?.verified ? 0.3 : 0);
        const rB = (sellerMeta[b.sellerId]?.rating || 0) + (sellerMeta[b.sellerId]?.verified ? 0.3 : 0);
        return rB - rA;
      });
    }

    return results;
  }, [searchProducts, selectedCategory, priceRange, minRating, sortBy, userCoords, maxDistance, locationQuery, isNearMeActive, sellerMeta]);

  const filteredShops = useMemo(() => {
    const query = locationQuery && locationQuery !== 'My Location' ? locationQuery.toLowerCase() : '';
    const shops = shopResults.filter((shop) => {
      if (!query) return true;
      const loc = normalizeLocation(shop.location);
      return (loc?.address || '').toLowerCase().includes(query);
    });
    return shops.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [shopResults, locationQuery]);

  const recentSearchSummary = useMemo(() => {
    return recentSearches.slice(0, 5).map((item) => {
      const ts = item.created_at ? new Date(item.created_at).getTime() : Date.now();
      const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
      return {
        id: item.id,
        name: item.query,
        time: mins >= 60 ? `${Math.round(mins / 60)} hrs ago` : `${mins} mins ago`
      };
    });
  }, [recentSearches]);

  const mapItems = viewMode === 'map'
    ? (mapProducts.length > 0 ? mapProducts : filteredProducts)
    : filteredProducts;

  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapRef.current || !mapReadyRef.current) return;
    const source = mapRef.current.getSource('products') as any;
    if (!source) return;
    const features = mapItems
      .filter((product) => product.location)
      .map((product) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [product.location!.lng, product.location!.lat]
        },
        properties: {
          productId: product.id,
          name: product.name,
          price: product.price,
          lng: product.location!.lng,
          lat: product.location!.lat
        }
      }));
    source.setData({ type: 'FeatureCollection', features } as any);
  }, [mapItems, mapReadyVersion, viewMode]);
  const recordingElapsedSec = recordingStart ? Math.max(0, Math.round((Date.now() - recordingStart) / 1000)) : 0;
  const recordingPointCount = recordingPoints.length;
  const recordingGoal = 10;
  const recordingProgress = Math.min(1, recordingPointCount / recordingGoal);

  useEffect(() => {
    mapItemsRef.current = mapItems;
  }, [mapItems]);

  return (
    <div
      className="h-full bg-zinc-50 flex flex-col overflow-hidden"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) handleMediaFile(file);
      }}
    >
      {/* Search Header */}
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-20">
        <div className="flex gap-3 items-center mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  recordSearch();
                }
              }}
              placeholder="Search products, shops, or snap a photo..." 
              className="w-full pl-10 pr-24 py-2.5 bg-zinc-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-zinc-900"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={recordSearch}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                title="Search"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={handleStartListening}
                className={`p-1.5 transition-colors ${isListening ? 'text-emerald-600' : 'text-zinc-400 hover:text-indigo-600'}`}
                title="Voice search"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                title="Add media"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {isListening && (
          <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-[10px] font-black mb-2">
            <span>Recording… {String(Math.floor(voiceSeconds / 60)).padStart(2, '0')}:{String(voiceSeconds % 60).padStart(2, '0')}</span>
            <button
              onClick={stopListening}
              className="px-3 py-1 rounded-full bg-emerald-600 text-white"
            >
              Stop
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickActions((prev) => !prev)}
              className="px-3 py-1.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600 hover:text-indigo-600 transition-colors"
            >
              More
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-colors ${showFilters ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
            >
              Filters
            </button>
          </div>
          {mediaUploading && (
            <div className="text-[10px] font-bold text-indigo-600">
              Uploading…
            </div>
          )}
        </div>
        {showQuickActions && (
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={handleSaveSearch}
              className="px-3 py-1.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600 hover:text-indigo-600 transition-colors"
              title="Save this search"
            >
              Save
            </button>
            <button
              onClick={handleReadResults}
              className="px-3 py-1.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600 hover:text-indigo-600 transition-colors"
              title="Read results aloud"
            >
              Read
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <div className="px-3 py-1.5 bg-zinc-100 rounded-full text-[10px] font-black text-zinc-600">
            Detected: {detectedLanguage}
          </div>
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-black ${isListening ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {isListening ? 'Listening...' : 'Voice ready'}
          </div>
          {mediaStatus && (
            <div className="px-3 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-700">
              {mediaStatus}
            </div>
          )}
          {mediaUploading && (
            <button
              onClick={cancelMediaSearch}
              className="px-3 py-1.5 rounded-full text-[10px] font-black bg-red-50 text-red-600"
            >
              Cancel media
            </button>
          )}
          {initialAction && (
            <div className="px-3 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-700">
              {initialAction === 'voice' && 'Voice Search Active'}
              {initialAction === 'photo' && 'Photo Search Active'}
              {initialAction === 'video' && 'Video Search Active'}
              {initialAction === 'hybrid' && 'Hybrid Search Active'}
            </div>
          )}
        </div>

        {transcriptChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {transcriptChips.map((t) => (
              <button
                key={t}
                onClick={() => setSearchQuery(t)}
                className="px-3 py-1.5 bg-indigo-50 rounded-full text-[10px] font-bold text-indigo-700"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) handleMediaFile(file);
          }}
        />

        {/* Quick Actions & Categories */}
        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={handleUseMyLocation}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${isNearMeActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}
          >
            <Navigation className="w-3 h-3" /> Near Me
          </button>

          <div className="w-px h-4 bg-zinc-200 mx-1" />

          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative">
        {isDragActive && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-indigo-900/10 border-2 border-dashed border-indigo-400 rounded-3xl">
            <div className="px-4 py-2 bg-white rounded-full text-xs font-bold text-indigo-700 shadow">
              Drop an image or video to search
            </div>
          </div>
        )}
        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
            {searchLoading ? 'Searching...' : `${filteredProducts.length} Results Found`}
          </h3>
          <div className="flex bg-zinc-200/50 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {(searchError || mediaError || mediaUploading) && (
          <div className="mb-4 text-[10px] font-bold text-rose-500">
            {searchError || mediaError || 'Uploading media...'}
          </div>
        )}

        {viewMode === 'map' ? (
          <>
            <div className="relative h-[360px] sm:h-[520px] w-full rounded-3xl overflow-hidden border-2 border-zinc-200 bg-zinc-100">
              <div ref={mapContainerRef} className="absolute inset-0" />
              {!mapboxToken && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70 text-white text-xs font-bold">
                  Mapbox token missing. Add VITE_MAPBOX_TOKEN to enable maps.
                </div>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <div className="bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-2xl p-2 flex items-center gap-2">
                  <button
                    onClick={() => setShowPathsPanel((prev) => !prev)}
                    className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-black"
                  >
                    Paths
                  </button>
                  <button
                    onClick={() => {
                      const next = !voiceDirectionsEnabled;
                      setVoiceDirectionsEnabled(next);
                      void updateUiPreferences({
                        voice_feedback_enabled: voiceFeedbackEnabled,
                        voice_directions_enabled: next
                      }).catch(() => {});
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black ${voiceDirectionsEnabled ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {voiceDirectionsEnabled ? 'Voice On' : 'Voice Off'}
                  </button>
                </div>
                <div className="bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-2xl p-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isRecording) {
                        stopRecording();
                      } else {
                        startRecording();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black ${isRecording ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
                  >
                    {isRecording ? 'Stop Recording' : 'Record Path'}
                  </button>
                  {isRecording && (
                    <button
                      onClick={recordingPaused ? resumeRecording : pauseRecording}
                      className="px-3 py-1.5 rounded-full bg-zinc-100 text-[10px] font-black text-zinc-700"
                    >
                      {recordingPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                </div>
              </div>
              {isRecording && (
                <div className="absolute top-4 left-4 bg-rose-600/90 text-white px-3 py-2 rounded-2xl text-[10px] font-bold shadow space-y-1">
                  <div>
                    Recording… {Math.round(recordingDistance)}m · {Math.floor(recordingElapsedSec / 60)}m {recordingElapsedSec % 60}s
                  </div>
                  <div className="text-[9px] text-white/80">Points: {recordingPointCount} / {recordingGoal}</div>
                </div>
              )}
              {showPathsPanel && (
                <div className="absolute top-20 right-4 w-72 bg-white/95 backdrop-blur rounded-2xl border border-white shadow-xl p-4 space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Paths</div>
                    <button
                      onClick={() => setShowPathsPanel(false)}
                      className="text-[10px] font-black text-zinc-400"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span>Popular paths</span>
                    <input
                      type="checkbox"
                      checked={showPopularPaths}
                      onChange={(e) => setShowPopularPaths(e.target.checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span>My paths</span>
                    <input
                      type="checkbox"
                      checked={showMyPaths}
                      onChange={(e) => setShowMyPaths(e.target.checked)}
                    />
                  </div>
                  {showMyPaths && myPaths.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {myPaths.slice(0, 5).map((path) => (
                        <div key={path.id} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              fitPathOnMap(path);
                              recordPathUse(path.id).catch(() => {});
                            }}
                            className="flex-1 text-left px-3 py-2 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                          >
                            {path.name || 'Recorded path'}
                            {path.shared && <span className="ml-2 text-[9px] text-emerald-600">Shared</span>}
                          </button>
                          {path.verified ? (
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black">
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyPath(path.id);
                              }}
                              disabled={pathVerifying[path.id]}
                              className="px-2 py-1 rounded-full bg-white text-[9px] font-black text-indigo-600 border border-indigo-100 disabled:opacity-50"
                            >
                              {pathVerifying[path.id] ? '...' : 'Verify'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {showPopularPaths && popularPaths.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {popularPaths.slice(0, 5).map((path) => (
                        <div key={path.id} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              fitPathOnMap(path);
                              recordPathUse(path.id).catch(() => {});
                            }}
                            className="flex-1 text-left px-3 py-2 bg-amber-50 rounded-xl text-[10px] font-bold text-zinc-700"
                          >
                            {path.name || 'Popular path'}
                            {path.usage_count ? (
                              <span className="ml-2 text-[9px] text-amber-600">{path.usage_count} uses</span>
                            ) : null}
                          </button>
                          {path.verified ? (
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black">
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyPath(path.id);
                              }}
                              disabled={pathVerifying[path.id]}
                              className="px-2 py-1 rounded-full bg-white text-[9px] font-black text-indigo-600 border border-indigo-100 disabled:opacity-50"
                            >
                              {pathVerifying[path.id] ? '...' : 'Verify'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {routeInfo && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-white shadow-xl text-[10px] font-bold text-zinc-700">
                  Route: {routeInfo.distanceKm} km · {routeInfo.durationMin} min
                </div>
              )}
              <div className="absolute top-4 right-32 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white shadow-xl flex flex-wrap gap-1 text-[9px] font-bold text-zinc-700">
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
                    onClick={() => setRouteProfile(opt.value as any)}
                    className={`px-2 py-1 rounded-full ${routeProfile === opt.value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 pb-3 px-3 sm:px-4">
                <div className="bg-white/95 backdrop-blur-md rounded-t-3xl border border-white shadow-2xl p-4 space-y-3 max-h-[45vh] overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-zinc-900">Nearby Market View</p>
                      <p className="text-[10px] text-zinc-500">Showing {mapItems.length} items within your area</p>
                      {mapStatus && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1">{mapStatus}</p>
                      )}
                    </div>
                  </div>
                  {routeSteps.length > 0 && (
                    <div className="max-h-32 overflow-auto text-[10px] text-zinc-700 space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Directions</div>
                      {routeSteps.slice(0, 6).map((step, idx) => (
                        <div key={`route-step-${idx}`} className="flex items-center justify-between gap-2">
                          <span className="font-bold">{step.instruction}</span>
                          <span className="text-[9px] text-zinc-500">
                            {Math.max(1, Math.round(step.distance / 10) * 10)}m · {Math.max(1, Math.round(step.duration / 60))}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {routeSteps.length === 0 && routeInfo && (
                    <div className="text-[10px] font-bold text-zinc-600">
                      Directions unavailable. Enable location services and try again.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <AnimatePresence>
              {showRecordingPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm"
                >
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
                    <span>{recordingPointCount} / {recordingGoal} points</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round(recordingProgress * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={saveRecording}
                  disabled={recordingPoints.length < 2}
                  className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-50"
                >
                  Save Path
                </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Saved Searches</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{savedSearches.length} saved</span>
                </div>
                <div className="flex flex-col gap-2">
                  {savedSearches.map((item) => {
                    const existingAlert = item.query_hash ? alertByHash.get(item.query_hash) : undefined;
                    const frequency = alertFrequency[item.id] || 'daily';
                    return (
                      <div key={item.id || item.query} className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSearchQuery(item.query)}
                          className="px-3 py-1.5 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          {item.query}
                        </button>
                        <select
                          value={frequency}
                          onChange={(e) => setAlertFrequency((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className="px-2 py-1 rounded-full text-[9px] font-bold bg-zinc-50 border border-zinc-100 text-zinc-600"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <button
                          onClick={() => handleCreateAlert(item)}
                          disabled={Boolean(existingAlert)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${existingAlert ? 'bg-zinc-200 text-zinc-500' : 'bg-amber-500 text-white'}`}
                        >
                          {existingAlert ? 'Alerted' : 'Create Alert'}
                        </button>
                        <button
                          onClick={() => handleRemoveSavedSearch(item)}
                          className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-zinc-200 text-zinc-700"
                        >
                          Remove
                        </button>
                        {existingAlert?.status && (
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">
                            {existingAlert.status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {alertSummary.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Search Alerts</h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold">{alertSummary.length} active</span>
                </div>
                <div className="space-y-2">
                  {alertSummary.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                      <span className="truncate">{alert.query}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">{alert.frequency}</span>
                        <button
                          onClick={() => {
                            const full = searchAlerts.find((item) => item.id === alert.id);
                            if (full) handleToggleAlert(full);
                          }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-zinc-100 text-zinc-600"
                        >
                          {alert.status === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={() => {
                            const full = searchAlerts.find((item) => item.id === alert.id);
                            if (full) handleRemoveAlert(full);
                          }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-zinc-200 text-zinc-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Drop Alerts */}
            {watchlistProducts.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price Drop Alerts</h3>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold">Watchlist</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {watchlistProducts.slice(0, 4).map((product) => {
                    const watchItem = watchlistById.get(product.id);
                    const targetPrice = watchItem?.target_price ?? product.price;
                    const targetValue = watchItem ? (watchlistTargets[watchItem.id] ?? String(watchItem.target_price)) : '';
                    return (
                    <div
                      key={product.id}
                      onClick={() => {
                        trackSearchEvent('view', product.id);
                        onProductOpen(product);
                      }}
                      role="button"
                      className="p-3 bg-zinc-50 rounded-xl flex items-center gap-3 text-left cursor-pointer"
                    >
                      <img src={product.mediaUrl} className="w-10 h-10 rounded-lg object-cover" alt={product.name} />
                      <div>
                        <p className="text-xs font-bold text-zinc-900 line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">
                          Target: KES {targetPrice}
                        </p>
                        {product.price <= targetPrice && (
                          <p className="text-[10px] text-amber-600 font-bold">Alert ready</p>
                        )}
                        {watchItem && (
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              type="number"
                              value={targetValue}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setWatchlistTargets((prev) => ({ ...prev, [watchItem.id]: e.target.value }))}
                              className="w-20 px-2 py-1 text-[9px] font-bold rounded-lg bg-white border border-zinc-200"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateWatchlist(watchItem);
                              }}
                              className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-indigo-600 text-white"
                            >
                              Update
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveWatchlist(watchItem);
                              }}
                              className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-zinc-200 text-zinc-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* Trending Near You */}
            {trendingQueries.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Trending Near You</h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold">Live</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingQueries.map(term => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1.5 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-700"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* For You */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recommended For You</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">Based on searches</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {recommendedProducts.slice(0, 4).map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      trackSearchEvent('view', product.id);
                      onProductOpen(product);
                    }}
                    className="p-3 bg-zinc-50 rounded-xl flex items-center gap-3 text-left"
                  >
                    <img src={product.mediaUrl} className="w-10 h-10 rounded-lg object-cover" alt={product.name} />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 line-clamp-1">{product.name}</p>
                      <p className="text-[10px] text-zinc-500">{product.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recent Searches</h3>
              </div>
              <div className="space-y-2">
                {recentSearchSummary.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                    <span>{item.name}</span>
                    <span className="text-zinc-400">{item.time}</span>
                  </div>
                ))}
                {recentSearchSummary.length === 0 && (
                  <div className="text-[10px] font-bold text-zinc-400">No recent searches yet.</div>
                )}
              </div>
            </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-white p-4 rounded-2xl border border-zinc-100 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filters</div>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setPriceRange([0, 1000]);
                          setMinRating(0);
                          setSortBy('rating');
                          setVerifiedOnly(false);
                          setLocationQuery('');
                          setUserCoords(null);
                          setIsNearMeActive(false);
                          setMaxDistance(null);
                        }}
                        className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-zinc-100 text-zinc-600"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Category</label>
                        <select
                          value={selectedCategory || ''}
                          onChange={(e) => setSelectedCategory(e.target.value || null)}
                          className="w-full bg-zinc-50 border-none rounded-xl text-xs font-bold p-2.5 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Sort</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'rating', label: 'Top Rated' },
                            { value: 'price_asc', label: 'Low → High' },
                            { value: 'price_desc', label: 'High → Low' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setSortBy(opt.value as any)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black ${sortBy === opt.value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Trust</label>
                        <div className="flex flex-wrap gap-2">
                          {[0, 4, 4.5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setMinRating(rating)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black ${minRating === rating ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                            >
                              {rating === 0 ? 'Any' : `${rating}+`}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setVerifiedOnly((prev) => !prev)}
                          className={`mt-2 w-full px-3 py-2 rounded-xl text-[10px] font-black ${verifiedOnly ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                        >
                          {verifiedOnly ? 'Verified Sellers Only' : 'Include Unverified'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Price Range</label>
                        <span className="text-xs font-black text-indigo-600">${priceRange[0]} - ${priceRange[1]}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-zinc-400">Min</div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1000" 
                            step="10"
                            value={priceRange[0]}
                            onChange={(e) => {
                              const next = Math.min(parseInt(e.target.value), priceRange[1]);
                              setPriceRange([next, priceRange[1]]);
                            }}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-zinc-400">Max</div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1000" 
                            step="10"
                            value={priceRange[1]}
                            onChange={(e) => {
                              const next = Math.max(parseInt(e.target.value), priceRange[0]);
                              setPriceRange([priceRange[0], next]);
                            }}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          value={locationQuery}
                          onChange={(e) => {
                            setLocationQuery(e.target.value);
                            if (e.target.value !== 'My Location') {
                              setUserCoords(null);
                              setIsNearMeActive(false);
                            }
                          }}
                          placeholder="City or address..." 
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                        />
                        {locationSuggestions.length > 0 && (
                          <div className="absolute z-20 mt-2 w-full bg-white rounded-2xl border border-zinc-100 shadow-lg overflow-hidden">
                            {locationSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.id}
                                onClick={() => {
                                  setLocationQuery(suggestion.label);
                                  setUserCoords({ lat: suggestion.lat, lng: suggestion.lng });
                                  setIsNearMeActive(true);
                                  setMaxDistance((prev) => prev ?? 10);
                                  setLocationSuggestions([]);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-zinc-700 hover:bg-indigo-50"
                              >
                                {suggestion.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {userCoords && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">Radius</label>
                            <span className="text-xs font-black text-indigo-600">{maxDistance} km</span>
                          </div>
                          <input 
                            type="range" 
                            min="5" 
                            max="500" 
                            step="5"
                            value={maxDistance || 50}
                            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={handleUseMyLocation}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${isNearMeActive ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                        >
                          <Navigation className="w-4 h-4" /> {isNearMeActive ? 'Near Me Active' : 'Use Nearby'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!mapRef.current) return;
                            const center = mapRef.current.getCenter();
                            const picked = await reverseGeocode(center.lng, center.lat);
                            if (!picked) return;
                            setLocationQuery(picked.label);
                            setUserCoords({ lat: picked.lat, lng: picked.lng });
                            setIsNearMeActive(true);
                            setMaxDistance((prev) => prev ?? 10);
                            setLocationSuggestions([]);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold bg-zinc-100 text-zinc-600 hover:text-indigo-600"
                        >
                          Use Map Pin
                        </button>
                      </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shops */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Shops</h3>
                <span className="text-[10px] font-bold text-zinc-400">{filteredShops.length} Shops</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {filteredShops.slice(0, 6).map((shop) => {
                  const shopId = shop.id || shop.seller_id || '';
                  const shopLocation = normalizeLocation(shop.location);
                  const shopName = shop.name || 'Shop';
                  const shopDescription = shop.category || shopLocation?.address || 'Local shop';
                  const shopAvatar = (shop as any).avatar || (shop as any).logo_url || (shop as any).image_url || '';
                  return (
                  <div
                    key={shopId || shopName}
                    role="button"
                    tabIndex={0}
                    onClick={() => shopId && onShopOpen(shopId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && shopId) onShopOpen(shopId);
                    }}
                    className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between text-left hover:border-indigo-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {shopAvatar ? (
                        <img src={shopAvatar} className="w-12 h-12 rounded-full object-cover" alt={shopName} />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-black">
                          {shopName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{shopName}</p>
                        <p className="text-[10px] text-zinc-500">{shopDescription}</p>
                        {shopLocation?.address && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold mt-1">
                            <MapPin className="w-3 h-3" /> {shopLocation.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                      ★ {shop.rating || 0}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (shopId) toggleFavoriteShop(shopId);
                      }}
                      className={`ml-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${favoriteShopIds.includes(shopId) ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {favoriteShopIds.includes(shopId) ? 'Favorited' : 'Favorite'}
                    </button>
                  </div>
                );
                })}
                {filteredShops.length === 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    No shops found for this search.
                  </div>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-zinc-100 overflow-hidden flex flex-col shadow-sm cursor-pointer group"
                  onClick={() => {
                    trackSearchEvent('view', product.id);
                    onProductOpen(product);
                  }}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img src={product.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isGoodDeal && (
                        <div className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <TrendingUp className="w-2 h-2" /> GOOD DEAL
                        </div>
                      )}
                      {product.stockStatus === 'low_stock' && (
                        <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
                          LOW STOCK
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          trackSearchEvent('compare_add', product.id);
                          onAddToComparison(product);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${comparisonList.find(p => p.id === product.id) ? 'bg-indigo-600 text-white' : 'bg-white/80 text-zinc-600'}`}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddWatchlist(product);
                        }}
                        className="p-2 rounded-full backdrop-blur-md bg-white/80 text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col relative">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="font-bold text-zinc-900 text-sm line-clamp-1">{product.name}</h4>
                      {sellerMeta[product.sellerId]?.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 mb-2 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="font-black text-indigo-600 text-sm">${product.price}</span>
                        {product.competitorPrice && (
                          <span className="text-[9px] text-zinc-400 line-through">${product.competitorPrice}</span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          trackSearchEvent('add_to_bag', product.id);
                          onAddToBag(product);
                        }}
                        className="p-1.5 bg-zinc-100 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <SearchIcon className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400 font-medium">No products found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comparison Bar */}
      <AnimatePresence>
        {comparisonList.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-30"
          >
            <div className="bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex -space-x-3 overflow-x-auto no-scrollbar max-w-[120px] sm:max-w-[200px] py-1">
                  {comparisonList.map(p => (
                    <img 
                      key={p.id} 
                      src={p.mediaUrl} 
                      className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover shrink-0" 
                      alt="thumb" 
                    />
                  ))}
                </div>
                <div className="text-xs shrink-0">
                  <p className="font-bold">{comparisonList.length} Selected</p>
                  <p className="text-zinc-400 text-[10px]">
                    Profile: {comparisonProfile.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onAddToComparison(comparisonList[0])}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  onClick={onOpenComparison}
                  data-compare-target="search"
                  className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                >
                  Compare <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden">
              <div className="relative">
                <video ref={videoRef} className="w-full h-80 object-cover" autoPlay playsInline muted />
                <button 
                  onClick={handleCloseCamera}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
                  <div className="p-4 flex items-center justify-between">
                <span className="text-xs text-white font-bold">Visual Search</span>
                <div className="flex items-center gap-2">
                  <button onClick={handleCapture} className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold">
                    {mediaUploading ? 'Uploading...' : 'Capture'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Visual Search Preview */}
      {capturedPreview && (
        <div className="fixed bottom-28 left-4 right-4 sm:left-auto sm:right-4 z-[60] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden sm:w-32">
          <img src={capturedPreview} className="w-full h-24 object-cover" alt="capture" />
          <div className="p-2 text-[9px] font-bold text-zinc-600">
            Visual search applied
          </div>
        </div>
      )}

      {videoPreview && (
        <div className="fixed bottom-28 left-4 right-4 sm:left-auto sm:right-40 z-[60] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden sm:w-40">
          <video src={videoPreview} className="w-full h-24 object-cover" />
          <div className="p-2 text-[9px] font-bold text-zinc-600">
            Video search applied
          </div>
        </div>
      )}
    </div>
  );
};
