import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, Product, OrderItem } from '../../types';
import { Search, Plus, Trash2, X, Download, Truck, Mail, Send, Eye, Server, Loader2, Check, AlertCircle, Save, HelpCircle, ChevronDown, Filter, Users, Package } from 'lucide-react';

// Email Template Helper (Simulated Backend Logic)
const generateShippingEmailHTML = (order: Order, tracking: string, fromEmail: string, fromName: string) => {
    return `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px; color: #1f2937;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Pickle Nick</h1>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Order Update</p>
                </div>

                <div style="margin-bottom: 24px; font-size: 14px; color: #6b7280;">
                    <strong>To:</strong> ${order.customerName}<br/>
                    <strong>Order:</strong> #${order.id.slice(-6)}
                </div>

                <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px;">Your order is on the way!</h2>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #374151;">
                    Hi ${order.customerName.split(' ')[0]},<br/><br/>
                    Great news! We've packed your order with care and it's now with the carrier.
                </p>

                ${tracking ? `
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 12px; text-transform: uppercase; font-weight: 600; color: #6b7280;">Tracking Number</p>
                    <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #111827;">${tracking}</p>
                </div>
                ` : ''}

                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center; font-size: 14px; color: #9ca3af;">
                    <p>Thank you for choosing Pickle Nick.</p>
                </div>
            </div>
        </div>
    `;
};

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3 bg-blue-50 text-blue-700 p-4 text-sm rounded-xl border border-blue-100 mb-4">
        <HelpCircle size={18} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{text}</span>
    </div>
);

const Orders = () => {
  const { orders, updateOrder, products, placeOrder, settings } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Order>>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Email Simulation State
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'packing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openEdit = (order: Order) => {
      setSelectedOrder(order);
      setFormData(order);
      setOrderItems([...order.items]);
      setIsAdding(false);
      setEmailSentStatus(false);
      setSaveStatus('idle');
  };

  const openAdd = () => {
      const newOrder: Partial<Order> = {
          id: `ORD-ADM-${Date.now()}`,
          customerName: '',
          customerEmail: '',
          shippingAddress: '',
          status: 'pending',
          userId: 'admin_entry',
          trackingNumber: '',
          noTracking: false
      };
      setFormData(newOrder);
      setOrderItems([]);
      setSelectedOrder(newOrder as Order);
      setIsAdding(true);
      setEmailSentStatus(false);
      setSaveStatus('idle');
  };

  const addItemToOrder = (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const existing = orderItems.find(i => i.productId === productId);
      if (existing) {
          setOrderItems(orderItems.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
          setOrderItems([...orderItems, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
      }
  };

  const removeItem = (productId: string) => {
      setOrderItems(orderItems.filter(i => i.productId !== productId));
  };

  const updateItemQty = (productId: string, qty: number) => {
      if (qty < 1) return;
      setOrderItems(orderItems.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleSave = async () => {
      if (!formData.customerName) return alert("Customer Name required");
      
      // Strict Tracking Check
      if (formData.status === 'shipped' && !formData.trackingNumber && !formData.noTracking) {
          return alert("To mark as 'Shipped', you must either enter a Tracking Number OR check 'No Tracking'.");
      }
      
      setSaveStatus('saving');
      
      try {
        const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = settings.gstEnabled ? (subtotal * (settings.gstRate / 100)) : 0;
        const total = subtotal + tax;

        const finalOrder: Order = {
            ...formData as Order,
            items: orderItems,
            subtotal,
            tax,
            total,
            createdAt: formData.createdAt || new Date().toISOString()
        };

        if (isAdding) {
            placeOrder(finalOrder); // This adds to context state
        } else {
            await updateOrder(finalOrder);
        }
        
        setSaveStatus('success');
        // Close modal after success
        setTimeout(() => {
            setSaveStatus('idle');
            setSelectedOrder(null);
        }, 1500);

      } catch (e) {
        console.error(e);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
  };

  // Simulated Email Sending
  const handleSendEmail = async () => {
      if (!formData.trackingNumber && !formData.noTracking) return alert("Please enter tracking number or check 'No Tracking'.");
      
      setFormData(prev => ({...prev, status: 'shipped'}));
      
      setEmailSentStatus(false);
      
      import('../../services/emailService').then(async ({ EmailService }) => {
          const success = await EmailService.sendTrackingUpdate(formData as Order, settings);
          if (success) {
              setEmailSentStatus(true);
              setShowEmailPreview(false);
              alert(`📧 Notification successfully dispatched to ${formData.customerEmail}`);
          } else {
              alert(`⚠️ Failed to send email. Ensure your SiteGround mail endpoint is configured in Settings.`);
          }
      });
  };

  const handleExportCSV = () => {
    // ... existing CSV logic ...
    const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Status', 'Subtotal', 'Tax', 'Total', 'Items', 'Shipping Address', 'Tracking'];
    const rows = filteredOrders.map(order => {
      const itemsString = order.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
      const dateString = new Date(order.createdAt).toLocaleDateString();
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        order.id, dateString, escape(order.customerName), escape(order.customerEmail), order.status,
        (order.subtotal || order.total).toFixed(2), (order.tax || 0).toFixed(2), order.total.toFixed(2),
        escape(itemsString), escape(order.shippingAddress), escape(order.trackingNumber || '')
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pickle_nick_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-display text-native-black mb-2">Orders</h1>
            <p className="text-gray-500 text-sm">Manage and track customer orders.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-native-clay/20 focus:border-native-clay outline-none transition-all" 
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto">
                <button onClick={handleExportCSV} className="flex-1 md:flex-none bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" title="Export CSV">
                   <Download size={16} /> Export
                </button>
                <button onClick={openAdd} className="flex-1 md:flex-none bg-native-black text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm">
                   <Plus size={16} /> New Order
                </button>
             </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Order ID</th>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Customer</th>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tracking</th>
                <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400">No orders found.</td>
                    </tr>
                ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 font-mono text-sm text-gray-500">#{order.id.slice(-6)}</td>
                    <td className="p-4">
                    <div className="font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">${order.total.toFixed(2)}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusStyles(order.status)}`}>
                        {order.status}
                    </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                    {order.trackingNumber || (order.noTracking ? 'Local Pickup' : '---')}
                    </td>
                    <td className="p-4 text-right">
                    <button 
                        onClick={() => openEdit(order)}
                        className="text-gray-400 hover:text-native-clay transition-colors font-medium text-sm"
                    >
                        Manage
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl shadow-2xl rounded-2xl border border-gray-100 relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                        {isAdding ? "New Order" : `Order #${selectedOrder.id.slice(-6)}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isAdding ? "Create a manual order entry" : `Placed on ${new Date(selectedOrder.createdAt).toLocaleDateString()}`}
                    </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                <Users size={16} className="text-gray-400" /> Customer Details
                            </h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                                    <input 
                                        value={formData.customerName || ''} 
                                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                                    <input 
                                        value={formData.customerEmail || ''} 
                                        onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Shipping Address</label>
                                    <textarea 
                                        value={formData.shippingAddress || ''} 
                                        onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all h-24 resize-none"
                                        placeholder="123 Pickle Lane..."
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Tracking Section */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                <Truck size={16} className="text-gray-400" /> Fulfillment
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Order Status</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.status} 
                                            onChange={e => setFormData({...formData, status: e.target.value as OrderStatus})}
                                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="packing">Packing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Tracking Number</label>
                                    <input 
                                        value={formData.trackingNumber || ''} 
                                        onChange={e => setFormData({...formData, trackingNumber: e.target.value, noTracking: false})}
                                        disabled={formData.noTracking}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all"
                                        placeholder="Tracking ID"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.noTracking || false} 
                                        onChange={e => setFormData({...formData, noTracking: e.target.checked, trackingNumber: e.target.checked ? '' : formData.trackingNumber})}
                                        className="w-4 h-4 text-native-clay rounded border-gray-300 focus:ring-native-clay"
                                    />
                                    <span className="text-sm text-gray-600">Local Pickup (No Tracking)</span>
                                </label>

                                <button 
                                    onClick={() => setShowEmailPreview(true)}
                                    disabled={!formData.trackingNumber && !formData.noTracking}
                                    className="text-native-clay hover:text-native-clay/80 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Mail size={14} /> Notify Customer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Items */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                 <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                    <Package size={16} className="text-gray-400" /> Order Items
                                 </h3>
                                 <div className="text-right">
                                    <span className="text-2xl font-display text-gray-900 block">
                                        ${(orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (settings.gstEnabled ? 1 + (settings.gstRate / 100) : 1)).toFixed(2)}
                                    </span>
                                    {settings.gstEnabled && <span className="text-xs text-gray-400">Inc. GST</span>}
                                 </div>
                            </div>
                            
                            <div className="mb-4">
                                <select 
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all" 
                                    onChange={(e) => {
                                        if(e.target.value) {
                                            addItemToOrder(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                >
                                    <option value="">+ Add Product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto pr-2 min-h-[200px]">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-500">${item.price} each</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantity} 
                                                onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value))}
                                                className="w-16 p-1.5 border border-gray-200 rounded-md text-center text-sm font-medium focus:border-native-clay outline-none"
                                            />
                                            <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {orderItems.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Package size={32} className="mb-2 opacity-20" />
                                        No items added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                disabled={saveStatus !== 'idle'}
                className="px-5 py-2.5 text-gray-600 font-medium text-sm hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                className={`
                    px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 min-w-[120px] justify-center shadow-sm
                    ${saveStatus === 'idle' ? 'bg-native-black text-white hover:bg-gray-800' : ''}
                    ${saveStatus === 'saving' ? 'bg-gray-100 text-gray-500 cursor-wait' : ''}
                    ${saveStatus === 'success' ? 'bg-green-500 text-white cursor-default' : ''}
                    ${saveStatus === 'error' ? 'bg-red-500 text-white cursor-default' : ''}
                `}
              >
                {saveStatus === 'idle' && (isAdding ? 'Create Order' : 'Save Changes')}
                {saveStatus === 'saving' && <><Loader2 size={16} className="animate-spin" /> Saving...</>}
                {saveStatus === 'success' && <><Check size={16} /> Saved</>}
                {saveStatus === 'error' && <><AlertCircle size={16} /> Error</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <div className="flex items-center gap-2">
                          <Mail className="text-native-clay" size={20} />
                          <span className="font-semibold text-sm text-gray-900">Preview Notification</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md">
                         <Server size={12} /> 
                         <span>Backend: {settings.emailConfig?.enabled ? 'EmailJS' : 'Mock/Local'}</span>
                      </div>
                      <button onClick={() => setShowEmailPreview(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
                      <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 flex gap-2">
                          <AlertCircle size={16} className="shrink-0" />
                          This is a preview. The actual email will be formatted according to your EmailJS template.
                      </div>
                      <div 
                        className="shadow-lg rounded-xl overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: generateShippingEmailHTML(
                            selectedOrder, 
                            formData.trackingNumber || '',
                            settings.emailConfig?.adminEmail || 'orders@picklenick.com',
                            'Pickle Nick Provisions'
                        ) }} 
                      />
                  </div>
                  <div className="p-4 border-t bg-white flex justify-end gap-3">
                      <button onClick={() => setShowEmailPreview(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">Cancel</button>
                      <button 
                        onClick={handleSendEmail} 
                        className="px-5 py-2 bg-native-clay text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-native-clay/90 transition-colors shadow-sm"
                      >
                          <Send size={16} /> Confirm & Send
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;