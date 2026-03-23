import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { StoreProvider, useStore } from './context/StoreContext';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Account from './pages/Account';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

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
  const { siteContent } = useStore();

  return (
    <div className="flex flex-col min-h-screen border-x-4 border-native-black/50 max-w-[1600px] mx-auto bg-native-sand shadow-2xl relative rounded-t-3xl mt-4">
      {/* Brand Mascots — tribal art watermarks */}
      {siteContent?.general.mascotUrl1 && (
        <div className="fixed bottom-8 left-6 w-48 pointer-events-none z-0 hidden xl:block">
            <img src={siteContent.general.mascotUrl1} alt="" className="w-full" style={{
              opacity: 0.55,
              mixBlendMode: 'multiply',
              filter: 'sepia(0.4) saturate(0.8) brightness(0.9)',
              maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 80%)',
            }} />
        </div>
      )}
      {siteContent?.general.mascotUrl2 && (
        <div className="fixed top-32 right-6 w-40 pointer-events-none z-0 hidden xl:block">
            <img src={siteContent.general.mascotUrl2} alt="" className="w-full" style={{
              opacity: 0.55,
              mixBlendMode: 'multiply',
              filter: 'sepia(0.4) saturate(0.8) brightness(0.9)',
              maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 80%)',
            }} />
        </div>
      )}

      <Navbar />
      <main className="flex-grow z-10 relative">
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
    const tagline = g.tagline || 'Spirit of the Brine';
    const description = g.seoDescription || `${brand} — artisan pickles and provisions, delivered Australia-wide.`;
    const siteUrl = (g.siteUrl || 'https://picklenick.au').replace(/\/$/, '');
    const faviconUrl = g.faviconUrl || g.logoUrl || '/logo.svg';
    const ogImage = faviconUrl.startsWith('http') ? faviconUrl : `${siteUrl}${faviconUrl}`;

    // Title
    document.title = `${brand} | ${tagline}`;

    // Favicon (all link tags)
    const setLink = (rel: string, href: string, type?: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); }
      el.href = href;
      if (type) el.type = type;
    };
    const ext = faviconUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : 'image/jpeg';
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
    setMeta('meta[property="og:title"]', `${brand} — ${tagline}`);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', siteUrl);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[property="og:site_name"]', brand);

    // Twitter
    setMeta('meta[name="twitter:title"]', `${brand} — ${tagline}`);
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