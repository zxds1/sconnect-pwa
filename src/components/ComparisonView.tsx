import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft, ShoppingBag, Star, BarChart3, MapPin, Map as MapIcon } from 'lucide-react';
import { Product } from '../types';
import { addCartItem } from '../lib/cartApi';
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
  const [mapLoadingProductId, setMapLoadingProductId] = useState<string | null>(null);
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'add' | 'remove' | 'view'>('all');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const view = analysisResponses.map(({ item, analysis }) => {
        const product: CompareProduct | undefined = analysis?.product;
        const offers = analysis?.offers || [];
        const bestOffer = offers.length
          ? [...offers].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0]
          : null;
        return {
          id: item.product_id,
          name: product?.name || item.product_name,
          brand: product?.brand,
          categoryId: product?.category_id,
          imageUrl: product?.image_url || item.product_image_url,
          bestOffer,
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

  const formattedProducts = useMemo(() => products.filter(p => p.id), [products]);
  const activeMapItem = activeMapProduct?.mapItems?.[0];

  if (!loading && formattedProducts.length === 0) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center p-6 text-center">
        <BarChart3 className="w-16 h-16 text-zinc-200 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Comparison List Empty</h2>
        <p className="text-sm text-zinc-500 mb-6">Add products from search or detail views to compare them side-by-side.</p>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm"
        >
          Go Back
        </button>
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
        </div>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{formattedProducts.length} Items</span>
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
            {formattedProducts.map((product) => (
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
                      </div>
                    )}
                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Price Analysis</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">Value Score</span>
                        <span className="text-xs font-bold text-zinc-900">{product.bestOffer?.value_score ?? '—'}</span>
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
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Availability</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-600">Status</span>
                        <span className="text-xs font-black text-zinc-900">{product.bestOffer?.availability_status || product.bestOffer?.stock_status || '—'}</span>
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
            ))}
          </div>
        </div>
      )}

      {activeMapProduct && activeMapItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <MapIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900">Location Map</p>
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

            <div className="relative h-[360px] bg-zinc-100">
              <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-14 h-14 bg-white rounded-full border-2 border-indigo-600 shadow-xl overflow-hidden">
                    {activeMapProduct.imageUrl || activeMapProduct.fallbackImageUrl ? (
                      <img src={activeMapProduct.imageUrl || activeMapProduct.fallbackImageUrl} className="w-full h-full object-cover" alt="location" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-400">NA</div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-indigo-600" />
                </div>
              </div>
            </div>

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
