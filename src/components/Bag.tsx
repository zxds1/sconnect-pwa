import React, { useMemo, useState } from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, ArrowRight, RefreshCcw, MapPin, Truck, AlertTriangle, Route, BarChart3 } from 'lucide-react';
import { Product } from '../types';
import { SELLERS } from '../mockData';

interface BagProps {
  items: Product[];
  allProducts: Product[];
  onBack: () => void;
  onRemove: (id: string) => void;
  onOpenProduct: (product: Product) => void;
  onSwap: (current: Product, next: Product) => void;
  onSwitchAll: (target: Product[]) => void;
}

type PricingConfig = {
  basePerShop: number;
  perKm: number;
  speedKmh: number;
  stopMinutes: number;
};

export const Bag: React.FC<BagProps> = ({ items, allProducts, onBack, onRemove, onOpenProduct, onSwap, onSwitchAll }) => {
  const [deliveryMode, setDeliveryMode] = useState<'single' | 'separate'>('single');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => {
    try {
      const raw = localStorage.getItem('soko:delivery_pricing');
      if (raw) return JSON.parse(raw) as PricingConfig;
    } catch {}
    return {
      basePerShop: 80,
      perKm: 22,
      speedKmh: 25,
      stopMinutes: 18
    };
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('soko:delivery_pricing', JSON.stringify(pricingConfig));
    } catch {}
  }, [pricingConfig]);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const lowStock = items.filter(i => i.stockLevel < 5).length;

  const recommendations = useMemo(() => {
    if (items.length === 0) return [];
    const categories = new Set(items.map(i => i.category));
    return allProducts.filter(p => categories.has(p.category) && !items.find(i => i.id === p.id)).slice(0, 6);
  }, [items, allProducts]);

  const sellerStops = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; location?: { lat: number; lng: number; address: string } }>();
    items.forEach(item => {
      const seller = SELLERS.find(s => s.id === item.sellerId);
      if (!seller) return;
      if (!unique.has(seller.id)) {
        unique.set(seller.id, { id: seller.id, name: seller.name, location: seller.location });
      }
    });
    return Array.from(unique.values());
  }, [items]);

  const origin = useMemo(() => {
    const first = sellerStops.find(s => s.location);
    return first?.location || { lat: -1.286389, lng: 36.817223, address: 'Your location (mock)' };
  }, [sellerStops]);

  const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const spreadKm = useMemo(() => {
    const points = sellerStops.filter(s => s.location).map(s => s.location!) ;
    if (points.length < 2) return 0;
    let max = 0;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        max = Math.max(max, distanceKm(points[i], points[j]));
      }
    }
    return max;
  }, [sellerStops]);

  const routeEstimate = useMemo(() => {
    const stops = sellerStops.filter(s => s.location);
    if (stops.length === 0) return { distance: 0, etaHours: 0, sequence: [] as string[] };
    if (deliveryMode === 'separate') {
      const distance = stops.reduce((sum, s) => sum + distanceKm(origin, s.location!), 0) * 2;
      const etaHours = distance / pricingConfig.speedKmh + stops.length * (pricingConfig.stopMinutes / 60);
      return { distance, etaHours, sequence: stops.map(s => s.name) };
    }
    // simple nearest neighbor route from origin
    const remaining = [...stops];
    const sequence: string[] = [];
    let current = origin;
    let distance = 0;
    while (remaining.length > 0) {
      remaining.sort((a, b) => distanceKm(current, a.location!) - distanceKm(current, b.location!));
      const next = remaining.shift()!;
      distance += distanceKm(current, next.location!);
      sequence.push(next.name);
      current = next.location!;
    }
    const etaHours = distance / pricingConfig.speedKmh + sequence.length * (pricingConfig.stopMinutes / 60);
    return { distance, etaHours, sequence };
  }, [sellerStops, origin, deliveryMode, pricingConfig]);

  const deliveryCost = useMemo(() => {
    const shops = Math.max(1, sellerStops.length);
    return pricingConfig.basePerShop * shops + routeEstimate.distance * pricingConfig.perKm;
  }, [sellerStops, routeEstimate, pricingConfig]);

  const alternativeSets = useMemo(() => {
    if (items.length === 0) return [] as { label: string; items: Product[] }[];
    const sameSeller = items[0]?.sellerId;
    const sameSellerItems = allProducts.filter(p => p.sellerId === sameSeller && !items.find(i => i.id === p.id)).slice(0, items.length);
    const differentSellerItems = allProducts.filter(p => p.sellerId !== sameSeller && !items.find(i => i.id === p.id)).slice(0, items.length);
    return [
      { label: 'Same seller alternatives', items: sameSellerItems },
      { label: 'Different seller alternatives', items: differentSellerItems }
    ];
  }, [items, allProducts]);

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
        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
            <ShoppingBag className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-900">Your bag is empty</p>
            <p className="text-[10px] text-zinc-500">Add items to see smart swaps and analytics.</p>
          </div>
        )}

        {items.map(item => {
          const seller = SELLERS.find(s => s.id === item.sellerId);
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex gap-4">
              <img src={item.mediaUrl} className="w-16 h-16 rounded-xl object-cover" alt={item.name} />
              <div className="flex-1">
                <button onClick={() => onOpenProduct(item)} className="text-left">
                  <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                </button>
                <p className="text-[10px] text-zinc-500">{seller?.name}</p>
                <p className="text-sm font-black text-indigo-600 mt-1">KES {item.price}</p>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-[10px] font-bold text-zinc-400">Remove</button>
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
                <p className="text-sm font-black text-zinc-900">{sellerStops.length}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Stock Risk</p>
                <p className={`text-sm font-black ${lowStock > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lowStock}</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Multi-Shop Spread</p>
                <p className="text-sm font-black text-zinc-900">{spreadKm.toFixed(1)} km</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[9px] text-zinc-400 uppercase">Delivery Cost</p>
                <p className="text-sm font-black text-zinc-900">KES {deliveryCost.toFixed(0)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500">
              <MapPin className="w-3 h-3" /> Route origin: {origin.address}
            </div>

            <div className="mt-4 bg-zinc-50 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2 text-[10px] font-bold text-zinc-500">
                <span>Delivery Mode</span>
                <span className="text-indigo-600">{deliveryMode === 'single' ? 'Single route' : 'Separate deliveries'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeliveryMode('single')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black ${deliveryMode === 'single' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}
                >
                  Single Route
                </button>
                <button
                  onClick={() => setDeliveryMode('separate')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black ${deliveryMode === 'separate' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}
                >
                  Separate
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1"><Route className="w-3 h-3" /> Route distance</span>
                <span>{routeEstimate.distance.toFixed(1)} km</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> ETA</span>
                <span>{routeEstimate.etaHours.toFixed(1)} hrs</span>
              </div>
              {routeEstimate.sequence.length > 0 && (
                <div className="mt-2 text-[10px] text-zinc-500">
                  Route: {routeEstimate.sequence.join(' → ')}
                </div>
              )}
            </div>

            <div className="mt-4 bg-white rounded-2xl border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-2 text-[10px] font-bold text-zinc-500">
                <span>Delivery Config</span>
                <span className="text-indigo-600">Hybrid pricing</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <label className="flex flex-col gap-1 text-zinc-500">
                  Base per shop (KES)
                  <input
                    type="number"
                    value={pricingConfig.basePerShop}
                    onChange={(e) => setPricingConfig(prev => ({ ...prev, basePerShop: Number(e.target.value) }))}
                    className="p-2 bg-zinc-50 rounded-xl text-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-zinc-500">
                  Per km (KES)
                  <input
                    type="number"
                    value={pricingConfig.perKm}
                    onChange={(e) => setPricingConfig(prev => ({ ...prev, perKm: Number(e.target.value) }))}
                    className="p-2 bg-zinc-50 rounded-xl text-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-zinc-500">
                  Speed (km/h)
                  <input
                    type="number"
                    value={pricingConfig.speedKmh}
                    onChange={(e) => setPricingConfig(prev => ({ ...prev, speedKmh: Number(e.target.value) }))}
                    className="p-2 bg-zinc-50 rounded-xl text-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-zinc-500">
                  Stop time (min)
                  <input
                    type="number"
                    value={pricingConfig.stopMinutes}
                    onChange={(e) => setPricingConfig(prev => ({ ...prev, stopMinutes: Number(e.target.value) }))}
                    className="p-2 bg-zinc-50 rounded-xl text-zinc-900"
                  />
                </label>
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

        {items.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Smart Recommendations</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {items.map(item => {
                const alt = recommendations.find(r => r.category === item.category);
                if (!alt) return null;
                return (
                  <div key={`${item.id}-alt`} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500">Switch alternative</p>
                      <p className="text-sm font-bold text-zinc-900">{alt.name}</p>
                      <p className="text-[10px] text-zinc-500">KES {alt.price}</p>
                    </div>
                    <button
                      onClick={() => onSwap(item, alt)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                    >
                      Switch
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCcw className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">One-Tap Alternatives</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {alternativeSets.map(set => (
                <button
                  key={set.label}
                  onClick={() => onSwitchAll(set.items)}
                  className="w-full px-4 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold flex items-center justify-between"
                >
                  <span>{set.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-3">Switch all recommendations from same seller or different seller.</p>
          </div>
        )}
      </div>
    </div>
  );
};
