import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Wifi, CreditCard, Share2, Sparkles, AlertCircle, CheckCircle2, Package, Trash2, AlertTriangle, RefreshCw, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200 group">
    <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-native-black/5 transition-colors">
            <Icon size={24} className="text-native-black" />
        </div>
        {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend}
            </div>
        )}
    </div>
    <div>
        <h3 className="text-3xl font-display text-native-black mb-1">{value}</h3>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
    </div>
  </div>
);

const ConnectionStatus = ({ label, icon: Icon, active, message }: any) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                <Icon size={18} />
            </div>
            <div>
                <h4 className="font-sans font-semibold text-sm text-gray-900">{label}</h4>
                <p className="text-xs text-gray-500">{message}</p>
            </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
    </div>
);

const DashboardHome = () => {
  const { orders, products, users, settings, resetStore, reseedStore } = useStore();
  const [systemStatus, setSystemStatus] = useState({
      firebase: false,
      firebaseError: null as string | null,
      payment: false,
      facebook: false,
      ai: false
  });
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  // Low Stock Logic
  const threshold = settings.lowStockThreshold || 10;
  const lowStockItems = products.filter(p => p.stock <= threshold);

  useEffect(() => {
      // Check Connections
      setSystemStatus({
          firebase: StorageService.isFirebaseReady(),
          firebaseError: StorageService.getConnectionError(),
          payment: !!settings.squareApplicationId && !!settings.squareAccessToken,
          facebook: !!settings.fbAppId,
          ai: !!process.env.API_KEY
      });
  }, [settings]);
  
  // Mock data for chart
  const data = [
    { name: 'Mon', sales: 400 },
    { name: 'Tue', sales: 300 },
    { name: 'Wed', sales: 600 },
    { name: 'Thu', sales: 200 },
    { name: 'Fri', sales: 900 },
    { name: 'Sat', sales: 1200 },
    { name: 'Sun', sales: 800 },
  ];

  const getFirebaseMessage = () => {
      if (systemStatus.firebase) return "Synced";
      if (systemStatus.firebaseError) return "Error";
      return "Local";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-display text-native-black mb-2">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, Keeper of the Brine.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={reseedStore}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
                <RefreshCw size={16} /> Reseed
            </button>
            <div className="px-4 py-2 bg-native-black text-white text-sm font-medium rounded-lg shadow-sm">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} trend="12%" trendUp={true} />
        <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} trend="5%" trendUp={true} />
        <StatCard title="Pending Orders" value={pendingOrders} icon={Package} trend={pendingOrders > 0 ? "Action Needed" : "All Clear"} trendUp={pendingOrders === 0} />
        <StatCard title="Customers" value={users.length || 0} icon={Users} trend="3%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-8 shadow-sm rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-display text-xl text-native-black">Revenue Overview</h3>
                <select className="bg-gray-50 border-none text-sm text-gray-500 rounded-lg px-3 py-1 focus:ring-0 cursor-pointer">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>This Year</option>
                </select>
            </div>
            <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '8px', border: 'none', padding: '8px 12px', fontSize: '12px' }}
                    cursor={{ fill: '#f9fafb', radius: 4 }}
                />
                <Bar dataKey="sales" fill="#bc4b35" radius={[4, 4, 4, 4]} barSize={32} />
                </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* System Status */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 h-full">
                <h3 className="font-display text-xl text-native-black mb-6">System Status</h3>
                <div className="space-y-3">
                    <ConnectionStatus 
                        label="Database" 
                        icon={Users} 
                        active={systemStatus.firebase} 
                        message={getFirebaseMessage()} 
                    />
                    <ConnectionStatus 
                        label="AI Services" 
                        icon={Sparkles} 
                        active={systemStatus.ai} 
                        message={systemStatus.ai ? "Operational" : "Key Missing"} 
                    />
                    <ConnectionStatus 
                        label="Payments" 
                        icon={CreditCard} 
                        active={systemStatus.payment} 
                        message={systemStatus.payment ? "Connected" : "Setup Required"} 
                    />
                    <ConnectionStatus 
                        label="Facebook API" 
                        icon={Share2} 
                        active={systemStatus.facebook} 
                        message={systemStatus.facebook ? "Linked" : "Not Configured"} 
                    />
                </div>
            </div>

            {/* Low Stock Alert (Mini) */}
            {lowStockItems.length > 0 && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-red-600" size={20} />
                        <h3 className="font-semibold text-red-900">Low Stock Alert</h3>
                    </div>
                    <p className="text-sm text-red-700 mb-4">{lowStockItems.length} items are running low.</p>
                    <Link to="/admin/inventory" className="text-xs font-bold uppercase tracking-wide text-red-700 hover:text-red-900 underline">
                        View Inventory
                    </Link>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default DashboardHome;