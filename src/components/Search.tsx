import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  X, 
  ShoppingBag, 
  ArrowRightLeft, 
  ChevronRight, 
  MapPin, 
  Map as MapIcon, 
  Grid,
  Mic,
  Camera,
  Navigation,
  CheckCircle2,
  TrendingUp,
  Bookmark,
  Bell,
  Sparkles,
  Clock
} from 'lucide-react';
import { Product } from '../types';
import { SELLERS } from '../mockData';

interface SearchProps {
  products: Product[];
  onProductOpen: (product: Product) => void;
  comparisonList: Product[];
  onAddToComparison: (product: Product) => void;
  onOpenComparison: () => void;
  onAddToBag: (product: Product) => void;
  onShopOpen: (sellerId: string) => void;
  initialQuery?: string;
  initialAction?: 'voice' | 'photo' | 'video' | 'hybrid';
}

export const Search: React.FC<SearchProps> = ({ products, onProductOpen, comparisonList, onAddToComparison, onOpenComparison, onAddToBag, onShopOpen, initialQuery, initialAction }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [activeLocationTooltip, setActiveLocationTooltip] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isHybridActive, setIsHybridActive] = useState(false);
  const [pendingHybrid, setPendingHybrid] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<'English' | 'Swahili' | 'Sheng'>('English');
  const [transcriptChips, setTranscriptChips] = useState<string[]>([]);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchPrefs, setWatchPrefs] = useState<Record<string, { targetPrice: number; createdAt: number }>>({});
  const [alertPrefs, setAlertPrefs] = useState({ priceDrops: true, backInStock: true, trending: true });
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === 'voice') {
      handleStartListening();
    }
    if (initialAction === 'photo') {
      handleOpenCamera();
    }
    if (initialAction === 'video') {
      videoInputRef.current?.click();
    }
    if (initialAction === 'hybrid') {
      setPendingHybrid(true);
      handleOpenCamera();
    }
  }, [initialAction]);

  useEffect(() => {
    try {
      setVoiceFeedbackEnabled(localStorage.getItem('soko:voice_feedback') === 'true');
    } catch {
      setVoiceFeedbackEnabled(false);
    }
  }, []);

  useEffect(() => {
    try {
      const rawSaved = localStorage.getItem('soko:saved_searches');
      const rawRecent = localStorage.getItem('soko:recent_searches');
      const rawWatch = localStorage.getItem('soko:watchlist');
      const rawFav = localStorage.getItem('soko:fav_shops');
      const rawWatchPrefs = localStorage.getItem('soko:watchlist_prefs');
      const rawAlertPrefs = localStorage.getItem('soko:alert_prefs');
      setSavedSearches(rawSaved ? JSON.parse(rawSaved) : []);
      setRecentSearches(rawRecent ? JSON.parse(rawRecent) : []);
      setWatchlist(rawWatch ? JSON.parse(rawWatch) : []);
      setFavoriteShopIds(rawFav ? JSON.parse(rawFav) : []);
      setWatchPrefs(rawWatchPrefs ? JSON.parse(rawWatchPrefs) : {});
      setAlertPrefs(rawAlertPrefs ? JSON.parse(rawAlertPrefs) : { priceDrops: true, backInStock: true, trending: true });
    } catch {
      setSavedSearches([]);
      setRecentSearches([]);
      setWatchlist([]);
      setFavoriteShopIds([]);
      setWatchPrefs({});
      setAlertPrefs({ priceDrops: true, backInStock: true, trending: true });
    }
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMaxDistance(10); // Default to 10km for "Near Me"
          setIsNearMeActive(true);
          setLocationQuery('My Location');
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please check permissions.");
        }
      );
    }
  };

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      alert('Could not access camera.');
    }
  };

  const handleCloseCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPreview(dataUrl);
    // Heuristic "visual search": use tags/categories as hints
    const sampleTags = ['electronics', 'fashion', 'food', 'home', 'beauty', 'sports', 'office', 'kids', 'outdoors', 'accessories'];
    const hint = sampleTags[Math.floor(Math.random() * sampleTags.length)];
    setSearchQuery(hint);
    setIsHybridActive(pendingHybrid || false);
    setPendingHybrid(false);
    handleCloseCamera();
  };

  const handleVideoSelect = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setSearchQuery('video match');
    setIsHybridActive(false);
  };

  const handleReadResults = () => {
    if (!voiceFeedbackEnabled) {
      alert('Enable Voice-First Feedback in Settings.');
      return;
    }
    const summary = filteredProducts.slice(0, 3).map(p => `${p.name} for ${p.price} shillings`).join('. ');
    if ('speechSynthesis' in window && summary) {
      const utter = new SpeechSynthesisUtterance(`Results: ${summary}.`);
      utter.lang = 'sw-KE';
      window.speechSynthesis.speak(utter);
      return;
    }
    alert('Voice feedback not supported on this browser.');
  };

  const detectLanguage = (text: string): 'English' | 'Swahili' | 'Sheng' => {
    const lower = text.toLowerCase();
    const swahiliHints = ['natafuta', 'bei', 'karibu', 'bidhaa', 'duka', 'risiti', 'sasa', 'hapa', 'tafadhali', 'kesho'];
    const shengHints = ['sasa hivi', 'msee', 'niko', 'poa', 'fiti', 'kitu', 'hii', 'ivo'];
    const swMatch = swahiliHints.some(h => lower.includes(h));
    const shMatch = shengHints.some(h => lower.includes(h));
    if (shMatch) return 'Sheng';
    if (swMatch) return 'Swahili';
    return 'English';
  };

  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported on this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = detectedLanguage === 'Swahili' ? 'sw-KE' : 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      const nextLang = detectLanguage(transcript);
      setDetectedLanguage(nextLang);
      setTranscriptChips(prev => [transcript, ...prev].slice(0, 5));
    };
    recognition.start();
  };

  const persistSavedSearches = (next: string[]) => {
    setSavedSearches(next);
    try {
      localStorage.setItem('soko:saved_searches', JSON.stringify(next));
    } catch {}
  };

  const persistRecentSearches = (next: string[]) => {
    setRecentSearches(next);
    try {
      localStorage.setItem('soko:recent_searches', JSON.stringify(next));
    } catch {}
  };

  const handleSaveSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    if (savedSearches.includes(query)) return;
    const next = [query, ...savedSearches].slice(0, 8);
    persistSavedSearches(next);
  };

  const recordSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    const next = [query, ...recentSearches.filter(q => q !== query)].slice(0, 8);
    persistRecentSearches(next);
  };

  const toggleFavoriteShop = (shopId: string) => {
    const next = favoriteShopIds.includes(shopId)
      ? favoriteShopIds.filter(id => id !== shopId)
      : [shopId, ...favoriteShopIds];
    setFavoriteShopIds(next);
    try {
      localStorage.setItem('soko:fav_shops', JSON.stringify(next));
    } catch {}
  };

  const filteredProducts = useMemo(() => {
    let results = products.filter(p => {
      const seller = SELLERS.find(s => s.id === p.sellerId);
      const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesRating = (seller?.rating || 0) >= minRating;
      
      let matchesLocation = true;
      if (isNearMeActive && userCoords) {
        if (seller?.location) {
          const dist = calculateDistance(userCoords.lat, userCoords.lng, seller.location.lat, seller.location.lng);
          matchesLocation = dist <= (maxDistance || 10);
        } else {
          matchesLocation = false;
        }
      } else if (locationQuery && locationQuery !== 'My Location') {
        matchesLocation = seller?.location?.address.toLowerCase().includes(locationQuery.toLowerCase()) || false;
      }

      return matchesQuery && matchesCategory && matchesPrice && matchesRating && matchesLocation;
    });

    if (sortBy === 'price_asc') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') {
      results.sort((a, b) => {
        const sA = SELLERS.find(s => s.id === a.sellerId);
        const sB = SELLERS.find(s => s.id === b.sellerId);
        const rA = (sA?.rating || 0) + (sA?.isVerified ? 0.3 : 0);
        const rB = (sB?.rating || 0) + (sB?.isVerified ? 0.3 : 0);
        return rB - rA;
      });
    }

    return results;
  }, [products, searchQuery, selectedCategory, priceRange, minRating, sortBy, userCoords, maxDistance, locationQuery, isNearMeActive]);

  const filteredShops = useMemo(() => {
    const shops = SELLERS.filter(s => {
      const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesQuery && searchQuery.length > 0) return false;
      const matchesCategory = !selectedCategory || products.some(p => p.sellerId === s.id && p.category === selectedCategory);
      const matchesPrice = products.some(p => p.sellerId === s.id && p.price >= priceRange[0] && p.price <= priceRange[1]);
      const matchesRating = s.rating >= minRating;

      let matchesLocation = true;
      if (isNearMeActive && userCoords && s.location) {
        const dist = calculateDistance(userCoords.lat, userCoords.lng, s.location.lat, s.location.lng);
        matchesLocation = dist <= (maxDistance || 10);
      } else if (locationQuery && locationQuery !== 'My Location') {
        matchesLocation = s.location?.address.toLowerCase().includes(locationQuery.toLowerCase()) || false;
      }

      return matchesCategory && matchesPrice && matchesRating && matchesLocation;
    });
    return shops.sort((a, b) => {
      const scoreA = (a.rating || 0) + (a.isVerified ? 0.5 : 0);
      const scoreB = (b.rating || 0) + (b.isVerified ? 0.5 : 0);
      return scoreB - scoreA;
    });
  }, [products, searchQuery, selectedCategory, priceRange, minRating, isNearMeActive, userCoords, maxDistance, locationQuery]);

  const trendingQueries = useMemo(() => {
    const pool = ['solar lantern', 'wireless earphones', 'organic honey', 'gas cooker', 'power bank', 'school shoes', 'cooking oil'];
    return pool.slice(0, 5);
  }, []);

  const recommendedProducts = useMemo(() => {
    if (recentSearches.length === 0) return products.slice(0, 4);
    const query = recentSearches[0].toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 4);
  }, [recentSearches, products]);

  const watchlistProducts = useMemo(() => {
    return products.filter(p => watchlist.includes(p.id)).slice(0, 4);
  }, [products, watchlist]);

  const recentPurchases = useMemo(() => {
    return products.slice(0, 5).map((p, idx) => ({
      id: p.id,
      name: p.name,
      shop: SELLERS.find(s => s.id === p.sellerId)?.name || 'Local Shop',
      time: `${12 - idx} mins ago`
    }));
  }, [products]);

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-20">
        <div className="flex gap-3 items-center mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  recordSearch();
                }
              }}
              placeholder="Search products, shops, or snap a photo..." 
              className="w-full pl-10 pr-20 py-3 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={handleStartListening}
                className={`p-1.5 transition-colors ${isListening ? 'text-emerald-600' : 'text-zinc-400 hover:text-indigo-600'}`}
                title="Voice search"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button 
                onClick={handleOpenCamera}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                title="Camera search"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                title="Video search"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-colors ${showFilters ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSaveSearch}
            className="p-3 rounded-xl bg-zinc-100 text-zinc-600 hover:text-indigo-600 transition-colors"
            title="Save this search"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={handleReadResults}
            className="p-3 rounded-xl bg-zinc-100 text-zinc-600 hover:text-indigo-600 transition-colors"
            title="Read results aloud"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="px-3 py-1.5 bg-zinc-100 rounded-full text-[10px] font-black text-zinc-600">
            Detected: {detectedLanguage}
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black text-emerald-700">
            Voice ready
          </div>
          {initialAction && (
            <div className="px-3 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-700">
              {initialAction === 'voice' && 'Voice Search Active'}
              {initialAction === 'photo' && 'Photo Search Active'}
              {initialAction === 'video' && 'Video Search Active'}
              {initialAction === 'hybrid' && 'Hybrid Search Active'}
            </div>
          )}
        </div>

        {transcriptChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {transcriptChips.map((t) => (
              <button
                key={t}
                onClick={() => setSearchQuery(t)}
                className="px-3 py-1.5 bg-indigo-50 rounded-full text-[10px] font-bold text-indigo-700"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleVideoSelect(e.target.files?.[0])}
        />

        {/* Quick Actions & Categories */}
        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={handleUseMyLocation}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${isNearMeActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}
          >
            <Navigation className="w-3 h-3" /> Near Me
          </button>

          <button
            onClick={() => {
              if (capturedPreview && searchQuery.trim()) {
                setIsHybridActive(true);
              } else {
                alert('Add a photo and text to activate hybrid search.');
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${isHybridActive ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
          >
            <Sparkles className="w-3 h-3" /> Hybrid
          </button>
          
          <div className="w-px h-4 bg-zinc-200 mx-1" />

          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative">
        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
            {filteredProducts.length} Results Found
          </h3>
          <div className="flex bg-zinc-200/50 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="h-[320px] sm:h-[500px] w-full bg-zinc-100 rounded-3xl overflow-hidden relative border-2 border-zinc-200">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
            
            {/* Map Markers */}
            {filteredProducts.map((product, i) => {
              if (!product.location) return null;
              const top = ((product.location.lat - 34) * 15) % 80 + 10;
              const left = ((product.location.lng + 120) * 15) % 80 + 10;
              
              return (
                <motion.div 
                  key={product.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ top: `${top}%`, left: `${left}%` }}
                  className="absolute z-10"
                >
                  <div className="relative group">
                    <button 
                      onClick={() => setActiveLocationTooltip(product.id)}
                      className="w-10 h-10 bg-white rounded-full border-2 border-indigo-600 shadow-xl overflow-hidden active:scale-90 transition-transform"
                    >
                      <img src={product.mediaUrl} className="w-full h-full object-cover" alt="marker" />
                    </button>
                    
                    <AnimatePresence>
                      {activeLocationTooltip === product.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white p-3 rounded-2xl shadow-2xl border border-zinc-100 z-20"
                        >
                          <div className="flex flex-col gap-2">
                            <img src={product.mediaUrl} className="w-full h-24 object-cover rounded-xl" alt="prod" />
                            <div>
                              <p className="text-xs font-black text-zinc-900 line-clamp-1">{product.name}</p>
                              <p className="text-[10px] font-bold text-indigo-600">${product.price}</p>
                            </div>
                            <button 
                              onClick={() => onProductOpen(product)}
                              className="w-full py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold"
                            >
                              View Product
                            </button>
                            {product.location?.address && (
                              <button
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.location!.address)}`, '_blank')}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold"
                              >
                                Get Directions
                              </button>
                            )}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}

            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Nearby Market View</p>
                  <p className="text-[10px] text-zinc-500">Showing {filteredProducts.length} items within your area</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Saved Searches</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{savedSearches.length} saved</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1.5 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Drop Alerts */}
            {watchlistProducts.length > 0 && alertPrefs.priceDrops && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price Drop Alerts</h3>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold">Watchlist</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {watchlistProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => onProductOpen(product)}
                      className="p-3 bg-zinc-50 rounded-xl flex items-center gap-3 text-left"
                    >
                      <img src={product.mediaUrl} className="w-10 h-10 rounded-lg object-cover" alt={product.name} />
                      <div>
                        <p className="text-xs font-bold text-zinc-900 line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">
                          Target: KES {watchPrefs[product.id]?.targetPrice ?? product.price}
                        </p>
                        {product.price <= (watchPrefs[product.id]?.targetPrice ?? product.price) && (
                          <p className="text-[10px] text-amber-600 font-bold">Alert ready</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Near You */}
            {alertPrefs.trending && (
              <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Trending Near You</h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold">Live</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingQueries.map(term => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1.5 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-700"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* For You */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recommended For You</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">Based on searches</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {recommendedProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => onProductOpen(product)}
                    className="p-3 bg-zinc-50 rounded-xl flex items-center gap-3 text-left"
                  >
                    <img src={product.mediaUrl} className="w-10 h-10 rounded-lg object-cover" alt={product.name} />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 line-clamp-1">{product.name}</p>
                      <p className="text-[10px] text-zinc-500">{product.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Just Bought Here */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Just Bought Here</h3>
              </div>
              <div className="space-y-2">
                {recentPurchases.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                    <span>{item.name} • {item.shop}</span>
                    <span className="text-zinc-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-white p-5 rounded-2xl border border-zinc-100 space-y-6 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Sort By</label>
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full bg-zinc-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="rating">Top Rated</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Min Trust Score</label>
                        <select 
                          value={minRating}
                          onChange={(e) => setMinRating(parseFloat(e.target.value))}
                          className="w-full bg-zinc-50 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="0">Any Rating</option>
                          <option value="4">4.0+ Stars</option>
                          <option value="4.5">4.5+ Stars</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Price Range</label>
                        <span className="text-xs font-black text-indigo-600">${priceRange[0]} - ${priceRange[1]}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1000" 
                        step="10"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-4 pt-2 border-t border-zinc-50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="text" 
                            value={locationQuery}
                            onChange={(e) => {
                              setLocationQuery(e.target.value);
                              if (e.target.value !== 'My Location') {
                                setUserCoords(null);
                                setIsNearMeActive(false);
                              }
                            }}
                            placeholder="Enter city or address..." 
                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {userCoords && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Distance Radius</label>
                            <span className="text-xs font-black text-indigo-600">{maxDistance} km</span>
                          </div>
                          <input 
                            type="range" 
                            min="5" 
                            max="500" 
                            step="5"
                            value={maxDistance || 50}
                            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}

                      <button 
                        onClick={handleUseMyLocation}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-colors ${isNearMeActive ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                      >
                        <Navigation className="w-4 h-4" /> {isNearMeActive ? 'Near Me Active' : 'Filter by Nearby Availability'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shops */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Shops</h3>
                <span className="text-[10px] font-bold text-zinc-400">{filteredShops.length} Shops</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {filteredShops.slice(0, 6).map(shop => (
                  <div
                    key={shop.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onShopOpen(shop.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onShopOpen(shop.id);
                    }}
                    className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between text-left hover:border-indigo-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img src={shop.avatar} className="w-12 h-12 rounded-full object-cover" alt={shop.name} />
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{shop.name}</p>
                        <p className="text-[10px] text-zinc-500">{shop.description}</p>
                        {shop.location && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold mt-1">
                            <MapPin className="w-3 h-3" /> {shop.location.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                      ★ {shop.rating}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteShop(shop.id);
                      }}
                      className={`ml-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${favoriteShopIds.includes(shop.id) ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {favoriteShopIds.includes(shop.id) ? 'Favorited' : 'Favorite'}
                    </button>
                  </div>
                ))}
                {filteredShops.length === 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    No shops found for this search.
                  </div>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-zinc-100 overflow-hidden flex flex-col shadow-sm cursor-pointer group"
                  onClick={() => onProductOpen(product)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img src={product.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isGoodDeal && (
                        <div className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <TrendingUp className="w-2 h-2" /> GOOD DEAL
                        </div>
                      )}
                      {product.stockStatus === 'low_stock' && (
                        <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
                          LOW STOCK
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToComparison(product);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${comparisonList.find(p => p.id === product.id) ? 'bg-indigo-600 text-white' : 'bg-white/80 text-zinc-600'}`}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col relative">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="font-bold text-zinc-900 text-sm line-clamp-1">{product.name}</h4>
                      {SELLERS.find(s => s.id === product.sellerId)?.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 mb-2 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="font-black text-indigo-600 text-sm">${product.price}</span>
                        {product.competitorPrice && (
                          <span className="text-[9px] text-zinc-400 line-through">${product.competitorPrice}</span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToBag(product);
                        }}
                        className="p-1.5 bg-zinc-100 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <SearchIcon className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400 font-medium">No products found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comparison Bar */}
      <AnimatePresence>
        {comparisonList.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-30"
          >
            <div className="bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex -space-x-3 overflow-x-auto no-scrollbar max-w-[120px] sm:max-w-[200px] py-1">
                  {comparisonList.map(p => (
                    <img 
                      key={p.id} 
                      src={p.mediaUrl} 
                      className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover shrink-0" 
                      alt="thumb" 
                    />
                  ))}
                </div>
                <div className="text-xs shrink-0">
                  <p className="font-bold">{comparisonList.length} Selected</p>
                  <p className="text-zinc-400 text-[10px]">Compare features</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onAddToComparison(comparisonList[0])}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  onClick={onOpenComparison}
                  data-compare-target="search"
                  className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                >
                  Compare <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden">
              <div className="relative">
                <video ref={videoRef} className="w-full h-80 object-cover" autoPlay playsInline />
                <button 
                  onClick={handleCloseCamera}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-xs text-white font-bold">Visual Search</span>
                <button onClick={handleCapture} className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold">
                  Capture
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Visual Search Preview */}
      {capturedPreview && (
        <div className="fixed bottom-28 left-4 right-4 sm:left-auto sm:right-4 z-[60] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden sm:w-32">
          <img src={capturedPreview} className="w-full h-24 object-cover" alt="capture" />
          <div className="p-2 text-[9px] font-bold text-zinc-600">
            Visual search applied
          </div>
        </div>
      )}

      {videoPreview && (
        <div className="fixed bottom-28 left-4 right-4 sm:left-auto sm:right-40 z-[60] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden sm:w-40">
          <video src={videoPreview} className="w-full h-24 object-cover" />
          <div className="p-2 text-[9px] font-bold text-zinc-600">
            Video search applied
          </div>
        </div>
      )}
    </div>
  );
};
