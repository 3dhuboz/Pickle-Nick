import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Share2, 
  Settings, 
  LogOut,
  Mountain,
  FileText,
  Mail,
  ChevronRight,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logoutAdmin } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink 
      to={to}
      onClick={() => setDrawerOpen(false)}
      className={({ isActive }) => `
        group flex items-center justify-between px-4 py-3 mx-2 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-native-clay text-white shadow-md shadow-native-clay/20' 
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
    <div className="px-6 mt-6 mb-2">
      <p className="text-[10px] font-tribal uppercase tracking-[0.2em] text-native-sand/30 font-bold">{label}</p>
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-native-clay rounded-lg flex items-center justify-center shadow-lg shadow-native-clay/20">
            <Mountain size={16} className="text-white" />
          </div>
          <h2 className="font-display text-2xl text-white tracking-wide">Pickle Nick</h2>
        </div>
        <p className="text-xs text-native-sand/40 font-medium pl-11">Command Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
      <div className="p-6 border-t border-white/5 bg-black/20 space-y-1">
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
    <div className="min-h-screen bg-[#f8f5f2] flex font-sans text-native-black">

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-native-black text-native-sand fixed h-screen hidden md:flex flex-col shadow-2xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-native-black text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-native-clay rounded-md flex items-center justify-center">
            <Mountain size={14} className="text-white" />
          </div>
          <span className="font-display text-lg tracking-wide">Pickle Nick</span>
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
      <aside className={`md:hidden fixed top-0 left-0 h-screen w-72 bg-native-black text-native-sand flex flex-col shadow-2xl z-50 transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
      <main className="flex-1 md:ml-72 min-h-screen bg-[#f8f5f2] relative">
        <div className="h-full pt-14 md:pt-0 p-5 md:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;