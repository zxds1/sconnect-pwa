import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, BarChart3, Settings, Package, 
  Sparkles, X, Upload, Star, MapPin, Edit3, Save, Trash2,
  Wand2, TrendingUp, Users, AlertCircle,
  ArrowUpRight, Wallet, Megaphone, QrCode, Download, 
  ShieldCheck, Clock, MessageSquare, Heart, Phone,
  LineChart as LineChartIcon, Zap, Send, Search as SearchIcon
} from 'lucide-react';
import { MARKETING_SPEND, ORDERS, PRODUCTS, SELLERS, SUPPLIERS, SUPPLIER_OFFERS, RFQ_THREADS } from '../mockData';
import { Product, Seller } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { ListingOptimizer } from './ListingOptimizer';

const SALES_DATA = [
  { name: 'Mon', sales: 4000, reach: 2400 },
  { name: 'Tue', sales: 3000, reach: 1398 },
  { name: 'Wed', sales: 2000, reach: 9800 },
  { name: 'Thu', sales: 2780, reach: 3908 },
  { name: 'Fri', sales: 1890, reach: 4800 },
  { name: 'Sat', sales: 2390, reach: 3800 },
  { name: 'Sun', sales: 3490, reach: 4300 },
];

const CATEGORY_DEMAND = [
  { category: 'Electronics', demand: 85, sellerShare: 40 },
  { category: 'Fashion', demand: 65, sellerShare: 20 },
  { category: 'Home', demand: 45, sellerShare: 10 },
  { category: 'Accessories', demand: 90, sellerShare: 75 },
];

const STOCK_HEALTH = [
  { name: 'Healthy', value: 70, color: '#10b981' },
  { name: 'Low Stock', value: 20, color: '#f59e0b' },
  { name: 'Out of Stock', value: 10, color: '#ef4444' },
];

const DEMOGRAPHICS_DATA = [
  { name: 'Gen Z (18-24)', value: 35, color: '#6366f1' },
  { name: 'Millennials (25-34)', value: 45, color: '#8b5cf6' },
  { name: 'Gen X (35-50)', value: 15, color: '#d946ef' },
  { name: 'Others', value: 5, color: '#f43f5e' },
];

const COMPETITOR_PRICING = [
  { name: 'Bamboo Watch', yourPrice: 45, avgPrice: 42, competitorMin: 38 },
  { name: 'Eco Tote', yourPrice: 12, avgPrice: 15, competitorMin: 10 },
  { name: 'Yoga Mat', yourPrice: 35, avgPrice: 32, competitorMin: 28 },
  { name: 'Water Bottle', yourPrice: 25, avgPrice: 22, competitorMin: 18 },
];

const SALES_VELOCITY = [
  { name: 'Mon', velocity: 45, target: 40 },
  { name: 'Tue', velocity: 52, target: 40 },
  { name: 'Wed', velocity: 38, target: 40 },
  { name: 'Thu', velocity: 65, target: 40 },
  { name: 'Fri', velocity: 48, target: 40 },
  { name: 'Sat', velocity: 70, target: 40 },
  { name: 'Sun', velocity: 85, target: 40 },
];

const TOP_SEARCHED = [
  { name: 'Solar Lanterns', searches: 120, trend: '+15%' },
  { name: 'Organic Honey', searches: 85, trend: '+8%' },
  { name: 'Leather Sandals', searches: 64, trend: '+22%' },
];

const PEAK_HOURS = [
  { hour: '8am', searches: 120 },
  { hour: '10am', searches: 340 },
  { hour: '12pm', searches: 560 },
  { hour: '2pm', searches: 480 },
  { hour: '4pm', searches: 720 },
  { hour: '6pm', searches: 980 },
  { hour: '8pm', searches: 650 },
  { hour: '10pm', searches: 210 },
];

const TRENDING_PRODUCTS = [
  { name: 'Omo 3kg', demand: 'High', supplier: 'Unilever Partner' },
  { name: 'Sugar 2kg', demand: 'Medium', supplier: 'Kibera Wholesale' },
  { name: 'Bread', demand: 'Rising', supplier: 'Bakery Collective' }
];

const GOD_VIEW_SOURCES = [
  { label: 'QR', value: 127 },
  { label: 'Photos', value: 47 },
  { label: 'POS', value: 892 },
  { label: 'CRM', value: 156 }
];

const GOD_VIEW_DEMAND = [
  { name: 'Omo 3kg', pct: 87 },
  { name: 'Sugar 2kg', pct: 62 },
  { name: 'Bread', pct: 45 }
];

const GOD_VIEW_BUYERS = [
  { name: 'Priya', item: 'Omo x2', price: 'KSh580', source: 'QR' },
  { name: 'John', item: 'Sugar x1', price: 'KSh240', source: 'QR' },
  { name: 'Amina', item: 'Bread x3', price: 'KSh60', source: 'POS' },
  { name: 'Mary', item: 'Omo x3 repeat', price: '—', source: 'CRM' }
];

const GOD_VIEW_COMPETITORS = [
  { name: 'YOU', price: 'KSh580', stock: 187, trend: '—' },
  { name: 'Ali', price: 'KSh560', stock: 234, trend: '🔻' },
  { name: 'Fatma', price: 'KSh620', stock: 98, trend: '🔺' },
  { name: 'Network Avg', price: 'KSh592', stock: 156, trend: '—' }
];

const GOD_VIEW_INVENTORY = [
  { name: 'Omo 3kg', your: '187 (📸+POS)', network: '+12% demand' },
  { name: 'Sugar 2kg', your: '42 (📸)', network: '-8% demand' },
  { name: 'Sunlight', your: '98 (POS)', network: 'Stable' },
  { name: 'Bread', your: '23 (📸)', network: '+23% demand' }
];

const GOD_VIEW_ALERTS = [
  'Omo demand +47% (Kibera)',
  'Sugar overstock risk',
  'Ali dropped price to KSh560',
  'Photo bread shelf? +2⭐'
];

interface SellerDashboardProps {
  products: Product[];
  onProductsChange: (next: Product[]) => void;
  onToast?: (msg: string) => void;
  sellerBalance: number;
  onSellerBalanceChange: (next: number) => void;
  sellerPayouts: Array<{ id: string; amount: number; reason: string; timestamp: number }>;
  onSellerPayoutsChange: (next: Array<{ id: string; amount: number; reason: string; timestamp: number }>) => void;
  verifiedSellerIds: string[];
  onVerifiedSellerIdsChange: (next: string[]) => void;
  onOpenSellerChat?: () => void;
  onOpenSupportChat?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  products,
  onProductsChange,
  onToast,
  sellerBalance,
  onSellerBalanceChange,
  sellerPayouts,
  onSellerPayoutsChange,
  verifiedSellerIds,
  onVerifiedSellerIdsChange,
  onOpenSellerChat,
  onOpenSupportChat
}) => {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller>(SELLERS[0]); // Mocking s1
  const [myProducts, setMyProducts] = useState<Product[]>(
    products.filter(p => p.sellerId === SELLERS[0].id)
  );
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [campaigns, setCampaigns] = useState<Array<{
    id: string;
    name: string;
    objective: 'reach' | 'sales' | 'favorites';
    budget: number;
    durationDays: number;
    productId: string;
    channel: 'search' | 'feed' | 'messages';
    status: 'scheduled' | 'active' | 'completed';
  }>>([]);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    objective: 'sales' as 'reach' | 'sales' | 'favorites',
    budget: 1200,
    durationDays: 7,
    productId: '',
    channel: 'search' as 'search' | 'feed' | 'messages'
  });

  // Form States
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    mediaUrl: string;
    stockLevel: number;
    expiryDate?: string;
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    mediaUrl: '',
    stockLevel: 10,
    expiryDate: ''
  });

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: seller.name,
    description: seller.description,
    address: seller.location?.address || ''
  });

  const [showListingOptimizer, setShowListingOptimizer] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [supplierFilters, setSupplierFilters] = useState({
    category: '',
    maxDistance: 50,
    minRating: 0,
    verifiedOnly: false,
    maxLeadTime: 14,
    maxMOQ: 50,
    maxUnitCost: 500,
    paymentTerms: ''
  });
  const [sellerFilters, setSellerFilters] = useState({
    category: '',
    maxDistance: 50,
    minRating: 0,
    verifiedOnly: false,
    minOrderValue: 0
  });
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [rfqThreadsLocal, setRfqThreadsLocal] = useState(RFQ_THREADS);
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqStep, setRfqStep] = useState<'details' | 'suppliers' | 'review'>('details');
  const [rfqDraft, setRfqDraft] = useState({
    type: 'single' as 'single' | 'multi' | 'group' | 'standing' | 'emergency',
    title: '',
    deliveryLocation: '',
    items: [{ name: '', quantity: 1, unit: 'units' }],
    supplierIds: [] as string[]
  });
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [compareSort, setCompareSort] = useState<'price' | 'eta' | 'rating' | 'distance'>('price');
  const [analyticsDelta, setAnalyticsDelta] = useState({ views: 0, inquiries: 0, sales: 0, revenue: 0 });
  const [broadcastCount, setBroadcastCount] = useState(0);

  useEffect(() => {
    const isVerified = verifiedSellerIds.includes(seller.id);
    setSeller(prev => ({ ...prev, isVerified }));
    setMyProducts(products.filter(p => p.sellerId === seller.id));
  }, [products, seller.id, verifiedSellerIds]);

  useEffect(() => {
    try {
      localStorage.setItem(`soko:seller_analytics_delta:${seller.id}`, JSON.stringify(analyticsDelta));
      localStorage.setItem(`soko:seller_broadcasts:${seller.id}`, String(broadcastCount));
    } catch {}
  }, [analyticsDelta, broadcastCount]);

  useEffect(() => {
    try {
      const rawDelta = localStorage.getItem(`soko:seller_analytics_delta:${seller.id}`);
      const rawBroadcasts = localStorage.getItem(`soko:seller_broadcasts:${seller.id}`);
      setAnalyticsDelta(rawDelta ? JSON.parse(rawDelta) : { views: 0, inquiries: 0, sales: 0, revenue: 0 });
      setBroadcastCount(rawBroadcasts ? Number(rawBroadcasts) : 0);
    } catch {
      setAnalyticsDelta({ views: 0, inquiries: 0, sales: 0, revenue: 0 });
      setBroadcastCount(0);
    }
  }, [seller.id]);

  const pushProducts = (nextMyProducts: Product[]) => {
    const others = products.filter(p => p.sellerId !== seller.id);
    onProductsChange([...nextMyProducts, ...others]);
  };

  const now = new Date();
  const ordersForSeller = ORDERS.filter(o => o.sellerId === seller.id);
  const last30Orders = ordersForSeller.filter(o => (now.getTime() - new Date(o.createdAt).getTime()) <= 30 * 24 * 60 * 60 * 1000);
  const last30Revenue = last30Orders.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);
  const last30Customers = new Set(last30Orders.map(o => o.customerId)).size;
  const totalOrders = ordersForSeller.length;
  const totalUnits = ordersForSeller.reduce((sum, o) => sum + o.quantity, 0);
  const totalRevenue = ordersForSeller.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);
  const totalCost = ordersForSeller.reduce((sum, o) => sum + o.quantity * o.unitCost, 0);
  const averagePrice = totalOrders ? totalRevenue / totalOrders : (myProducts.reduce((sum, p) => sum + p.price, 0) / Math.max(myProducts.length, 1));
  const estimatedMonthlyViews = seller.dailyViews * 30;
  const estimatedMonthlyOrders = Math.max(1, last30Orders.length || totalOrders || 1);
  const conversionRate = estimatedMonthlyViews ? (estimatedMonthlyOrders / estimatedMonthlyViews) * 100 : 0;
  const estimatedMonthlyRevenue = totalOrders ? (totalRevenue / Math.max(totalOrders, 1)) * estimatedMonthlyOrders : estimatedMonthlyOrders * averagePrice;
  const marketingSpend = MARKETING_SPEND.filter(m => m.sellerId === seller.id).reduce((sum, m) => sum + m.amount, 0);
  const customerOrderCounts = ordersForSeller.reduce((map, o) => {
    map.set(o.customerId, (map.get(o.customerId) || 0) + 1);
    return map;
  }, new Map<string, number>());
  const uniqueCustomers = customerOrderCounts.size || 1;
  const newCustomers = Array.from(customerOrderCounts.values()).filter(c => c === 1).length || 1;
  const purchaseFrequency = totalOrders / uniqueCustomers;
  const churnRate = 0.25;
  const ltv = Math.round(averagePrice * purchaseFrequency / churnRate);
  const cac = Math.round(marketingSpend / Math.max(newCustomers, 1));
  const roas = marketingSpend ? (estimatedMonthlyRevenue / marketingSpend) : 0;
  const totalStock = myProducts.reduce((sum, p) => sum + p.stockLevel, 0);
  const stockCoverageDays = Math.round(totalStock / Math.max(estimatedMonthlyOrders / 30, 1));
  const repeatRate = Math.min(70, Math.round((purchaseFrequency / Math.max(1, purchaseFrequency + 1)) * 100 + seller.rating * 4));
  const topCategories = Array.from(
    myProducts.reduce((map, p) => {
      map.set(p.category, (map.get(p.category) || 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const demandHeatmap = PRODUCTS.map((p, i) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    demand: 40 + ((i * 23) % 60)
  })).filter(p => p.location);

  const productsWithCompetitor = myProducts.filter(p => p.competitorPrice);
  const priceCompetitiveness = productsWithCompetitor.length
    ? (productsWithCompetitor.reduce((sum, p) => sum + (p.price / (p.competitorPrice || p.price)), 0) / productsWithCompetitor.length) * 100
    : 100;
  const stockoutRate = myProducts.length
    ? (myProducts.filter(p => p.stockLevel === 0).length / myProducts.length) * 100
    : 0;
  const sellThroughRate = totalStock + estimatedMonthlyOrders > 0
    ? (estimatedMonthlyOrders / (totalStock + estimatedMonthlyOrders)) * 100
    : 0;
  const grossMarginPct = totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const netMarginPct = totalRevenue ? ((totalRevenue - totalCost - marketingSpend - totalRevenue * 0.05) / totalRevenue) * 100 : 0;
  const avgInventoryValue = myProducts.reduce((sum, p) => sum + p.stockLevel * (p.costPrice || p.price * 0.65), 0);
  const inventoryTurns = avgInventoryValue ? ((totalCost || estimatedMonthlyRevenue * 0.65) / avgInventoryValue) * 12 : 0;
  const gmroi = avgInventoryValue ? ((totalRevenue - totalCost) / avgInventoryValue) * 12 : 0;
  const returnRate = totalOrders ? (ordersForSeller.filter(o => o.returned).length / totalOrders) * 100 : 0;
  const cartAbandonRate = Math.min(90, Math.max(30, 100 - (conversionRate / 0.12)));
  const avgItemsPerOrder = totalOrders ? totalUnits / totalOrders : 1;
  const promoLift = Math.min(30, Math.max(5, roas * 3));
  const repeatPurchaseIntervalDays = (() => {
    const intervals: number[] = [];
    customerOrderCounts.forEach((_, customerId) => {
      const customerOrders = ordersForSeller.filter(o => o.customerId === customerId)
        .map(o => new Date(o.createdAt).getTime())
        .sort((a, b) => a - b);
      for (let i = 1; i < customerOrders.length; i += 1) {
        intervals.push((customerOrders[i] - customerOrders[i - 1]) / (1000 * 60 * 60 * 24));
      }
    });
    if (intervals.length === 0) return 60;
    return Math.round(intervals.reduce((sum, v) => sum + v, 0) / intervals.length);
  })();
  const channelMix = ['search', 'feed', 'messages', 'direct'].map((name) => {
    const count = ordersForSeller.filter(o => o.channel === name).length;
    return { name: name[0].toUpperCase() + name.slice(1), value: totalOrders ? Math.round((count / totalOrders) * 100) : 0 };
  });
  const fulfillmentTimeDays = totalOrders
    ? ordersForSeller.reduce((sum, o) => {
        const created = new Date(o.createdAt).getTime();
        const fulfilled = new Date(o.fulfilledAt).getTime();
        const days = (fulfilled - created) / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, days);
      }, 0) / totalOrders
    : 0;
  const onTimeRate = totalOrders
    ? (ordersForSeller.filter(o => o.slaMet).length / totalOrders) * 100
    : 0;
  const csat = Math.min(5, Math.max(3, seller.rating));
  const dataCoverageRate = myProducts.length
    ? (myProducts.filter(p => p.location).length / myProducts.length) * 100
    : 0;
  const dataFreshnessDays = myProducts.reduce((sum, p) => {
    const last = p.priceHistory?.[p.priceHistory.length - 1]?.date;
    if (!last) return sum + 30;
    const diff = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    return sum + Math.min(90, Math.max(0, diff));
  }, 0) / Math.max(myProducts.length, 1);
  const verificationRate = Math.min(98, 70 + seller.rating * 5);
  const anomalyRate = Math.max(0.5, 6 - seller.rating);
  const lostSalesEstimate = Math.round((stockoutRate / 100) * estimatedMonthlyOrders * averagePrice);

  const handleLaunchCampaign = () => {
    if (!campaignForm.name || !campaignForm.productId) return;
    setCampaigns(prev => [
      {
        id: `c_${Date.now()}`,
        name: campaignForm.name,
        objective: campaignForm.objective,
        budget: campaignForm.budget,
        durationDays: campaignForm.durationDays,
        productId: campaignForm.productId,
        channel: campaignForm.channel,
        status: 'active'
      },
      ...prev
    ]);
    setCampaignForm({
      name: '',
      objective: 'sales',
      budget: 1200,
      durationDays: 7,
      productId: '',
      channel: 'search'
    });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', mediaUrl: '', stockLevel: 10, expiryDate: '' });
    setIsAddingProduct(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      mediaUrl: product.mediaUrl,
      stockLevel: product.stockLevel,
      expiryDate: product.expiryDate || ''
    });
    setIsAddingProduct(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct?.id || `p${Date.now()}`,
      sellerId: seller.id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      mediaUrl: formData.mediaUrl || 'https://picsum.photos/seed/new/400/400',
      mediaType: 'image',
      tags: [],
      stockLevel: 10, // Default stock level
      location: seller.location,
      expiryDate: formData.expiryDate
    };

    if (editingProduct) {
      setMyProducts(prev => {
        const next = prev.map(p => p.id === editingProduct.id ? newProduct : p);
        pushProducts(next);
        return next;
      });
    } else {
      setMyProducts(prev => {
        const next = [...prev, newProduct];
        pushProducts(next);
        return next;
      });
    }
    setIsAddingProduct(false);
    onToast?.('Product saved and updated across app.');
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setMyProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        pushProducts(next);
        return next;
      });
      onToast?.('Product removed.');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSeller: Seller = {
      ...seller,
      name: profileData.name,
      description: profileData.description,
      location: seller.location ? { ...seller.location, address: profileData.address } : undefined
    };
    setSeller(updatedSeller);
    alert('Profile updated successfully!');
  };

  const applyReceiptSimulation = () => {
    if (myProducts.length === 0) return;
    const next = myProducts.map((p, idx) => {
      if (idx > 2) return p;
      const sold = Math.min(p.stockLevel, (idx + 1) * 3);
      return { ...p, stockLevel: Math.max(0, p.stockLevel - sold), stockStatus: p.stockLevel - sold <= 5 ? 'low_stock' : 'in_stock' };
    });
    setMyProducts(next);
    pushProducts(next);
    const reward = 30;
    onSellerBalanceChange(sellerBalance + reward);
    onSellerPayoutsChange([{ id: `pay_${Date.now()}`, amount: reward, reason: 'Receipt upload rewards', timestamp: Date.now() }, ...sellerPayouts]);
    setAnalyticsDelta(prev => ({
      views: prev.views + 20,
      inquiries: prev.inquiries + 5,
      sales: prev.sales + 3,
      revenue: prev.revenue + 8450
    }));
    onToast?.('Receipts processed: stock updated and sales recorded.');
  };

  const applyPriceMatch = () => {
    if (myProducts.length === 0) return;
    const target = myProducts[0];
    const next = myProducts.map(p => p.id === target.id ? { ...p, price: Math.max(1, p.price - 5) } : p);
    setMyProducts(next);
    pushProducts(next);
    onSellerPayoutsChange([{ id: `pay_${Date.now()}`, amount: 10, reason: 'Price update reward', timestamp: Date.now() }, ...sellerPayouts]);
    onSellerBalanceChange(sellerBalance + 10);
    setAnalyticsDelta(prev => ({
      ...prev,
      views: prev.views + 8,
      inquiries: prev.inquiries + 2
    }));
    onToast?.(`Price updated for ${target.name}.`);
  };

  const applyBulkUpdate = () => {
    if (myProducts.length === 0) return;
    const next = myProducts.map((p, idx) => ({
      ...p,
      price: idx % 2 === 0 ? Math.max(1, p.price - 3) : p.price,
      stockLevel: p.stockLevel + 5
    }));
    setMyProducts(next);
    pushProducts(next);
    onSellerPayoutsChange([{ id: `pay_${Date.now()}`, amount: 25, reason: 'Bulk price + stock update reward', timestamp: Date.now() }, ...sellerPayouts]);
    onSellerBalanceChange(sellerBalance + 25);
    setAnalyticsDelta(prev => ({
      ...prev,
      views: prev.views + 6
    }));
    onToast?.('Prices and stock updated across products.');
  };

  const handleBroadcast = () => {
    setBroadcastCount(prev => prev + 1);
    setAnalyticsDelta(prev => ({
      ...prev,
      views: prev.views + 12,
      inquiries: prev.inquiries + 4,
      sales: prev.sales + 1
    }));
    onToast?.('Broadcast sent to followers.');
  };

  const handleVerifySeller = () => {
    if (verifiedSellerIds.includes(seller.id)) return;
    const next = [...verifiedSellerIds, seller.id];
    onVerifiedSellerIdsChange(next);
    const idx = SELLERS.findIndex(s => s.id === seller.id);
    if (idx >= 0) {
      SELLERS[idx].isVerified = true;
    }
    onSellerBalanceChange(sellerBalance + 200);
    onSellerPayoutsChange([{ id: `pay_${Date.now()}`, amount: 200, reason: 'Shop verification bonus', timestamp: Date.now() }, ...sellerPayouts]);
    onToast?.('Verified seller badge enabled. Bonus paid.');
  };

  const loanBase = Math.round((Math.min(850, seller.sokoScore) / 850) * 150000);
  const loanRevenueBoost = Math.round(estimatedMonthlyRevenue * 0.4);
  const loanEligibilityMax = Math.max(50000, Math.min(300000, loanBase + loanRevenueBoost));
  const loanEligibilityMin = Math.max(50000, Math.round(loanEligibilityMax * 0.35));

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const baseLocation = userCoords || seller.location || null;
  const rfqThreads = rfqThreadsLocal.filter(t => t.buyerSellerId === seller.id);
  const rfqActive = rfqThreads.filter(t => t.status === 'active');
  const rfqResponses = rfqThreads.reduce((sum, t) => sum + t.responses.length, 0);
  const rfqBestSavings = rfqThreads.reduce((sum, t) => {
    const prices = t.responses.filter(r => r.status === 'responded').map(r => r.price);
    if (prices.length < 2) return sum;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    return sum + (max - min);
  }, 0);
  const selectedThread = rfqThreads.find(t => t.id === selectedThreadId) || null;
  const getSupplierName = (id: string) => SUPPLIERS.find(s => s.id === id)?.name || id;
  const rfqDetailsValid = Boolean(rfqDraft.title && rfqDraft.deliveryLocation && rfqDraft.items.every(i => i.name && i.quantity));
  const rfqSuppliersValid = rfqDraft.supplierIds.length > 0;

  const simulateResponses = (supplierIds: string[]) => {
    const hash = (input: string) => input.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return supplierIds.map((id, index) => {
      const supplier = SUPPLIERS.find(s => s.id === id);
      const bestOffer = SUPPLIER_OFFERS.filter(o => o.supplierId === id).sort((a, b) => a.unitCost - b.unitCost)[0];
      const base = 5000 + (hash(id) % 800);
      const price = Math.round(base - index * 50);
      const etaHours = Math.max(1, (hash(id) % 5) + 1);
      const rating = supplier?.rating || 4;
      const distanceKm = supplier?.location && baseLocation
        ? calculateDistance(baseLocation.lat, baseLocation.lng, supplier.location.lat, supplier.location.lng)
        : undefined;
      return {
        supplierId: id,
        price,
        stock: 100 + (hash(id) % 200),
        etaHours,
        rating,
        moq: bestOffer?.moq,
        paymentTerms: supplier?.paymentTerms,
        leadTimeDays: supplier?.leadTimeDays,
        verified: supplier?.isVerified,
        distanceKm,
        status: 'responded' as const,
        respondedAt: new Date().toISOString()
      };
    });
  };

  const handleCreateRfq = () => {
    if (!rfqDraft.title || !rfqDraft.deliveryLocation || rfqDraft.items.some(i => !i.name || !i.quantity)) return;
    const responses = simulateResponses(rfqDraft.supplierIds);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const newThread = {
      id: `RFQ-${Math.floor(10000 + Math.random() * 90000)}`,
      buyerSellerId: seller.id,
      title: rfqDraft.title,
      status: 'active' as const,
      createdAt,
      expiresAt,
      deliveryLocation: rfqDraft.deliveryLocation,
      type: rfqDraft.type,
      items: rfqDraft.items.map(i => ({ ...i, quantity: Number(i.quantity) })),
      responses
    };
    setRfqThreadsLocal(prev => [newThread, ...prev]);
    setShowRfqModal(false);
    setRfqStep('details');
    setRfqDraft({
      type: 'single',
      title: '',
      deliveryLocation: '',
      items: [{ name: '', quantity: 1, unit: 'units' }],
      supplierIds: []
    });
    setSelectedThreadId(newThread.id);
  };
  const supplierMatches = SUPPLIERS.map((supplier) => {
    const offers = SUPPLIER_OFFERS.filter(o => o.supplierId === supplier.id);
    const filteredOffers = supplierFilters.category
      ? offers.filter(o => o.category === supplierFilters.category)
      : offers;
    const bestOffer = filteredOffers.sort((a, b) => a.unitCost - b.unitCost)[0];
    const distance = baseLocation && supplier.location
      ? calculateDistance(baseLocation.lat, baseLocation.lng, supplier.location.lat, supplier.location.lng)
      : null;
    const priceScore = bestOffer && supplierFilters.maxUnitCost
      ? Math.max(0, 100 - (bestOffer.unitCost / supplierFilters.maxUnitCost) * 100)
      : 50;
    const leadScore = Math.max(0, 100 - supplier.leadTimeDays * 6);
    const distanceScore = distance !== null && supplierFilters.maxDistance
      ? Math.max(0, 100 - (distance / supplierFilters.maxDistance) * 100)
      : 40;
    const score = supplier.rating * 20 * 0.4 + priceScore * 0.25 + leadScore * 0.2 + distanceScore * 0.15 + (supplier.isVerified ? 5 : 0);
    return { supplier, bestOffer, distance, score };
  }).filter(({ supplier, bestOffer, distance }) => {
    if (supplierFilters.category && !supplier.categories.includes(supplierFilters.category)) return false;
    if (supplierFilters.verifiedOnly && !supplier.isVerified) return false;
    if (supplierFilters.paymentTerms && supplier.paymentTerms !== supplierFilters.paymentTerms) return false;
    if (supplierFilters.minRating && supplier.rating < supplierFilters.minRating) return false;
    if (supplierFilters.maxLeadTime && supplier.leadTimeDays > supplierFilters.maxLeadTime) return false;
    if (supplierFilters.maxMOQ && bestOffer && bestOffer.moq > supplierFilters.maxMOQ) return false;
    if (supplierFilters.maxUnitCost && bestOffer && bestOffer.unitCost > supplierFilters.maxUnitCost) return false;
    if (supplierFilters.maxDistance && distance !== null && distance > supplierFilters.maxDistance) return false;
    return true;
  }).sort((a, b) => b.score - a.score);

  const sellersWithMeta = SELLERS.map((s) => {
    const sellerOrders = ORDERS.filter(o => o.sellerId === s.id);
    const sellerRevenue = sellerOrders.reduce((sum, o) => sum + o.unitPrice * o.quantity, 0);
    const avgOrderValue = sellerOrders.length ? sellerRevenue / sellerOrders.length : 0;
    const categories = Array.from(new Set(PRODUCTS.filter(p => p.sellerId === s.id).map(p => p.category)));
    const distance = baseLocation && s.location
      ? calculateDistance(baseLocation.lat, baseLocation.lng, s.location.lat, s.location.lng)
      : null;
    const score = s.rating * 20 * 0.5 + (distance ? Math.max(0, 100 - (distance / Math.max(sellerFilters.maxDistance, 1)) * 100) : 40) * 0.3 + Math.min(100, sellerRevenue / 100) * 0.2;
    return { seller: s, categories, avgOrderValue, distance, score };
  }).filter(({ seller, categories, avgOrderValue, distance }) => {
    if (sellerFilters.category && !categories.includes(sellerFilters.category)) return false;
    if (sellerFilters.verifiedOnly && !seller.isVerified) return false;
    if (sellerFilters.minRating && seller.rating < sellerFilters.minRating) return false;
    if (sellerFilters.minOrderValue && avgOrderValue < sellerFilters.minOrderValue) return false;
    if (sellerFilters.maxDistance && distance !== null && distance > sellerFilters.maxDistance) return false;
    return true;
  }).sort((a, b) => b.score - a.score);

  useEffect(() => {
    const loadReviews = () => {
      let stored: Record<string, any[]> = {};
      try {
        const raw = localStorage.getItem('soko:reviews');
        stored = raw ? JSON.parse(raw) : {};
      } catch {
        stored = {};
      }
      let shopStored: Record<string, any[]> = {};
      try {
        const raw = localStorage.getItem('soko:shopReviews');
        shopStored = raw ? JSON.parse(raw) : {};
      } catch {
        shopStored = {};
      }
      const reviews = myProducts.flatMap((p) => {
        const productReviews = p.reviews || [];
        const storedReviews = Array.isArray(stored[p.id]) ? stored[p.id] : [];
        const merged = [...productReviews, ...storedReviews];
        return merged.map((r: any) => ({ ...r, productId: p.id, productName: p.name }));
      });
      reviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSellerReviews(reviews.slice(0, 20));
      const shopList = Array.isArray(shopStored[seller.id]) ? shopStored[seller.id] : [];
      setShopReviews(shopList);
    };
    loadReviews();
  }, [myProducts]);

  const handleReply = (review: any) => {
    const replyText = replyDrafts[review.id];
    if (!replyText?.trim()) return;
    let stored: Record<string, any[]> = {};
    try {
      const raw = localStorage.getItem('soko:reviews');
      stored = raw ? JSON.parse(raw) : {};
    } catch {
      stored = {};
    }
    const list = Array.isArray(stored[review.productId]) ? stored[review.productId] : [];
    const idx = list.findIndex((r: any) => r.id === review.id);
    const reply = {
      id: `rep_${Date.now()}`,
      sellerId: seller.id,
      sellerName: seller.name,
      comment: replyText,
      timestamp: Date.now()
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], replies: [...(list[idx].replies || []), reply] };
    } else {
      list.unshift({ ...review, replies: [...(review.replies || []), reply] });
    }
    stored[review.productId] = list;
    localStorage.setItem('soko:reviews', JSON.stringify(stored));
    setReplyDrafts(prev => ({ ...prev, [review.id]: '' }));
    setSellerReviews(prev => prev.map(r => r.id === review.id ? { ...r, replies: [...(r.replies || []), reply] } : r));
  };

  const handleShopReply = (review: any) => {
    const replyText = replyDrafts[review.id];
    if (!replyText?.trim()) return;
    let stored: Record<string, any[]> = {};
    try {
      const raw = localStorage.getItem('soko:shopReviews');
      stored = raw ? JSON.parse(raw) : {};
    } catch {
      stored = {};
    }
    const list = Array.isArray(stored[seller.id]) ? stored[seller.id] : [];
    const idx = list.findIndex((r: any) => r.id === review.id);
    const reply = {
      id: `rep_${Date.now()}`,
      sellerId: seller.id,
      sellerName: seller.name,
      comment: replyText,
      timestamp: Date.now()
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], replies: [...(list[idx].replies || []), reply] };
    }
    stored[seller.id] = list;
    localStorage.setItem('soko:shopReviews', JSON.stringify(stored));
    setReplyDrafts(prev => ({ ...prev, [review.id]: '' }));
    setShopReviews(prev => prev.map(r => r.id === review.id ? { ...r, replies: [...(r.replies || []), reply] } : r));
  };

  return (
    <div className="h-full bg-zinc-50 flex flex-col">
      {/* Sidebar / Nav */}
      <div className="flex border-b bg-white overflow-x-auto no-scrollbar">
        {[
          { id: 'onboarding', icon: Sparkles, label: 'Onboarding' },
          { id: 'products', icon: Package, label: 'Products' },
          { id: 'analytics', icon: BarChart3, label: 'Intelligence' },
          { id: 'rewards', icon: Star, label: 'Rewards' },
          { id: 'marketing', icon: Megaphone, label: 'Marketing' },
          { id: 'growth', icon: Wallet, label: 'Growth' },
          { id: 'suppliers', icon: MapPin, label: 'Suppliers' },
          { id: 'comms', icon: MessageSquare, label: 'Comms' },
          { id: 'offline', icon: Clock, label: 'Offline' },
          { id: 'settings', icon: Settings, label: 'Shop Profile' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-none px-6 flex flex-col items-center py-3 gap-1 transition-colors ${
              activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {activeTab === 'onboarding' && (
          <div className="space-y-6 pb-20">
            <div>
              <h2 className="text-2xl font-black text-zinc-900">Seller Onboarding & Presence</h2>
              <p className="text-xs text-zinc-500 font-bold mt-1">Zero-effort setup via WhatsApp or basic phone.</p>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">WhatsApp-Based Onboarding</p>
                  <p className="text-sm font-bold text-zinc-900">Send “Hi” → guided flow creates your shop</p>
                </div>
                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Start on WhatsApp
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">1. Jina la duka</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">2. Eneo la duka</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">3. Aina ya bidhaa</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">4. Tuma picha za bidhaa</div>
              </div>
              <div className="mt-4 text-[10px] text-zinc-500 font-bold">Voice onboarding available for low-literacy sellers.</div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">QR Code Storefront</p>
                  <p className="text-[10px] text-zinc-500">Share your shop instantly on WhatsApp and posters.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Your public page</p>
                  <p className="text-sm font-black text-zinc-900">soko.connect/shop/{seller.name.toLowerCase().replace(/\s/g, '')}</p>
                </div>
                <button className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                  Download QR
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">Passive Discovery from Receipts</p>
                  <p className="text-[10px] text-zinc-500">Customers upload receipts → your catalog appears automatically.</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                5 customers uploaded receipts from your shop this week.
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">
                  Claim Shop (KES 200 bonus)
                </button>
                <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">
                  Start Verification
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Digital Storefront Preview</p>
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-sm font-black text-zinc-900">{seller.name}</p>
                <p className="text-[10px] text-zinc-500">{seller.location?.address || 'Kawangware, Stage Road'} • Open 7am-9pm</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {myProducts.slice(0, 4).map(p => (
                    <div key={p.id} className="text-[9px] font-bold text-zinc-700 bg-white rounded-xl p-2 text-center">
                      {p.name.split(' ')[0]} • KES {p.price}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black">Edit Page</button>
                  <button className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black">Share QR</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">{seller.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-xs font-bold">{seller.rating} Rating</span>
                  </div>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs text-zinc-500">{myProducts.length} Products</span>
                </div>
              </div>
              <button 
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/30"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Expiry Alerts Section */}
            {myProducts.some(p => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30) && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Expiry Alerts</h3>
                </div>
                <div className="space-y-2">
                  {myProducts
                    .filter(p => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30)
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={p.mediaUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{p.name}</p>
                            <p className="text-[10px] text-amber-600 font-medium">Expires: {p.expiryDate}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setFormData({
                              name: p.name,
                              description: p.description,
                              price: (p.price * 0.7).toFixed(2),
                              category: p.category,
                              mediaUrl: p.mediaUrl,
                              stockLevel: p.stockLevel,
                              expiryDate: p.expiryDate || ''
                            });
                            setEditingProduct(p);
                            setIsAddingProduct(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          Clearance Promotion (30% Off)
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Low Stock Section */}
            {myProducts.some(p => p.stockLevel < 5) && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-bold text-red-900 uppercase tracking-tight">Low Stock Alerts</h3>
                </div>
                <div className="space-y-2">
                  {myProducts
                    .filter(p => p.stockLevel < 5)
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={p.mediaUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{p.name}</p>
                            <p className="text-[10px] text-red-600 font-bold">Stock: {p.stockLevel} units</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">
                          Restock Now
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Receipt-Based Auto-Update</h3>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold">Send daily receipts → stock auto-updates and sales totals.</p>
                <button onClick={applyReceiptSimulation} className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">
                  Upload Daily Receipts
                </button>
                <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  Today: Unga sold 15 • Stock left 5 • Sales KES 8,450
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">WhatsApp Inventory Commands</h3>
                </div>
                <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                  <div className="p-2 bg-zinc-50 rounded-xl">"Bei Unga 185" → price updated</div>
                  <div className="p-2 bg-zinc-50 rounded-xl">"Stock Unga 25" → stock updated</div>
                  <div className="p-2 bg-zinc-50 rounded-xl">"Remove Sukari" → product hidden</div>
                </div>
                <button onClick={applyBulkUpdate} className="mt-3 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                  Try WhatsApp Update
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Smart Reorder Recommendations</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                Unga: avg 15/week → order 20 • Sukari: avg 12/week → order 15 • Maziwa: avg 10/week → order 24
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black">Order Recommendations</button>
                <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">Adjust Quantities</button>
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 rounded-2xl text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">AI Powered</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Smart Listing</h3>
                  <p className="text-sm text-indigo-100 mb-4 max-w-[250px]">
                    Let AI optimize your product descriptions and pricing.
                  </p>
                  <button 
                    onClick={() => setShowListingOptimizer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" /> Start AI Listing
                  </button>
                </div>
                <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Inventory Sync</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-900">Receipt OCR</h3>
                  <p className="text-sm text-zinc-500 mb-4 max-w-[250px]">
                    Upload a customer receipt to automatically list new products.
                  </p>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-zinc-800 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Scan Receipt
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Bulk Upload</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-900">CSV Import</h3>
                  <p className="text-sm text-zinc-500 mb-4 max-w-[250px]">
                    Upload a spreadsheet to add hundreds of products in one step.
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm">
                      <Upload className="w-4 h-4" /> Upload CSV
                    </button>
                    <button className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-bold text-sm">
                      Template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myProducts.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-xl border border-zinc-200 flex gap-4 items-center group">
                  <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-800">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-zinc-500">${product.price} • {product.category}</p>
                      {product.stockLevel < 10 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded text-[8px] font-bold text-red-600 uppercase">
                          <AlertCircle className="w-2 h-2" /> Low Stock: {product.stockLevel}
                        </div>
                      )}
                      {product.expiryDate && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-[8px] font-bold text-amber-600 uppercase">
                          <Clock className="w-2 h-2" /> Exp: {product.expiryDate}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-indigo-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {myProducts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300">
                  <Package className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-400 font-medium">No products listed yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Real-Time Demand Alerts</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  Unga: 5 searches today (you have 20) • Sukari: 8 searches (stock 5) • Maziwa: 12 searches (stock 0)
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">Boost Unga (KES 100)</button>
                  <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">Update Stock</button>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <LineChartIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Competitive Intelligence</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                  Bei yako ya Unga KES 180 • Wastani wa eneo KES 175 • Bei ya chini KES 170 (Shop B)
                </div>
                <div className="mt-3 flex gap-2">
                <button onClick={applyPriceMatch} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black">Match KES 175</button>
                <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">View All Prices</button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-900">Intelligence Hub</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Live Engine
                </div>
                {onOpenSellerChat && (
                  <button
                    onClick={onOpenSellerChat}
                    className="p-2 rounded-full bg-[#1976D2] text-white shadow-lg"
                    title="Seller Studio AI Assistant"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* God View Summary */}
            <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">God View</p>
                  <p className="text-lg font-black">{seller.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/60 font-black">Rank</p>
                  <p className="text-sm font-black">🥉 #3 Mombasa</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold">
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Stars</p>
                  <p className="text-sm font-black">{Math.round(seller.sokoScore * 1.4)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Revenue</p>
                  <p className="text-sm font-black">KSh {estimatedMonthlyRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Network</p>
                  <p className="text-sm font-black">16k dukas</p>
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-2xl p-3">
                <p className="text-[10px] font-black text-white/70 mb-2">Data Sources (Active)</p>
                <div className="grid grid-cols-5 gap-2 text-[10px] font-bold text-white/80">
                  {GOD_VIEW_SOURCES.map(source => (
                    <div key={source.label} className="bg-white/10 rounded-xl p-2 text-center">
                      <p className="text-white/60">{source.label}</p>
                      <p className="text-white font-black">{source.value}</p>
                    </div>
                  ))}
                  <div className="bg-emerald-500/20 rounded-xl p-2 text-center">
                    <p className="text-white/60">Total</p>
                    <p className="text-white font-black">{GOD_VIEW_SOURCES.reduce((sum, s) => sum + s.value, 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Demand Intelligence */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Live Demand Forecasts</h3>
                <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">Stock Up</button>
              </div>
              <div className="space-y-3">
                {GOD_VIEW_DEMAND.map(item => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                      <span>{item.name}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  🔔 Omo +47% Kibera NOW
                </div>
              </div>
            </div>

            {/* Buyer Insights */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Verified Buyers</h3>
                <span className="text-[10px] font-bold text-emerald-600">Repeat rate: 67%</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {GOD_VIEW_BUYERS.map(buyer => (
                  <div key={`${buyer.name}-${buyer.item}`} className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2">
                    <span>{buyer.name} ({buyer.source})</span>
                    <span>{buyer.item} • {buyer.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor Benchmark */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Competitor Benchmark</h3>
                <span className="text-[10px] font-bold text-zinc-400">Network data</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-500">
                <div>Duka</div>
                <div>Omo Price</div>
                <div>Stock</div>
                <div>Trend</div>
              </div>
              <div className="space-y-2 mt-2">
                {GOD_VIEW_COMPETITORS.map(row => (
                  <div key={row.name} className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-700 bg-zinc-50 rounded-2xl p-2">
                    <div>{row.name}</div>
                    <div>{row.price}</div>
                    <div>{row.stock}</div>
                    <div>{row.trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Synopsis */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Inventory Synopsis</h3>
                <span className="text-[10px] font-bold text-zinc-400">Photos + POS + ERP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-500">
                <div>Product</div>
                <div>Your Stock</div>
                <div>Network</div>
              </div>
              <div className="space-y-2 mt-2">
                {GOD_VIEW_INVENTORY.map(item => (
                  <div key={item.name} className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-700 bg-zinc-50 rounded-2xl p-2">
                    <div>{item.name}</div>
                    <div>{item.your}</div>
                    <div>{item.network}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Data Feeds */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Live Data Feeds</h3>
                <span className="text-[10px] font-bold text-emerald-600">+247⭐ earned today</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>QR Scans</span><span>● 127 today</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>Shelf Photos</span><span>● 47 shelves</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>MyDuka POS</span><span>● 892 products</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>SAP B1</span><span>● 1,247 items</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>Zoho CRM</span><span>● 156 contacts</span></div>
              </div>
            </div>

            {/* Actionable Alerts */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Action Required</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">Stock Omo</button>
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold">Photo Now</button>
                </div>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {GOD_VIEW_ALERTS.map(alert => (
                  <div key={alert} className="p-2 bg-zinc-50 rounded-2xl">{alert}</div>
                ))}
              </div>
            </div>

            {/* Neighborhood Heatmap */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Neighborhood Heatmap</h3>
                <span className="text-[10px] font-bold text-zinc-400">Your rank #3 vs 127 dukas</span>
              </div>
              <div className="space-y-3">
                {GOD_VIEW_DEMAND.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Upsell */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Pro Unlocks</h3>
                <span className="text-[10px] font-bold text-emerald-400">KSh2k →</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-white/80">
                <div>✓ Full buyer phone numbers</div>
                <div>✓ Competitor stock levels</div>
                <div>✓ API exports</div>
              </div>
              <div className="mt-3 text-[10px] text-white/70 font-bold">“127 buyers waiting…”</div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    <ArrowUpRight className="w-3 h-3" /> 12.5%
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Total Revenue</p>
                <p className="text-2xl font-black text-zinc-900 mt-1">$12,450.00</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    <ArrowUpRight className="w-3 h-3" /> 8.2%
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Customer Reach</p>
                <p className="text-2xl font-black text-zinc-900 mt-1">45.2k</p>
              </div>
            </div>

            {/* Business KPI Suite */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Business KPIs</h3>
                  <p className="text-[10px] text-zinc-500">Estimated from current catalog and activity</p>
                </div>
                <div className="px-2 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase">Estimated</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CAC', value: `KES ${cac}` },
                  { label: 'ROAS', value: `${roas.toFixed(1)}x` },
                  { label: 'LTV', value: `KES ${ltv}` },
                  { label: 'Gross Margin', value: `${grossMarginPct.toFixed(0)}%` },
                  { label: 'Net Margin', value: `${netMarginPct.toFixed(0)}%` },
                  { label: 'Return Rate', value: `${returnRate.toFixed(1)}%` },
                  { label: 'Cart Abandon', value: `${cartAbandonRate.toFixed(0)}%` },
                  { label: 'Items/Order', value: `${avgItemsPerOrder.toFixed(1)}` },
                  { label: 'Promo Lift', value: `${promoLift}%` },
                  { label: 'Repeat Interval', value: `${repeatPurchaseIntervalDays} days` },
                  { label: 'On-time Rate', value: `${onTimeRate}%` },
                  { label: 'CSAT', value: `${csat.toFixed(1)}/5` }
                ].map(metric => (
                  <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
                    <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Scan Rewards */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold">Buyer QR Rewards</h3>
                  <p className="text-[10px] text-zinc-500">Unlimited scans driving your stars</p>
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">+50⭐ unlocked</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Today scans</p>
                  <p className="text-sm font-black text-zinc-900">127</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Stars earned</p>
                  <p className="text-sm font-black text-zinc-900">+50</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Rank</p>
                  <p className="text-sm font-black text-zinc-900">#3 Mombasa</p>
                </div>
              </div>
              <div className="mt-4 h-40 rounded-2xl bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                Live buyer map: Kibera 42 scans, CBD 85 scans
              </div>
              <div className="mt-3 text-[10px] text-zinc-500 font-bold">Daily nudge: “127 buyers scanned today! Photo fresh stock?”</div>
            </div>

            {/* Demand Alerts */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Demand Alerts</h3>
                <span className="text-[10px] text-emerald-600 font-bold">Actionable</span>
              </div>
              <div className="space-y-3">
                {TRENDING_PRODUCTS.map((item) => (
                  <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">Demand: {item.demand} • Supplier: {item.supplier}</p>
                    </div>
                    <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">
                      Feature
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Searched Products */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Top Searched Products</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Your area</span>
              </div>
              <div className="space-y-3">
                {TOP_SEARCHED.map((item) => (
                  <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">{item.searches} searches • {item.trend}</p>
                    </div>
                    <button className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">
                      Add Stock
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Peak Hours Report</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Search intensity</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PEAK_HOURS}>
                    <defs>
                      <linearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="searches" stroke="#6366f1" fill="url(#peakFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Velocity */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Sales Velocity Trends</h3>
                <span className="text-[10px] text-emerald-600 font-bold">Target 40/day</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SALES_VELOCITY}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="velocity" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Competitor Price Benchmarks */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Competitor Price Benchmarks</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Market comparison</span>
              </div>
              <div className="space-y-3">
                {COMPETITOR_PRICING.map((item) => (
                  <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <span className="text-[10px] font-bold text-zinc-500">Avg: ${item.avgPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                      <span>Your: ${item.yourPrice}</span>
                      <span>Min: ${item.competitorMin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Performance Chart */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sales Performance</h3>
                <select className="text-[10px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SALES_DATA}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 800, color: '#18181b' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Velocity Trends */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sales Velocity Trends</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Units sold per day vs Target</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <LineChartIcon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SALES_VELOCITY}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#18181b' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 20 }} />
                    <Line 
                      type="monotone" 
                      dataKey="velocity" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                      name="Current Velocity"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#e2e8f0" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={false}
                      name="Daily Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory & Data Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Inventory Management</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Stockout Rate', value: `${stockoutRate.toFixed(1)}%` },
                    { label: 'Sell-Through', value: `${sellThroughRate.toFixed(1)}%` },
                    { label: 'Inventory Turns', value: `${inventoryTurns.toFixed(1)}x` },
                    { label: 'GMROI', value: `${gmroi.toFixed(2)}x` },
                    { label: 'Price Index', value: `${priceCompetitiveness.toFixed(0)}%` },
                    { label: 'Lost Sales', value: `KES ${lostSalesEstimate}` }
                  ].map(metric => (
                    <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
                      <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                  Tip: Improve stock coverage by prioritizing top-selling SKUs and setting reorder points.
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Data Management</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Coverage', value: `${dataCoverageRate.toFixed(0)}%` },
                    { label: 'Freshness', value: `${Math.round(dataFreshnessDays)} days` },
                    { label: 'Verification', value: `${verificationRate.toFixed(0)}%` },
                    { label: 'Anomaly Rate', value: `${anomalyRate.toFixed(1)}%` }
                  ].map(metric => (
                    <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
                      <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>Receipt match rate</span>
                  <span>{Math.min(98, verificationRate + 2).toFixed(0)}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>Geo completeness</span>
                  <span>{dataCoverageRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Peak Hours Report</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Updated today</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Mon-Wed 5-7pm', 'Thu-Fri 4-8pm', 'Sat 10am-2pm'].map(slot => (
                  <div key={slot} className="px-3 py-2 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-600">
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Mix */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Channel Mix</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Traffic sources</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {channelMix.map(c => (
                  <div key={c.name} className="p-3 bg-zinc-50 rounded-2xl text-center">
                    <p className="text-xs font-black text-zinc-900">{c.value}%</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{c.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Searched & Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Top Searched (Your Area)</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Opportunity for inventory expansion</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <SearchIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  {TOP_SEARCHED.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-400">{item.searches} searches this week</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-500">{item.trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Peak Hours Report</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Optimal operating times</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Clock className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PEAK_HOURS}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#18181b' }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="searches" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 font-medium italic">
                  "Most searches in your area happen 5-7pm. Consider staying open later."
                </p>
              </div>
            </div>

            {/* Market Demand vs Seller Share */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Market Demand</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Benchmarked against 50+ onboarded shops</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CATEGORY_DEMAND} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="category" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#18181b' }}
                        width={80}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="demand" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} name="Market Avg" />
                      <Bar dataKey="sellerShare" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={12} name="Your Share" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Customer Demographics</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Audience age distribution</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Users className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={DEMOGRAPHICS_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {DEMOGRAPHICS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {DEMOGRAPHICS_DATA.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-zinc-600">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Pricing Insights */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Competitor Pricing Benchmarks</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Your price vs Market average</p>
                </div>
                <div className="p-2 bg-zinc-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={COMPETITOR_PRICING}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#18181b' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="yourPrice" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} name="Your Price" />
                    <Bar dataKey="avgPrice" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} name="Market Avg" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] text-amber-700 font-bold">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Your price for Bamboo Watch is 10% above 3 nearby shops. Consider adjusting.
                </p>
              </div>
            </div>

            {/* Trending Products & Supplier Connection */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Trending Products & Suppliers</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Connect with wholesalers for trending items</p>
                </div>
                <div className="p-2 bg-zinc-50 rounded-xl">
                  <ArrowUpRight className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
              <div className="space-y-4">
                {TRENDING_PRODUCTS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">Demand: <span className="text-emerald-600 font-black">{item.demand}</span></p>
                      <p className="text-[10px] text-zinc-400">Supplier: {item.supplier}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Health & AI Insights */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest">AI Strategic Insights</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Demand Surge Detected</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Accessories category is trending 25% higher than your current inventory levels. Consider restocking "Bamboo Watch" variants.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Pricing Optimization</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Your "Quantum Headphones" are priced 12% above the platform average. A temporary 5% discount could increase conversion by 18%.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                        <Zap className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold mb-1 text-indigo-300">Demand Alert</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          5 people searched for "Eco Tote" near your shop today. You have it in stock. Want to feature it?
                        </p>
                        <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">
                          Feature Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-16 -mt-16" />
              </div>

              {/* Daily View Counts */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Daily Engagement</h3>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Users className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Product Views</p>
                    <p className="text-2xl font-black text-zinc-900">{45 + analyticsDelta.views}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+{12 + Math.round(analyticsDelta.views / 2)}% from yesterday</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Inquiries</p>
                    <p className="text-2xl font-black text-zinc-900">{12 + analyticsDelta.inquiries}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+{5 + Math.round(analyticsDelta.inquiries / 2)}% from yesterday</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 text-center font-medium">
                  "Today: {45 + analyticsDelta.views} people saw your products. {12 + analyticsDelta.inquiries} clicked to message you."
                </p>
              </div>

              {/* WhatsApp Daily Summary Simulation */}
              <div 
                onClick={() => setShowWhatsAppModal(true)}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">WhatsApp Daily Summary</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Automated Report</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/50 p-3 rounded-xl text-[11px] text-emerald-800 italic">
                    "Hi {seller.name}! Yesterday you had {450 + analyticsDelta.views} views and {12 + analyticsDelta.sales} sales. Click to view full report."
                  </div>
                  <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20">
                    View Full Summary
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">WhatsApp Business Tools</h3>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-xs font-bold mb-1">Inventory via WhatsApp</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Send "Add new stock" + Photo + Price to our number to list products instantly.
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-xs font-bold mb-1 text-emerald-700">WhatsApp Onboarding</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Invite fellow sellers! They can send "Hi" to start their shop setup without the app.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Inventory Health</h3>
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={STOCK_HEALTH}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {STOCK_HEALTH.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {STOCK_HEALTH.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-zinc-600">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Marketing Hub</h2>

            {/* Marketing KPI Snapshot */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Revenue (30d)', value: `KES ${last30Revenue.toFixed(0)}`, hint: 'Completed orders' },
                { label: 'Orders (30d)', value: `${last30Orders.length}`, hint: 'All channels' },
                { label: 'New Customers', value: `${newCustomers}`, hint: 'First-time buyers' },
                { label: 'ROAS', value: `${roas.toFixed(2)}x`, hint: 'Revenue / spend' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-xl font-black text-zinc-900 mt-2">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>

            {/* Advanced KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'CAC', value: `KES ${cac}`, hint: 'Cost per customer' },
                { label: 'ROAS', value: `${roas.toFixed(1)}x`, hint: 'Revenue / spend' },
                { label: 'LTV', value: `KES ${ltv}`, hint: 'Value per customer' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-lg font-black text-zinc-900 mt-2">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>

            {/* Growth Funnel */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Order Funnel</h3>
                <span className="text-[10px] font-bold text-indigo-600">Last 30 days</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Customers', value: last30Customers },
                  { label: 'Orders', value: last30Orders.length },
                  { label: 'Units', value: last30Orders.reduce((sum, o) => sum + o.quantity, 0) },
                  { label: 'Returns', value: last30Orders.filter(o => o.returned).length }
                ].map((step) => (
                  <div key={step.label} className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs font-black text-zinc-900">{step.value.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Demand Heatmap */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Demand Heatmap</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Hotspots by product demand</span>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                {demandHeatmap.map((p, i) => {
                  const top = ((p.location!.lat - 34) * 11) % 80 + 10;
                  const left = ((p.location!.lng + 120) * 11) % 80 + 10;
                  const size = Math.max(18, Math.min(54, p.demand));
                  return (
                    <div
                      key={p.id}
                      className="absolute rounded-full bg-rose-500/30 border border-rose-500/40 backdrop-blur-sm"
                      style={{ top: `${top}%`, left: `${left}%`, width: `${size}px`, height: `${size}px` }}
                      title={`${p.name} • Demand ${p.demand}`}
                    />
                  );
                })}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-zinc-700">
                  Warmer circles = higher demand
                </div>
              </div>
            </div>
            
            {/* Featured Listing */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Megaphone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Featured Listing</h3>
                    <p className="text-[10px] text-zinc-400">Appear at the top of searches</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase">Inactive</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Boost your visibility for 7 days. Reach up to 5x more customers.</p>
              
              {myProducts.length >= 50 ? (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] text-emerald-700 font-bold">Scale Discount Active! 20% off featured rates for 50+ products.</p>
                </div>
              ) : (
                <p className="text-[10px] text-indigo-600 font-bold mb-4">Tip: List 50+ products to unlock a 20% discount on featured rates!</p>
              )}

              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20">
                Activate for KES 500/week
              </button>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Active Campaigns</h3>
                <span className="text-[10px] text-zinc-400 font-bold">{campaigns.length} Live</span>
              </div>
              {campaigns.length === 0 ? (
                <div className="p-4 bg-zinc-50 rounded-2xl text-center">
                  <p className="text-xs font-bold text-zinc-900">No campaigns yet</p>
                  <p className="text-[10px] text-zinc-500">Launch a campaign to boost reach and conversions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => {
                    const product = myProducts.find(p => p.id === c.productId);
                    return (
                      <div key={c.id} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white">
                            {product && <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{c.name}</p>
                            <p className="text-[10px] text-zinc-500">{c.objective} • {c.channel} • {c.durationDays} days</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">KES {c.budget}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Urgent Stock Alert */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500 rounded-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Urgent Stock Alert</h3>
                  <p className="text-[10px] text-zinc-400">Broadcast to your {seller.followersCount} followers</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-6 italic">"Just got fresh stock of X. Notify your followers?"</p>
              <div className="flex gap-2">
                <select className="flex-1 bg-zinc-800 border-none rounded-xl text-xs font-bold px-4 py-3">
                  <option>Select Product...</option>
                  {myProducts.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
                <button className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-500/20">
                  Broadcast
                </button>
              </div>
            </div>

            {/* Targeted Promotions */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-xl">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Targeted Promotions</h3>
                    <p className="text-[10px] text-zinc-400">Engage your top fans</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                  <ShieldCheck className="w-3 h-3" /> Opt-in Only
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Send exclusive offers to customers who have favorited your shop.</p>
              <button className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-pink-500/20">
                Create Fan-Only Offer
              </button>
            </div>

            {/* Audience & Category Focus */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Audience & Category Focus</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Based on your catalog</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topCategories.map((cat) => (
                  <div key={cat.category} className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-xs font-black text-zinc-900">{cat.category}</p>
                    <p className="text-[10px] text-zinc-500">{cat.count} listings</p>
                  </div>
                ))}
                {topCategories.length === 0 && (
                  <div className="col-span-2 p-3 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                    Add products to unlock category insights.
                  </div>
                )}
              </div>
            </div>

            {/* Category Spotlight */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-white fill-white" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Category Spotlight</h3>
                </div>
                <p className="text-xs font-bold mb-2">Featured Shop of the Week</p>
                <p className="text-[10px] text-amber-50 leading-relaxed mb-4">
                  Your shop is currently being considered for the "Electronics Shop of the Week" spotlight. Maintain high ratings to qualify!
                </p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">Current Rank: #3</div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">Rating: {seller.rating}</div>
                </div>
              </div>
              <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/20 rotate-12" />
            </div>

            {/* Promotion Builder */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Campaign Builder</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Weekend Flash Sale"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Objective</label>
                    <select 
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                      value={campaignForm.objective}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, objective: e.target.value as any }))}
                    >
                      <option value="sales">Drive Sales</option>
                      <option value="reach">Maximize Reach</option>
                      <option value="favorites">Increase Favorites</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Channel</label>
                    <select 
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, channel: e.target.value as any }))}
                    >
                      <option value="search">Search</option>
                      <option value="feed">Feed</option>
                      <option value="messages">Messages</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Featured Product</label>
                  <select
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={campaignForm.productId}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, productId: e.target.value }))}
                  >
                    <option value="">Select product</option>
                    {myProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Budget (KES)</label>
                    <input 
                      type="number" 
                      placeholder="1200"
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Duration (days)</label>
                    <input 
                      type="number"
                      value={campaignForm.durationDays}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleLaunchCampaign}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs"
                >
                  Launch Campaign
                </button>
              </div>
            </div>

            {/* QR Code Storefront */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl flex items-center gap-6">
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1">QR Code Storefront</h3>
                <p className="text-[10px] text-zinc-400 mb-4">Share your shop's unique code with customers on WhatsApp.</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors">
                  <Download className="w-4 h-4" /> Download QR
                </button>
              </div>
              <div className="w-20 h-20 bg-white p-2 rounded-xl shrink-0">
                <QrCode className="w-full h-full text-zinc-900" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Rewards & Incentives</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Receipt Submission Rewards</h3>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold">Daily receipts earn KES 20-50. Streak bonuses at 7 & 30 days.</p>
              <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                6-day streak • Bonus tomorrow: KES 100
              </div>
                <div className="mt-3 p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                SC Wallet balance: {sellerBalance} SC
              </div>
              <button onClick={applyReceiptSimulation} className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">
                Upload Receipts Now
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Data Sharing Rewards</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">Price update: KES 10</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Stock update: KES 5</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Photo upload: KES 5</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Complete profile: KES 100</div>
              </div>
              <button onClick={applyBulkUpdate} className="mt-3 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                Update Prices + Stock
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Payout History</h3>
                <button
                  onClick={() => {
                    onSellerBalanceChange(0);
                    onSellerPayoutsChange([]);
                  }}
                  className="text-[10px] font-bold text-zinc-400"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {sellerPayouts.length === 0 && (
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No payouts yet.
                  </div>
                )}
                {sellerPayouts.map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600 flex items-center justify-between">
                    <span>{p.reason}</span>
                    <span className="text-emerald-600">+KES {p.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold">Referral Rewards</h3>
                  <p className="text-[10px] text-zinc-400">KES 200 per shop • KES 500 per supplier</p>
                </div>
              </div>
              <button
                onClick={() => setShowReferralModal(true)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
              >
                Invite a Shop
              </button>
            </div>
          </div>
        )}

        {activeTab === 'comms' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Communication & Engagement</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">WhatsApp Daily Summary</p>
                  <p className="text-sm font-bold text-zinc-900">Morning report + evening receipt reminder</p>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Preview Summary
                </button>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                Alerts: demand spikes, stockouts, competitor price drops, weekly review.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Broadcast to Followers</h3>
              </div>
              <textarea
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                rows={3}
                defaultValue="Leo Unga 2kg KES 175 • Sukari 1kg KES 150 • Maziwa fresh!"
              />
              <button onClick={handleBroadcast} className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black">
                Send Promotion
              </button>
              <div className="mt-2 text-[10px] text-zinc-500 font-bold">Broadcasts sent: {broadcastCount}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Customer Chat</p>
                <button className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">Open Customer Inbox</button>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Supplier Chat</p>
                <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">Message Supplier</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Support Chat</p>
              <button
                onClick={onOpenSupportChat}
                className="w-full py-3 bg-[#1976D2] text-white rounded-xl text-[10px] font-black"
              >
                Contact SokoConnect
              </button>
            </div>
          </div>
        )}

        {activeTab === 'offline' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Offline & Accessibility</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">USSD Interface</h3>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                Dial `*384*123#` → 1. Views 2. Update price 3. Update stock 4. Alerts
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">SMS Alerts</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                “Wateja 8 wanatafuta Sukari karibu nawe leo.”
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Voice Commands</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                Call and say: “Stock Unga 25” or “Bei Sukari 150”
              </div>
            </div>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Financial Growth</h2>

            {/* Growth Snapshot */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Est. Monthly Revenue', value: `KES ${estimatedMonthlyRevenue.toFixed(0)}` },
                { label: 'Avg Order Value', value: `KES ${averagePrice.toFixed(0)}` },
                { label: 'Repeat Rate', value: `${repeatRate}%` },
                { label: 'Stock Coverage', value: `${stockCoverageDays} days` }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-xl font-black text-zinc-900 mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* SokoScore Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-200" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-100">SokoScore</span>
                  </div>
                  <div className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold">Excellent</div>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-black">{Math.min(850, seller.sokoScore)}</span>
                  <span className="text-emerald-200 text-sm font-bold mb-1">/ 850</span>
                </div>
                <p className="text-xs text-emerald-100 mb-6">Based on transaction volume, consistency, verification, and reviews.</p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(Math.min(850, seller.sokoScore) / 850) * 100}%` }} />
                </div>
              </div>
              <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
            </div>

            {/* Cashflow Forecast */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Cashflow Forecast</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Next 7 days</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SALES_DATA.map(d => ({ ...d, revenue: Math.round((d.sales / 100) * averagePrice) }))}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retention Builder */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Repeat Buyer Boost</h3>
                <span className="text-[10px] text-emerald-600 font-bold">+{Math.round(repeatRate / 4)}% projected</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Offer a loyalty perk on top sellers to lift repeat rate and stabilize monthly revenue.</p>
              <div className="grid grid-cols-2 gap-3">
                {myProducts.slice(0, 2).map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 rounded-2xl flex items-center gap-3">
                    <img src={p.mediaUrl} className="w-10 h-10 rounded-xl object-cover" alt={p.name} />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">KES {p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 mt-4 bg-zinc-900 text-white rounded-xl font-bold text-xs">
                Create Loyalty Offer
              </button>
            </div>

            {/* Referral Program */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Referral Program</h3>
                  <p className="text-[10px] text-zinc-400">Earn KES 200 per shop referral</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                When a seller you refer uploads their first 10 products, both of you receive a <span className="font-bold text-zinc-900">KES 200 M-PESA bonus</span>.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-zinc-50 rounded-xl text-xs font-mono font-bold text-zinc-400 truncate">
                  SCON-REF-{seller.id.toUpperCase()}
                </div>
                <button 
                  onClick={() => setShowReferralModal(true)}
                  className="px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs"
                >
                  Invite Shop
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Supplier Referral</h3>
                  <p className="text-[10px] text-zinc-400">Earn KES 500 per supplier referral</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSellerPayoutsChange([{ id: `pay_${Date.now()}`, amount: 500, reason: 'Supplier referral reward', timestamp: Date.now() }, ...sellerPayouts]);
                  onSellerBalanceChange(sellerBalance + 500);
                  onToast?.('Supplier referral reward added.');
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
              >
                Simulate Supplier Referral Reward
              </button>
            </div>

            {/* Group Buying Power */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Group Buying Power</h3>
                  <p className="text-[10px] text-zinc-400">Bulk orders with nearby shops</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Join forces with 5 nearby shops to place a bulk order for "Eco Packaging" at 30% off.</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">+2</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">3/5 Shops Joined</span>
              </div>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20">
                Join Bulk Order
              </button>
            </div>

            {/* Loan Matchmaking */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Available Capital</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase">Working Capital Loan</p>
                    <p className="text-lg font-black text-zinc-900">Up to KES {loanEligibilityMax.toLocaleString()}</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Apply</button>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase">Inventory Finance</p>
                    <p className="text-lg font-black text-zinc-900">Up to KES {(loanEligibilityMax * 1.6).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">Score 900+</span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                Eligibility range: KES {loanEligibilityMin.toLocaleString()} - {loanEligibilityMax.toLocaleString()} based on SokoScore + recent sales.
              </div>
            </div>

            {/* Transaction History Export */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Transaction History</h3>
                <button className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
              <p className="text-xs text-zinc-500">Download your sales data to show banks for loan applications outside Sconnect.</p>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-900">Supplier Network</h2>
              <button 
                onClick={requestLocation}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest"
              >
                Use My Location
              </button>
            </div>

            {/* RFQ Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Active RFQs', value: rfqActive.length },
                { label: 'Total Responses', value: rfqResponses },
                { label: 'Best Savings', value: `KES ${rfqBestSavings.toFixed(0)}` }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-lg font-black text-zinc-900 mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* RFQ Threads */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">RFQ Threads</h3>
                <button 
                  onClick={() => setShowRfqModal(true)}
                  className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
                >
                  New RFQ
                </button>
              </div>
              <div className="space-y-4">
                {rfqThreads.map((thread) => (
                  <div key={thread.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{thread.title}</p>
                        <p className="text-[10px] text-zinc-500">{thread.id} • {thread.type.toUpperCase()} • {thread.status}</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600">{thread.responses.length} responses</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold mb-3">
                      Delivery: {thread.deliveryLocation} • Expires: {new Date(thread.expiresAt).toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-600">
                      {thread.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2 border border-zinc-100">
                          {item.name} • {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {thread.responses.map((r, idx) => (
                        <div key={`${thread.id}-${idx}`} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                          <span>{getSupplierName(r.supplierId)} • KES {r.price} • ETA {r.etaHours}h • {r.rating}★</span>
                          <span className={`px-2 py-0.5 rounded-full ${r.status === 'responded' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-200 text-zinc-500'}`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => setSelectedThreadId(thread.id)}
                        className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold"
                      >
                        Compare
                      </button>
                      <button className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">Select Supplier</button>
                      <button className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">Message Suppliers</button>
                    </div>
                  </div>
                ))}
                {rfqThreads.length === 0 && (
                  <div className="p-6 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                    No RFQs yet. Create one to get quotes.
                  </div>
                )}
              </div>
            </div>

            {/* RFQ Comparison */}
            {selectedThread && (
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold">Compare Quotes</h3>
                    <p className="text-[10px] text-zinc-500">{selectedThread.title} • {selectedThread.id}</p>
                  </div>
                  <select 
                    className="text-[10px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1"
                    value={compareSort}
                    onChange={(e) => setCompareSort(e.target.value as any)}
                  >
                    <option value="price">Sort by Price</option>
                    <option value="eta">Sort by ETA</option>
                    <option value="rating">Sort by Rating</option>
                    <option value="distance">Sort by Distance</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {[...selectedThread.responses]
                      .sort((a, b) => {
                        if (compareSort === 'price') return a.price - b.price;
                        if (compareSort === 'eta') return a.etaHours - b.etaHours;
                        if (compareSort === 'rating') return b.rating - a.rating;
                        if (compareSort === 'distance') return (a.distanceKm || 999) - (b.distanceKm || 999);
                        return 0;
                      })
                      .map((r, idx) => (
                        <div key={`${selectedThread.id}-cmp-${idx}`} className="w-72 bg-zinc-50 rounded-2xl border border-zinc-100 p-4 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{getSupplierName(r.supplierId)}</p>
                              <p className="text-[10px] text-zinc-500">
                                {r.status.toUpperCase()} • {r.rating}★ • {r.verified ? 'Verified' : 'Unverified'}
                              </p>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600">KES {r.price}</span>
                          </div>
                          <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                            <div className="flex items-center justify-between">
                              <span>ETA</span>
                              <span>{r.etaHours}h</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Lead Time</span>
                              <span>{r.leadTimeDays ? `${r.leadTimeDays}d` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Stock</span>
                              <span>{r.stock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>MOQ</span>
                              <span>{r.moq ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Terms</span>
                              <span>{r.paymentTerms ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Distance</span>
                              <span>{r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Response</span>
                              <span>{r.respondedAt ? new Date(r.respondedAt).toLocaleTimeString() : 'Pending'}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button className="flex-1 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold">Message</button>
                            <button className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">Choose</button>
                          </div>
                          <button
                            onClick={() => setRfqThreadsLocal(prev => prev.map(t => t.id === selectedThread.id ? { ...t, responses: t.responses.filter(resp => resp.supplierId !== r.supplierId) } : t))}
                            className="mt-2 py-2 text-[10px] font-bold text-zinc-500 hover:text-red-500"
                          >
                            Remove from comparison
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Find Suppliers */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Find Nearby Suppliers</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{supplierMatches.length} matches</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.category}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {Array.from(new Set(SUPPLIERS.flatMap(s => s.categories))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.paymentTerms}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  >
                    <option value="">Any Terms</option>
                    <option value="cash">Cash</option>
                    <option value="net7">Net 7</option>
                    <option value="net14">Net 14</option>
                    <option value="net30">Net 30</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Max distance (km)"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxDistance}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Max unit cost"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxUnitCost}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxUnitCost: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Max MOQ"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxMOQ}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxMOQ: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Max lead time"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxLeadTime}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxLeadTime: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Min rating"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.minRating}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                    <input
                      type="checkbox"
                      checked={supplierFilters.verifiedOnly}
                      onChange={(e) => setSupplierFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                    />
                    Verified only
                  </label>
                </div>

                <div className="space-y-3">
                  {supplierMatches.map(({ supplier, bestOffer, distance, score }) => (
                    <div key={supplier.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{supplier.name}</p>
                          <p className="text-[10px] text-zinc-500">{supplier.description}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{score.toFixed(0)} score</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-600">
                        <span>Rating {supplier.rating}</span>
                        <span>Lead {supplier.leadTimeDays}d</span>
                        <span>MOQ {bestOffer?.moq ?? '—'}</span>
                        <span>Unit KES {bestOffer?.unitCost ?? '—'}</span>
                        <span>{distance !== null ? `${distance.toFixed(1)} km` : 'Distance N/A'}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">Contact</button>
                        <button className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold">Request Quote</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Find Sellers (for Suppliers) */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Find Nearby Sellers</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{sellersWithMeta.length} matches</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.category}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {Array.from(new Set(PRODUCTS.map(p => p.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Max distance (km)"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.maxDistance}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Min rating"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.minRating}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Min order value"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.minOrderValue}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                    <input
                      type="checkbox"
                      checked={sellerFilters.verifiedOnly}
                      onChange={(e) => setSellerFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                    />
                    Verified only
                  </label>
                </div>

                <div className="space-y-3">
                  {sellersWithMeta.map(({ seller: s, categories, avgOrderValue, distance, score }) => (
                    <div key={s.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{s.name}</p>
                          <p className="text-[10px] text-zinc-500">{categories.join(', ') || 'No categories'}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{score.toFixed(0)} score</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-600">
                        <span>Rating {s.rating}</span>
                        <span>AOV KES {avgOrderValue.toFixed(0)}</span>
                        <span>{distance !== null ? `${distance.toFixed(1)} km` : 'Distance N/A'}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">Contact</button>
                        <button className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold">Send Offer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900">Shop Profile</h2>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${seller.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                {seller.isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {seller.isVerified ? 'Verified Shop' : 'Unverified'}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verified Seller Program</p>
                  <p className="text-sm font-bold text-zinc-900">Higher ranking, more trust, loan eligibility</p>
                </div>
                <button
                  onClick={handleVerifySeller}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Verify for KES 500
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">ID verified ✓</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Business verified ✓</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Visit verified ✓</div>
              </div>
            </div>

            {/* Community Stats & Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-pink-50 rounded-xl">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-black uppercase">Followers</p>
                  <p className="text-lg font-black text-zinc-900">{seller.followersCount}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-black uppercase">Top Shop</p>
                  <p className="text-xs font-black text-amber-600">March 2026</p>
                </div>
              </div>
            </div>

            {/* Follower Notifications */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <h3 className="text-sm font-bold">Follower Notifications</h3>
                  <p className="text-[10px] text-zinc-500">Notify you when new customers follow your shop.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-600">Email + In-app alerts</span>
                <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">Enabled</button>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {sellerReviews.length === 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    No reviews yet.
                  </div>
                )}
                {sellerReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-900">{review.userName}</span>
                      <span className="text-[10px] text-zinc-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-500' : 'text-zinc-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400">{review.productName}</span>
                    </div>
                    <p className="text-xs text-zinc-600 italic">"{review.comment}"</p>
                    {review.replies && review.replies.length > 0 && (
                      <div className="space-y-2">
                        {review.replies.map((reply: any) => (
                          <div key={reply.id} className="p-2 bg-white rounded-xl border border-zinc-100">
                            <p className="text-[10px] font-bold text-zinc-900">{reply.sellerName}</p>
                            <p className="text-[10px] text-zinc-600">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 p-2 bg-white rounded-xl text-[10px] font-bold"
                        placeholder="Reply to this review..."
                        value={replyDrafts[review.id] || ''}
                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                      />
                      <button 
                        onClick={() => handleReply(review)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop Reviews */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Shop Reviews</h3>
              <div className="space-y-4">
                {shopReviews.length === 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    No shop reviews yet.
                  </div>
                )}
                {shopReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-900">{review.userName}</span>
                      <span className="text-[10px] text-zinc-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-500' : 'text-zinc-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 italic">"{review.comment}"</p>
                    {review.replies && review.replies.length > 0 && (
                      <div className="space-y-2">
                        {review.replies.map((reply: any) => (
                          <div key={reply.id} className="p-2 bg-white rounded-xl border border-zinc-100">
                            <p className="text-[10px] font-bold text-zinc-900">{reply.sellerName}</p>
                            <p className="text-[10px] text-zinc-600">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 p-2 bg-white rounded-xl text-[10px] font-bold"
                        placeholder="Reply to this shop review..."
                        value={replyDrafts[review.id] || ''}
                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                      />
                      <button 
                        onClick={() => handleShopReply(review)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src={seller.avatar} className="w-24 h-24 rounded-2xl object-cover" alt="avatar" />
                  <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-lg border border-zinc-100">
                    <Upload className="w-4 h-4 text-zinc-600" />
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shop Name</label>
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Description</label>
                <textarea 
                  rows={3}
                  value={profileData.description}
                  onChange={e => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Location / Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    value={profileData.address}
                    onChange={e => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Referral Modal */}
      <AnimatePresence>
        {showReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-100 rounded-2xl">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900">Invite a Shop</h3>
                  <p className="text-xs text-zinc-500 font-bold">Grow the Sconnect community</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-800 mb-1">Referral Reward</p>
                  <p className="text-[10px] text-emerald-600">You get KES 200. They get KES 200. Everyone wins!</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shop Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+254..." 
                    className="w-full p-4 bg-zinc-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert("Referral link sent via SMS/WhatsApp!");
                    setShowReferralModal(false);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Summary Modal */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Sconnect Business</p>
                    <p className="text-[10px] text-emerald-100">Daily Summary</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-zinc-50 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Habari! Here is your daily summary for March 10th:</p>
                  <div className="space-y-2 text-[10px] text-zinc-600 font-medium">
                    <p>• Yesterday: <span className="text-emerald-600 font-bold">23 views</span>, <span className="text-indigo-600 font-bold">5 inquiries</span>.</p>
                    <p>• Today's demand alerts: <span className="text-amber-600 font-bold">3 products</span> trending in your area.</p>
                    <p>• Stock Alert: <span className="text-red-500 font-bold">2 items</span> low on stock.</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-4">8:00 AM</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">New Opportunity!</p>
                  <p className="text-[10px] text-zinc-600 font-medium">5 people near you searched for "Solar Lanterns" today. You have them in stock! Reply "FEATURE" to boost them.</p>
                  <p className="text-[10px] text-zinc-400 mt-1">8:05 AM</p>
                </div>
              </div>
              <div className="p-4 bg-white border-t flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-xs outline-none"
                  readOnly
                />
                <button className="p-2 bg-emerald-600 text-white rounded-full">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Onboarding Modal */}
      <AnimatePresence>
        {showOnboardingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black">SokoConnect Onboarding</p>
                    <p className="text-[10px] text-emerald-100">WhatsApp Flow</p>
                  </div>
                </div>
                <button onClick={() => setShowOnboardingModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-zinc-50 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Karibu SokoConnect kwa wafanyabiashara!</p>
                  <div className="space-y-2 text-[10px] text-zinc-600 font-medium">
                    <p>1. Jina la duka</p>
                    <p>2. Eneo (mfano: Luthuli Avenue, Shop 45)</p>
                    <p>3. Aina ya bidhaa</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-4">8:00 AM</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Tuma picha za bidhaa zako (hadi 10)</p>
                  <p className="text-[10px] text-zinc-600 font-medium">Bei ya bidhaa ya kwanza?</p>
                  <p className="text-[10px] text-zinc-400 mt-2">8:02 AM</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Hongera! Duka lako sasa liko kwenye SokoConnect.</p>
                  <p className="text-[10px] text-zinc-600 font-medium">Wateja wataweza kukupata wakitafuta bidhaa karibu nao.</p>
                  <p className="text-[10px] text-zinc-400 mt-2">8:05 AM</p>
                </div>
              </div>
              <div className="p-4 bg-white border-t flex gap-3">
                <button
                  onClick={() => setShowOnboardingModal(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('WhatsApp onboarding started.');
                    setShowOnboardingModal(false);
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs"
                >
                  Start Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Addition/Edit Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">Smart Listing AI</h4>
                    <p className="text-[10px] text-indigo-600 font-medium">Auto-generate details from your draft</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setShowListingOptimizer(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Wand2 className="w-3 h-3" />
                  Optimize
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Product Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Premium Wireless Headphones"
                  className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Price ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Category</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product..."
                  className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expiryDate || ''}
                  onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Media URL (Image/Video)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.mediaUrl}
                    onChange={e => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" className="p-3 bg-zinc-100 rounded-xl text-zinc-500">
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'List Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* RFQ Creation Modal */}
      <AnimatePresence>
        {showRfqModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900">Create RFQ</h3>
                  <p className="text-[10px] text-zinc-500 font-bold">Step {rfqStep === 'details' ? '1' : rfqStep === 'suppliers' ? '2' : '3'} of 3</p>
                </div>
                <button 
                  onClick={() => setShowRfqModal(false)}
                  className="p-2 rounded-full hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rfqStep === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">RFQ Type</label>
                      <select
                        className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                        value={rfqDraft.type}
                        onChange={(e) => setRfqDraft(prev => ({ ...prev, type: e.target.value as any }))}
                      >
                        <option value="single">Single Product</option>
                        <option value="multi">Multi Product</option>
                        <option value="group">Group Buying</option>
                        <option value="standing">Standing RFQ</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Delivery Location</label>
                      <input
                        className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                        placeholder="e.g. Kawangware, Stage Road"
                        value={rfqDraft.deliveryLocation}
                        onChange={(e) => setRfqDraft(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">RFQ Title</label>
                    <input
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                      placeholder="e.g. Unga 50kg x 20"
                      value={rfqDraft.title}
                      onChange={(e) => setRfqDraft(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Items</label>
                    {rfqDraft.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input
                          className="col-span-6 p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === idx ? { ...it, name: e.target.value } : it)
                          }))}
                        />
                        <input
                          type="number"
                          className="col-span-3 p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it)
                          }))}
                        />
                        <input
                          className="col-span-2 p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it)
                          }))}
                        />
                        <button
                          onClick={() => setRfqDraft(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                          className="col-span-1 p-3 bg-zinc-100 rounded-xl text-zinc-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setRfqDraft(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, unit: 'units' }] }))}
                      className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              )}

              {rfqStep === 'suppliers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {SUPPLIERS.map(s => (
                      <label key={s.id} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-3 text-xs font-bold text-zinc-700">
                        <input
                          type="checkbox"
                          checked={rfqDraft.supplierIds.includes(s.id)}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            supplierIds: e.target.checked
                              ? [...prev.supplierIds, s.id]
                              : prev.supplierIds.filter(id => id !== s.id)
                          }))}
                        />
                        <div>
                          <p className="text-xs font-black text-zinc-900">{s.name}</p>
                          <p className="text-[10px] text-zinc-500">{s.categories.join(', ')} • {s.rating}★</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {rfqDraft.supplierIds.length === 0 && (
                    <p className="text-[10px] text-zinc-500 font-bold">Select at least one supplier to continue.</p>
                  )}
                </div>
              )}

              {rfqStep === 'review' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-sm font-bold text-zinc-900">{rfqDraft.title}</p>
                    <p className="text-[10px] text-zinc-500">Type: {rfqDraft.type.toUpperCase()} • Delivery: {rfqDraft.deliveryLocation}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-600">
                      {rfqDraft.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2 border border-zinc-100">
                          {item.name} • {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Quote Comparison</h4>
                    <select 
                      className="text-[10px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1"
                      value={compareSort}
                      onChange={(e) => setCompareSort(e.target.value as any)}
                    >
                      <option value="price">Sort by Price</option>
                      <option value="eta">Sort by ETA</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="distance">Sort by Distance</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex gap-4 min-w-max">
                      {simulateResponses(rfqDraft.supplierIds)
                        .sort((a, b) => {
                          if (compareSort === 'price') return a.price - b.price;
                          if (compareSort === 'eta') return a.etaHours - b.etaHours;
                          if (compareSort === 'rating') return b.rating - a.rating;
                          if (compareSort === 'distance') return (a.distanceKm || 999) - (b.distanceKm || 999);
                          return 0;
                        })
                        .map((r, idx) => (
                          <div key={idx} className="w-72 bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-bold text-zinc-900">{getSupplierName(r.supplierId)}</p>
                                <p className="text-[10px] text-zinc-500">{r.rating}★ • ETA {r.etaHours}h • {r.verified ? 'Verified' : 'Unverified'}</p>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600">KES {r.price}</span>
                            </div>
                            <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                              <div className="flex items-center justify-between">
                                <span>Stock</span>
                                <span>{r.stock}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>MOQ</span>
                                <span>{r.moq ?? 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Terms</span>
                                <span>{r.paymentTerms ?? 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Lead Time</span>
                                <span>{r.leadTimeDays ? `${r.leadTimeDays}d` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Distance</span>
                                <span>{r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : 'N/A'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setRfqDraft(prev => ({ ...prev, supplierIds: prev.supplierIds.filter(id => id !== r.supplierId) }))}
                              className="mt-3 py-2 text-[10px] font-bold text-zinc-500 hover:text-red-500"
                            >
                              Remove from comparison
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (rfqStep === 'details') return setShowRfqModal(false);
                    setRfqStep(rfqStep === 'review' ? 'suppliers' : 'details');
                  }}
                  className="px-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold text-zinc-600"
                >
                  {rfqStep === 'details' ? 'Cancel' : 'Back'}
                </button>
                {rfqStep !== 'review' ? (
                  <button
                    onClick={() => {
                      if (rfqStep === 'details') setRfqStep('suppliers');
                      if (rfqStep === 'suppliers') setRfqStep('review');
                    }}
                    disabled={(rfqStep === 'details' && !rfqDetailsValid) || (rfqStep === 'suppliers' && !rfqSuppliersValid)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${((rfqStep === 'details' && !rfqDetailsValid) || (rfqStep === 'suppliers' && !rfqSuppliersValid)) ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'}`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleCreateRfq}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Send RFQ
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* AI Listing Optimizer Overlay */}
      <AnimatePresence>
        {showListingOptimizer && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ListingOptimizer 
                initialData={formData}
                onClose={() => setShowListingOptimizer(false)}
                onApply={(data) => {
                  setFormData(prev => ({ ...prev, ...data }));
                  setShowListingOptimizer(false);
                  setIsAddingProduct(true);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
