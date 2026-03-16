import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, MapPin, Truck, AlertTriangle, Route, BarChart3 } from 'lucide-react';
import { Product } from '../types';
import { getProduct } from '../lib/catalogApi';
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
  swapCartItem,
  autoSwapCartItem,
  applyCartCoupon,
  checkoutCart,
  checkoutCartSplit,
  switchAllCartItems,
  createCartAlert,
  getCartAlerts,
  notifyCartRecovery,
  getCartRecoveryStatus,
  createCartRoute,
  getCartRoute,
  type Cart,
  type CartItem,
  type DeliveryEstimate,
  type CartRecommendation,
  type CartAlert,
  type CartRoute,
  type RoutePoint
} from '../lib/cartApi';

interface BagProps {
  onBack: () => void;
  onOpenProduct: (product: Product) => void;
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

export const Bag: React.FC<BagProps> = ({ onBack, onOpenProduct }) => {
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
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [autoSwapResult, setAutoSwapResult] = useState<any>(null);
  const [swapForm, setSwapForm] = useState({
    original_product_id: '',
    candidates: '[{"product_id":"","availability":0.9,"price_score":0.8,"similarity":0.85,"margin":0.6}]'
  });
  const [autoSwapForm, setAutoSwapForm] = useState({
    original_product_id: '',
    original_stock: '0',
    reserved_pct: '0.9',
    price_delta_pct: '0.05',
    same_brand: true,
    same_category: true,
    same_canonical: false,
    candidates: '[{"product_id":"","availability":0.9,"price_score":0.8,"similarity":0.85,"margin":0.6}]'
  });
  const [routePoints, setRoutePoints] = useState<Array<{ lat: string; lng: string }>>([{ lat: '', lng: '' }, { lat: '', lng: '' }]);
  const [routeResult, setRouteResult] = useState<CartRoute | null>(null);
  const [routeLookupId, setRouteLookupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          getCartSummary(),
          getCartInsights(),
          getCartRecommendations(),
          getCartTaxes(),
          getCartAlerts(),
          getCartRecoveryStatus()
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
    if (!items.length && recommendations.length === 0) return;
    let alive = true;
    const loadProducts = async () => {
      const productIds = new Set<string>();
      items.forEach((item) => productIds.add(item.product_id));
      recommendations.forEach((rec) => {
        productIds.add(rec.original_product_id);
        productIds.add(rec.candidate_product_id);
      });
      const entries = await Promise.all(
        Array.from(productIds).map(async (id) => {
          try {
            const product = await getProduct(id);
            return [id, product] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      if (!alive) return;
      const next: Record<string, ProductView> = {};
      for (const [id, product] of entries) {
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
    if (summary?.total) return Number(summary.total);
    return items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0);
  }, [summary, items]);

  const lowStock = useMemo(() => {
    if (typeof insights?.low_stock_count === 'number') return insights.low_stock_count;
    if (typeof insights?.stock_risk === 'number') return insights.stock_risk;
    return 0;
  }, [insights]);

  const refreshCart = async () => {
    const [cartResp, summaryResp, insightsResp, taxesResp, alertsResp, recoveryResp, recResp] = await Promise.all([
      getCart(),
      getCartSummary(),
      getCartInsights(),
      getCartTaxes(),
      getCartAlerts(),
      getCartRecoveryStatus(),
      getCartRecommendations()
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
        setError('Original cart item not found.');
        return;
      }
      if (!rec.candidateSellerId || !rec.candidatePrice) {
        setError('Candidate product is missing price or seller.');
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
      setError(err?.message || 'Unable to switch item.');
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
            <p className="text-sm font-black">Your Bag</p>
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
            Loading your cart...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
            <ShoppingBag className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-900">Your bag is empty</p>
            <p className="text-[10px] text-zinc-500">Add items to see smart swaps and analytics.</p>
          </div>
        )}

        {items.map(item => {
          const product = productsById[item.product_id];
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex gap-4">
              {product?.mediaUrl ? (
                <img src={product.mediaUrl} className="w-16 h-16 rounded-xl object-cover" alt={product.name || item.product_id} />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {product?.name?.slice(0, 2).toUpperCase() || 'NA'}
                </div>
              )}
              <div className="flex-1">
                <button
                  onClick={() => {
                    if (!product || !product.name) return;
                    onOpenProduct({
                      id: product.id,
                      sellerId: item.seller_id || '',
                      name: product.name,
                      description: '',
                      price: item.unit_price || 0,
                      category: '',
                      mediaUrl: product.mediaUrl || '',
                      mediaType: 'image',
                      tags: [],
                      stockLevel: 0
                    });
                  }}
                  className="text-left"
                >
                  <p className="text-sm font-bold text-zinc-900">{product?.name || item.product_id}</p>
                </button>
                <p className="text-[10px] text-zinc-500">Seller: {item.seller_id || '—'}</p>
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
                <p className="text-sm font-black text-indigo-600 mt-2">KES {item.unit_price || 0}</p>
              </div>
              <button onClick={() => handleRemove(item.id)} className="text-[10px] font-bold text-zinc-400">Remove</button>
            </div>
          );
        })}

        {items.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Bag Analytics</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Shops</p>
                <p className="text-sm font-black text-zinc-900">{insights?.seller_count ?? uniqueSellerCount}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Stock Risk</p>
                <p className={`text-sm font-black ${lowStock > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lowStock}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Distance</p>
                <p className="text-sm font-black text-zinc-900">{delivery?.distance_km?.toFixed(1) || '—'} km</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Delivery Cost</p>
                <p className="text-sm font-black text-zinc-900">
                  {delivery?.cost_amount ? `${delivery.currency || 'KES'} ${delivery.cost_amount.toFixed(0)}` : '—'}
                </p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Items</p>
                <p className="text-sm font-black text-zinc-900">{insights?.items ?? items.length}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Total</p>
                <p className="text-sm font-black text-zinc-900">KES {(insights?.total ?? total).toFixed(0)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500">
              <MapPin className="w-3 h-3" /> Route origin: {origin?.label || 'Location unavailable'}
            </div>

            <div className="mt-4 bg-zinc-50 rounded-2xl p-3">
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1"><Route className="w-3 h-3" /> Route distance</span>
                <span>{delivery?.distance_km?.toFixed(1) || '—'} km</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> ETA</span>
                <span>{delivery?.eta_minutes ? `${Math.ceil(delivery.eta_minutes / 60)} hrs` : '—'}</span>
              </div>
            </div>

            {lowStock > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                {lowStock} items are low stock. Use recommendations to swap or reduce delivery risk.
              </div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Smart Recommendations</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((rec, idx) => (
                <div key={`${rec.candidate_product_id}-${idx}`} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500">Switch alternative</p>
                    <p className="text-sm font-bold text-zinc-900">{rec.candidateName || rec.candidate_product_id}</p>
                    <p className="text-[10px] text-zinc-500">From: {rec.originalName || rec.original_product_id}</p>
                    <p className="text-[10px] text-zinc-500">Reason: {rec.reason || 'Recommended'}</p>
                    <p className="text-[10px] text-zinc-500">KES {rec.candidatePrice ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => handleSwitch(rec)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold disabled:opacity-50"
                    disabled={!rec.candidate_product_id}
                  >
                    Switch
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await switchAllCartItems();
                    setSwapStatus('Switch-all queued.');
                  } catch (err: any) {
                    setSwapStatus(err?.message || 'Switch-all failed.');
                  }
                }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Switch All Alternatives
              </button>
              {swapStatus && <span className="text-[10px] font-bold text-zinc-500">{swapStatus}</span>}
            </div>
          </div>
        )}

        {cart?.id && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Checkout & Coupons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Coupon code"
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
                    setError(err?.message || 'Unable to apply coupon.');
                  }
                }}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Apply Coupon
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Tax</span>
              <span>{taxes?.currency || 'KES'} {taxes?.tax?.toFixed(0) ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await checkoutCart({ client_total: total });
                    await refreshCart();
                  } catch (err: any) {
                    setError(err?.message || 'Checkout failed.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold"
              >
                Checkout
              </button>
              <button
                onClick={async () => {
                  try {
                    await checkoutCartSplit({ client_total: total });
                    await refreshCart();
                  } catch (err: any) {
                    setError(err?.message || 'Split checkout failed.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
              >
                Split Checkout
              </button>
            </div>
          </div>
        )}

        {cart?.id && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Alerts & Recovery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Product ID"
                value={alertForm.product_id}
                onChange={(e) => setAlertForm(prev => ({ ...prev, product_id: e.target.value }))}
              />
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Target price"
                type="number"
                value={alertForm.target_price}
                onChange={(e) => setAlertForm(prev => ({ ...prev, target_price: e.target.value }))}
              />
              <button
                onClick={async () => {
                  try {
                    await createCartAlert({ cart_id: cart.id, product_id: alertForm.product_id, target_price: Number(alertForm.target_price || 0) });
                    await refreshCart();
                  } catch (err: any) {
                    setError(err?.message || 'Unable to create alert.');
                  }
                }}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Create Alert
              </button>
            </div>
            {alerts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alerts.map((alert, idx) => (
                  <div key={`${alert.product_id}-${idx}`} className="p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700">
                    {alert.product_id} • Target KES {alert.target_price}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Recovery status</span>
              <span>{recoveryStatus || 'unknown'}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await notifyCartRecovery();
                  await refreshCart();
                } catch (err: any) {
                  setError(err?.message || 'Unable to notify recovery.');
                }
              }}
              className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
            >
              Notify Recovery
            </button>
          </div>
        )}

        {cart?.id && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Swap Scoring</h3>
            <div className="grid grid-cols-1 gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Original product ID"
                value={swapForm.original_product_id}
                onChange={(e) => setSwapForm(prev => ({ ...prev, original_product_id: e.target.value }))}
              />
              <textarea
                className="w-full min-h-[80px] p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder='Candidates JSON'
                value={swapForm.candidates}
                onChange={(e) => setSwapForm(prev => ({ ...prev, candidates: e.target.value }))}
              />
              <button
                onClick={async () => {
                  try {
                    const candidates = JSON.parse(swapForm.candidates);
                    const result = await swapCartItem({ original_product_id: swapForm.original_product_id, candidates });
                    setSwapResult(result);
                    setSwapStatus('Swap scored.');
                  } catch (err: any) {
                    setSwapStatus(err?.message || 'Swap scoring failed.');
                  }
                }}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
              >
                Score Swap Candidates
              </button>
            </div>
            {swapResult && (
              <div className="text-[10px] font-bold text-zinc-600 bg-zinc-50 rounded-xl p-3 space-y-1">
                <div>Original: {swapResult.original_product_id || '—'}</div>
                <div>Candidates:</div>
                {Array.isArray(swapResult.candidates) && swapResult.candidates.length > 0 ? (
                  swapResult.candidates.map((cand: any, idx: number) => (
                    <div key={`swap_${idx}`} className="flex items-center justify-between">
                      <span>{cand.product_id || '—'}</span>
                      <span>Score {typeof cand.score === 'number' ? cand.score.toFixed(2) : '—'}</span>
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Original product ID"
                value={autoSwapForm.original_product_id}
                onChange={(e) => setAutoSwapForm(prev => ({ ...prev, original_product_id: e.target.value }))}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                  placeholder="Stock"
                  value={autoSwapForm.original_stock}
                  onChange={(e) => setAutoSwapForm(prev => ({ ...prev, original_stock: e.target.value }))}
                />
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                  placeholder="Reserved %"
                  value={autoSwapForm.reserved_pct}
                  onChange={(e) => setAutoSwapForm(prev => ({ ...prev, reserved_pct: e.target.value }))}
                />
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                  placeholder="Price delta %"
                  value={autoSwapForm.price_delta_pct}
                  onChange={(e) => setAutoSwapForm(prev => ({ ...prev, price_delta_pct: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={autoSwapForm.same_brand}
                    onChange={(e) => setAutoSwapForm(prev => ({ ...prev, same_brand: e.target.checked }))}
                  />
                  Same brand
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={autoSwapForm.same_category}
                    onChange={(e) => setAutoSwapForm(prev => ({ ...prev, same_category: e.target.checked }))}
                  />
                  Same category
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={autoSwapForm.same_canonical}
                    onChange={(e) => setAutoSwapForm(prev => ({ ...prev, same_canonical: e.target.checked }))}
                  />
                  Same canonical
                </label>
              </div>
              <textarea
                className="w-full min-h-[80px] p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder='Candidates JSON'
                value={autoSwapForm.candidates}
                onChange={(e) => setAutoSwapForm(prev => ({ ...prev, candidates: e.target.value }))}
              />
              <button
                onClick={async () => {
                  try {
                    const candidates = JSON.parse(autoSwapForm.candidates);
                    const result = await autoSwapCartItem({
                      original_product_id: autoSwapForm.original_product_id,
                      original_stock: Number(autoSwapForm.original_stock || 0),
                      reserved_pct: Number(autoSwapForm.reserved_pct || 0),
                      price_delta_pct: Number(autoSwapForm.price_delta_pct || 0),
                      same_brand: autoSwapForm.same_brand,
                      same_category: autoSwapForm.same_category,
                      same_canonical: autoSwapForm.same_canonical,
                      candidates
                    });
                    setAutoSwapResult(result);
                    setSwapStatus('Auto-swap evaluated.');
                  } catch (err: any) {
                    setSwapStatus(err?.message || 'Auto-swap failed.');
                  }
                }}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Evaluate Auto Swap
              </button>
              {autoSwapResult && (
                <div className="text-[10px] font-bold text-zinc-600 bg-zinc-50 rounded-xl p-3 space-y-1">
                  <div>Auto swap: {autoSwapResult.auto_swap ? 'yes' : 'no'}</div>
                  <div>Original: {autoSwapResult.original_product_id || '—'}</div>
                  <div>Candidate: {autoSwapResult.candidate?.product_id || '—'}</div>
                  <div>Score: {typeof autoSwapResult.candidate?.score === 'number' ? autoSwapResult.candidate.score.toFixed(2) : '—'}</div>
                </div>
              )}
              {swapStatus && <div className="text-[10px] font-bold text-zinc-500">{swapStatus}</div>}
            </div>
          </div>
        )}

        {cart?.id && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Routes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {routePoints.map((pt, idx) => (
                <div key={`pt_${idx}`} className="flex gap-2">
                  <input
                    className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                    placeholder="Lat"
                    value={pt.lat}
                    onChange={(e) => setRoutePoints(prev => prev.map((p, i) => i === idx ? { ...p, lat: e.target.value } : p))}
                  />
                  <input
                    className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                    placeholder="Lng"
                    value={pt.lng}
                    onChange={(e) => setRoutePoints(prev => prev.map((p, i) => i === idx ? { ...p, lng: e.target.value } : p))}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRoutePoints(prev => [...prev, { lat: '', lng: '' }])}
                className="px-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold"
              >
                Add Point
              </button>
              <button
                onClick={async () => {
                  try {
                    const points: RoutePoint[] = routePoints
                      .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }))
                      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
                    const route = await createCartRoute({ cart_id: cart.id, points });
                    setRouteResult(route);
                  } catch (err: any) {
                    setError(err?.message || 'Unable to create route.');
                  }
                }}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
              >
                Create Route
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                placeholder="Route ID"
                value={routeLookupId}
                onChange={(e) => setRouteLookupId(e.target.value)}
              />
              <button
                onClick={async () => {
                  try {
                    const route = await getCartRoute(routeLookupId);
                    setRouteResult(route);
                  } catch (err: any) {
                    setError(err?.message || 'Unable to fetch route.');
                  }
                }}
                className="px-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold"
              >
                Fetch
              </button>
            </div>
            {routeResult?.route_wkt && (
              <div className="text-[10px] font-bold text-zinc-600 bg-zinc-50 rounded-xl p-3">
                {routeResult.route_wkt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
