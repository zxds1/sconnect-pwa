import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Users, Timer, Filter, MessageCircle, ShoppingCart, Zap, Loader2, BadgePercent, Sparkles, Clock3 } from 'lucide-react';
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

  const summary = useMemo(() => {
    const now = Date.now();
    const open = items.filter((item) => String(item.status || '').toLowerCase().includes('open')).length;
    const endingSoon = items.filter((item) => {
      if (!item.expires_at) return false;
      return new Date(item.expires_at).getTime() - now < 1000 * 60 * 60 * 24;
    }).length;
    const nearby = items.filter((item) => typeof item.distance_km === 'number' && item.distance_km <= Number(filters.radius_km || 0)).length;
    const averageProgress = items.length
      ? Math.round(items.reduce((acc, item) => {
          const target = Math.max(1, item.target_tier_qty || item.min_group_size || 1);
          const current = item.current_size || 0;
          return acc + Math.min(100, (current / target) * 100);
        }, 0) / items.length)
      : 0;
    return { open, endingSoon, nearby, averageProgress };
  }, [filters.radius_km, items]);

  const dealTone = (item: GroupBuyInstance) => {
    const status = String(item.status || '').toLowerCase();
    if (status.includes('closed')) return 'rgba(148,163,184,0.9)';
    if (status.includes('filled')) return 'rgba(34,197,94,0.9)';
    return 'rgba(56,189,248,0.9)';
  };

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_34%),radial-gradient(circle_at_80%_0%,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#090b12_0%,_#0b1020_55%,_#06070c_100%)] text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] pb-4 shadow-[0_12px_60px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10">
                Back
              </button>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-300/90">Shared deals</p>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Group Buys</h2>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-medium text-white/75">Join nearby shoppers for better prices.</p>
            <p className="text-[10px] font-bold text-white/50">Seller participation is optional and location-aware.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-5">
        <div className="sticky top-[calc(env(safe-area-inset-top)+4.2rem)] z-10 mb-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
                <Filter className="h-4 w-4" /> Find deals
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                {items.length} listings
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr]">
              <input
                value={filters.market_name}
                onChange={(e) => setFilters((prev) => ({ ...prev, market_name: e.target.value }))}
                placeholder="Market or area"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-sky-400/50"
              />
              <input
                value={filters.category_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value }))}
                placeholder="Category or product"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-sky-400/50"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-400/50"
              >
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-400/50"
              >
                <option value="ending_soon">Ending soon</option>
                <option value="most_full">Most full</option>
                <option value="best_discount">Best discount</option>
                <option value="nearest">Nearest</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={filters.price_max}
                onChange={(e) => setFilters((prev) => ({ ...prev, price_max: e.target.value }))}
                placeholder="Max price you want"
                type="number"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-sky-400/50"
              />
              <input
                value={filters.radius_km}
                onChange={(e) => setFilters((prev) => ({ ...prev, radius_km: e.target.value }))}
                placeholder="Distance radius (km)"
                type="number"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-sky-400/50"
              />
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <button
                  onClick={handleUseMyLocation}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-400/15"
                >
                  <MapPin className="h-4 w-4" /> Use location
                </button>
                <span className="text-[11px] font-medium text-white/45">Nearby deals are prioritized when location is set.</span>
              </div>
            </div>
          </div>
        </div>

        <details className="group mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
                <ShoppingCart className="h-4 w-4" /> Request a group deal
              </div>
              <p className="mt-2 text-sm text-white/70">
                Tell nearby sellers what you want, how many you need, and the price that works for you.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 group-open:bg-white/10">
              Toggle
            </span>
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={createSku}
              onChange={(e) => setCreateSku(e.target.value)}
              placeholder="Product SKU or name"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-emerald-400/50"
            />
            <input
              value={createQty}
              onChange={(e) => setCreateQty(e.target.value)}
              placeholder="How many units"
              type="number"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-emerald-400/50"
            />
            <input
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              placeholder="Target price"
              type="number"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-emerald-400/50"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateRequest}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" /> Request deal
            </button>
            <span className="text-[11px] font-medium text-white/45">
              Create a request and let sellers respond with better pricing tiers.
            </span>
          </div>
        </details>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Open deals", value: summary.open, tone: "from-sky-400/20 to-blue-500/10", icon: Users },
            { label: "Ending soon", value: summary.endingSoon, tone: "from-amber-400/20 to-orange-500/10", icon: Clock3 },
            { label: "Nearby", value: summary.nearby, tone: "from-emerald-400/20 to-teal-500/10", icon: MapPin },
            { label: "Average fill", value: `${summary.averageProgress}%`, tone: "from-fuchsia-400/20 to-violet-500/10", icon: BadgePercent },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.tone} p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.26em] text-white/55">{card.label}</div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-white">{card.value}</div>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
            {error}
          </div>
        )}
        {loading && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading shared deals...
          </div>
        )}

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_22px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black tracking-tight text-white">{item.product_sku || 'Shared deal'}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/55">
                      <span>{item.market_name || item.seller_name || 'Market'}</span>
                      <span>•</span>
                      <span>{item.distance_km ? `${item.distance_km.toFixed(1)} km` : 'Nearby'}</span>
                      {etaMin ? (
                        <>
                          <span>•</span>
                          <span>{etaMin} min</span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-1 text-[11px] text-white/45">
                      {item.seller_mode || 'seller'} {item.visual_marker ? `• ${item.visual_marker}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">KSh {tierPrice || '-'}</div>
                    {tierDiscount && <div className="text-[10px] font-bold text-emerald-300">{tierDiscount} off</div>}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    <span>{current}/{target} joined</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${dealTone(item)}, rgba(255,255,255,0.14))` }} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleJoin(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-100 transition hover:bg-sky-400/15"
                  >
                    <Users className="h-4 w-4" /> Join deal
                  </button>
                  {shareLink && (
                    <button
                      onClick={() => window.open(shareLink, '_blank', 'noopener')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/90 transition hover:bg-white/10"
                    >
                      <MessageCircle className="h-4 w-4" /> Open discussion
                    </button>
                  )}
                  {item.whatsapp_number && (
                    <a
                      href={`https://wa.me/${item.whatsapp_number}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/90 transition hover:bg-white/10"
                    >
                      <MessageCircle className="h-4 w-4" /> Contact seller
                    </a>
                  )}
                  {item.expires_at && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                      <Timer className="h-3 w-3" /> {new Date(item.expires_at).toLocaleDateString()}
                    </div>
                  )}
                  {item.inventory_remaining !== undefined && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                      <Zap className="h-3 w-3" /> {item.inventory_remaining} left
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {!loading && items.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm font-semibold text-white/55">
              No group buys found. Try a different filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
