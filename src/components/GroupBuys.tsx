import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Users, Timer, Filter, MessageCircle, ShoppingCart, Zap, Loader2 } from 'lucide-react';
import { listGroupBuyInstances, joinGroupBuyInstance, createBuyerGroupRequest, type GroupBuyInstance } from '../lib/groupBuyApi';
import { getOpsConfig } from '../lib/opsConfigApi';

type Filters = {
  market_name: string;
  category_id: string;
  status: string;
  price_max: string;
  min_size: string;
  max_size: string;
  sort: string;
  radius_km: string;
};

export const GroupBuys: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [filters, setFilters] = useState<Filters>({
    market_name: '',
    category_id: '',
    status: 'open',
    price_max: '',
    min_size: '',
    max_size: '',
    sort: 'ending_soon',
    radius_km: '5'
  });
  const [items, setItems] = useState<GroupBuyInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [createSku, setCreateSku] = useState('');
  const [createQty, setCreateQty] = useState('5');
  const [createPrice, setCreatePrice] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      getOpsConfig('groupbuy.search_defaults').catch(() => null),
      getOpsConfig('groupbuy.request_defaults').catch(() => null),
    ]).then(([searchDefaults, requestDefaults]) => {
      if (!alive) return;
      const radius = Number((searchDefaults as any)?.value?.radius_km ?? 5);
      if (Number.isFinite(radius) && radius > 0) {
        setFilters((prev) => ({ ...prev, radius_km: String(radius) }));
      }
      const targetQuantity = Number((requestDefaults as any)?.value?.target_quantity ?? 5);
      if (Number.isFinite(targetQuantity) && targetQuantity > 0) {
        setCreateQty(String(targetQuantity));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGroupBuyInstances({
        market_name: filters.market_name || undefined,
        category_id: filters.category_id || undefined,
        status: filters.status || undefined,
        price_max: filters.price_max ? Number(filters.price_max) : undefined,
        min_size: filters.min_size ? Number(filters.min_size) : undefined,
        max_size: filters.max_size ? Number(filters.max_size) : undefined,
        sort: filters.sort || undefined,
        radius_km: filters.radius_km ? Number(filters.radius_km) : undefined,
        lat: latLng?.lat,
        lng: latLng?.lng
      });
      setItems(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load group buys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters, latLng]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setLatLng(null)
    );
  };

  const handleJoin = async (item: GroupBuyInstance) => {
    try {
      await joinGroupBuyInstance(item.id, { quantity: 1 });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to join group.');
    }
  };

  const handleCreateRequest = async () => {
    if (!createSku || !Number(createQty)) {
      setError('Provide a product SKU and target quantity.');
      return;
    }
    try {
      await createBuyerGroupRequest({
        product_sku: createSku,
        target_quantity: Number(createQty),
        target_price: createPrice ? Number(createPrice) : undefined
      });
      setCreateSku('');
      setCreateQty('5');
      setCreatePrice('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to create group request.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-100">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/90 backdrop-blur px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="px-3 py-2 rounded-full bg-white/10 text-xs font-bold text-white">
                Back
              </button>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">Shared deals</p>
              <h2 className="text-2xl font-black text-white">Group Buys</h2>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[11px] text-white/70 font-medium">Join nearby shoppers for better prices.</p>
            <p className="text-[10px] text-white/50 font-bold">Seller participation is optional and location-aware.</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-white/95 p-5 shadow-2xl shadow-black/10">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <Filter className="w-4 h-4" /> Find deals
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Filter by market, category, price, and distance to see the best shared orders nearby.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={filters.market_name}
              onChange={(e) => setFilters((prev) => ({ ...prev, market_name: e.target.value }))}
              placeholder="Market or area"
              className="px-3 py-2 rounded-xl bg-zinc-50 text-sm font-semibold"
            />
            <input
              value={filters.category_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value }))}
              placeholder="Category or product"
              className="px-3 py-2 rounded-xl bg-zinc-50 text-sm font-semibold"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-zinc-50 text-sm font-semibold"
            >
              <option value="open">Open</option>
              <option value="filled">Filled</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-zinc-50 text-sm font-semibold"
            >
              <option value="ending_soon">Ending soon</option>
              <option value="most_full">Most full</option>
              <option value="best_discount">Best discount</option>
              <option value="nearest">Nearest</option>
            </select>
            <input
              value={filters.price_max}
              onChange={(e) => setFilters((prev) => ({ ...prev, price_max: e.target.value }))}
              placeholder="Max price you want"
              type="number"
              className="px-3 py-2 rounded-xl bg-zinc-50 text-sm font-semibold"
            />
            <input
              value={filters.radius_km}
              onChange={(e) => setFilters((prev) => ({ ...prev, radius_km: e.target.value }))}
              placeholder="Distance radius (km)"
              type="number"
              className="px-3 py-2 rounded-xl bg-zinc-50 text-sm font-semibold"
            />
            </div>
            <button
              onClick={handleUseMyLocation}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-600"
            >
              <MapPin className="w-4 h-4" /> Use my current location
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 text-white shadow-2xl shadow-black/20">
            <div className="text-xs font-black text-emerald-300 uppercase tracking-widest">Request a group deal</div>
            <p className="mt-2 text-sm text-white/70">
              Tell nearby sellers what you want, how many you need, and the price that works for you.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={createSku}
                onChange={(e) => setCreateSku(e.target.value)}
                placeholder="Product SKU or name"
                className="px-3 py-2 rounded-xl bg-white/10 text-sm font-semibold text-white placeholder:text-white/40"
              />
              <input
                value={createQty}
                onChange={(e) => setCreateQty(e.target.value)}
                placeholder="How many units"
                type="number"
                className="px-3 py-2 rounded-xl bg-white/10 text-sm font-semibold text-white placeholder:text-white/40"
              />
              <input
                value={createPrice}
                onChange={(e) => setCreatePrice(e.target.value)}
                placeholder="Target price"
                type="number"
                className="px-3 py-2 rounded-xl bg-white/10 text-sm font-semibold text-white placeholder:text-white/40"
              />
            </div>
            <button
              onClick={handleCreateRequest}
              className="mt-4 px-4 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Request deal
            </button>
          </div>
        </div>

        {error && <div className="mx-auto mt-4 w-full max-w-6xl text-sm text-rose-200 font-semibold">{error}</div>}
        {loading && (
          <div className="mx-auto mt-4 w-full max-w-6xl flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading shared deals...
          </div>
        )}

        <div className="mx-auto mt-4 grid w-full max-w-6xl gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const target = Math.max(1, item.target_tier_qty || item.min_group_size || 1);
            const current = item.current_size || 0;
            const progress = Math.min(100, Math.round((current / target) * 100));
            const tierPrice = item.tiers?.[0]?.price ?? item.current_price ?? 0;
            const tierDiscount = item.tiers?.[0]?.discount;
            const etaMin = item.distance_km ? Math.max(5, Math.round(item.distance_km * 6)) : null;
            const shareLink = item.share_link
              ? item.share_link.startsWith('http')
                ? item.share_link
                : `${window.location.origin}/group/${item.share_link}`
              : '';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-white/95 p-5 shadow-2xl shadow-black/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-zinc-900">{item.product_sku || 'Shared deal'}</div>
                    <div className="text-[11px] text-zinc-500">
                      {item.market_name || item.seller_name || 'Market'} • {item.distance_km ? `${item.distance_km.toFixed(1)}km` : 'Nearby'}{etaMin ? ` • ${etaMin} min` : ''}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {item.seller_mode || 'seller'} {item.visual_marker ? `• ${item.visual_marker}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-zinc-900">KSh {tierPrice || '-'}</div>
                    {tierDiscount && <div className="text-[10px] text-emerald-600 font-bold">{tierDiscount} off</div>}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                    <span>{current}/{target} joined</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden mt-1">
                    <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleJoin(item)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Join deal
                  </button>
                  {shareLink && (
                    <button
                      onClick={() => window.open(shareLink, '_blank', 'noopener')}
                      className="px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Open discussion
                    </button>
                  )}
                  {item.whatsapp_number && (
                    <a
                      href={`https://wa.me/${item.whatsapp_number}`}
                      className="px-3 py-2 rounded-xl bg-zinc-100 text-xs font-bold inline-flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Contact seller
                    </a>
                  )}
                  {item.expires_at && (
                    <div className="text-[10px] text-zinc-500 font-bold inline-flex items-center gap-1">
                      <Timer className="w-3 h-3" /> {new Date(item.expires_at).toLocaleDateString()}
                    </div>
                  )}
                  {item.inventory_remaining !== undefined && (
                    <div className="text-[10px] text-amber-600 font-bold inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {item.inventory_remaining} left
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {!loading && items.length === 0 && (
            <div className="text-sm text-zinc-500 font-semibold">No group buys found. Try a different filter.</div>
          )}
        </div>
      </div>
    </div>
  );
};
