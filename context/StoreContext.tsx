import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { Product, Order, User, SocialPost, OrderItem, AppSettings, SiteContent, ContactMessage, Category } from '../types';
import { ApiService, INITIAL_SETTINGS } from '../services/api';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  posts: SocialPost[];
  settings: AppSettings;
  cart: OrderItem[];
  isAdmin: boolean;
  siteContent: SiteContent | null;
  messages: ContactMessage[];
  currentUser: User | null;
  installPrompt: any;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (c: Category) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  placeOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status'], tracking?: string) => void;
  updateOrder: (order: Order) => Promise<void>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  loginAdmin: () => void;
  logoutAdmin: () => void;
  loginCustomer: () => Promise<void>;
  logoutCustomer: () => Promise<void>;
  addPost: (post: SocialPost) => void;
  deletePost: (id: string) => Promise<void>;
  updateSettings: (s: AppSettings) => Promise<void>;
  updateSiteContent: (c: SiteContent) => Promise<void>;
  sendMessage: (msg: ContactMessage) => void;
  deleteMessage: (id: string) => Promise<void>;
  refreshData: () => void;
  updateUser: (u: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetStore: () => Promise<void>;
  reseedStore: () => Promise<void>;
  triggerInstall: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const isAdmin = userLoaded && (user?.publicMetadata as any)?.role === 'admin';
  const currentUser: User | null = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.fullName || user.firstName || 'Customer',
    role: (user.publicMetadata as any)?.role || 'customer',
    orders: [],
  } : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const tok = async (): Promise<string> => {
    const t = await getToken();
    if (!t) throw new Error('Not authenticated');
    return t;
  };

  const refreshData = async () => {
    try {
      const [p, cat, content, publicSettings] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getContent(),
        ApiService.getPublicSettings(),
      ]);
      setProducts(p);
      setCategories(cat);
      if (content && Object.keys(content).length > 0) setSiteContent(content as SiteContent);
      setSettings(prev => ({ ...prev, ...publicSettings }));
    } catch (e) {
      console.error('Failed to refresh public data', e);
    }

    if (isAdmin) {
      try {
        const token = await tok();
        const [o, u, post, msgs, s] = await Promise.all([
          ApiService.getOrders(token),
          ApiService.getUsers(token),
          ApiService.getPosts(token),
          ApiService.getMessages(token),
          ApiService.getSettings(token),
        ]);
        setOrders(o);
        setUsers(u);
        setPosts(post);
        setMessages(msgs);
        setSettings(s);
      } catch (e) {
        console.error('Failed to refresh admin data', e);
      }
    } else if (user) {
      // Load the logged-in customer's own orders for Account page
      try {
        const token = await tok();
        const myOrders = await ApiService.getMyOrders(token);
        setOrders(myOrders);
      } catch (e) {
        console.error('Failed to load customer orders', e);
      }
    }
  };

  useEffect(() => {
    if (!userLoaded) return;
    refreshData();

    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [userLoaded, isAdmin]);

  // Products
  const addProduct = async (p: Product) => {
    await ApiService.saveProduct(p, await tok());
    setProducts(prev => [...prev, p]);
  };
  const updateProduct = async (p: Product) => {
    await ApiService.saveProduct(p, await tok());
    setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod));
  };
  const deleteProduct = async (id: string) => {
    await ApiService.deleteProduct(id, await tok());
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Categories
  const addCategory = async (c: Category) => {
    await ApiService.saveCategory(c, await tok());
    setCategories(prev => [...prev, c]);
  };
  const updateCategory = async (c: Category) => {
    await ApiService.saveCategory(c, await tok());
    setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat));
  };
  const deleteCategory = async (id: string) => {
    await ApiService.deleteCategory(id, await tok());
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Orders
  const placeOrder = async (order: Order) => {
    const token = await getToken();
    await ApiService.saveOrder(order, token);
    setOrders(prev => [order, ...prev]);
    clearCart();
  };

  const updateOrderStatus = async (id: string, status: Order['status'], tracking?: string) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      const updated = { ...order, status, trackingNumber: tracking || order.trackingNumber };
      await ApiService.updateOrder(updated, await tok());
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }
  };

  const updateOrder = async (order: Order) => {
    await ApiService.updateOrder(order, await tok());
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  // Users
  const updateUser = async (u: User) => {
    await ApiService.saveUser(u, await tok());
    setUsers(prev => {
      const i = prev.findIndex(x => x.id === u.id);
      return i > -1 ? prev.map(x => x.id === u.id ? u : x) : [...prev, u];
    });
  };
  const deleteUser = async (id: string) => {
    await ApiService.deleteUser(id, await tok());
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Cart
  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { productId: product.id, quantity, price: product.price, name: product.name }];
    });
  };
  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.productId !== productId));
  const clearCart = () => setCart([]);

  // Auth — Clerk handles the UI; these are kept for API compatibility
  const loginAdmin = () => {};
  const logoutAdmin = async () => { await signOut(); };
  const loginCustomer = async () => {};
  const logoutCustomer = async () => { await signOut(); };

  // Social
  const addPost = async (post: SocialPost) => {
    await ApiService.savePost(post, await tok());
    setPosts(prev => {
      const i = prev.findIndex(p => p.id === post.id);
      return i > -1 ? prev.map(p => p.id === post.id ? post : p) : [post, ...prev];
    });
  };
  const deletePost = async (id: string) => {
    await ApiService.deletePost(id, await tok());
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  // Messages
  const sendMessage = async (msg: ContactMessage) => {
    await ApiService.saveMessage(msg);
    setMessages(prev => [msg, ...prev]);
  };
  const deleteMessage = async (id: string) => {
    await ApiService.deleteMessage(id, await tok());
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // Settings & Content
  const updateSettings = async (s: AppSettings) => {
    setSettings(s);
    await ApiService.saveSettings(s, await tok());
  };
  const updateSiteContent = async (c: SiteContent) => {
    await ApiService.saveContent(c, await tok());
    setSiteContent(c);
  };

  // System
  const resetStore = async () => {
    if (window.confirm('WARNING: This will delete ALL data. This cannot be undone.')) {
      alert('Factory reset is not available in the new stack. Use the Cloudflare D1 dashboard to wipe tables.');
    }
  };
  const reseedStore = async () => {
    alert('Reseed is not available in the new stack. Use the seed SQL file via wrangler d1 execute.');
  };
  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <StoreContext.Provider value={{
      products, categories, orders, users, posts, cart, isAdmin, settings, siteContent, messages, currentUser, installPrompt,
      addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory,
      placeOrder, updateOrderStatus, updateOrder, addToCart, removeFromCart, clearCart,
      loginAdmin, logoutAdmin, loginCustomer, logoutCustomer,
      addPost, deletePost, updateSettings, updateSiteContent, sendMessage, deleteMessage,
      refreshData, updateUser, deleteUser, resetStore, reseedStore, triggerInstall,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
