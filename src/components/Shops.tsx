import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Star, MapPin, ArrowRight, ArrowLeft, BadgeCheck } from 'lucide-react';
import { searchShops, type ShopDirectoryEntry } from '../lib/shopDirectoryApi';

interface ShopsProps {
  onBack?: () => void;
  onShopClick: (sellerId: string) => void;
}

export const Shops: React.FC<ShopsProps> = ({ onBack, onShopClick }) => {
  const fallbackInitials = (value: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
      || 'S';
  const [query, setQuery] = useState('');
  const [shops, setShops] = useState<ShopDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setStatus(null);
      try {
        const items = await searchShops({ query: query.trim() || undefined });
        if (alive) setShops(items);
      } catch (err: any) {
        if (alive) {
          setShops([]);
          setStatus(err?.message || 'Unable to load shops.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const shopCards = useMemo(() => {
    return shops.map((shop) => {
      const id = shop.seller_id || shop.id || '';
      const name = shop.name || 'Shop';
      const rating = Number(shop.rating ?? 0);
      const verified = Boolean(shop.verified);
      const locationLabel = typeof shop.location === 'string'
        ? shop.location
        : shop.location?.address || '';
      const category = shop.category || 'General';
      const avatar = (shop as any)?.logo_url || '';
      const description = (shop as any)?.description || shop.category || '';
      return { id, name, rating, verified, locationLabel, category, avatar, description, raw: shop };
    });
  }, [shops]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(shopCards.map((shop) => shop.category).filter(Boolean)));
  }, [shopCards]);

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="mb-4 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 transition-colors" aria-label="Go back">
              <ArrowLeft className="w-5 h-5 text-zinc-900" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-zinc-900">Discover Shops</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search for sellers or categories..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Featured Sellers */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-zinc-800">Top Rated Sellers</h2>
          <button
            onClick={() => {
              setStatus(null);
              setQuery('');
            }}
            className="text-indigo-600 text-xs font-bold uppercase tracking-wider"
          >
            View All
          </button>
        </div>

        {status && (
          <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
            {status}
          </div>
        )}
        {loading && (
          <div className="p-3 rounded-2xl bg-white border border-zinc-100 text-xs font-bold text-zinc-500">
            Loading shops...
          </div>
        )}
        {!loading && shopCards.length === 0 && (
          <div className="p-3 rounded-2xl bg-white border border-zinc-100 text-xs font-bold text-zinc-500">
            No shops matched the production directory response yet.
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          {shopCards.map((seller, i) => (
            <motion.div 
              key={seller.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onShopClick(seller.id)}
              className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex gap-4 items-center mb-4">
                {seller.avatar ? (
                  <img src={seller.avatar} className="w-16 h-16 rounded-full border-2 border-zinc-50 object-cover" alt="avatar" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-50 bg-zinc-900 text-sm font-black text-white">
                    {fallbackInitials(seller.name)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-zinc-900">{seller.name}</h3>
                    {seller.verified && <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-50" />}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-xs font-bold">{seller.rating ? seller.rating.toFixed(1) : '—'}</span>
                    <span className="text-zinc-400 text-[10px] ml-1">{seller.category}</span>
                  </div>
                  {seller.locationLabel && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.locationLabel)}`, '_blank');
                      }}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors text-[10px] font-medium"
                    >
                      <MapPin className="w-3 h-3" />
                      <span className="underline">{seller.locationLabel}</span>
                    </button>
                  )}
                </div>
                <button className="p-2 bg-zinc-100 rounded-full">
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4 line-clamp-2 italic">
                "{seller.description || 'Production shop details will appear here once the directory sync resolves.'}"
              </p>

              <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-600">
                <span>Products {seller.raw?.products ?? seller.raw?.total_products ?? '—'}</span>
                <span>Stars {seller.raw?.stars_earned ?? '—'}</span>
                <span>Last sync {seller.raw?.last_sync_at ? new Date(seller.raw.last_sync_at).toLocaleDateString() : '—'}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Categories */}
        <div className="pt-4">
          <h2 className="font-bold text-zinc-800 mb-4">Browse Categories</h2>
          {availableCategories.length === 0 && (
            <div className="p-3 bg-white border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-500">
              No categories surfaced from the live directory yet.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {availableCategories.map((cat) => (
              <div key={cat} className="h-24 bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-2xl relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                  <span className="text-white font-bold text-sm drop-shadow-md">{cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
