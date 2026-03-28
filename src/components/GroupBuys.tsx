import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Users, Timer, Filter, MessageCircle, ShoppingCart, Loader2, BadgePercent, Sparkles, Clock3 } from 'lucide-react';
import {
  createBuyerGroupRequest,
  joinGroupBuyInstance,
  listGroupBuyInstances,
  type GroupBuyInstance,
} from '../lib/groupBuyApi';
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
          const current = item.current_size ?? 0;
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

  const panelClass = 'group-buys-panel rounded-3xl border backdrop-blur-xl';
  const chipClass = 'group-buys-chip rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]';
  const inputClass = 'group-buys-input rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition';
  const subtleCopyClass = 'group-buys-soft text-[11px] font-medium';

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
    <div className="group-buys-page min-h-screen">
      <div className="group-buys-header sticky top-0 z-10 border-b px-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] pb-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="group-buys-chip rounded-full p-2 transition hover:opacity-85" aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-400">Shared deals</p>
              <h2 className="group-buys-title text-2xl font-black tracking-tight sm:text-3xl">Group Buys</h2>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="group-buys-copy text-[11px] font-medium">Join nearby shoppers for better prices.</p>
            <p className="group-buys-soft text-[10px] font-bold">Seller participation is optional and location-aware.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-5">
        <div className={`${panelClass} sticky top-[calc(env(safe-area-inset-top)+4.2rem)] z-10 mb-4 px-4 py-4`}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
                <Filter className="h-4 w-4" /> Find deals
              </div>
              <span className={chipClass}>
                {items.length} listings
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr]">
              <input
                value={filters.market_name}
                onChange={(e) => setFilters((prev) => ({ ...prev, market_name: e.target.value }))}
                placeholder="Market or area"
                className={`${inputClass} focus:border-sky-400/50`}
              />
              <input
                value={filters.category_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value }))}
                placeholder="Category or product"
                className={`${inputClass} focus:border-sky-400/50`}
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className={`${inputClass} focus:border-sky-400/50`}
              >
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                className={`${inputClass} focus:border-sky-400/50`}
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
                className={`${inputClass} focus:border-sky-400/50`}
              />
              <input
                value={filters.radius_km}
                onChange={(e) => setFilters((prev) => ({ ...prev, radius_km: e.target.value }))}
                placeholder="Distance radius (km)"
                type="number"
                className={`${inputClass} focus:border-sky-400/50`}
              />
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <button
                  onClick={handleUseMyLocation}
                  className="group-buys-accent-btn inline-flex items-center gap-2 rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition hover:brightness-105"
                >
                  <MapPin className="h-4 w-4" /> Use location
                </button>
                <span className={subtleCopyClass}>Nearby deals are prioritized when location is set.</span>
              </div>
            </div>
          </div>
        </div>

        <details className={`${panelClass} group mb-4 p-4`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
                <ShoppingCart className="h-4 w-4" /> Request a group deal
              </div>
              <p className="group-buys-copy mt-2 text-sm">
                Tell nearby sellers what you want, how many you need, and the price that works for you.
              </p>
            </div>
            <span className={`${chipClass} group-open:opacity-90`}>
              Toggle
            </span>
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={createSku}
              onChange={(e) => setCreateSku(e.target.value)}
              placeholder="Product SKU or name"
              className={`${inputClass} focus:border-emerald-400/50`}
            />
            <input
              value={createQty}
              onChange={(e) => setCreateQty(e.target.value)}
              placeholder="How many units"
              type="number"
              className={`${inputClass} focus:border-emerald-400/50`}
            />
            <input
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              placeholder="Target price"
              type="number"
              className={`${inputClass} focus:border-emerald-400/50`}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateRequest}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" /> Request deal
            </button>
            <span className={subtleCopyClass}>
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
              <div key={card.label} className={`${panelClass} bg-gradient-to-br ${card.tone} p-4`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="group-buys-stat-label text-[10px] font-black uppercase tracking-[0.26em]">{card.label}</div>
                    <div className="group-buys-stat-value mt-2 text-2xl font-black tracking-tight">{card.value}</div>
                  </div>
                  <div className="group-buys-icon-tile grid h-11 w-11 place-items-center rounded-2xl border">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="group-buys-error mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}
        {loading && (
          <div className="group-buys-panel group-buys-copy mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading shared deals...
          </div>
        )}

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const target = Math.max(1, item.target_tier_qty || item.min_group_size || 1);
            const current = item.current_size ?? 0;
            const progress = Math.min(100, Math.round((current / target) * 100));
            const tierPrice = item.tiers?.[0]?.price ?? item.current_price ?? 0;
            const tierDiscount = item.tiers?.[0]?.discount;
            const status = String(item.status || '').toLowerCase();
            const canJoin = !status.includes('closed') && !status.includes('fulfilled');
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
                className={`${panelClass} overflow-hidden p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="group-buys-title text-sm font-black tracking-tight">{item.product_sku || 'Shared deal'}</div>
                    <div className="group-buys-stat-label mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium">
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
                    <div className="group-buys-soft mt-1 text-[11px]">
                      {item.seller_mode || 'seller'} {item.visual_marker ? `• ${/^https?:\/\//i.test(String(item.visual_marker)) ? 'photo marker' : item.visual_marker}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="group-buys-title text-sm font-black">KSh {tierPrice || '-'}</div>
                    {tierDiscount && <div className="text-[10px] font-bold text-emerald-300">{tierDiscount} off</div>}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="group-buys-soft flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em]">
                    <span>{current}/{target} joined</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="group-buys-progress-track mt-2 h-2 overflow-hidden rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${dealTone(item)}, rgba(255,255,255,0.14))` }} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleJoin(item)}
                    disabled={!canJoin}
                    className="group-buys-accent-btn inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Users className="h-4 w-4" /> {canJoin ? 'Join deal' : 'Deal closed'}
                  </button>
                  {shareLink && (
                    <button
                      onClick={() => window.open(shareLink, '_blank', 'noopener')}
                      className="group-buys-chip inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition hover:opacity-90"
                    >
                      <MessageCircle className="h-4 w-4" /> Open discussion
                    </button>
                  )}
                  {item.whatsapp_number && (
                    <a
                      href={`https://wa.me/${item.whatsapp_number}`}
                      className="group-buys-chip inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition hover:opacity-90"
                    >
                      <MessageCircle className="h-4 w-4" /> Contact seller
                    </a>
                  )}
                  {item.expires_at && (
                    <div className="group-buys-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                      <Timer className="h-3 w-3" /> {new Date(item.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {!loading && items.length === 0 && (
            <div className="group-buys-panel group-buys-stat-label rounded-3xl border p-5 text-sm font-semibold">
              No group buys found. Try a different filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
