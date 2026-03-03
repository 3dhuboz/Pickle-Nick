
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  featured: boolean;
  updatedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description: string;
  updatedAt?: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export type OrderStatus = 'pending' | 'packing' | 'shipped' | 'delivered';
export type PaymentStatus = 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId: string; // 'guest' or actual user ID
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string; // e.g., 'stripe', 'paypal'
  transactionId?: string; // Gateway transaction ID
  createdAt: string;
  trackingNumber?: string;
  noTracking?: boolean; // For local pickup
  updatedAt?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  orders: string[]; // Order IDs
  updatedAt?: number;
}

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'both';
  content: string;
  imageUrl?: string;
  scheduledTime: string;
  status: 'draft' | 'scheduled' | 'published';
  hashtags: string[];
  updatedAt?: number;
}

export interface SocialMetrics {
  followers: number;
  engagementRate: number;
  weeklyReach: number;
  clicks: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface EmailConfig {
  enabled: boolean;
  serviceId: string;
  templateId: string;
  publicKey: string;
  adminEmail: string;
}

export interface ShippingConfig {
  carrierName: string;
  trackingBaseUrl: string;
}

export interface AppSettings {
  fbAppId: string;
  fbAppSecret: string;
  instaAppId?: string; // New for Insta
  
  // Facebook Page Connection
  fbPageId?: string;
  fbPageName?: string;
  fbPageAccessToken?: string;
  
  // Square Payments
  squareApplicationId: string;
  squareAccessToken: string;
  squareLocationId: string;

  lowStockThreshold: number;
  firebaseConfig?: FirebaseConfig;
  
  // Financials
  gstEnabled: boolean;
  gstRate: number; // Percentage

  // Email Server
  emailConfig: EmailConfig;

  // Shipping
  shippingConfig: ShippingConfig;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt?: number;
}

export interface SiteContent {
  updatedAt?: number;
  general: {
    brandName: string;
    logoUrl: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    mascotUrl1: string; // Bottom Left Chief
    mascotUrl2: string; // Top Right Spirit
  };
  home: {
    heroHeading: string;
    heroSubheading: string;
    heroText: string;
    heroImage: string; // Legacy field, kept for safety
    founderImage: string;
    galleryImage1: string; // Gravel/Banner
    galleryImage2: string; // Production Rows
    galleryImage3: string; // Sauce Closeup
  };
  about: {
    heading: string;
    text: string;
  };
}