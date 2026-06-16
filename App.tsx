import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { StoreProvider, useStore } from './context/StoreContext';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Account = lazy(() => import('./pages/Account'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';

// Icons
import { Download } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageFallback = () => (
  <div className="min-h-screen bg-[#120d0b] flex items-center justify-center">
    <div className="h-14 w-14 rounded-full border-4 border-native-clay/25 border-t-native-clay animate-spin" />
  </div>
);

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  const isAdmin = (user?.publicMetadata as any)?.role === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const ProtectedCustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const showWatermarks = pathname !== '/';

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#120d0b] text-native-sand">
      {showWatermarks && (
        <img
          src="/brand/pickle-nick-logo.jpg"
          alt=""
          className="pointer-events-none fixed bottom-10 left-8 z-[1] hidden w-48 rounded-full xl:block"
          style={{ opacity: 0.08 }}
        />
      )}
      {showWatermarks && (
        <img
          src="/brand/pickle-nick-logo.jpg"
          alt=""
          className="pointer-events-none fixed right-8 top-28 z-[1] hidden w-40 rounded-full xl:block"
          style={{ opacity: 0.055 }}
        />
      )}

      <Navbar />
      <main className="relative z-10 min-w-0 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const SeoManager = () => {
  const { siteContent } = useStore();

  useEffect(() => {
    if (!siteContent) return;
    const g = siteContent.general;
    const brand = g.brandName || 'Pickle Nick';
    const tagline = g.tagline || 'Made To Bite Back';
    const description = g.seoDescription || `${brand} makes small-batch pickles, hot sauce, and bold jars with Nick's mark.`;
    const siteUrl = (g.siteUrl || 'https://picklenick.au').replace(/\/$/, '');
    const faviconUrl = '/brand/pickle-nick-logo.jpg';
    const ogImage = `${siteUrl}${faviconUrl}`;

    // Title
    document.title = `${brand} | ${tagline}`;

    // Favicon (all link tags)
    const setLink = (rel: string, href: string, type?: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); }
      el.href = href;
      if (type) el.type = type;
    };
    const mimeType = 'image/jpeg';
    setLink('icon', faviconUrl, mimeType);
    setLink('shortcut icon', faviconUrl, mimeType);
    setLink('apple-touch-icon', faviconUrl);

    // Meta helper
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const attr = selector.includes('[property') ? 'property' : 'name';
        const val = selector.replace(/.*["']([^"']+)["']\]/, '$1');
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[name="author"]', brand);

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = siteUrl;

    // Open Graph
    setMeta('meta[property="og:title"]', `${brand} - ${tagline}`);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', siteUrl);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[property="og:site_name"]', brand);

    // Twitter
    setMeta('meta[name="twitter:title"]', `${brand} - ${tagline}`);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImage);

    // JSON-LD structured data
    let ld = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Store",
      "name": brand,
      "description": description,
      "url": siteUrl,
      "logo": ogImage,
      "image": ogImage,
      "priceRange": "$$",
      "email": g.email || undefined,
      "telephone": g.phone || undefined,
      "address": { "@type": "PostalAddress", "streetAddress": g.address || undefined, "addressCountry": "AU" },
      "sameAs": []
    });
  }, [siteContent]);

  return null;
};

const AppContent = () => {
  return (
    <Router>
      <ScrollToTop />
      <SeoManager />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
          
          {/* Public Routes */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/shop" element={<MainLayout><Shop /></MainLayout>} />
          <Route path="/product/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
          <Route path="/about" element={<MainLayout><About /></MainLayout>} />
          <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
          <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          
          {/* Customer Route */}
          <Route path="/account" element={
            <ProtectedCustomerRoute>
              <MainLayout>
                <Account />
              </MainLayout>
            </ProtectedCustomerRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
