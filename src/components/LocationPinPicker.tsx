import React from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';

type LocationSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type LocationPinValue = {
  label?: string;
  lat?: number;
  lng?: number;
};

interface LocationPinPickerProps {
  title: string;
  helpText?: string;
  value: LocationPinValue;
  onChange: (next: LocationPinValue) => void;
  searchPlaceholder?: string;
  className?: string;
}

const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 };

export const LocationPinPicker: React.FC<LocationPinPickerProps> = ({
  title,
  helpText,
  value,
  onChange,
  searchPlaceholder = 'Search for a place',
  className = '',
}) => {
  const mapboxToken = (() => {
    const token = (import.meta as any)?.env?.VITE_MAPBOX_TOKEN;
    return typeof token === 'string' ? token : '';
  })();

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const mapboxModuleRef = React.useRef<any>(null);
  const mapboxLoadingRef = React.useRef<Promise<any> | null>(null);
  const syncingQueryRef = React.useRef(false);
  const reverseGeocodeRef = React.useRef(0);
  const [query, setQuery] = React.useState(value.label || '');
  const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [mapStatus, setMapStatus] = React.useState<string | null>(null);

  const ensureMapbox = React.useCallback(async () => {
    if (mapboxModuleRef.current) return mapboxModuleRef.current;
    if (!mapboxLoadingRef.current) {
      mapboxLoadingRef.current = Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl.css'),
      ]).then(([module]) => {
        const loaded = (module as any).default ?? module;
        mapboxModuleRef.current = loaded;
        return loaded;
      });
    }
    return mapboxLoadingRef.current;
  }, []);

  const fetchSuggestions = React.useCallback(async (searchValue: string) => {
    if (!mapboxToken || searchValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue.trim())}.json?access_token=${mapboxToken}&autocomplete=true&types=place,locality,neighborhood,poi,address&limit=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Unable to search locations.');
      const data = await res.json();
      const next = (data.features || [])
        .map((feature: any) => ({
          id: String(feature.id),
          label: String(feature.place_name || ''),
          lng: Number(feature.center?.[0]),
          lat: Number(feature.center?.[1]),
        }))
        .filter((item: LocationSuggestion) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
      setSuggestions(next);
    } catch (err: any) {
      setMapStatus(err?.message || 'Unable to search locations.');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [mapboxToken]);

  const reverseGeocode = React.useCallback(async (lng: number, lat: number) => {
    if (!mapboxToken) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,locality,neighborhood,poi,address&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    return {
      label: String(feature.place_name || ''),
      lng: Number(feature.center?.[0]),
      lat: Number(feature.center?.[1]),
    };
  }, [mapboxToken]);

  const updateSelection = React.useCallback((next: LocationPinValue, syncQuery = true) => {
    if (syncQuery) {
      syncingQueryRef.current = true;
      setQuery(next.label || '');
      window.setTimeout(() => {
        syncingQueryRef.current = false;
      }, 0);
    }
    onChange(next);
  }, [onChange]);

  React.useEffect(() => {
    if (syncingQueryRef.current) return;
    setQuery(value.label || '');
  }, [value.label]);

  React.useEffect(() => {
    if (syncingQueryRef.current) return;
    const handle = window.setTimeout(() => {
      void fetchSuggestions(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [fetchSuggestions, query]);

  React.useEffect(() => {
    if (!mapboxToken) {
      setMapStatus('Mapbox token missing. Add VITE_MAPBOX_TOKEN to enable drag-a-pin.');
      return;
    }
    if (!containerRef.current) return;
    let active = true;
    void ensureMapbox().then((mapboxgl) => {
      if (!active || !containerRef.current) return;
      mapboxgl.accessToken = mapboxToken;
      if (!mapRef.current) {
        const center = [
          Number.isFinite(value.lng) ? Number(value.lng) : DEFAULT_CENTER.lng,
          Number.isFinite(value.lat) ? Number(value.lat) : DEFAULT_CENTER.lat,
        ];
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center,
          zoom: Number.isFinite(value.lat) && Number.isFinite(value.lng) ? 14 : 11,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        const marker = new mapboxgl.Marker({ draggable: true })
          .setLngLat(center)
          .addTo(map);
        marker.on('dragend', async () => {
          const next = marker.getLngLat();
          const requestId = Date.now();
          reverseGeocodeRef.current = requestId;
          const resolved = await reverseGeocode(next.lng, next.lat);
          if (reverseGeocodeRef.current !== requestId) return;
          updateSelection({
            label: resolved?.label || query || value.label || '',
            lat: Number(next.lat.toFixed(6)),
            lng: Number(next.lng.toFixed(6)),
          });
        });
        map.on('click', async (event: any) => {
          const next = event.lngLat;
          marker.setLngLat(next);
          const requestId = Date.now();
          reverseGeocodeRef.current = requestId;
          const resolved = await reverseGeocode(next.lng, next.lat);
          if (reverseGeocodeRef.current !== requestId) return;
          updateSelection({
            label: resolved?.label || query || value.label || '',
            lat: Number(next.lat.toFixed(6)),
            lng: Number(next.lng.toFixed(6)),
          });
        });
        mapRef.current = map;
        markerRef.current = marker;
      }
      setMapStatus(null);
    }).catch((err: any) => {
      setMapStatus(err?.message || 'Unable to load map.');
    });
    return () => {
      active = false;
    };
  }, [ensureMapbox, mapboxToken, query, reverseGeocode, updateSelection, value.label, value.lat, value.lng]);

  React.useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return;
    const center = [Number(value.lng), Number(value.lat)];
    markerRef.current.setLngLat(center);
    mapRef.current.easeTo({ center, duration: 400 });
  }, [value.lat, value.lng]);

  React.useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleUseCurrentLocation = async () => {
    setMapStatus(null);
    if (!navigator.geolocation) {
      setMapStatus('Geolocation not available.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const resolved = await reverseGeocode(lng, lat);
        updateSelection({
          label: resolved?.label || value.label || '',
          lat,
          lng,
        });
      },
      () => setMapStatus('Unable to fetch current location.')
    );
  };

  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-4 space-y-3 ${className}`.trim()}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</p>
        {helpText && <p className="mt-1 text-[10px] font-bold text-zinc-500">{helpText}</p>}
      </div>

      <label className="block text-[10px] font-bold text-zinc-500">
        Place Name
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateSelection({ ...value, label: e.target.value }, false);
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
            placeholder={searchPlaceholder}
          />
        </div>
      </label>

      {(loadingSuggestions || suggestions.length > 0) && (
        <div className="space-y-2">
          {loadingSuggestions && (
            <div className="text-[10px] font-bold text-zinc-500">Searching places…</div>
          )}
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSuggestions([]);
                updateSelection({
                  label: item.label,
                  lat: Number(item.lat.toFixed(6)),
                  lng: Number(item.lng.toFixed(6)),
                });
              }}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-[10px] font-bold text-zinc-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative h-64 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        <div ref={containerRef} className="absolute inset-0" />
        {!mapboxToken && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[10px] font-bold text-zinc-500">
            Mapbox token missing. The search box still works for naming, but drag-a-pin needs `VITE_MAPBOX_TOKEN`.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-[10px] font-black text-zinc-700"
        >
          <Crosshair className="w-4 h-4" />
          Use Current Location
        </button>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2 text-[10px] font-bold text-zinc-600">
          <MapPin className="w-4 h-4" />
          {Number.isFinite(value.lat) && Number.isFinite(value.lng)
            ? `${Number(value.lat).toFixed(5)}, ${Number(value.lng).toFixed(5)}`
            : 'Drag or tap to pin'}
        </div>
      </div>

      {mapStatus && (
        <div className="text-[10px] font-bold text-zinc-500">{mapStatus}</div>
      )}
    </div>
  );
};
