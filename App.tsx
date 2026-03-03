import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const { isAdmin } = useStore();
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const ProtectedCustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useStore();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { siteContent } = useStore();

  return (
    <div className="flex flex-col min-h-screen border-x-4 border-native-black/50 max-w-[1600px] mx-auto bg-native-sand shadow-2xl relative rounded-t-3xl mt-4">
      {/* Brand Mascots / Decorative Elements */}
      {siteContent?.general.mascotUrl1 && (
        <div className="fixed bottom-0 left-0 w-64 pointer-events-none z-0 hidden xl:block mix-blend-multiply opacity-80">
            <img src={siteContent.general.mascotUrl1} alt="Chief Mascot" className="w-full" />
        </div>
      )}
      {siteContent?.general.mascotUrl2 && (
        <div className="fixed top-28 right-0 w-48 pointer-events-none z-0 hidden xl:block mix-blend-multiply opacity-60 rotate-12">
            <img src={siteContent.general.mascotUrl2} alt="Spirit Mascot" className="w-full" />
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

const AppContent = () => {
  return (
    <Router>
      <ScrollToTop />
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