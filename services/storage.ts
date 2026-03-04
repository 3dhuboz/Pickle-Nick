import { Product, Order, User, SocialPost, AppSettings, SiteContent, ContactMessage, Category } from '../types';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';

const SETTINGS_KEY = 'pn_settings';
const OP_TIMEOUT = 10000; // 10 seconds timeout for DB operations

// Local Storage Keys for Offline Mode
const LS_KEYS = {
    PRODUCTS: 'pn_products',
    CATEGORIES: 'pn_categories',
    ORDERS: 'pn_orders',
    USERS: 'pn_users',
    POSTS: 'pn_posts',
    MESSAGES: 'pn_messages',
    CONTENT: 'pn_content'
};

// Helper to prevent infinite spinning on failed/hung requests
const withTimeout = <T>(promise: Promise<T>): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Operation timed out. Check your connection or Firebase configuration.")), OP_TIMEOUT))
    ]);
};

const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
            throw new Error(`Storage quota exceeded. AI-generated images take up a lot of space. Please configure Firebase in Settings or use standard image URLs instead.`);
        }
        throw e;
    }
};

// --- INITIAL CONSTANTS (Fallback / Seeding) ---
const INITIAL_CONTENT: SiteContent = {
  updatedAt: 1, 
  general: {
    brandName: 'Pickle Nick',
    logoUrl: '/logo.jpg',
    tagline: 'Spirit of the Brine',
    email: 'hello@picklenick.com',
    phone: '(555) 123-CRUNCH',
    address: '123 Brine Boulevard, Jarville, PK 90210',
    mascotUrl1: 'https://png.pngtree.com/png-clipart/20220910/original/pngtree-american-traditional-tattoo-native-american-head-vector-png-image_8535805.png',
    mascotUrl2: 'https://i.pinimg.com/736x/2a/87/37/2a8737a47dbdd17d472b904df6d5668e.jpg'
  },
  home: {
    heroHeading: 'Pickle Nick',
    heroSubheading: 'Spirit of the Brine',
    heroText: 'Hand-harvested, earth-grown, and preserved with the wisdom of tradition. Flavor that speaks to the soul.',
    heroImage: '/logo.jpg',
    founderImage: 'https://images.pexels.com/photos/2403391/pexels-photo-2403391.jpeg?auto=compress&cs=tinysrgb&w=800',
    galleryImage1: 'https://images.pexels.com/photos/8601704/pexels-photo-8601704.jpeg?auto=compress&cs=tinysrgb&w=1600',
    galleryImage2: 'https://images.pexels.com/photos/9005955/pexels-photo-9005955.jpeg?auto=compress&cs=tinysrgb&w=800',
    galleryImage3: 'https://images.pexels.com/photos/5793770/pexels-photo-5793770.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  about: {
    heading: 'The Pickle Nick Standard',
    text: 'In an age of mass production, we stand for something different. The supermarket pickle aisle has become a graveyard of mediocrity—neon dyes, limp spears, and forgotten flavors.\n\nPickle Nick was founded on a simple, timeless American premise: Quality cannot be rushed. Our pickles are a testament to patience, tradition, and the bold spirit of flavor.'
  }
};

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_pickles',
    name: 'Pickles',
    description: 'Crisp, crunchy, and brined to perfection.',
    image: 'https://images.pexels.com/photos/8601700/pexels-photo-8601700.jpeg?auto=compress&cs=tinysrgb&w=1600',
    updatedAt: 1
  },
  {
    id: 'cat_sauces',
    name: 'Sauces',
    description: 'Liquid gold for your feast.',
    image: 'https://images.pexels.com/photos/6941017/pexels-photo-6941017.jpeg?auto=compress&cs=tinysrgb&w=1600',
    updatedAt: 1
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'The Classic Dill',
    description: 'Our signature crunch. Fermented for 48 hours in oak barrels with fresh dill and garlic.',
    price: 12.99,
    stock: 50,
    image: 'https://images.pexels.com/photos/8601701/pexels-photo-8601701.jpeg?auto=compress&cs=tinysrgb&w=1000',
    category: 'Pickles',
    featured: true,
    weight: 500,
    updatedAt: 1
  },
  {
    id: 'p2',
    name: 'Spicy Habanero Spears',
    description: 'For those who like a kick. Infused with roasted habanero and a touch of honey.',
    price: 14.50,
    stock: 25,
    image: 'https://images.pexels.com/photos/3646/pickled-jalapenos-preserve-preserved.jpg?auto=compress&cs=tinysrgb&w=1000',
    category: 'Pickles',
    featured: true,
    weight: 450,
    updatedAt: 1
  },
  {
    id: 'p3',
    name: 'Sweet Bread & Butter',
    description: 'A nostalgic trip down memory lane. Perfectly sliced, sweet, tangy, and undeniably delightful.',
    price: 11.00,
    stock: 100,
    image: 'https://images.pexels.com/photos/5503189/pexels-photo-5503189.jpeg?auto=compress&cs=tinysrgb&w=1000',
    category: 'Pickles',
    featured: false,
    weight: 400,
    updatedAt: 1
  },
  {
    id: 'p4',
    name: 'Nick\'s Secret Sauce',
    description: 'The green gold. A creamy, dill-infused aioli perfect for burgers.',
    price: 18.00,
    stock: 40,
    image: 'https://images.pexels.com/photos/5793770/pexels-photo-5793770.jpeg?auto=compress&cs=tinysrgb&w=1000',
    category: 'Sauces',
    featured: true,
    weight: 350,
    updatedAt: 1
  },
];

const INITIAL_SETTINGS: AppSettings = {
  fbAppId: '',
  fbAppSecret: '',
  instaAppId: '',
  squareApplicationId: '',
  squareAccessToken: '',
  squareLocationId: '',
  lowStockThreshold: 10,
  gstEnabled: false,
  gstRate: 10,
  emailConfig: {
    enabled: false,
    adminEmail: 'orders@picklenick.com',
    fromName: 'Pickle Nick',
    fromEmail: 'noreply@picklenick.com',
    smtpEndpoint: '/api/send-email.php'
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
      { maxWeightGrams: 10000, standardPrice: 25.00, expressPrice: 42.00 }
    ]
  }
};

// --- FIREBASE INITIALIZATION ---
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let initError: string | null = null;

const initFirebase = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const settings: AppSettings = JSON.parse(savedSettings);
      if (settings.firebaseConfig && settings.firebaseConfig.apiKey) {
        // Ensure all vital fields are present before attempting
        const { apiKey, authDomain, projectId } = settings.firebaseConfig;
        if (!apiKey || !authDomain || !projectId) {
            throw new Error("Incomplete configuration. API Key, Auth Domain, and Project ID are required.");
        }
        
        app = getApps().length === 0 ? initializeApp(settings.firebaseConfig) : getApp();
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("🔥 Firebase initialized (Live Mode)");
        initError = null;
      }
    }
  } catch (e: any) {
    console.error("Firebase init error", e);
    initError = e.message || "Initialization Failed";
    db = null;
    auth = null;
  }
};

initFirebase();

const stamp = (data: any) => {
    const cleanData = { ...data, updatedAt: Date.now() };
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || (typeof cleanData[key] === 'number' && isNaN(cleanData[key]))) {
            delete cleanData[key];
        }
    });
    return cleanData;
};

export const StorageService = {
  getAuth: () => auth,
  isFirebaseReady: () => !!db && !!auth,
  getConnectionError: () => initError,

  // --- SETTINGS (localStorage for bootstrap + Firestore for cross-device sync) ---
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
        try {
             return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
        } catch(e) {
             return INITIAL_SETTINGS;
        }
    }
    return INITIAL_SETTINGS;
  },

  getSettingsFromCloud: async (): Promise<AppSettings | null> => {
    if (!db) return null;
    try {
      const docSnap = await withTimeout(getDoc(doc(db, 'settings', 'main')));
      if (docSnap.exists()) {
        return { ...INITIAL_SETTINGS, ...docSnap.data() } as AppSettings;
      }
      return null;
    } catch (e) {
      console.error('Cloud Fetch Settings Error', e);
      return null;
    }
  },

  saveSettings: async (settings: AppSettings): Promise<boolean> => {
    const oldSettings = StorageService.getSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Persist to Firestore for cross-device sync
    if (db) {
      try {
        await withTimeout(setDoc(doc(db, 'settings', 'main'), { ...settings, updatedAt: Date.now() }));
      } catch (e) {
        console.error('Failed to save settings to cloud', e);
      }
    }

    // Only reload if Firebase config changed (requires SDK reinit)
    const configChanged = JSON.stringify(oldSettings.firebaseConfig || {}) !== JSON.stringify(settings.firebaseConfig || {});
    if (configChanged && settings.firebaseConfig?.apiKey) {
      window.location.reload();
      return true;
    }
    return false;
  },

  // --- SOCIAL CONFIG (profile, stats, API key — synced to Firestore) ---
  getSocialConfig: async (): Promise<{ profile: any; stats: any; geminiKey: string }> => {
    const fallback = {
      profile: JSON.parse(localStorage.getItem('pn_social_profile') || 'null'),
      stats: JSON.parse(localStorage.getItem('pn_social_stats') || 'null'),
      geminiKey: localStorage.getItem('pn_gemini_key') || ''
    };
    if (!db) return fallback;
    try {
      const docSnap = await withTimeout(getDoc(doc(db, 'settings', 'social')));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Also cache to localStorage for offline/fast boot
        if (data.profile) localStorage.setItem('pn_social_profile', JSON.stringify(data.profile));
        if (data.stats) localStorage.setItem('pn_social_stats', JSON.stringify(data.stats));
        if (data.geminiKey) localStorage.setItem('pn_gemini_key', data.geminiKey);
        return {
          profile: data.profile || fallback.profile,
          stats: data.stats || fallback.stats,
          geminiKey: data.geminiKey || fallback.geminiKey
        };
      }
      return fallback;
    } catch (e) {
      console.error('Cloud Fetch Social Config Error', e);
      return fallback;
    }
  },

  saveSocialConfig: async (config: { profile?: any; stats?: any; geminiKey?: string }) => {
    // Always cache locally
    if (config.profile) localStorage.setItem('pn_social_profile', JSON.stringify(config.profile));
    if (config.stats) localStorage.setItem('pn_social_stats', JSON.stringify(config.stats));
    if (config.geminiKey !== undefined) localStorage.setItem('pn_gemini_key', config.geminiKey);

    // Persist to Firestore
    if (db) {
      try {
        const existing = await withTimeout(getDoc(doc(db, 'settings', 'social')));
        const merged = existing.exists() ? { ...existing.data(), ...config, updatedAt: Date.now() } : { ...config, updatedAt: Date.now() };
        await withTimeout(setDoc(doc(db, 'settings', 'social'), merged));
      } catch (e) {
        console.error('Failed to save social config to cloud', e);
      }
    }
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    if (db) {
        try {
            const snapshot = await withTimeout(getDocs(collection(db, 'products')));
            const products = snapshot.docs.map(doc => doc.data() as Product);
            return products.length > 0 ? products : INITIAL_PRODUCTS;
        } catch (e) {
            console.error("Cloud Fetch Products Error", e);
            return INITIAL_PRODUCTS;
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.PRODUCTS);
    return local ? JSON.parse(local) : INITIAL_PRODUCTS;
  },
  
  saveProduct: async (product: Product) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'products', product.id), stamp(product)));
    } else {
        const products = await StorageService.getProducts();
        const index = products.findIndex(p => p.id === product.id);
        if (index > -1) products[index] = stamp(product);
        else products.push(stamp(product));
        safeSetItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  deleteProduct: async (id: string) => {
    if (db) {
        await withTimeout(deleteDoc(doc(db, 'products', id)));
    } else {
        const products = await StorageService.getProducts();
        const filtered = products.filter(p => p.id !== id);
        safeSetItem(LS_KEYS.PRODUCTS, JSON.stringify(filtered));
    }
  },

  // --- CATEGORIES ---
  getCategories: async (): Promise<Category[]> => {
    if (db) {
        try {
            const snapshot = await withTimeout(getDocs(collection(db, 'categories')));
            const cats = snapshot.docs.map(doc => doc.data() as Category);
            return cats.length > 0 ? cats : INITIAL_CATEGORIES;
        } catch (e) {
            console.error("Cloud Fetch Categories Error", e);
            return INITIAL_CATEGORIES;
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.CATEGORIES);
    return local ? JSON.parse(local) : INITIAL_CATEGORIES;
  },

  saveCategory: async (category: Category) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'categories', category.id), stamp(category)));
    } else {
        const categories = await StorageService.getCategories();
        const index = categories.findIndex(c => c.id === category.id);
        if (index > -1) categories[index] = stamp(category);
        else categories.push(stamp(category));
        safeSetItem(LS_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  },

  deleteCategory: async (id: string) => {
    if (db) {
        await withTimeout(deleteDoc(doc(db, 'categories', id)));
    } else {
        const categories = await StorageService.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        safeSetItem(LS_KEYS.CATEGORIES, JSON.stringify(filtered));
    }
  },

  // --- ORDERS ---
  getOrders: async (): Promise<Order[]> => {
    if (db) {
        try {
            const snapshot = await withTimeout(getDocs(collection(db, 'orders')));
            const orders = snapshot.docs.map(doc => doc.data() as Order);
            return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
            console.error("Cloud Fetch Orders Error", e);
            return [];
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.ORDERS);
    return local ? JSON.parse(local).sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  },

  saveOrder: async (order: Order) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'orders', order.id), stamp(order)));
    } else {
        const orders = await StorageService.getOrders();
        const index = orders.findIndex(o => o.id === order.id);
        if (index > -1) orders[index] = stamp(order);
        else orders.push(stamp(order));
        safeSetItem(LS_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    if (db) {
        try {
            const snapshot = await withTimeout(getDocs(collection(db, 'users')));
            return snapshot.docs.map(doc => doc.data() as User);
        } catch(e) {
            console.error("Cloud Fetch Users Error", e);
            return [];
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.USERS);
    return local ? JSON.parse(local) : [];
  },

  saveUser: async (user: User) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'users', user.id), stamp(user)));
    } else {
        const users = await StorageService.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index > -1) users[index] = stamp(user);
        else users.push(stamp(user));
        safeSetItem(LS_KEYS.USERS, JSON.stringify(users));
    }
  },

  deleteUser: async (id: string) => {
    if (db) {
        await withTimeout(deleteDoc(doc(db, 'users', id)));
    } else {
        const users = await StorageService.getUsers();
        const filtered = users.filter(u => u.id !== id);
        safeSetItem(LS_KEYS.USERS, JSON.stringify(filtered));
    }
  },

  // --- SOCIAL POSTS ---
  getPosts: async (): Promise<SocialPost[]> => {
    if (db) {
        try {
            const snapshot = await withTimeout(getDocs(collection(db, 'posts')));
            return snapshot.docs.map(doc => doc.data() as SocialPost);
        } catch(e) {
            console.error("Cloud Fetch Posts Error", e);
            return [];
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.POSTS);
    return local ? JSON.parse(local) : [];
  },

  savePost: async (post: SocialPost) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'posts', post.id), stamp(post)));
    } else {
        const posts = await StorageService.getPosts();
        const index = posts.findIndex(p => p.id === post.id);
        if (index > -1) posts[index] = stamp(post);
        else posts.push(stamp(post));
        safeSetItem(LS_KEYS.POSTS, JSON.stringify(posts));
    }
  },

  deletePost: async (id: string) => {
    if (db) {
        await withTimeout(deleteDoc(doc(db, 'posts', id)));
    } else {
        const posts = await StorageService.getPosts();
        const filtered = posts.filter(p => p.id !== id);
        safeSetItem(LS_KEYS.POSTS, JSON.stringify(filtered));
    }
  },

  // --- CONTENT ---
  getContent: async (): Promise<SiteContent> => {
    if (db) {
        try {
           const docRef = doc(db, 'content', 'main');
           const docSnap = await withTimeout(getDoc(docRef));
           if (docSnap.exists()) {
               return docSnap.data() as SiteContent;
           }
           return INITIAL_CONTENT;
        } catch (e) {
           console.error("Cloud Fetch Content Error", e);
           return INITIAL_CONTENT;
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.CONTENT);
    return local ? JSON.parse(local) : INITIAL_CONTENT;
  },

  saveContent: async (content: SiteContent) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'content', 'main'), stamp(content)));
    } else {
        safeSetItem(LS_KEYS.CONTENT, JSON.stringify(stamp(content)));
    }
  },

  // --- MESSAGES ---
  getMessages: async (): Promise<ContactMessage[]> => {
    if (db) {
        try {
            const snapshot = await withTimeout(getDocs(collection(db, 'messages')));
            const msgs = snapshot.docs.map(doc => doc.data() as ContactMessage);
            return msgs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch(e) {
            console.error("Cloud Fetch Messages Error", e);
            return [];
        }
    }
    // Local Fallback
    const local = localStorage.getItem(LS_KEYS.MESSAGES);
    return local ? JSON.parse(local) : [];
  },

  saveMessage: async (msg: ContactMessage) => {
    if (db) {
        await withTimeout(setDoc(doc(db, 'messages', msg.id), stamp(msg)));
    } else {
        const msgs = await StorageService.getMessages();
        msgs.unshift(stamp(msg));
        safeSetItem(LS_KEYS.MESSAGES, JSON.stringify(msgs));
    }
  },

  deleteMessage: async (id: string) => {
    if (db) {
        await withTimeout(deleteDoc(doc(db, 'messages', id)));
    } else {
        const msgs = await StorageService.getMessages();
        const filtered = msgs.filter((m: ContactMessage) => m.id !== id);
        safeSetItem(LS_KEYS.MESSAGES, JSON.stringify(filtered));
    }
  },

  // --- AUTH & TOOLS ---
  signInGoogle: async () => {
    if (!auth) throw new Error("Google Login requires Firebase configuration.");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  logout: async () => {
    if (auth) await signOut(auth);
  },

  // Forces a complete overwrite of DB with initial data
  reseedDatabase: async () => {
      console.log("Reseeding Database from Deployment...");
      
      if (db) {
          // Cloud Reseed
          const collections = ['products', 'categories', 'orders', 'posts', 'messages', 'users'];
          try {
             for(const colName of collections) {
                 const snap = await withTimeout(getDocs(collection(db, colName)));
                 await Promise.all(snap.docs.map(d => deleteDoc(doc(db, colName, d.id))));
             }
             await withTimeout(deleteDoc(doc(db, 'content', 'main')));

             await Promise.all([
                 ...INITIAL_PRODUCTS.map(p => setDoc(doc(db!, 'products', p.id), stamp(p))),
                 ...INITIAL_CATEGORIES.map(c => setDoc(doc(db!, 'categories', c.id), stamp(c))),
                 setDoc(doc(db!, 'content', 'main'), stamp(INITIAL_CONTENT))
             ]);
             alert("Cloud Database successfully reseeded.");
          } catch(e) {
              console.error("Cloud Reseed failed", e);
              alert("Failed to reseed cloud.");
          }
      } else {
          // Local Reseed
          localStorage.removeItem(LS_KEYS.PRODUCTS);
          localStorage.removeItem(LS_KEYS.CATEGORIES);
          localStorage.removeItem(LS_KEYS.CONTENT);
          // We don't necessarily want to wipe orders/users in local dev unless factory reset
          // But reseed implies fresh start:
          safeSetItem(LS_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS.map(stamp)));
          safeSetItem(LS_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES.map(stamp)));
          safeSetItem(LS_KEYS.CONTENT, JSON.stringify(stamp(INITIAL_CONTENT)));
          alert("Local Data successfully reseeded.");
      }
      window.location.reload();
  },

  factoryReset: async () => {
      // Wipes everything including settings
      if (db) {
         try {
             const collections = ['products', 'categories', 'orders', 'users', 'posts', 'messages'];
             for(const colName of collections) {
                 const snap = await withTimeout(getDocs(collection(db, colName)));
                 await Promise.all(snap.docs.map(d => deleteDoc(doc(db!, colName, d.id))));
             }
             await withTimeout(deleteDoc(doc(db, 'content', 'main')));
         } catch(e) { console.error("Cloud wipe failed", e); }
      }
      localStorage.clear();
      window.location.reload();
  }
};