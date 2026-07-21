import React, { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useStore } from '../../context/StoreContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Share2, 
  Settings, 
  LogOut,
  FileText,
  Mail,
  ChevronRight,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import NickLogo from '../brand/NickLogo';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logoutAdmin } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const topbarRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const sectionTitle = [
    ['/admin/dashboard', 'Dashboard'],
    ['/admin/orders', 'Orders'],
    ['/admin/inventory', 'Inventory'],
    ['/admin/users', 'Customers'],
    ['/admin/social', 'Social Spirit'],
    ['/admin/inbox', 'Inbox'],
    ['/admin/cms', 'Content'],
    ['/admin/settings', 'Settings'],
  ].find(([path]) => location.pathname.startsWith(path))?.[1] || 'Command Center';

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        topbarRef.current,
        { opacity: 0.65, y: -8 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
      );
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.62, ease: 'power3.out', clearProps: 'transform' },
      );
    }, mainRef);

    return () => context.revert();
  }, [location.pathname]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink 
      to={to}
      onClick={() => setDrawerOpen(false)}
      className={({ isActive }) => `
        admin-nav-item group flex items-center justify-between px-4 py-3 mx-2 transition-all duration-200
        ${isActive 
          ? 'is-active text-white'
          : 'text-native-sand/60 hover:bg-white/5 hover:text-white'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={location.pathname.includes(to) ? 'text-white' : 'text-native-sand/40 group-hover:text-white transition-colors'} />
        <span className="font-sans font-medium text-sm tracking-wide">{label}</span>
      </div>
      {location.pathname.includes(to) && <ChevronRight size={14} className="opacity-50" />}
    </NavLink>
  );

  const SectionHeader = ({ label }: { label: string }) => (
      <div className="admin-nav-section px-6 mt-6 mb-2">
      <p className="text-[10px] font-tribal uppercase tracking-[0.2em] text-native-sand/30 font-bold">{label}</p>
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="admin-brand px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <NickLogo
            size="sm"
            showName
            imageClassName="h-10 w-10"
            subtitle="Command Center"
            labelClassName="text-xl leading-tight"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <SectionHeader label="Overview" />
        <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
        
        <SectionHeader label="Commerce" />
        <NavItem to="/admin/orders" icon={ShoppingCart} label="Orders" />
        <NavItem to="/admin/inventory" icon={Package} label="Inventory" />
        <NavItem to="/admin/users" icon={Users} label="Customers" />

        <SectionHeader label="Engagement" />
        <NavItem to="/admin/social" icon={Share2} label="Social Spirit" />
        <NavItem to="/admin/inbox" icon={Mail} label="Inbox" />
        <NavItem to="/admin/cms" icon={FileText} label="Content" />

        <SectionHeader label="System" />
        <NavItem to="/admin/settings" icon={Settings} label="Settings" />
      </nav>

      {/* Footer */}
      <div className="admin-sidebar__footer p-6 border-t border-white/5 bg-black/20 space-y-1">
        <NavLink
          to="/"
          onClick={() => setDrawerOpen(false)}
          className="flex items-center justify-between px-4 py-3 w-full rounded-xl text-native-sand/60 hover:bg-white/5 hover:text-white transition-all group"
        >
          <div className="flex items-center gap-3">
            <ExternalLink size={18} className="text-native-sand/40 group-hover:text-white transition-colors" />
            <span className="font-medium text-sm">View Store</span>
          </div>
        </NavLink>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-native-sand/60 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div
      className="admin-shell min-h-screen flex font-sans text-native-black"
      style={{ colorScheme: 'light' }}
    >

      {/* Desktop Sidebar */}
      <aside className="admin-sidebar w-72 text-native-sand fixed h-screen hidden md:flex flex-col z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="admin-mobilebar md:hidden fixed top-0 left-0 right-0 z-30 text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <NickLogo size="sm" showName imageClassName="h-9 w-9" labelClassName="text-lg leading-none" />
        </div>
        <button
          title="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`admin-sidebar md:hidden fixed top-0 left-0 h-screen w-72 text-native-sand flex flex-col shadow-2xl z-50 transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-4 right-4">
          <button
            title="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-native-sand/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="admin-main flex-1 md:ml-72 min-h-screen relative">
        <img className="admin-main__seal" src="/brand/pickle-nick-logo.jpg" alt="" aria-hidden="true" />
        <div ref={topbarRef} className="admin-topbar">
          <div>
            <span className="admin-topbar__eyeline">Nick's workbench</span>
            <strong>{sectionTitle}</strong>
          </div>
          <NavLink className="admin-topbar__store" to="/">
            View live store <ExternalLink size={15} />
          </NavLink>
        </div>
        <div className="admin-main__scroll h-full p-5 md:p-10 overflow-y-auto">
          <div ref={contentRef} className="admin-content max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
