import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, CreditCard, Lock, ShieldCheck, CheckCircle2, ChevronRight, Truck, AlertCircle, Loader2, MapPin, Zap, Package } from 'lucide-react';

const AU_STATES = [
  { value: '', label: 'Select State/Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' }
];

const validatePostcode = (postcode: string, state: string): string | null => {
  if (!/^\d{4}$/.test(postcode)) return 'Postcode must be exactly 4 digits.';
  const p = parseInt(postcode);
  const ranges: Record<string, [number,number][]> = {
    NSW: [[1000,1999],[2000,2599],[2619,2899],[2921,2999]],
    VIC: [[3000,3999],[8000,8999]],
    QLD: [[4000,4999],[9000,9999]],
    SA:  [[5000,5799],[5800,5999]],
    WA:  [[6000,6797],[6800,6999]],
    TAS: [[7000,7799],[7800,7999]],
    NT:  [[800,899],[900,999]],
    ACT: [[200,299],[2600,2618],[2900,2920]]
  };
  if (state && ranges[state]) {
    const valid = ranges[state].some(([lo, hi]) => p >= lo && p <= hi);
    if (!valid) return `Postcode ${postcode} doesn't match ${state}. Please check.`;
  }
  return null;
};
import { Link, useNavigate } from 'react-router-dom';
import { mountSquareCard, processPayment } from '../services/paymentService';

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

const Cart = () => {
  const { cart, removeFromCart, placeOrder, clearCart, settings, currentUser, products } = useStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Square card element
  const squareTokenizeRef = useRef<(() => Promise<string>) | null>(null);
  const squareDestroyRef = useRef<(() => void) | null>(null);
  const [squareReady, setSquareReady] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = settings.gstEnabled ? (subtotal * (settings.gstRate / 100)) : 0;

  // Live weight-based postage calculator
  const sc = settings.shippingConfig;
  const defaultWeight = sc?.defaultWeightGrams || 500;
  const totalWeightGrams = cart.reduce((acc, item) => {
    const prod = products.find(p => p.id === item.productId);
    const itemWeight = prod?.weight || defaultWeight;
    return acc + (itemWeight * item.quantity);
  }, 0);

  const calcShipping = (method: 'standard' | 'express'): number => {
    const rates = sc?.rates || [];
    if (rates.length === 0) return method === 'express' ? 15 : 10;
    const sorted = [...rates].sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
    const tier = sorted.find(r => totalWeightGrams <= r.maxWeightGrams) || sorted[sorted.length - 1];
    if (method === 'standard') {
      const threshold = sc?.freeShippingThreshold ?? 75;
      return subtotal >= threshold ? 0 : tier.standardPrice;
    }
    return tier.expressPrice;
  };

  const standardCost = calcShipping('standard');
  const expressCost = calcShipping('express');
  const shippingCost = shippingMethod === 'express' ? expressCost : standardCost;
  const total = subtotal + tax + shippingCost;

  // Auto-fill user data if logged in
  useEffect(() => {
      if (currentUser) {
          setFormData(prev => ({
              ...prev,
              name: currentUser.name,
              email: currentUser.email
          }));
      }
  }, [currentUser]);

  // Mount Square card element when payment step is active
  useEffect(() => {
    if (step !== 'payment') return;
    let cancelled = false;
    setSquareReady(false);
    setSquareError(null);
    squareDestroyRef.current?.();
    squareDestroyRef.current = null;
    squareTokenizeRef.current = null;

    mountSquareCard('square-card-container', settings)
      .then(({ tokenize, destroy }) => {
        if (cancelled) { destroy(); return; }
        squareTokenizeRef.current = tokenize;
        squareDestroyRef.current = destroy;
        setSquareReady(true);
      })
      .catch(err => {
        if (!cancelled) setSquareError(err.message || 'Failed to load payment form');
      });

    return () => {
      cancelled = true;
      squareDestroyRef.current?.();
    };
  }, [step, settings.squareApplicationId, settings.squareLocationId]);

  const handleShippingSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const errors: Record<string, string> = {};

      if (!formData.name.trim()) errors.name = 'Name is required.';
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Valid email is required.';
      if (!formData.address.trim() || formData.address.trim().length < 5) errors.address = 'Enter a valid street address.';
      if (!formData.suburb.trim()) errors.suburb = 'Suburb/City is required.';
      if (!formData.state) errors.state = 'Please select a state.';

      const postcodeErr = validatePostcode(formData.postcode, formData.state);
      if (postcodeErr) errors.postcode = postcodeErr;

      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
          setError('Please correct the highlighted fields.');
          return;
      }
      setError(null);
      setStep('payment');
      window.scrollTo(0,0);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!squareTokenizeRef.current) {
          setError('Payment form is not ready. Please wait a moment and try again.');
          return;
      }
      setIsProcessing(true);
      try {
          // 1. Tokenize card via Square Web Payments SDK
          const sourceId = await squareTokenizeRef.current();

          // 2. Charge via Worker → Square Payments API
          const paymentResult = await processPayment(sourceId, total, 'AUD');
          if (!paymentResult.success) {
              throw new Error(paymentResult.error || 'Payment failed.');
          }

          // 3. Place order in D1
          const orderId = `ORD-${Date.now()}`;
          const newOrder = {
              id: orderId,
              userId: currentUser ? currentUser.id : 'guest',
              customerName: formData.name,
              customerEmail: formData.email,
              shippingAddress: `${formData.address}, ${formData.suburb} ${formData.state} ${formData.postcode}`,
              items: cart,
              subtotal,
              tax,
              shippingCost,
              shippingMethod,
              total,
              status: 'pending' as const,
              paymentStatus: 'paid' as const,
              transactionId: paymentResult.transactionId,
              paymentMethod: 'square',
              createdAt: new Date().toISOString()
          };
          await placeOrder(newOrder);
          setStep('success');
          window.scrollTo(0, 0);
      } catch (err: any) {
          setError(err.message || 'An unexpected error occurred during payment.');
      } finally {
          setIsProcessing(false);
      }
  };

  // --- Render Functions ---

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-native-sand">
        <div className="bg-white p-12 shadow-card rounded-[3rem] max-w-lg w-full border border-native-black/5">
          <h2 className="font-display text-5xl text-native-black mb-4 uppercase">Basket Empty</h2>
          <p className="text-gray-500 font-sans text-lg mb-8">Your pantry is looking a bit bare.</p>
          <Link to="/shop" className="bg-native-black text-white px-8 py-5 font-display text-2xl uppercase hover:bg-native-clay transition-all shadow-ink rounded-full block w-full tracking-widest">
            Fill The Basket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto bg-native-sand min-h-screen">
      
      {/* Checkout Progress Header */}
      <div className="mb-12">
           <h1 className="font-display text-4xl md:text-6xl text-native-black mb-8 uppercase text-center md:text-left drop-shadow-sm">Secure Checkout</h1>
           <div className="flex items-center justify-center md:justify-start gap-4 text-xs md:text-sm font-tribal uppercase tracking-widest font-bold">
               <span className={`${step === 'cart' ? 'text-native-clay' : 'text-native-black/40'} flex items-center gap-2 transition-colors`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step === 'cart' ? 'border-native-clay bg-native-clay text-white shadow-md' : 'border-native-black/20 text-native-black/40'}`}>1</span>
                  Review
               </span>
               <div className="w-8 h-0.5 bg-native-black/10 rounded-full"></div>
               <span className={`${step === 'shipping' ? 'text-native-clay' : 'text-native-black/40'} flex items-center gap-2 transition-colors`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step === 'shipping' ? 'border-native-clay bg-native-clay text-white shadow-md' : 'border-native-black/20 text-native-black/40'}`}>2</span>
                  Shipping
               </span>
               <div className="w-8 h-0.5 bg-native-black/10 rounded-full"></div>
               <span className={`${step === 'payment' ? 'text-native-clay' : 'text-native-black/40'} flex items-center gap-2 transition-colors`}>
                   <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step === 'payment' ? 'border-native-clay bg-native-clay text-white shadow-md' : 'border-native-black/20 text-native-black/40'}`}>3</span>
                   Payment
               </span>
           </div>
      </div>

      {step === 'success' ? (
          <div className="max-w-2xl mx-auto bg-white p-12 shadow-card rounded-[3rem] text-center animate-in fade-in zoom-in duration-500 border border-native-turquoise/20">
               <div className="flex justify-center mb-8">
                   <div className="bg-native-turquoise/10 p-6 rounded-full text-native-turquoise shadow-inner">
                       <CheckCircle2 size={64} />
                   </div>
               </div>
               <h2 className="font-display text-4xl text-native-black uppercase mb-4">Order Confirmed</h2>
               <p className="font-sans text-xl text-native-earth mb-10 leading-relaxed">
                   Thank you, {formData.name.split(' ')[0]}. The spirits have accepted your offering. 
                   A confirmation raven (email) has been dispatched to <strong>{formData.email}</strong>.
               </p>
               <div className="flex justify-center">
                   <Link to="/shop" className="bg-native-black text-white px-12 py-5 font-tribal uppercase font-bold tracking-widest hover:bg-native-turquoise transition-all rounded-full shadow-ink">
                       Return to Shop
                   </Link>
               </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Dynamic Content based on Step */}
            <div className="lg:col-span-2">
                
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-5 mb-8 rounded-2xl flex items-start gap-4 shadow-sm">
                        <AlertCircle className="shrink-0 mt-0.5 text-red-500" />
                        <div>
                            <p className="font-bold uppercase text-xs tracking-wider mb-1">Transaction Issue</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Step 1: Cart Review */}
                {step === 'cart' && (
                    <div className="space-y-8 animate-in slide-in-from-left-4 fade-in">
                        <div className="bg-white p-8 shadow-card rounded-3xl border border-native-black/5">
                            <h3 className="font-display text-2xl uppercase mb-8 text-native-black border-b border-native-black/5 pb-4">Your Bounty</h3>
                            <div className="space-y-8">
                                {cart.map((item) => (
                                    <div key={item.productId} className="flex items-center gap-6 group">
                                      <div className="flex-1">
                                          <h3 className="font-display text-xl text-native-black uppercase group-hover:text-native-clay transition-colors">{item.name}</h3>
                                          <p className="text-native-earth/60 font-sans text-sm font-medium">Qty: {item.quantity} &times; ${item.price.toFixed(2)}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="font-display text-xl text-native-clay">${(item.quantity * item.price).toFixed(2)}</p>
                                      </div>
                                      <button 
                                          onClick={() => removeFromCart(item.productId)}
                                          className="text-native-earth/30 hover:text-red-500 transition-all p-3 bg-native-sand/50 rounded-full hover:bg-red-50"
                                      >
                                          <Trash2 size={20} />
                                      </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end">
                             <button 
                                onClick={() => { setStep('shipping'); window.scrollTo(0,0); }}
                                className="bg-native-black text-white px-10 py-5 font-display text-xl uppercase tracking-widest hover:bg-native-clay transition-all shadow-ink rounded-full flex items-center gap-3"
                             >
                                 Proceed <ChevronRight size={20} />
                             </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Shipping Details */}
                {step === 'shipping' && (
                    <form onSubmit={handleShippingSubmit} className="bg-white p-10 shadow-card rounded-3xl border border-native-black/5 animate-in slide-in-from-right-4 fade-in">
                        <h3 className="font-display text-2xl uppercase mb-8 text-native-black flex items-center gap-3">
                            <Truck className="text-native-clay" size={28} /> Shipping Destination
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Recipient Name</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => { setFormData({...formData, name: e.target.value}); setFieldErrors(prev => ({...prev, name: ''})); }}
                                    className={`w-full p-4 bg-native-sand/30 rounded-2xl border ${fieldErrors.name ? 'border-red-400 bg-red-50/30' : 'border-native-black/5'} focus:border-native-clay/50 focus:bg-white outline-none font-display text-lg transition-all shadow-inner`}
                                    placeholder="Full Name"
                                />
                                {fieldErrors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{fieldErrors.name}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => { setFormData({...formData, email: e.target.value}); setFieldErrors(prev => ({...prev, email: ''})); }}
                                    className={`w-full p-4 bg-native-sand/30 rounded-2xl border ${fieldErrors.email ? 'border-red-400 bg-red-50/30' : 'border-native-black/5'} focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner`}
                                    placeholder="updates@example.com"
                                />
                                {fieldErrors.email && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{fieldErrors.email}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Street Address</label>
                                <input 
                                    required
                                    value={formData.address}
                                    onChange={e => { setFormData({...formData, address: e.target.value}); setFieldErrors(prev => ({...prev, address: ''})); }}
                                    className={`w-full p-4 bg-native-sand/30 rounded-2xl border ${fieldErrors.address ? 'border-red-400 bg-red-50/30' : 'border-native-black/5'} focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner`}
                                    placeholder="42 Brine Boulevard, Unit 3"
                                />
                                {fieldErrors.address && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{fieldErrors.address}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Suburb / City</label>
                                <input 
                                    required
                                    value={formData.suburb}
                                    onChange={e => { setFormData({...formData, suburb: e.target.value}); setFieldErrors(prev => ({...prev, suburb: ''})); }}
                                    className={`w-full p-4 bg-native-sand/30 rounded-2xl border ${fieldErrors.suburb ? 'border-red-400 bg-red-50/30' : 'border-native-black/5'} focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner`}
                                    placeholder="Sydney"
                                />
                                {fieldErrors.suburb && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{fieldErrors.suburb}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">State / Territory</label>
                                <select
                                    required
                                    value={formData.state}
                                    onChange={e => { setFormData({...formData, state: e.target.value}); setFieldErrors(prev => ({...prev, state: '', postcode: ''})); }}
                                    className={`w-full p-4 bg-native-sand/30 rounded-2xl border ${fieldErrors.state ? 'border-red-400 bg-red-50/30' : 'border-native-black/5'} focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner appearance-none`}
                                >
                                    {AU_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                {fieldErrors.state && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{fieldErrors.state}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Postcode</label>
                                <input 
                                    required
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={formData.postcode}
                                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0,4); setFormData({...formData, postcode: v}); setFieldErrors(prev => ({...prev, postcode: ''})); }}
                                    className={`w-full p-4 bg-native-sand/30 rounded-2xl border ${fieldErrors.postcode ? 'border-red-400 bg-red-50/30' : 'border-native-black/5'} focus:border-native-clay/50 focus:bg-white outline-none font-mono text-lg tracking-widest transition-all shadow-inner`}
                                    placeholder="2000"
                                />
                                {fieldErrors.postcode && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/>{fieldErrors.postcode}</p>}
                            </div>
                        </div>

                        {/* Shipping Method Selector */}
                        <div className="mt-8">
                            <label className="block text-xs font-bold text-native-earth/60 mb-3 uppercase tracking-widest font-tribal">Delivery Speed</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShippingMethod('standard')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${shippingMethod === 'standard' ? 'border-native-clay bg-native-clay/5 shadow-md' : 'border-native-black/10 hover:border-native-black/20 bg-white'}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Package size={20} className={shippingMethod === 'standard' ? 'text-native-clay' : 'text-native-earth/40'} />
                                        <span className="font-display text-lg uppercase text-native-black">Standard</span>
                                    </div>
                                    <p className="text-xs text-native-earth/60 mb-2">3–7 business days via {sc?.carrierName || 'Australia Post'}</p>
                                    <span className="font-display text-xl text-native-clay">
                                        {standardCost === 0 ? 'FREE' : `$${standardCost.toFixed(2)}`}
                                    </span>
                                    {standardCost === 0 && <span className="text-[10px] text-native-turquoise font-bold uppercase tracking-wider ml-2">Orders ${sc?.freeShippingThreshold ?? 75}+</span>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShippingMethod('express')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${shippingMethod === 'express' ? 'border-native-clay bg-native-clay/5 shadow-md' : 'border-native-black/10 hover:border-native-black/20 bg-white'}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Zap size={20} className={shippingMethod === 'express' ? 'text-native-clay' : 'text-native-earth/40'} />
                                        <span className="font-display text-lg uppercase text-native-black">Express</span>
                                    </div>
                                    <p className="text-xs text-native-earth/60 mb-2">1–3 business days via {sc?.carrierName || 'Australia Post'}</p>
                                    <span className="font-display text-xl text-native-clay">${expressCost.toFixed(2)}</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-native-earth/50 mt-2 text-center">Order weight: {(totalWeightGrams / 1000).toFixed(2)} kg</p>
                        </div>

                        <div className="mt-6 flex items-start gap-3 bg-native-sand/40 p-4 rounded-2xl border border-native-black/5">
                            <MapPin size={18} className="text-native-clay shrink-0 mt-0.5" />
                            <p className="text-xs text-native-earth/70 leading-relaxed">We ship Australia-wide via {sc?.carrierName || 'Australia Post'}. Free standard shipping on orders over ${sc?.freeShippingThreshold ?? 75}. Express available on all orders.</p>
                        </div>

                        <div className="flex justify-between mt-12 pt-8 border-t border-native-black/5 items-center">
                            <button type="button" onClick={() => setStep('cart')} className="text-native-earth font-bold uppercase tracking-wider text-sm hover:text-native-black transition-colors">Back</button>
                            <button type="submit" className="bg-native-black text-white px-10 py-4 font-display text-lg uppercase tracking-widest hover:bg-native-clay transition-all shadow-ink rounded-full">
                                Continue to Pay
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: Secure Payment */}
                {step === 'payment' && (
                    <div className="animate-in slide-in-from-right-4 fade-in">
                        {/* Trust Signals */}
                        <div className="flex items-center justify-center gap-8 mb-8 text-native-earth/40">
                            <div className="flex items-center gap-2">
                                <Lock size={16} /> <span className="text-[10px] font-bold uppercase tracking-[0.2em]">256-Bit SSL Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} /> <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Gateway</span>
                            </div>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="bg-white p-10 shadow-card rounded-3xl border border-native-black/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <CreditCard size={120} />
                            </div>

                            <h3 className="font-display text-2xl uppercase mb-8 text-native-black flex items-center gap-3 relative z-10">
                                <Lock className="text-native-turquoise" size={28} /> Payment Method
                            </h3>

                            <div className="space-y-8 relative z-10">
                                <div className="bg-native-sand/20 p-6 rounded-2xl border border-native-black/5 shadow-inner">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-bold text-sm text-native-black/60 uppercase tracking-widest">Credit / Debit Card</span>
                                        <span className="text-xs text-native-earth/50 font-medium">Powered by Square</span>
                                    </div>

                                    {squareError ? (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{squareError}</span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {!squareReady && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                                                    <Loader2 size={20} className="animate-spin text-native-earth/40" />
                                                </div>
                                            )}
                                            <div id="square-card-container" className="min-h-[88px]" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between mt-12 pt-8 border-t border-native-black/5 items-center">
                                <button type="button" onClick={() => setStep('shipping')} disabled={isProcessing} className="text-native-earth font-bold uppercase tracking-wider text-sm hover:text-native-black transition-colors">Back</button>
                                <button
                                    type="submit"
                                    disabled={isProcessing || !squareReady || !!squareError}
                                    className="bg-native-turquoise text-white px-12 py-5 font-display text-xl uppercase tracking-widest hover:bg-native-black transition-all shadow-ink rounded-full flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="animate-spin" size={20} /> Processing...</>
                                    ) : !squareReady && !squareError ? (
                                        <><Loader2 className="animate-spin" size={20} /> Loading...</>
                                    ) : (
                                        <>Pay ${total.toFixed(2)}</>
                                    )}
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-native-earth/40 mt-6 uppercase tracking-[0.3em] font-bold">
                                Payment processed securely. Your data is encrypted.
                            </p>
                        </form>
                    </div>
                )}
            </div>

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-1">
                <div className="bg-white p-8 shadow-card rounded-3xl border border-native-black/5 sticky top-32">
                    <h3 className="font-display text-xl uppercase text-native-black border-b border-native-black/5 pb-4 mb-6">Summary</h3>
                    
                    {/* Items Preview */}
                    <div className="space-y-4 mb-8 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {cart.map(item => (
                            <div key={item.productId} className="flex justify-between text-sm">
                                <span className="text-native-black/60 font-medium">{item.quantity} &times; {item.name}</span>
                                <span className="font-bold text-native-black">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 border-t border-native-black/5 pt-6 mb-6">
                        <div className="flex justify-between text-native-earth/70 font-medium">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {settings.gstEnabled && (
                             <div className="flex justify-between text-native-earth/50 text-xs">
                                <span>Tax (GST {settings.gstRate}%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-native-earth/70 font-medium">
                            <span className="flex items-center gap-1.5">
                                {shippingMethod === 'express' ? <Zap size={12} /> : <Package size={12} />}
                                {shippingMethod === 'express' ? 'Express' : 'Standard'}
                            </span>
                            <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t-2 border-dashed border-native-black/10 pt-6">
                        <span className="font-display text-xl text-native-black uppercase">Total</span>
                        <span className="font-display text-4xl text-native-turquoise drop-shadow-sm">${total.toFixed(2)}</span>
                    </div>

                    {step === 'payment' && (
                        <div className="mt-8 p-4 bg-native-sand/30 text-[10px] text-native-earth/60 text-center rounded-2xl border border-native-black/5 uppercase tracking-widest font-bold">
                            {shippingMethod === 'express' ? '⚡ Express' : '📦 Standard'} Shipping to: <br/>
                            <span className="text-native-black mt-1 block">{formData.address}, {formData.suburb} {formData.state} {formData.postcode}</span>
                        </div>
                    )}
                </div>
            </div>

          </div>
      )}
    </div>
  );
};

export default Cart;