export type Review = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  timestamp: number;
  isVerifiedPurchase?: boolean;
  replies?: Array<{
    id: string;
    sellerId: string;
    sellerName: string;
    comment: string;
    timestamp: number;
  }>;
};

export type PricePoint = {
  date: string;
  price: number;
};

export type Product = {
  id: string;
  sellerId: string;
  productId?: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  category: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  tags: string[];
  stockLevel: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  expiryDate?: string;
  isFeatured?: boolean;
  discountPrice?: number;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  reviews?: Review[];
  competitorPrice?: number;
  priceHistory?: PricePoint[];
  isGoodDeal?: boolean;
};

export type Seller = {
  id: string;
  name: string;
  avatar: string;
  description: string;
  rating: number;
  isVerified?: boolean;
  followersCount: number;
  sokoScore: number;
  dailyViews: number;
  totalSales: number;
  whatsappNumber?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
};

export type Supplier = {
  id: string;
  name: string;
  description: string;
  rating: number;
  isVerified?: boolean;
  categories: string[];
  minOrderValue: number;
  leadTimeDays: number;
  paymentTerms: 'cash' | 'net7' | 'net14' | 'net30';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
};

export type SupplierOffer = {
  id: string;
  supplierId: string;
  category: string;
  sku: string;
  unitCost: number;
  moq: number;
  availableUnits: number;
};

export type Order = {
  id: string;
  sellerId: string;
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  channel: 'search' | 'feed' | 'messages' | 'direct';
  returned: boolean;
  fulfillmentDays: number;
  createdAt: string;
  fulfilledAt: string;
  slaDays: number;
  slaMet: boolean;
};

export type MarketingSpend = {
  id: string;
  sellerId: string;
  channel: 'search' | 'feed' | 'messages' | 'direct';
  amount: number;
  period: 'month' | 'week';
  startsAt: string;
};

export type RFQItem = {
  name: string;
  quantity: number;
  unit: string;
};

export type RFQResponse = {
  supplierId: string;
  price: number;
  stock: number;
  etaHours: number;
  rating: number;
  verified?: boolean;
  leadTimeDays?: number;
  moq?: number;
  paymentTerms?: 'cash' | 'net7' | 'net14' | 'net30';
  distanceKm?: number;
  status: 'responded' | 'pending' | 'declined';
  respondedAt?: string;
};

export type RFQThread = {
  id: string;
  buyerSellerId: string;
  title: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  deliveryLocation: string;
  type: 'single' | 'multi' | 'group' | 'standing' | 'emergency';
  items: RFQItem[];
  responses: RFQResponse[];
};

export type Interaction = {
  productId: string;
  userId: string;
  type: 'view' | 'like' | 'share' | 'chat' | 'purchase';
  duration?: number;
  timestamp: number;
};

export type Message = {
  role: 'user' | 'model' | 'system';
  content: string;
};
