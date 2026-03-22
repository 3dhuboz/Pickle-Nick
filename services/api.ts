import { Product, Order, User, SocialPost, AppSettings, SiteContent, ContactMessage, Category } from '../types';

// Points to the Cloudflare Worker. In dev, proxy via vite or wrangler dev.
const BASE = '/api';

const apiFetch = async (path: string, opts: RequestInit = {}, token?: string | null): Promise<any> => {
  const headers: Record<string, string> = {
    ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text);
  }
  return res.json();
};

// ── Initial / seed data (used when DB is empty) ───────────────────────────────

export const INITIAL_SETTINGS: AppSettings = {
  fbAppId: '',
  fbAppSecret: '',
  squareApplicationId: '',
  squareAccessToken: '',
  squareLocationId: '',
  lowStockThreshold: 10,
  gstEnabled: false,
  gstRate: 10,
  emailConfig: {
    enabled: false,
    adminEmail: 'orders@picklenick.au',
    fromName: 'Pickle Nick',
    fromEmail: 'noreply@picklenick.au',
    emailProvider: 'resend',
    smtpEndpoint: '/api/email/send',
  },
  shippingConfig: {
    carrierName: 'Australia Post',
    trackingBaseUrl: 'https://auspost.com.au/mypost/track/#/details/',
    freeShippingThreshold: 75,
    defaultWeightGrams: 500,
    rates: [
      { maxWeightGrams: 500, standardPrice: 9.50, expressPrice: 15.90 },
      { maxWeightGrams: 1000, standardPrice: 12.50, expressPrice: 19.90 },
      { maxWeightGrams: 3000, standardPrice: 16.00, expressPrice: 26.50 },
      { maxWeightGrams: 5000, standardPrice: 20.00, expressPrice: 33.00 },
      { maxWeightGrams: 10000, standardPrice: 25.00, expressPrice: 42.00 },
    ],
  },
};

// ── ApiService ────────────────────────────────────────────────────────────────

export const ApiService = {
  // ── Products ────────────────────────────────────────────────────────────────
  getProducts: (): Promise<Product[]> =>
    apiFetch('/products'),

  saveProduct: (product: Product, token: string): Promise<void> => {
    const isNew = !product.updatedAt;
    return apiFetch(
      isNew ? '/products' : `/products/${product.id}`,
      { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(product) },
      token
    );
  },

  deleteProduct: (id: string, token: string): Promise<void> =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }, token),

  // ── Categories ──────────────────────────────────────────────────────────────
  getCategories: (): Promise<Category[]> =>
    apiFetch('/categories'),

  saveCategory: (category: Category, token: string): Promise<void> => {
    const isNew = !category.updatedAt;
    return apiFetch(
      isNew ? '/categories' : `/categories/${category.id}`,
      { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(category) },
      token
    );
  },

  deleteCategory: (id: string, token: string): Promise<void> =>
    apiFetch(`/categories/${id}`, { method: 'DELETE' }, token),

  // ── Orders ──────────────────────────────────────────────────────────────────
  getOrders: (token: string): Promise<Order[]> =>
    apiFetch('/orders', {}, token),

  getMyOrders: (token: string): Promise<Order[]> =>
    apiFetch('/orders/mine', {}, token),

  saveOrder: (order: Order, token?: string | null): Promise<{ id: string }> =>
    apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) }, token),

  updateOrder: (order: Order, token: string): Promise<void> =>
    apiFetch(`/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(order) }, token),

  // ── Users ───────────────────────────────────────────────────────────────────
  getUsers: (token: string): Promise<User[]> =>
    apiFetch('/users', {}, token),

  saveUser: (user: User, token: string): Promise<void> =>
    apiFetch(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) }, token),

  deleteUser: (id: string, token: string): Promise<void> =>
    apiFetch(`/users/${id}`, { method: 'DELETE' }, token),

  // ── Social Posts ─────────────────────────────────────────────────────────────
  getPosts: (token: string): Promise<SocialPost[]> =>
    apiFetch('/posts', {}, token),

  savePost: (post: SocialPost, token: string): Promise<void> =>
    apiFetch('/posts', { method: 'POST', body: JSON.stringify(post) }, token),

  deletePost: (id: string, token: string): Promise<void> =>
    apiFetch(`/posts/${id}`, { method: 'DELETE' }, token),

  // ── Messages ────────────────────────────────────────────────────────────────
  getMessages: (token: string): Promise<ContactMessage[]> =>
    apiFetch('/messages', {}, token),

  saveMessage: (msg: ContactMessage): Promise<void> =>
    apiFetch('/messages', { method: 'POST', body: JSON.stringify(msg) }),

  updateMessage: (id: string, read: boolean, token: string): Promise<void> =>
    apiFetch(`/messages/${id}`, { method: 'PUT', body: JSON.stringify({ read }) }, token),

  deleteMessage: (id: string, token: string): Promise<void> =>
    apiFetch(`/messages/${id}`, { method: 'DELETE' }, token),

  // ── Content ─────────────────────────────────────────────────────────────────
  getContent: (): Promise<SiteContent> =>
    apiFetch('/content'),

  saveContent: (content: SiteContent, token: string): Promise<void> =>
    apiFetch('/content', { method: 'PUT', body: JSON.stringify(content) }, token),

  // ── Settings ─────────────────────────────────────────────────────────────────
  getPublicSettings: (): Promise<Partial<AppSettings>> =>
    apiFetch('/settings/public'),

  getSettings: (token: string): Promise<AppSettings> =>
    apiFetch('/settings', {}, token).then(data => ({ ...INITIAL_SETTINGS, ...data })),

  saveSettings: (settings: AppSettings, token: string): Promise<void> =>
    apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) }, token),

  // ── R2 Upload ────────────────────────────────────────────────────────────────
  uploadFile: async (file: File, prefix: string, token: string): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    form.append('prefix', prefix);
    const data = await apiFetch('/r2/upload', { method: 'POST', body: form }, token);
    return data.url as string;
  },
};
