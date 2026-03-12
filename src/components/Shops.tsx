import React from 'react';
import { motion } from 'motion/react';
import { Search, Star, MapPin, ArrowRight, ShoppingBag, BadgeCheck } from 'lucide-react';
import { SELLERS } from '../mockData';

interface ShopsProps {
  onShopClick: (sellerId: string) => void;
}

export const Shops: React.FC<ShopsProps> = ({ onShopClick }) => {
  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Discover Shops</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search for sellers or categories..." 
            className="w-full pl-10 pr-4 py-3 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Featured Sellers */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-zinc-800">Top Rated Sellers</h2>
          <button className="text-indigo-600 text-xs font-bold uppercase tracking-wider">View All</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {SELLERS.map((seller, i) => (
            <motion.div 
              key={seller.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onShopClick(seller.id)}
              className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex gap-4 items-center mb-4">
                <img src={seller.avatar} className="w-16 h-16 rounded-full border-2 border-zinc-50 object-cover" alt="avatar" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-zinc-900">{seller.name}</h3>
                    {seller.isVerified && <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-50" />}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-xs font-bold">{seller.rating}</span>
                    <span className="text-zinc-400 text-[10px] ml-1">(1.2k reviews)</span>
                  </div>
                  {seller.location && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.location!.address)}`, '_blank');
                      }}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors text-[10px] font-medium"
                    >
                      <MapPin className="w-3 h-3" />
                      <span className="underline">{seller.location.address}</span>
                    </button>
                  )}
                </div>
                <button className="p-2 bg-zinc-100 rounded-full">
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4 line-clamp-2 italic">
                "{seller.description}"
              </p>

              {/* Mini Product Preview */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[1, 2, 3].map(j => (
                  <div key={j} className="w-20 h-20 bg-zinc-100 rounded-lg shrink-0 overflow-hidden relative">
                    <img src={`https://picsum.photos/seed/shop-${i}-${j}/100/100`} className="w-full h-full object-cover" alt="preview" />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                ))}
                <div className="w-20 h-20 bg-indigo-50 rounded-lg shrink-0 flex flex-col items-center justify-center gap-1 border border-indigo-100">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <span className="text-[8px] font-bold text-indigo-600 uppercase">Shop All</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Categories */}
        <div className="pt-4">
          <h2 className="font-bold text-zinc-800 mb-4">Browse Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Electronics', 'Sustainable Fashion', 'Home Decor', 'Gourmet Food'].map((cat, i) => (
              <div key={i} className="h-24 bg-zinc-900 rounded-2xl relative overflow-hidden group cursor-pointer">
                <img 
                  src={`https://picsum.photos/seed/cat-${i}/300/200`} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                  alt="cat"
                />
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
