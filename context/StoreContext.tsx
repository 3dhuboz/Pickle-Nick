import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Order, User, SocialPost, OrderItem, AppSettings, SiteContent, ContactMessage, Category } from '../types';
import { StorageService } from '../services/storage';
import { onAuthStateChanged } from 'firebase/auth';

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
  placeOrder: (order: Order) => void;
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
  updateSettings: (s: AppSettings) => void;
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
  // Initialize with empty state (or loading state ideally)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  
  // Settings are essential for booting, so we fetch them synchronously from local
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('pn_admin_session') === 'true');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const refreshData = async () => {
    try {
      // Parallelize all data fetching
      const [p, cat, o, u, post, content, msgs] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getCategories(),
        StorageService.getOrders(),
        StorageService.getUsers(),
        StorageService.getPosts(),
        StorageService.getContent(),
        StorageService.getMessages()
      ]);
      
      setProducts(p);
      setCategories(cat);
      setOrders(o);
      setUsers(u);
      setPosts(post);
      setSiteContent(content);
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  };

  useEffect(() => {
    refreshData();
    
    const auth = StorageService.getAuth();
    if (auth) {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const user: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Customer',
            email: firebaseUser.email || '',
            role: 'customer',
            orders: []
          };
          setCurrentUser(user);
          // Ensure user exists in DB
          try { await StorageService.saveUser(user); } catch(e) { console.warn("User sync failed", e); }
        } else {
          setCurrentUser(null);
        }
      });
    }

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Products
  const addProduct = async (p: Product) => {
    await StorageService.saveProduct(p);
    setProducts(prev => [...prev, p]);
  };
  const updateProduct = async (p: Product) => {
    await StorageService.saveProduct(p);
    setProducts(prev => prev.map((prod) => (prod.id === p.id ? p : prod)));
  };
  const deleteProduct = async (id: string) => {
    await StorageService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Categories
  const addCategory = async (c: Category) => {
    await StorageService.saveCategory(c);
    setCategories(prev => [...prev, c]);
  };
  const updateCategory = async (c: Category) => {
    await StorageService.saveCategory(c);
    setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat));
  };
  const deleteCategory = async (id: string) => {
    await StorageService.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Orders
  const placeOrder = async (order: Order) => {
    await StorageService.saveOrder(order);
    setOrders(prev => [order, ...prev]);
    
    // Deduct stock
    const newProducts = [...products];
    for (const item of order.items) {
      const pIndex = newProducts.findIndex(p => p.id === item.productId);
      if (pIndex > -1) {
        newProducts[pIndex] = {
            ...newProducts[pIndex],
            stock: Math.max(0, newProducts[pIndex].stock - item.quantity)
        };
        await StorageService.saveProduct(newProducts[pIndex]);
      }
    }
    setProducts(newProducts);
    clearCart();
  };

  const updateOrderStatus = async (id: string, status: Order['status'], tracking?: string) => {
    const order = orders.find(o => o.id === id);
    if (order) {
        const updated = { ...order, status, trackingNumber: tracking || order.trackingNumber };
        await StorageService.saveOrder(updated);
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }
  };

  const updateOrder = async (order: Order) => {
    await StorageService.saveOrder(order);
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  // Users
  const updateUser = async (u: User) => {
    await StorageService.saveUser(u);
    setUsers(prev => {
      const index = prev.findIndex(user => user.id === u.id);
      if (index > -1) {
        return prev.map(user => user.id === u.id ? u : user);
      }
      return [...prev, u];
    });
  };

  const deleteUser = async (id: string) => {
      await StorageService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Cart (Local Only)
  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { productId: product.id, quantity, price: product.price, name: product.name }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  // Admin Auth
  const loginAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('pn_admin_session', 'true');
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('pn_admin_session');
  };

  // Customer Auth
  const loginCustomer = async () => {
    try {
      await StorageService.signInGoogle();
    } catch (e) {
      console.error("Login failed", e);
      alert("Login unavailable. Ensure Firebase is configured.");
    }
  };

  const logoutCustomer = async () => {
    await StorageService.logout();
    setCurrentUser(null);
  };

  // Social
  const addPost = async (post: SocialPost) => {
    await StorageService.savePost(post);
    // Determine if update or insert for state
    setPosts(prev => {
        const index = prev.findIndex(p => p.id === post.id);
        if (index > -1) {
            const copy = [...prev];
            copy[index] = post;
            return copy;
        }
        return [post, ...prev];
    });
  };

  const deleteMessage = async (id: string) => {
    await StorageService.deleteMessage(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // Settings & Content
  const updateSettings = (s: AppSettings) => {
    setSettings(s);
    StorageService.saveSettings(s);
  };

  const updateSiteContent = async (c: SiteContent) => {
    await StorageService.saveContent(c);
    setSiteContent(c);
  };

  const sendMessage = async (msg: ContactMessage) => {
    await StorageService.saveMessage(msg);
    setMessages(prev => [msg, ...prev]);
  };

  // System Tools
  const resetStore = async () => {
      if(window.confirm("WARNING: This will delete ALL data from the connected database and reset settings. This cannot be undone.")) {
          await StorageService.factoryReset();
      }
  };

  const reseedStore = async () => {
    if(window.confirm("CONFIRM RESEED: This will wipe your cloud database and overwrite it with default seed data.")) {
        await StorageService.reseedDatabase();
    }
  };

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <StoreContext.Provider value={{
      products, categories, orders, users, posts, cart, isAdmin, settings, siteContent, messages, currentUser, installPrompt,
      addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, placeOrder, updateOrderStatus, updateOrder,
      addToCart, removeFromCart, clearCart, loginAdmin, logoutAdmin, loginCustomer, logoutCustomer, 
      addPost, updateSettings, updateSiteContent, sendMessage, deleteMessage, refreshData, updateUser, deleteUser, resetStore, reseedStore, triggerInstall
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};