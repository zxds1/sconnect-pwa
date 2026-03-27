import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Filter, MapPin, RefreshCcw, Search, ShieldCheck, Star } from 'lucide-react';
import { searchShops, type ShopDirectoryEntry } from '../lib/shopDirectoryApi';

type DirectoryEntry = {
  id: string;
  name: string;
  type: string;
  rating: number;
  location?: string;
  systems: string[];
  products: number;
  starsEarned: number;
  lastSync: string;
  verified?: boolean;
  category?: string;
  coords?: { lat: number; lng: number };
};

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatTimestamp = (value?: string) => value || '—';

const parseLocation = (location?: string | { address?: string }) => {
  if (!location) return undefined;
  if (typeof location === 'string') return location;
  return location.address;
};

const getCoordinates = (location?: string | { lat?: number; lng?: number }) => {
  if (location && typeof location === 'object' && location.lat !== undefined && location.lng !== undefined) {
    return { lat: location.lat, lng: location.lng };
  }
  return undefined;
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const Partnerships: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [minRating, setMinRating] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'distance'>('popularity');
  const [shopLoading, setShopLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopEntries, setShopEntries] = useState<DirectoryEntry[]>([]);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const requestGeo = () => {
    if (!navigator?.geolocation) {
      setGeoError('Location access not available on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoError(null);
      },
      () => setGeoError('Location access denied. Distance filters may be limited.'),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const loadShops = async (signal?: { cancelled: boolean }) => {
    setShopLoading(true);
    setError(null);
    try {
      const payload = {
        query: query.trim() || undefined,
        category: categoryFilter.trim() || undefined,
        minRating: minRating || undefined,
        verified: verifiedOnly || undefined,
        lat: radiusKm > 0 ? geo?.lat : undefined,
        lng: radiusKm > 0 ? geo?.lng : undefined,
        radiusKm: radiusKm > 0 ? radiusKm : undefined,
        sort: sortBy,
      };
      const shopsResp = await searchShops(payload);
      if (signal?.cancelled) return;

      const mapped = shopsResp.map((entry: ShopDirectoryEntry): DirectoryEntry => ({
        id: entry.id || entry.seller_id || '',
        name: entry.name || 'Shop',
        type: 'Shop',
        rating: numberOrZero(entry.rating),
        location: parseLocation(entry.location),
        systems: entry.category ? [entry.category] : [],
        products: numberOrZero(entry.products ?? entry.total_products),
        starsEarned: numberOrZero(entry.stars_earned),
        lastSync: formatTimestamp(entry.last_sync_at),
        verified: entry.verified,
        category: entry.category,
        coords: getCoordinates(entry.location as any),
      })).filter(entry => entry.id);

      setShopEntries(mapped);
    } catch (err: any) {
      if (!signal?.cancelled) {
        setError(err?.message || 'Unable to load shop directory.');
      }
    } finally {
      if (!signal?.cancelled) setShopLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if ((radiusKm > 0 || sortBy === 'distance') && !geo && !geoError) {
      requestGeo();
    }
  }, [radiusKm, sortBy, geo, geoError]);

  useEffect(() => {
    const signal = { cancelled: false };
    const timer = setTimeout(() => {
      loadShops(signal);
    }, 350);
    return () => {
      signal.cancelled = true;
      clearTimeout(timer);
    };
  }, [query, categoryFilter, minRating, verifiedOnly, radiusKm, sortBy, geo]);

  const filtered = useMemo(() => {
    let results = shopEntries.filter(entry => {
      const matchesQuery = entry.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === 'All' || entry.type === typeFilter;
      const matchesRating = entry.rating >= minRating;
      if (verifiedOnly && !entry.verified) return false;
      return matchesQuery && matchesType && matchesRating;
    });

    if (sortBy === 'rating') {
      results = [...results].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'distance' && geo) {
      results = [...results].sort((a, b) => {
        const coordsA = a.coords;
        const coordsB = b.coords;
        if (!coordsA && !coordsB) return 0;
        if (!coordsA) return 1;
        if (!coordsB) return -1;
        return haversineKm(geo, coordsA) - haversineKm(geo, coordsB);
      });
    }
    return results;
  }, [shopEntries, query, typeFilter, minRating, verifiedOnly, sortBy, geo]);

  return (
    <div className="theme-page-shell h-full flex flex-col overflow-y-auto no-scrollbar">
      <div className="theme-page-header sticky top-0 z-10 border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="theme-chip-surface rounded-full border p-2 transition hover:opacity-80" aria-label="Go back">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <p className="text-sm font-black text-zinc-900">Data Partnerships Directory</p>
              <p className="text-[10px] text-zinc-500">Public shop directory and discovery filters.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadShops()}
              className="theme-chip-surface rounded-full border p-2 transition hover:opacity-80"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shops..."
                className="theme-input-surface w-full rounded-xl border py-2 pl-9 pr-3 text-[10px] font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="theme-input-surface rounded-xl border px-2 py-2 text-[10px] font-bold"
              >
                <option value="All">All</option>
                <option value="Shop">Shop</option>
              </select>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="theme-input-surface rounded-xl border px-2 py-2 text-[10px] font-bold"
              >
                <option value={0}>Any Rating</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category filter"
              className="theme-input-surface rounded-xl border px-3 py-2 text-[10px] font-bold"
            />
            <label className="theme-chip-surface flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="accent-zinc-900"
              />
              Verified only
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="theme-input-surface rounded-xl border px-2 py-2 text-[10px] font-bold"
            >
              <option value={0}>Any Distance</option>
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popularity' | 'rating' | 'distance')}
              className="theme-input-surface rounded-xl border px-2 py-2 text-[10px] font-bold"
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="rating">Sort: Rating</option>
              <option value="distance">Sort: Distance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {geoError && (
          <div className="bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-bold rounded-2xl px-4 py-3">
            {geoError}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {shopLoading && (
          <div className="theme-panel rounded-2xl border p-5 text-[11px] font-bold text-zinc-500">
            Loading shop directory...
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {filtered.map(entry => (
            <div key={entry.id} className="theme-panel rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{entry.name}</p>
                    <p className="text-[10px] text-zinc-500">{entry.type} • {entry.verified ? 'VERIFIED' : 'UNVERIFIED'}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" /> {entry.rating.toFixed(1)}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-zinc-400" /> {entry.location || 'Online'}</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-zinc-400" /> Public listing</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 text-zinc-400">•</span> {entry.products} products</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 text-zinc-400">•</span> Last sync {entry.lastSync}</div>
              </div>
              {entry.systems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.systems.map(s => (
                    <span key={s} className="theme-chip-surface rounded-full border px-2 py-1 text-[9px] font-bold">{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !shopLoading && (
            <div className="theme-panel rounded-2xl border border-dashed p-6 text-center text-[10px] font-bold text-zinc-500">
              No shops match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
