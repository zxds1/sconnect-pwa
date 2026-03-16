import React, { useEffect, useMemo, useState } from 'react';
import { Plug, Search, Filter, Star, MapPin, ShieldCheck, Building2, Layers, Users, RefreshCcw, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import {
  listPartners,
  pausePartner,
  resumePartner,
  disconnectPartner,
  syncPartner,
  getPartnerStatus,
  getPartnerHealth,
  type PartnerRecord
} from '../lib/partnersApi';
import {
  searchShops,
  getShopProfile,
  getShopProducts,
  getShopStats,
  type ShopDirectoryEntry
} from '../lib/shopDirectoryApi';
import { getSessionInfo } from '../lib/identityApi';

const DIRECTORY_TYPES = ['Shop', 'Ecommerce', 'Marketplace', 'ERP', 'POS', 'CRM', 'CSV', 'Sheets'];

type DirectoryEntry = {
  id: string;
  name: string;
  type: string;
  rating: number;
  location?: string;
  systems: string[];
  status: 'live' | 'paused';
  products: number;
  starsEarned: number;
  lastSync: string;
  kind: 'partner' | 'shop';
  verified?: boolean;
  health?: string;
  category?: string;
  coords?: { lat: number; lng: number };
  integrationId?: string;
};

type ShopDetail = {
  profile?: Record<string, any>;
  stats?: Record<string, any>;
  products?: any[];
};

const normalizeStatus = (status?: string): 'live' | 'paused' => {
  const lowered = (status || '').toLowerCase();
  if (lowered.includes('pause') || lowered.includes('inactive') || lowered.includes('error')) return 'paused';
  return 'live';
};

const normalizeType = (type?: string) => {
  if (!type) return 'Integration';
  const lowered = type.toLowerCase();
  if (lowered === 'pos') return 'POS';
  if (lowered === 'erp') return 'ERP';
  if (lowered === 'crm') return 'CRM';
  if (lowered === 'csv') return 'CSV';
  if (lowered === 'sheet' || lowered === 'sheets') return 'Sheets';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatTimestamp = (value?: string) => {
  if (!value) return '—';
  return value;
};

const parseLocation = (location?: string | { address?: string }) => {
  if (!location) return undefined;
  if (typeof location === 'string') return location;
  return location.address;
};

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const extractHealthLabel = (value: any) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.status || value.health || value.state || undefined;
};

const normalizeRole = (role?: string) => {
  const lowered = (role || '').toLowerCase();
  if (lowered.includes('admin')) return 'admin';
  if (lowered.includes('owner')) return 'owner';
  return 'viewer';
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

export const Partnerships: React.FC<{ onBack?: () => void; onOpenBrandChat?: () => void }> = ({ onBack, onOpenBrandChat }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'live' | 'paused'>('All');
  const [minRating, setMinRating] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'distance'>('popularity');
  const [role, setRole] = useState<'viewer' | 'owner' | 'admin'>('viewer');
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [shopEntries, setShopEntries] = useState<DirectoryEntry[]>([]);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [shopDetails, setShopDetails] = useState<Record<string, ShopDetail>>({});
  const [shopDetailLoading, setShopDetailLoading] = useState<Record<string, boolean>>({});
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const canManage = role !== 'viewer';
  const shopFiltersActive = verifiedOnly || Boolean(categoryFilter.trim()) || radiusKm > 0;

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const [partnersResp, sessionInfo] = await Promise.all([
        listPartners(),
        getSessionInfo().catch(() => undefined),
      ]);

      if (sessionInfo?.role) {
        setRole(normalizeRole(sessionInfo.role));
      }

      const mapped = partnersResp.map((entry: PartnerRecord): DirectoryEntry => ({
        id: entry.id || entry.partner_id || '',
        name: entry.name || entry.display_name || 'Unknown partner',
        type: normalizeType(entry.type),
        rating: numberOrZero(entry.rating),
        location: parseLocation(entry.location),
        systems: entry.systems || [],
        status: normalizeStatus(entry.status),
        products: numberOrZero(entry.products ?? entry.total_products),
        starsEarned: numberOrZero(entry.stars_earned ?? entry.starsEarned),
        lastSync: formatTimestamp(entry.last_sync_at || entry.last_sync || entry.updated_at),
        kind: 'partner',
        health: extractHealthLabel(entry.health || entry.sync_health),
        coords: getCoordinates(entry.location as any),
      })).filter(entry => entry.id);

      setDirectoryEntries(mapped);
    } catch (err: any) {
      setError(err?.message || 'Unable to load partners.');
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerHealth = async () => {
    if (!directoryEntries.length) return;
    const updates = await Promise.allSettled(
      directoryEntries.map(async entry => {
        const [health, status] = await Promise.all([
          getPartnerHealth(entry.id),
          getPartnerStatus(entry.id),
        ]);
        const integration = status?.integration;
        return {
          id: entry.id,
          health: extractHealthLabel(health),
          integrationId: integration?.id,
          status: normalizeStatus(integration?.status || entry.status),
          lastSync: formatTimestamp(integration?.last_sync_at || integration?.updated_at),
        };
      })
    );
    const byId = updates.reduce<Record<string, { health?: string; integrationId?: string; status?: 'live' | 'paused'; lastSync?: string }>>((acc, item) => {
      if (item.status === 'fulfilled') {
        acc[item.value.id] = {
          health: item.value.health,
          integrationId: item.value.integrationId,
          status: item.value.status,
          lastSync: item.value.lastSync,
        };
      }
      return acc;
    }, {});
    if (Object.keys(byId).length) {
      setDirectoryEntries(prev => prev.map(entry => ({
        ...entry,
        health: byId[entry.id]?.health ?? entry.health,
        integrationId: byId[entry.id]?.integrationId ?? entry.integrationId,
        status: byId[entry.id]?.status ?? entry.status,
        lastSync: byId[entry.id]?.lastSync ?? entry.lastSync,
      })));
    }
  };

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
        status: entry.verified ? 'live' : 'paused',
        products: numberOrZero(entry.products ?? entry.total_products),
        starsEarned: numberOrZero(entry.stars_earned),
        lastSync: formatTimestamp(entry.last_sync_at),
        kind: 'shop',
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
    loadPartners();
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

  useEffect(() => {
    if (directoryEntries.length) {
      loadPartnerHealth();
    }
  }, [directoryEntries.length]);

  const directory = useMemo(() => [...directoryEntries, ...shopEntries], [directoryEntries, shopEntries]);

  const filtered = useMemo(() => {
    let results = directory.filter(entry => {
      const matchesQuery = entry.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === 'All' || entry.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
      const matchesRating = entry.rating >= minRating;
      if (shopFiltersActive && entry.kind !== 'shop') return false;
      if (verifiedOnly && entry.kind === 'shop' && !entry.verified) return false;
      return matchesQuery && matchesType && matchesStatus && matchesRating;
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
  }, [directory, query, typeFilter, statusFilter, minRating, verifiedOnly, shopFiltersActive, sortBy, geo]);

  const handleTogglePause = async (entry: DirectoryEntry) => {
    if (!canManage) return;
    try {
      if (entry.status === 'paused') {
        await resumePartner(entry.id);
        setDirectoryEntries(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'live' } : item));
      } else {
        await pausePartner(entry.id);
        setDirectoryEntries(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'paused' } : item));
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update partner status.');
    }
  };

  const handleDisconnect = async (entry: DirectoryEntry) => {
    if (!canManage) return;
    try {
      let integrationId = entry.integrationId;
      if (!integrationId) {
        const status = await getPartnerStatus(entry.id);
        integrationId = status?.integration?.id;
      }
      if (!integrationId) {
        setError('Integration not found for this partner.');
        return;
      }
      await disconnectPartner({ integration_id: integrationId });
      setDirectoryEntries(prev => prev.filter(item => item.id !== entry.id));
    } catch (err: any) {
      setError(err?.message || 'Unable to revoke partner.');
    }
  };

  const handleSync = async (entry: DirectoryEntry) => {
    setSyncing(prev => ({ ...prev, [entry.id]: true }));
    try {
      await syncPartner(entry.id);
      setDirectoryEntries(prev => prev.map(item => item.id === entry.id ? { ...item, lastSync: new Date().toISOString() } : item));
    } catch (err: any) {
      setError(err?.message || 'Unable to sync partner.');
    } finally {
      setSyncing(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleToggleShop = async (entry: DirectoryEntry) => {
    if (expandedShopId === entry.id) {
      setExpandedShopId(null);
      return;
    }
    setExpandedShopId(entry.id);
    if (shopDetails[entry.id]) return;
    setShopDetailLoading(prev => ({ ...prev, [entry.id]: true }));
    try {
      const [profile, stats, products] = await Promise.all([
        getShopProfile(entry.id),
        getShopStats(entry.id),
        getShopProducts(entry.id),
      ]);
      setShopDetails(prev => ({
        ...prev,
        [entry.id]: { profile, stats, products },
      }));
    } catch (err: any) {
      setError(err?.message || 'Unable to load shop profile.');
    } finally {
      setShopDetailLoading(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const roleLabel = role === 'admin' ? 'Admin' : role === 'owner' ? 'Owner' : 'Viewer';

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-zinc-900">Data Partnerships Directory</p>
            <p className="text-[10px] text-zinc-500">Connected integrations plus the global shop directory.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadPartners();
                loadShops();
              }}
              className="p-2 rounded-full hover:bg-zinc-100"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            {onBack && (
              <button onClick={onBack} className="text-[10px] font-black text-zinc-500">Close</button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shops, marketplaces, ERPs..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
              >
                <option>All</option>
                {DIRECTORY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'live' | 'paused')}
                className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
              >
                <option value="All">All</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
              </select>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
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
              placeholder="Category filter (shops)"
              className="px-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold"
            />
            <label className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold text-zinc-600">
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
              className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
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
              className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="rating">Sort: Rating</option>
              <option value="distance">Sort: Distance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {onOpenBrandChat && (
          <section className="bg-[#0b1d3a] text-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Brand Executive Chat</p>
                <p className="text-sm font-bold">Unilever Rep: Live now</p>
                <p className="text-[10px] text-white/70 mt-1">Ask for heatmaps, top dukas, and demand spikes.</p>
              </div>
              <button
                onClick={onOpenBrandChat}
                className="px-4 py-2 bg-white text-[#0b1d3a] rounded-xl text-[10px] font-black"
              >
                Open Chat
              </button>
            </div>
          </section>
        )}

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Access Control</p>
              <p className="text-[10px] text-zinc-500">Only owners/admins can revoke or pause integrations.</p>
            </div>
            <div className="text-[10px] font-black text-zinc-700 px-3 py-2 bg-zinc-50 rounded-xl">
              {roleLabel}
            </div>
          </div>
        </section>

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

        {(loading || shopLoading) && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 text-[11px] font-bold text-zinc-500">
            Loading partners directory...
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {filtered.map(entry => (
            <div key={`${entry.kind}-${entry.id}`} className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    {entry.kind === 'shop' ? <Building2 className="w-4 h-4 text-blue-600" /> : <Plug className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{entry.name}</p>
                    <p className="text-[10px] text-zinc-500">{entry.type} • {entry.kind === 'shop' ? (entry.verified ? 'VERIFIED' : 'UNVERIFIED') : entry.status.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" /> {entry.rating.toFixed(1)}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-zinc-400" /> {entry.location || 'Online'}</div>
                <div className="flex items-center gap-2"><Layers className="w-3 h-3 text-zinc-400" /> {entry.products} products</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-zinc-400" /> {entry.starsEarned}⭐ earned</div>
                <div className="flex items-center gap-2"><Users className="w-3 h-3 text-zinc-400" /> Sync {entry.lastSync}</div>
              </div>
              {entry.health && entry.kind === 'partner' && (
                <div className="mt-2 text-[10px] font-bold text-emerald-600">Health: {entry.health}</div>
              )}
              {entry.systems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.systems.map(s => (
                    <span key={s} className="px-2 py-1 bg-zinc-100 rounded-full text-[9px] font-bold text-zinc-600">{s}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[10px] font-black ${entry.kind === 'shop' ? 'text-blue-600' : entry.status === 'live' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {entry.kind === 'shop' ? 'DIRECTORY LISTING' : entry.status === 'live' ? 'LIVE SYNC' : 'PAUSED'}
                </span>
                {entry.kind === 'partner' ? (
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-2 rounded-xl text-[10px] font-black ${!canManage ? 'bg-zinc-100 text-zinc-400' : 'bg-white border border-zinc-200'}`}
                      disabled={!canManage}
                      onClick={() => handleTogglePause(entry)}
                    >
                      {entry.status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      className={`px-3 py-2 rounded-xl text-[10px] font-black ${!canManage ? 'bg-zinc-100 text-zinc-400' : 'bg-white border border-zinc-200'}`}
                      disabled={!canManage || syncing[entry.id]}
                      onClick={() => handleSync(entry)}
                    >
                      {syncing[entry.id] ? 'Syncing...' : 'Sync'}
                    </button>
                    <button
                      className={`px-3 py-2 rounded-xl text-[10px] font-black ${!canManage ? 'bg-zinc-100 text-zinc-400' : 'bg-red-50 text-red-600'}`}
                      disabled={!canManage}
                      onClick={() => handleDisconnect(entry)}
                    >
                      Revoke
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-3 py-2 rounded-xl text-[10px] font-black bg-white border border-zinc-200"
                    onClick={() => handleToggleShop(entry)}
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="w-3 h-3" />
                      {expandedShopId === entry.id ? 'Hide' : 'View'}
                      {expandedShopId === entry.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </button>
                )}
              </div>
              {entry.kind === 'shop' && expandedShopId === entry.id && (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-4 text-[10px] text-zinc-600 space-y-2">
                  {shopDetailLoading[entry.id] && <p className="font-bold">Loading shop profile...</p>}
                  {!shopDetailLoading[entry.id] && shopDetails[entry.id] && (
                    <>
                      {shopDetails[entry.id].profile && (
                        <div className="space-y-1">
                          <p className="font-black text-zinc-800">Profile</p>
                          <p>{shopDetails[entry.id].profile?.description || shopDetails[entry.id].profile?.summary || 'No description provided.'}</p>
                        </div>
                      )}
                      {shopDetails[entry.id].stats && (
                        <div className="space-y-1">
                          <p className="font-black text-zinc-800">Stats Snapshot</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(shopDetails[entry.id].stats || {}).slice(0, 4).map(([key, value]) => (
                              <span key={key} className="px-2 py-1 bg-zinc-100 rounded-full text-[9px] font-bold text-zinc-600">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {shopDetails[entry.id].products && (
                        <div className="space-y-1">
                          <p className="font-black text-zinc-800">Products</p>
                          <p>{shopDetails[entry.id].products?.length || 0} items listed</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !loading && !shopLoading && (
            <div className="p-6 bg-white rounded-2xl border border-dashed border-zinc-200 text-center text-[10px] font-bold text-zinc-500">
              No connected partners match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
