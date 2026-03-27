import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, MapPin, Truck, AlertTriangle, Route } from 'lucide-react';
import { Product } from '../types';
import { getProduct } from '../lib/catalogApi';
import { getAuthItem } from '../lib/authStorage';
import { search } from '../lib/searchApi';
import {
  getCart,
  getCartInsights,
  getCartRecommendations,
  getCartSummary,
  getCartTaxes,
  updateCartItem,
  addCartItem,
  deleteCartItem,
  estimateDelivery,
  applyCartCoupon,
  checkoutCart,
  checkoutCartSplit,
  createCartAlert,
  getCartAlerts,
  notifyCartRecovery,
  getCartRecoveryStatus,
  type Cart,
  type CartItem,
  type DeliveryEstimate,
  type CartRecommendation,
  type CartAlert,
} from '../lib/cartApi';

interface BagProps {
  onBack: () => void;
  onOpenProduct: (product: Product) => void;
  onRequireLogin?: (message: string) => void;
}

type ProductView = {
  id: string;
  name?: string;
  mediaUrl?: string;
};

type RecommendationView = {
  original_product_id: string;
  candidate_product_id: string;
  score?: number;
  reason?: string;
  originalName?: string;
  candidateName?: string;
  candidatePrice?: number;
  candidateSellerId?: string;
  candidateMediaUrl?: string;
};

export const Bag: React.FC<BagProps> = ({ onBack, onOpenProduct, onRequireLogin }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [productsById, setProductsById] = useState<Record<string, ProductView>>({});
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<RecommendationView[]>([]);
  const [delivery, setDelivery] = useState<DeliveryEstimate | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [taxes, setTaxes] = useState<{ tax?: number; currency?: string } | null>(null);
  const [coupon, setCoupon] = useState({ code: '', discount: '0' });
  const [alerts, setAlerts] = useState<CartAlert[]>([]);
  const [alertForm, setAlertForm] = useState({ product_id: '', target_price: '' });
  const [priceWatchSearch, setPriceWatchSearch] = useState('');
  const [catalogWatchProducts, setCatalogWatchProducts] = useState<Product[]>([]);
  const [catalogWatchLoading, setCatalogWatchLoading] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [alertStatus, setAlertStatus] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSession = Boolean(getAuthItem('soko:auth_token'));

  const recommendationKey = useMemo(
    () => recommendations.map(r => `${r.original_product_id}:${r.candidate_product_id}`).join('|'),
    [recommendations]
  );

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cartResp, summaryResp, insightsResp, recResp, taxesResp, alertsResp, recoveryResp] = await Promise.all([
          getCart(),
          getCartSummary().catch(() => null),
          getCartInsights().catch(() => null),
          getCartRecommendations().catch(() => [] as CartRecommendation[]),
          getCartTaxes().catch(() => null),
          getCartAlerts().catch(() => [] as CartAlert[]),
          getCartRecoveryStatus().catch(() => null)
        ]);
        if (!alive) return;
        setCart(cartResp);
        setItems(cartResp.items ?? []);
        setSummary(summaryResp);
        setInsights(insightsResp);
        setTaxes(taxesResp);
        setAlerts(alertsResp);
        setRecoveryStatus(recoveryResp?.status || null);
        const recs = Array.isArray(recResp) ? (recResp as CartRecommendation[]) : [];
        setRecommendations(recs.map((rec) => ({
          original_product_id: rec.original_product_id,
          candidate_product_id: rec.candidate_product_id,
          score: rec.score,
          reason: rec.reason
        })));
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to load cart.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!items.length) {
      if (alertForm.product_id) {
        setAlertForm(prev => ({ ...prev, product_id: '' }));
      }
      return;
    }
    const currentStillExists = items.some((item) => item.product_id === alertForm.product_id);
    if (!currentStillExists) {
      setAlertForm(prev => ({ ...prev, product_id: items[0].product_id }));
    }
  }, [alertForm.product_id, items]);

  useEffect(() => {
    const query = priceWatchSearch.trim();
    if (query.length < 2) {
      setCatalogWatchProducts([]);
      setCatalogWatchLoading(false);
      return;
    }

    let alive = true;
    const timer = window.setTimeout(async () => {
      setCatalogWatchLoading(true);
      try {
        const response = await search({ q: query });
        const results = Array.isArray(response?.results) ? response.results.slice(0, 8) : [];
        const hydrated = await Promise.all(
          results.map(async (result: any) => {
            try {
              const detail = await getProduct(result.canonical_id);
              return {
                id: result.canonical_id || detail?.id || '',
                sellerId: detail?.seller_id || detail?.sellerId || result.seller_id || '',
                name: detail?.name || detail?.title || result.name || 'Product',
                description: detail?.description || detail?.summary || '',
                price: Number(detail?.current_price ?? detail?.price ?? result.price ?? 0),
                category: detail?.category || detail?.category_id || 'general',
                mediaUrl: detail?.media_url || detail?.mediaUrl || detail?.image_url || '',
                mediaType: ((detail?.media_type || detail?.media?.[0]?.media_type || 'image') as 'image' | 'video'),
                tags: Array.isArray(detail?.tags) ? detail.tags : [],
                stockLevel: Number(detail?.stock_level ?? detail?.stockLevel ?? 0),
              } as Product;
            } catch {
              return {
                id: result.canonical_id || '',
                sellerId: result.seller_id || '',
                name: result.name || 'Product',
                description: '',
                price: Number(result.price ?? 0),
                category: 'general',
                mediaUrl: '',
                mediaType: 'image' as const,
                tags: [],
                stockLevel: 0,
              } as Product;
            }
          })
        );
        if (!alive) return;
        setCatalogWatchProducts(hydrated.filter((product) => product.id));
      } catch {
        if (!alive) return;
        setCatalogWatchProducts([]);
      } finally {
        if (alive) setCatalogWatchLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [priceWatchSearch]);

  useEffect(() => {
    if (!items.length && recommendations.length === 0) return;
    let alive = true;
    const loadProducts = async () => {
      const seeded: Record<string, ProductView> = {};
      items.forEach((item) => {
        const name = item.product_name || item.product_title;
        const mediaUrl = item.product_media_url || item.product_image_url;
        if (name || mediaUrl) {
          seeded[item.product_id] = {
            id: item.product_id,
            name: name || item.product_id,
            mediaUrl: mediaUrl || undefined
          };
        }
      });
      const productIds = new Set<string>();
      items.forEach((item) => productIds.add(item.product_id));
      recommendations.forEach((rec) => {
        productIds.add(rec.original_product_id);
        productIds.add(rec.candidate_product_id);
      });
      const entries = await Promise.all(
        Array.from(productIds).map(async (id) => {
          if (seeded[id]?.name || seeded[id]?.mediaUrl) {
            return [id, null] as const;
          }
          try {
            const product = await getProduct(id);
            return [id, product] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      if (!alive) return;
      const next: Record<string, ProductView> = { ...seeded };
      for (const [id, product] of entries) {
        if (next[id]) continue;
        if (product) {
          next[id] = {
            id,
            name: product.name || product.title,
            mediaUrl: product.media_url || product.mediaUrl || product.image_url
          };
        } else {
          next[id] = { id };
        }
      }
      setProductsById(next);
      setRecommendations((prev) => prev.map((rec) => {
        const original = next[rec.original_product_id];
        const candidate = next[rec.candidate_product_id];
        const candidateProduct = entries.find(([id]) => id === rec.candidate_product_id)?.[1];
        const price = candidateProduct?.price ?? candidateProduct?.current_price ?? candidateProduct?.unit_price;
        const sellerId = candidateProduct?.seller_id ?? candidateProduct?.sellerId;
        return {
          ...rec,
          originalName: original?.name,
          candidateName: candidate?.name,
          candidatePrice: typeof price === 'number' ? price : undefined,
          candidateSellerId: sellerId,
          candidateMediaUrl: candidate?.mediaUrl
        };
      }));
    };
    loadProducts();
    return () => {
      alive = false;
    };
  }, [items, recommendationKey]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Current location'
        });
      },
      () => {
        setOrigin(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!cart?.id || !origin) return;
    let alive = true;
    const loadEstimate = async () => {
      try {
        const estimate = await estimateDelivery({
          cart_id: cart.id,
          origin_lat: origin.lat,
          origin_lng: origin.lng
        });
        if (!alive) return;
        setDelivery(estimate);
      } catch {
        if (!alive) return;
        setDelivery(null);
      }
    };
    loadEstimate();
    return () => {
      alive = false;
    };
  }, [cart?.id, origin]);

  const uniqueSellerCount = useMemo(() => {
    const ids = new Set(items.map(item => item.seller_id).filter(Boolean));
    return ids.size;
  }, [items]);

  const total = useMemo(() => {
    if (summary?.total !== undefined && summary?.total !== null) return Number(summary.total);
    return items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0);
  }, [summary, items]);

  const lowStock = useMemo(() => {
    if (typeof insights?.low_stock_count === 'number') return insights.low_stock_count;
    if (typeof insights?.stock_risk === 'number') return insights.stock_risk;
    return 0;
  }, [insights]);

  const currency = summary?.currency || taxes?.currency || items[0]?.currency || 'KES';

  const formatMoney = (amount?: number | null, code: string = currency) => {
    if (amount === undefined || amount === null || !Number.isFinite(Number(amount))) return `${code} -`;
    return `${code} ${Number(amount).toFixed(0)}`;
  };

  const getProductLabel = (productId?: string, fallback?: string) => {
    if (!productId) return fallback || 'Item';
    return productsById[productId]?.name || fallback || 'Item';
  };

  const recoveryLabel = useMemo(() => {
    if (recoveryStatus === 'queued') return 'Saved for later';
    if (recoveryStatus === 'none') return 'Not saved yet';
    if (recoveryStatus === 'unknown') return 'Unavailable right now';
    if (!recoveryStatus) return 'Not saved yet';
    return recoveryStatus.charAt(0).toUpperCase() + recoveryStatus.slice(1);
  }, [recoveryStatus]);

  const selectedAlertItem = useMemo(
    () => items.find((item) => item.product_id === alertForm.product_id) || null,
    [alertForm.product_id, items]
  );

  const priceWatchOptions = useMemo(() => {
    const seen = new Set<string>();
    const fromBag = items
      .filter((item) => {
        if (!item.product_id || seen.has(item.product_id)) return false;
        seen.add(item.product_id);
        return true;
      })
      .map((item) => ({
        productId: item.product_id,
        label: getProductLabel(item.product_id, item.product_name || item.product_title || 'Item'),
        seller: item.seller_name || '',
        price: item.unit_price,
        currency: item.currency || currency,
        source: 'bag' as const,
      }));

    const fromCatalog = catalogWatchProducts
      .filter((product) => product.id && !seen.has(product.id))
      .map((product) => {
        seen.add(product.id);
        return {
          productId: product.id,
          label: product.name || 'Product',
          seller: '',
          price: product.price,
          currency,
          source: 'catalog' as const,
        };
      });

    return [...fromBag, ...fromCatalog];
  }, [catalogWatchProducts, currency, getProductLabel, items]);

  const selectedPriceWatchOption = useMemo(
    () => priceWatchOptions.find((item) => item.productId === alertForm.product_id) || null,
    [alertForm.product_id, priceWatchOptions]
  );

  const recommendationSummary = (rec: RecommendationView) => {
    const score = Number(rec.score ?? 0);
    if (score >= 0.9) return 'Best match';
    if (score >= 0.75) return 'Great alternative';
    if (score >= 0.6) return 'Worth a look';
    return 'Suggested option';
  };

  const groupedRecommendations = useMemo(() => {
    const byOriginal = new Map<string, RecommendationView[]>();
    recommendations.forEach((rec) => {
      const existing = byOriginal.get(rec.original_product_id) || [];
      existing.push(rec);
      existing.sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));
      byOriginal.set(rec.original_product_id, existing);
    });
    return Array.from(byOriginal.entries()).map(([originalProductId, options]) => {
      const currentItem = items.find((item) => item.product_id === originalProductId) || null;
      return {
        originalProductId,
        currentItem,
        currentName: options[0]?.originalName || currentItem?.product_name || currentItem?.product_title || getProductLabel(originalProductId),
        options,
      };
    });
  }, [getProductLabel, items, recommendations]);

  const refreshCart = async () => {
    const [cartResp, summaryResp, insightsResp, taxesResp, alertsResp, recoveryResp, recResp] = await Promise.all([
      getCart(),
      getCartSummary().catch(() => null),
      getCartInsights().catch(() => null),
      getCartTaxes().catch(() => null),
      getCartAlerts().catch(() => [] as CartAlert[]),
      getCartRecoveryStatus().catch(() => null),
      getCartRecommendations().catch(() => [] as CartRecommendation[])
    ]);
    setCart(cartResp);
    setItems(cartResp.items ?? []);
    setSummary(summaryResp);
    setInsights(insightsResp);
    setTaxes(taxesResp);
    setAlerts(alertsResp);
    setRecoveryStatus(recoveryResp?.status || null);
    const recs = Array.isArray(recResp) ? (recResp as CartRecommendation[]) : [];
    setRecommendations(recs.map((rec) => ({
      original_product_id: rec.original_product_id,
      candidate_product_id: rec.candidate_product_id,
      score: rec.score,
      reason: rec.reason
    })));
  };

  const handleRemove = async (itemId: string) => {
    try {
      await deleteCartItem(itemId);
      await refreshCart();
    } catch (err: any) {
      setError(err?.message || 'Unable to remove item.');
    }
  };

  const handleQuantityChange = async (item: CartItem, nextQty: number) => {
    try {
      if (nextQty <= 0) {
        await deleteCartItem(item.id);
      } else {
        await updateCartItem(item.id, { quantity: nextQty });
      }
      await refreshCart();
    } catch (err: any) {
      setError(err?.message || 'Unable to update item.');
    }
  };

  const handleSwitch = async (rec: RecommendationView) => {
    try {
      const original = items.find((item) => item.product_id === rec.original_product_id);
      if (!original) {
        setError('We could not update that item right now.');
        return;
      }
      if (!rec.candidateSellerId || rec.candidatePrice === undefined) {
        setError('This option is not ready yet.');
        return;
      }
      await deleteCartItem(original.id);
      await addCartItem({
        product_id: rec.candidate_product_id,
        seller_id: rec.candidateSellerId,
        quantity: original.quantity,
        unit_price: rec.candidatePrice
      });
      await refreshCart();
    } catch (err: any) {
      setError(err?.message || 'We could not swap that item right now.');
    }
  };

  const openRecommendedProduct = (rec: RecommendationView) => {
    onOpenProduct({
      id: rec.candidate_product_id,
      sellerId: rec.candidateSellerId || '',
      name: rec.candidateName || 'Suggested item',
      description: rec.reason || '',
      price: rec.candidatePrice || 0,
      category: '',
      mediaUrl: rec.candidateMediaUrl || '',
      mediaType: 'image',
      tags: [],
      stockLevel: 0,
    });
  };

  const handleSwapBestMatches = async () => {
    try {
      const bestOptions = groupedRecommendations
        .map((group) => ({ original: group.currentItem, candidate: group.options[0] }))
        .filter((entry) => entry.original && entry.candidate?.candidateSellerId && entry.candidate?.candidatePrice !== undefined);

      if (!bestOptions.length) {
        setSwapStatus('No ready-to-swap options are available right now.');
        return;
      }

      for (const entry of bestOptions) {
        const original = entry.original!;
        const candidate = entry.candidate!;
        await deleteCartItem(original.id);
        await addCartItem({
          product_id: candidate.candidate_product_id,
          seller_id: candidate.candidateSellerId!,
          quantity: original.quantity,
          unit_price: candidate.candidatePrice!,
        });
      }

      setSwapStatus('Your best matches have been added to the bag.');
      await refreshCart();
    } catch (err: any) {
      setSwapStatus(err?.message || 'We could not swap those items right now.');
    }
  };

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 bg-white border-b border-zinc-100 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black">Your Bag</p>
              {!hasSession && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-amber-700">
                  Guest
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500">{items.length} items</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-400">Total</p>
          <p className="text-sm font-black text-zinc-900">KES {total.toFixed(0)}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 text-[11px] font-bold text-zinc-500">
            Loading your bag...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
            <ShoppingBag className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-900">Your bag is empty</p>
            <p className="text-[10px] text-zinc-500">
              Add items to keep shopping. Guests can checkout after signing in.
            </p>
          </div>
        )}

        {items.map(item => {
          const product = productsById[item.product_id];
          const displayName = product?.name || item.product_name || item.product_title || 'Item';
          const displayMedia = product?.mediaUrl || item.product_media_url || item.product_image_url || '';
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex gap-4">
              {displayMedia ? (
                <img src={displayMedia} className="w-16 h-16 rounded-xl object-cover" alt={displayName} />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {displayName?.slice(0, 2).toUpperCase() || 'NA'}
                </div>
              )}
              <div className="flex-1">
                <button
                  onClick={() => {
                    if (!displayName) return;
                    onOpenProduct({
                      id: product?.id || item.product_id,
                      sellerId: item.seller_id || '',
                      name: displayName,
                      description: '',
                      price: item.unit_price || 0,
                      category: '',
                      mediaUrl: displayMedia,
                      mediaType: 'image',
                      tags: [],
                      stockLevel: 0
                    });
                  }}
                  className="text-left"
                >
                  <p className="text-sm font-bold text-zinc-900">{displayName}</p>
                </button>
                <p className="text-[10px] text-zinc-500">{item.seller_name || 'Sold by a nearby shop'}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                  <span>Qty</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600"
                    >
                      -
                    </button>
                    <span className="min-w-[20px] text-center text-zinc-900">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-sm font-black text-indigo-600 mt-2">
                  {formatMoney(item.unit_price, item.currency || currency)}
                </p>
              </div>
              <button onClick={() => handleRemove(item.id)} className="text-[10px] font-bold text-zinc-400">Remove</button>
            </div>
          );
        })}

        {items.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Delivery Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Shops</p>
                <p className="text-sm font-black text-zinc-900">{insights?.seller_count ?? uniqueSellerCount}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Stock Check</p>
                <p className={`text-sm font-black ${lowStock > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lowStock > 0 ? `${lowStock} to watch` : 'All good'}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Distance</p>
                <p className="text-sm font-black text-zinc-900">{delivery?.distance_km?.toFixed(1) || '—'} km</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Delivery fee</p>
                <p className="text-sm font-black text-zinc-900">
                  {delivery?.cost_amount ? formatMoney(delivery.cost_amount, delivery.currency || currency) : '—'}
                </p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Items</p>
                <p className="text-sm font-black text-zinc-900">{insights?.items ?? items.length}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Bag total</p>
                <p className="text-sm font-black text-zinc-900">{formatMoney(insights?.total ?? total, currency)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500">
              <MapPin className="w-3 h-3" /> Delivery starts from: {origin?.label || 'Turn on location to estimate delivery'}
            </div>

            <div className="mt-4 bg-zinc-50 rounded-2xl p-3">
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1"><Route className="w-3 h-3" /> Estimated trip</span>
                <span>{delivery?.distance_km?.toFixed(1) || '—'} km</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery time</span>
                <span>{delivery?.eta_minutes ? `${Math.ceil(delivery.eta_minutes / 60)} hr${Math.ceil(delivery.eta_minutes / 60) === 1 ? '' : 's'}` : '—'}</span>
              </div>
            </div>

            {lowStock > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                Some items may sell out soon. Check the suggestions below for similar options.
              </div>
            )}
          </div>
        )}

        {groupedRecommendations.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Swap Options</h3>
              </div>
              <button
                onClick={handleSwapBestMatches}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-[10px] font-bold text-white"
              >
                Swap Best Matches
              </button>
            </div>
            <p className="mb-4 text-[10px] font-bold text-zinc-500">
              If an item is running low or there is a better nearby option, you can switch it here.
            </p>

            <div className="space-y-4">
              {groupedRecommendations.map((group) => (
                <div key={group.originalProductId} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Current item</p>
                    <p className="mt-1 text-sm font-bold text-zinc-900">{group.currentName}</p>
                    {group.currentItem && (
                      <p className="text-[10px] text-zinc-500">
                        {formatMoney(group.currentItem.unit_price, group.currentItem.currency || currency)} • Qty {group.currentItem.quantity}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {group.options.slice(0, 3).map((rec, idx) => (
                      <div key={`${group.originalProductId}-${rec.candidate_product_id}-${idx}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-indigo-600">{recommendationSummary(rec)}</p>
                          <p className="truncate text-sm font-bold text-zinc-900">{rec.candidateName || 'Suggested item'}</p>
                          <p className="text-[10px] text-zinc-500">{rec.reason || 'A similar option is available now.'}</p>
                          <p className="text-[10px] text-zinc-500">
                            {rec.candidatePrice !== undefined ? formatMoney(rec.candidatePrice, currency) : 'Price will show when available'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openRecommendedProduct(rec)}
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-bold text-zinc-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleSwitch(rec)}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                            disabled={!rec.candidate_product_id || !rec.candidateSellerId || rec.candidatePrice === undefined}
                          >
                            Swap In
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {swapStatus && <div className="mt-4 text-[10px] font-bold text-zinc-500">{swapStatus}</div>}
          </div>
        )}

        {cart?.id && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Ready To Order?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Promo code"
                value={coupon.code}
                onChange={(e) => setCoupon(prev => ({ ...prev, code: e.target.value }))}
              />
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Discount amount"
                type="number"
                value={coupon.discount}
                onChange={(e) => setCoupon(prev => ({ ...prev, discount: e.target.value }))}
              />
              <button
                onClick={async () => {
                  try {
                    await applyCartCoupon({ cart_id: cart.id, code: coupon.code, discount_amount: Number(coupon.discount || 0) });
                    await refreshCart();
                  } catch (err: any) {
                    setError(err?.message || 'We could not apply that code.');
                  }
                }}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Apply Code
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Estimated tax</span>
              <span>{formatMoney(taxes?.tax, taxes?.currency || currency)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!hasSession) {
                    onRequireLogin?.('Sign in to place your order.');
                    return;
                  }
                  try {
                    await checkoutCart({ client_total: total });
                    await refreshCart();
                  } catch (err: any) {
                    setError(err?.message || 'We could not place your order.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold"
              >
                {hasSession ? 'Place Order' : 'Sign in to order'}
              </button>
              <button
                onClick={async () => {
                  if (!hasSession) {
                    onRequireLogin?.('Sign in to place separate orders by shop.');
                    return;
                  }
                  try {
                    await checkoutCartSplit({ client_total: total });
                    await refreshCart();
                  } catch (err: any) {
                    setError(err?.message || 'We could not split this order.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
              >
                {hasSession ? 'Order By Shop' : 'Sign in to order'}
              </button>
            </div>
          </div>
        )}

        {cart?.id && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Price Watches & Saved Bag</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700 sm:col-span-3"
                placeholder="Search items in your bag"
                value={priceWatchSearch}
                onChange={(e) => setPriceWatchSearch(e.target.value)}
              />
              <select
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                value={alertForm.product_id}
                onChange={(e) => setAlertForm(prev => ({ ...prev, product_id: e.target.value }))}
              >
                <option value="">Choose an item</option>
                {priceWatchOptions.map((item) => (
                  <option key={item.productId} value={item.productId}>
                    {item.label}{item.seller ? ` • ${item.seller}` : ''}{item.source === 'catalog' ? ' • Search result' : ' • In bag'}
                  </option>
                ))}
              </select>
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Tell me when the price drops to"
                type="number"
                value={alertForm.target_price}
                onChange={(e) => setAlertForm(prev => ({ ...prev, target_price: e.target.value }))}
              />
              <button
                onClick={async () => {
                  try {
                    if (!alertForm.product_id) {
                      setAlertStatus('Choose an item first.');
                      return;
                    }
                    await createCartAlert({ cart_id: cart.id, product_id: alertForm.product_id, target_price: Number(alertForm.target_price || 0) });
                    setAlertStatus('Price watch saved.');
                    await refreshCart();
                  } catch (err: any) {
                    setAlertStatus(err?.message || 'We could not save that price watch.');
                  }
                }}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Save Price Watch
              </button>
            </div>
            <div className="text-[10px] font-bold text-zinc-500">
              Search looks through your bag first, then matching products from the catalog.
            </div>
            {catalogWatchLoading && (
              <div className="text-[10px] font-bold text-zinc-500">
                Searching products...
              </div>
            )}
            {priceWatchSearch && priceWatchOptions.length === 0 && (
              <div className="text-[10px] font-bold text-zinc-500">
                No matching products found.
              </div>
            )}
            {selectedAlertItem && (
              <div className="text-[10px] font-bold text-zinc-500">
                Watching: {getProductLabel(selectedAlertItem.product_id, selectedAlertItem.product_name || selectedAlertItem.product_title || 'Item')}
                {selectedAlertItem.unit_price ? ` • Current price ${formatMoney(selectedAlertItem.unit_price, selectedAlertItem.currency || currency)}` : ''}
              </div>
            )}
            {!selectedAlertItem && selectedPriceWatchOption && (
              <div className="text-[10px] font-bold text-zinc-500">
                Watching: {selectedPriceWatchOption.label}
                {selectedPriceWatchOption.price ? ` • Current price ${formatMoney(selectedPriceWatchOption.price, selectedPriceWatchOption.currency)}` : ''}
              </div>
            )}
            {alertStatus && <div className="text-[10px] font-bold text-zinc-500">{alertStatus}</div>}
            {alerts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alerts.map((alert, idx) => (
                  <div key={`${alert.product_id}-${idx}`} className="p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700">
                    {getProductLabel(alert.product_id)} • Tell me at {formatMoney(alert.target_price, currency)}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Saved bag status</span>
              <span>{recoveryLabel}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await notifyCartRecovery();
                  await refreshCart();
                  setAlertStatus('Your bag has been saved for later.');
                } catch (err: any) {
                  setError(err?.message || 'We could not save your bag right now.');
                }
              }}
              className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
            >
              Save My Bag For Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
