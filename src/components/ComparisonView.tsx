import React from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft, ShoppingBag, Star, BarChart3, TrendingDown, TrendingUp, MapPin, Map as MapIcon } from 'lucide-react';
import { Product } from '../types';

interface ComparisonViewProps {
  products: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onProductOpen: (product: Product) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ products, onClose, onRemove, onProductOpen }) => {
  const [activeMapProduct, setActiveMapProduct] = React.useState<Product | null>(null);

  if (products.length === 0) {
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
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{products.length} Items</span>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-w-max h-full">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-72 bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col overflow-hidden"
            >
              <div className="relative aspect-square">
                <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />
                <button 
                  onClick={() => onRemove(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-zinc-900"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <span className="text-white font-black text-sm">${product.price}</span>
                </div>
              </div>

              <div className="p-5 space-y-6 flex-1">
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-1 leading-tight">{product.name}</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{product.category}</p>
                </div>

                {/* Key Metrics */}
                <div className="space-y-4">
                  {product.location && (
                    <div className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Location</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-zinc-700 line-clamp-1">{product.location.address}</span>
                        </div>
                        <button
                          onClick={() => setActiveMapProduct(product)}
                          className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          Map View
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Price Analysis</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-600">Market Avg</span>
                      <span className="text-xs font-bold text-zinc-900">${product.competitorPrice || (product.price * 1.1).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-zinc-600">Variance</span>
                      {product.competitorPrice && product.price < product.competitorPrice ? (
                        <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" /> -{(((product.competitorPrice - product.price) / product.competitorPrice) * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" /> +{product.competitorPrice ? (((product.price - product.competitorPrice) / product.competitorPrice) * 100).toFixed(1) : '5.0'}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Social Proof</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-600">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-zinc-900">4.8</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-zinc-600">Reviews</span>
                      <span className="text-xs font-black text-zinc-900">{product.reviews?.length || 0}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Availability</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-600">Stock</span>
                      <span className={`text-xs font-black ${product.stockLevel < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {product.stockLevel} units
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto flex flex-col gap-2">
                  <button 
                    onClick={() => onProductOpen(product)}
                    className="w-full py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" /> View Details
                  </button>
                  <button 
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map Overlay */}
      {activeMapProduct?.location && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <MapIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900">Location Map</p>
                  <p className="text-[10px] text-zinc-500 font-bold">{activeMapProduct.location.address}</p>
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
                    <img src={activeMapProduct.mediaUrl} className="w-full h-full object-cover" alt="location" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-indigo-600" />
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activeMapProduct.mediaUrl} className="w-12 h-12 rounded-xl object-cover" alt="product" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">{activeMapProduct.name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">${activeMapProduct.price}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveMapProduct(null);
                  onProductOpen(activeMapProduct);
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
