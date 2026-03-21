export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  featured: boolean;
  weight?: number; // grams
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
  shippingCost: number;
  shippingMethod?: 'standard' | 'express';
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
  imagePrompt?: string;
  reasoning?: string;
  pillar?: string;
  topic?: string;
  publishError?: string;
  publishAttempts?: number;
  updatedAt?: number;
}

export interface SmartScheduledPost {
  platform: 'facebook' | 'instagram';
  scheduledFor: string;
  topic: string;
  content: string;
  hashtags: string[];
  imagePrompt: string;
  reasoning: string;
  pillar: string;
}

export interface ContentCalendarStats {
  followers: number;
  reach: number;
  engagement: number;
  postsLast30Days: number;
}

export interface SocialMetrics {
  followers: number;
  engagementRate: number;
  weeklyReach: number;
  clicks: number;
}

export interface EmailConfig {
  enabled: boolean;
  adminEmail: string;
  fromName: string;
  fromEmail: string;
  emailProvider?: 'resend' | 'smtp'; // default: 'resend'
  resendApiKey?: string;              // Resend.com API key (re_...)
  smtpEndpoint: string; // URL to server-side mail script (e.g. /api/send-email.php)
  smtpHost?: string;     // e.g. mail.picklenick.com
  smtpPort?: number;     // 465 (SSL) or 587 (TLS)
  smtpUser?: string;     // e.g. noreply@picklenick.com
  smtpPass?: string;     // email account password
  smtpSecure?: 'ssl' | 'tls'; // encryption method
}

export interface ShippingRate {
  maxWeightGrams: number; // upper limit for this tier
  standardPrice: number;
  expressPrice: number;
}

export interface ShippingConfig {
  carrierName: string;
  trackingBaseUrl: string;
  freeShippingThreshold: number; // order $ amount for free standard shipping
  defaultWeightGrams: number; // fallback weight per item if not set on product
  rates: ShippingRate[]; // weight-based tiers, sorted ascending by maxWeightGrams
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
    faviconUrl: string;
    tagline: string;
    siteUrl: string;
    seoDescription: string;
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