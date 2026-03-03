import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, CreditCard, Lock, ShieldCheck, CheckCircle2, ChevronRight, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PaymentService } from '../services/paymentService';

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

const Cart = () => {
  const { cart, removeFromCart, placeOrder, clearCart, settings, currentUser } = useStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = settings.gstEnabled ? (subtotal * (settings.gstRate / 100)) : 0;
  const shippingCost = subtotal > 50 ? 0 : 10; // Simple shipping logic for now
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

  const handleShippingSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.zip) {
          setError("Please complete all shipping fields.");
          return;
      }
      setError(null);
      setStep('payment');
      window.scrollTo(0,0);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      
      // Basic client-side validation
      if (formData.cardNumber.replace(/\s/g, '').length < 13) {
          setError("Please enter a valid card number.");
          return;
      }

      setIsProcessing(true);

      try {
          // 1. Call Secure Payment Service (Simulates API)
          const paymentResult = await PaymentService.processPayment(
              total, 
              'USD', 
              { name: formData.name, number: formData.cardNumber }, 
              settings
          );

          if (!paymentResult.success) {
              throw new Error(paymentResult.error || "Payment failed.");
          }

          // 2. Place Order in Database
          const orderId = `ORD-${Date.now()}`;
          const newOrder = {
            id: orderId,
            userId: currentUser ? currentUser.id : 'guest',
            customerName: formData.name,
            customerEmail: formData.email,
            shippingAddress: `${formData.address}, ${formData.city} ${formData.zip}`,
            items: cart,
            subtotal,
            tax,
            total,
            status: 'pending' as const,
            paymentStatus: 'paid' as const,
            transactionId: paymentResult.transactionId,
            paymentMethod: 'credit_card',
            createdAt: new Date().toISOString()
          };
          
          placeOrder(newOrder);

          // 3. Send Email Confirmation
          import('../services/emailService').then(({ EmailService }) => {
              EmailService.sendOrderConfirmation(newOrder, settings);
          });

          setStep('success');
          window.scrollTo(0,0);

      } catch (err: any) {
          setError(err.message || "An unexpected error occurred during payment.");
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Recipient Name</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 focus:border-native-clay/50 focus:bg-white outline-none font-display text-lg transition-all shadow-inner"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner"
                                    placeholder="updates@example.com"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Street Address</label>
                                <input 
                                    required
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                    className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner"
                                    placeholder="123 Pickle Lane"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">City</label>
                                <input 
                                    required
                                    value={formData.city}
                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                    className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-native-earth/60 mb-2 uppercase tracking-widest font-tribal">Zip/Postal Code</label>
                                <input 
                                    required
                                    value={formData.zip}
                                    onChange={e => setFormData({...formData, zip: e.target.value})}
                                    className="w-full p-4 bg-native-sand/30 rounded-2xl border border-native-black/5 focus:border-native-clay/50 focus:bg-white outline-none font-sans transition-all shadow-inner"
                                />
                            </div>
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
                                        <div className="flex gap-2">
                                           <div className="h-6 w-10 bg-white/80 rounded border border-black/5"></div>
                                           <div className="h-6 w-10 bg-white/80 rounded border border-black/5"></div>
                                           <div className="h-6 w-10 bg-white/80 rounded border border-black/5"></div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-4 text-native-earth/30" size={20} />
                                            <input 
                                                required
                                                value={formData.cardNumber}
                                                onChange={e => setFormData({...formData, cardNumber: e.target.value})}
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                className="w-full pl-12 p-4 bg-white rounded-xl border border-native-black/5 focus:border-native-turquoise/50 outline-none font-mono text-lg shadow-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <input 
                                                required
                                                placeholder="MM / YY"
                                                maxLength={5}
                                                className="w-full p-4 bg-white rounded-xl border border-native-black/5 focus:border-native-turquoise/50 outline-none font-mono text-center shadow-sm"
                                                value={formData.expiry}
                                                onChange={e => setFormData({...formData, expiry: e.target.value})}
                                            />
                                            <input 
                                                required
                                                placeholder="CVC"
                                                maxLength={4}
                                                type="password"
                                                className="w-full p-4 bg-white rounded-xl border border-native-black/5 focus:border-native-turquoise/50 outline-none font-mono text-center shadow-sm"
                                                value={formData.cvc}
                                                onChange={e => setFormData({...formData, cvc: e.target.value})}
                                            />
                                        </div>
                                        <input 
                                            required
                                            placeholder="Cardholder Name"
                                            className="w-full p-4 bg-white rounded-xl border border-native-black/5 focus:border-native-turquoise/50 outline-none font-sans uppercase text-sm font-bold tracking-widest shadow-sm"
                                            defaultValue={formData.name}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-12 pt-8 border-t border-native-black/5 items-center">
                                <button type="button" onClick={() => setStep('shipping')} disabled={isProcessing} className="text-native-earth font-bold uppercase tracking-wider text-sm hover:text-native-black transition-colors">Back</button>
                                <button 
                                    type="submit" 
                                    disabled={isProcessing}
                                    className="bg-native-turquoise text-white px-12 py-5 font-display text-xl uppercase tracking-widest hover:bg-native-black transition-all shadow-ink rounded-full flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="animate-spin" /> Processing...</>
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
                            <span>Shipping</span>
                            <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t-2 border-dashed border-native-black/10 pt-6">
                        <span className="font-display text-xl text-native-black uppercase">Total</span>
                        <span className="font-display text-4xl text-native-turquoise drop-shadow-sm">${total.toFixed(2)}</span>
                    </div>

                    {step === 'payment' && (
                        <div className="mt-8 p-4 bg-native-sand/30 text-[10px] text-native-earth/60 text-center rounded-2xl border border-native-black/5 uppercase tracking-widest font-bold">
                            Shipping to: <br/>
                            <span className="text-native-black mt-1 block">{formData.address}, {formData.city}</span>
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