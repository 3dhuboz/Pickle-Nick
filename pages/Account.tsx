import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { User, Order } from '../types';
import { Save, Package, User as UserIcon, LogOut, MapPin, ExternalLink, Truck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Account = () => {
    const { currentUser, orders, updateUser, logoutCustomer, settings } = useStore();
    const navigate = useNavigate();
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<Partial<User>>({});
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (currentUser) {
            setForm(currentUser);
        }
    }, [currentUser]);

    const userOrders = orders.filter(o => 
        (currentUser?.id && o.userId === currentUser.id) || 
        (currentUser?.email && o.customerEmail === currentUser.email)
    );

    const handleSaveProfile = async () => {
        if (currentUser && form) {
            await updateUser({ ...currentUser, ...form } as User);
            setIsEditing(false);
            setSaveMessage('Profile Updated');
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleLogout = async () => {
        await logoutCustomer();
        navigate('/');
    };

    if (!currentUser) return null;

    return (
        <div className="py-16 px-4 bg-native-sand bg-fabric-texture min-h-screen">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-native-black/5 pb-8 gap-6">
                    <div>
                        <h1 className="font-display text-5xl md:text-6xl text-native-black uppercase mb-3 drop-shadow-sm">Member Ledger</h1>
                        <p className="font-sans text-native-earth/60 text-lg italic">"Welcome back to the tribe, {currentUser.name.split(' ')[0]}."</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-native-clay font-tribal uppercase font-bold text-[10px] tracking-[0.3em] bg-native-clay/5 px-6 py-3 rounded-full border border-native-clay/10 hover:bg-native-clay hover:text-white transition-all shadow-sm"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* --- Left Column: Profile --- */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-10 shadow-card rounded-[2.5rem] border border-native-black/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <UserIcon size={80} />
                            </div>
                            <h2 className="font-display text-2xl text-native-black uppercase mb-8 flex items-center gap-3 drop-shadow-sm">
                                <div className="w-1.5 h-8 bg-native-turquoise rounded-full"></div> Identity
                            </h2>

                            <div className="space-y-8 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-bold text-native-earth/60 mb-2 uppercase tracking-[0.2em] font-tribal">Full Name</label>
                                    {isEditing ? (
                                        <input 
                                            value={form.name || ''}
                                            onChange={e => setForm({...form, name: e.target.value})}
                                            className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 font-display text-lg focus:border-native-clay/50 focus:bg-white outline-none transition-all shadow-inner"
                                        />
                                    ) : (
                                        <p className="font-display text-xl text-native-black p-2 pl-0">{currentUser.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-native-earth/60 mb-2 uppercase tracking-[0.2em] font-tribal">Email Address</label>
                                    {isEditing ? (
                                        <input 
                                            value={form.email || ''}
                                            onChange={e => setForm({...form, email: e.target.value})}
                                            className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 font-sans text-lg focus:border-native-clay/50 focus:bg-white outline-none transition-all shadow-inner"
                                        />
                                    ) : (
                                        <p className="font-sans text-lg text-native-black p-2 pl-0">{currentUser.email}</p>
                                    )}
                                </div>

                                <div className="pt-8">
                                    {isEditing ? (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 py-4 text-native-earth font-tribal uppercase text-[10px] font-bold tracking-widest border border-native-black/5 rounded-xl hover:bg-native-sand transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveProfile}
                                                className="flex-1 py-4 bg-native-black text-white font-tribal uppercase text-[10px] font-bold tracking-widest rounded-xl hover:bg-native-clay transition-all shadow-ink flex justify-center items-center gap-2"
                                            >
                                                <Save size={14} /> Save
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="w-full py-4 border border-native-black/10 text-native-black font-tribal uppercase text-[10px] font-bold tracking-widest rounded-xl hover:bg-native-black hover:text-white transition-all shadow-sm"
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                    {saveMessage && (
                                        <p className="text-center text-native-turquoise font-bold text-[10px] uppercase tracking-widest mt-6 animate-pulse">{saveMessage}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column: Orders --- */}
                    <div className="lg:col-span-2">
                         <div className="bg-white p-10 shadow-card rounded-[2.5rem] border border-native-black/5 min-h-[500px]">
                            <h2 className="font-display text-2xl text-native-black uppercase mb-10 flex items-center gap-3 drop-shadow-sm">
                                <div className="w-1.5 h-8 bg-native-clay rounded-full"></div> Order History
                            </h2>

                            {userOrders.length === 0 ? (
                                <div className="text-center py-20 rounded-[2rem] border-2 border-dashed border-native-black/5 bg-native-sand/20">
                                    <Package size={64} className="mx-auto text-native-black/5 mb-6" />
                                    <p className="font-display text-2xl text-native-black/30 uppercase">No bounties claimed yet.</p>
                                    <button onClick={() => navigate('/shop')} className="mt-8 text-native-clay font-tribal uppercase font-bold text-xs tracking-widest underline underline-offset-8 hover:text-native-black transition-colors">Visit the Shop</button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {userOrders.map(order => (
                                        <div key={order.id} className="border border-native-black/5 bg-native-sand/10 rounded-3xl p-8 relative group hover:border-native-clay/20 transition-all hover:shadow-md">
                                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-8">
                                                <div>
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className="font-mono font-bold text-native-black bg-white px-3 py-1 rounded-lg border border-native-black/5 text-sm shadow-sm">#{order.id.slice(-8).toUpperCase()}</span>
                                                        <span className="text-[10px] text-native-earth/60 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                                            order.status === 'delivered' ? 'bg-native-black' : 
                                                            order.status === 'shipped' ? 'bg-native-turquoise' : 
                                                            'bg-native-clay'
                                                        }`}></span>
                                                        <span className="font-tribal uppercase text-[10px] font-bold tracking-[0.2em] text-native-black">{order.status}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-display text-3xl text-native-black drop-shadow-sm">${order.total.toFixed(2)}</p>
                                                    <p className="text-[10px] text-native-earth/60 font-bold uppercase tracking-widest mt-1">{order.items.length} Items</p>
                                                </div>
                                            </div>

                                            {/* Beautiful Tracking Ticket */}
                                            {order.trackingNumber && (
                                                <div className="relative overflow-hidden rounded-2xl border border-native-black/5 bg-white shadow-card mb-8 group-hover:shadow-lg transition-all">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-native-turquoise"></div>
                                                    <div className="p-6 pl-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                                                        <div className="flex items-center gap-5 text-native-black">
                                                            <div className="p-4 bg-native-black text-white rounded-2xl shadow-ink">
                                                                <Truck size={28} />
                                                            </div>
                                                            <div>
                                                                <p className="font-tribal text-[10px] font-bold uppercase tracking-[0.2em] text-native-earth/60 mb-1">Carrier: {settings.shippingConfig?.carrierName || 'Courier'}</p>
                                                                <p className="font-mono text-xl text-native-black font-bold tracking-widest">{order.trackingNumber}</p>
                                                            </div>
                                                        </div>
                                                        <a 
                                                            href={`${settings.shippingConfig?.trackingBaseUrl}${order.trackingNumber}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-native-black text-white px-8 py-4 font-display text-sm uppercase tracking-widest hover:bg-native-clay transition-all rounded-full shadow-ink flex items-center gap-2"
                                                        >
                                                            Track Shipment <ExternalLink size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {order.noTracking && (
                                                <div className="bg-native-sand/50 border border-native-black/5 rounded-2xl p-4 mb-6 text-center">
                                                    <p className="font-tribal text-[10px] font-bold uppercase tracking-[0.3em] text-native-earth/60">Local Pickup / No Tracking</p>
                                                </div>
                                            )}

                                            <div className="border-t border-native-black/5 pt-6">
                                                <h4 className="font-tribal text-[10px] font-bold uppercase tracking-[0.3em] text-native-earth/40 mb-4">Manifest</h4>
                                                <div className="space-y-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-native-black font-medium">{item.quantity}x {item.name}</span>
                                                            <span className="text-native-earth/60 font-mono text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;