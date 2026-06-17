import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  Zap,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';
import { mountSquareCard, processPayment } from '../services/paymentService';
import {
  calculateShippingCost,
  cloneShippingConfig,
  formatWeightLabel,
  getFreeShippingProgress,
  getShippingTierDetails,
} from '../lib/shipping';

const AU_STATES = [
  { value: '', label: 'Select State/Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
];

const validatePostcode = (postcode: string, state: string): string | null => {
  if (!/^\d{4}$/.test(postcode)) return 'Postcode must be exactly 4 digits.';
  const p = parseInt(postcode, 10);
  const ranges: Record<string, [number, number][]> = {
    NSW: [[1000, 1999], [2000, 2599], [2619, 2899], [2921, 2999]],
    VIC: [[3000, 3999], [8000, 8999]],
    QLD: [[4000, 4999], [9000, 9999]],
    SA: [[5000, 5799], [5800, 5999]],
    WA: [[6000, 6797], [6800, 6999]],
    TAS: [[7000, 7799], [7800, 7999]],
    NT: [[800, 899], [900, 999]],
    ACT: [[200, 299], [2600, 2618], [2900, 2920]],
  };
  if (state && ranges[state]) {
    const valid = ranges[state].some(([low, high]) => p >= low && p <= high);
    if (!valid) return `Postcode ${postcode} doesn't match ${state}. Please check.`;
  }
  return null;
};

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

const fieldClass = (hasError?: boolean) =>
  `w-full border px-5 py-4 font-sans text-base font-semibold outline-none transition ${
    hasError
      ? 'border-native-clay bg-native-clay/10 text-[#120d0b]'
      : 'border-[#120d0b]/16 bg-[#120d0b]/5 text-[#120d0b] focus:border-native-clay focus:bg-white'
  }`;

const Cart = () => {
  const { cart, removeFromCart, updateCartQuantity, placeOrder, settings, currentUser, products } = useStore();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const squareTokenizeRef = useRef<(() => Promise<string>) | null>(null);
  const squareDestroyRef = useRef<(() => void) | null>(null);
  const [squareReady, setSquareReady] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = settings.gstEnabled ? subtotal * (settings.gstRate / 100) : 0;
  const shippingConfig = cloneShippingConfig(settings.shippingConfig);
  const defaultWeight = shippingConfig?.defaultWeightGrams || 500;
  const totalWeightGrams = cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    return acc + (product?.weight || defaultWeight) * item.quantity;
  }, 0);
  const { label: shippingBandLabel } = getShippingTierDetails(shippingConfig, totalWeightGrams);
  const {
    threshold: freeShippingThreshold,
    amountRemaining: amountToFreeShipping,
    progressPercent: freeShippingProgressPercent,
    unlocked: freeShippingUnlocked,
  } = getFreeShippingProgress(shippingConfig, subtotal);

  const calcShipping = useCallback((method: 'standard' | 'express'): number => {
    return calculateShippingCost({
      shippingConfig,
      totalWeightGrams,
      subtotal,
      method,
    });
  }, [shippingConfig, subtotal, totalWeightGrams]);

  const standardCost = calcShipping('standard');
  const expressCost = calcShipping('express');
  const shippingCost = shippingMethod === 'express' ? expressCost : standardCost;
  const total = subtotal + tax + shippingCost;
  const summaryShippingLabel =
    step === 'cart'
      ? 'Est. standard shipping'
      : shippingMethod === 'express'
        ? 'Express shipping'
        : 'Standard shipping';

  useEffect(() => {
    if (!currentUser) return;
    setFormData(prev => ({ ...prev, name: currentUser.name, email: currentUser.email }));
  }, [currentUser]);

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
        if (cancelled) {
          destroy();
          return;
        }
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
  }, [step, settings]);

  const handleShippingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!squareTokenizeRef.current) {
      setError('Payment form is not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const sourceId = await squareTokenizeRef.current();
      const paymentResult = await processPayment(sourceId, total, 'AUD');
      if (!paymentResult.success) throw new Error(paymentResult.error || 'Payment failed.');

      await placeOrder({
        id: `ORD-${Date.now()}`,
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
        status: 'pending',
        paymentStatus: 'paid',
        transactionId: paymentResult.transactionId,
        paymentMethod: 'square',
        createdAt: new Date().toISOString(),
      });
      setStep('success');
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const goToStep = (nextStep: CheckoutStep) => {
    setStep(nextStep);
    window.scrollTo(0, 0);
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#120d0b] px-5 py-32 text-[#f5f0e6]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(244,197,109,0.16),transparent_32%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
        <div className="relative w-full max-w-xl border border-[#f4c56d]/18 bg-[#0b0807]/88 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
          <NickLogo size="lg" className="mb-7 justify-center" />
          <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
            Basket
          </p>
          <h1 className="mt-4 font-display text-6xl leading-none text-[#f4c56d]">Empty</h1>
          <p className="mt-6 font-sans text-lg font-semibold text-[#f5f0e6]/68">
            Your pantry is looking bare.
          </p>
          <Link
            to="/shop"
            className="mt-9 inline-flex w-full items-center justify-center border border-native-clay bg-native-clay px-8 py-5 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#a63d2b]"
          >
            Fill The Basket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-12 pt-32 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(244,197,109,0.16),transparent_32%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
        <div className="relative mx-auto max-w-7xl border-b border-[#f4c56d]/18 pb-10">
          <NickLogo size="md" className="mb-6" />
          <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
            Secure Counter
          </p>
          <h1 className="mt-4 font-display text-[4rem] leading-[0.9] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-7xl">
            Checkout
          </h1>

          {step !== 'success' && (
            <div className="mt-9 flex flex-wrap items-center gap-3 font-tribal text-xs font-bold uppercase tracking-[0.18em]">
              {[
                ['cart', '1', 'Review'],
                ['shipping', '2', 'Shipping'],
                ['payment', '3', 'Payment'],
              ].map(([key, number, label]) => (
                <React.Fragment key={key}>
                  <span className={`inline-flex items-center gap-2 border px-4 py-3 transition ${
                    step === key
                      ? 'border-native-clay bg-native-clay text-white'
                      : 'border-[#f4c56d]/22 text-[#f5f0e6]/48'
                  }`}>
                    <span>{number}</span>
                    {label}
                  </span>
                  {key !== 'payment' && <span className="h-px w-7 bg-[#f4c56d]/18" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#f1dfb8] px-5 py-16 text-[#120d0b] lg:px-8">
        <div className="mx-auto max-w-7xl">
          {step === 'success' ? (
            <div className="mx-auto max-w-2xl border border-[#120d0b]/14 bg-[#120d0b] p-8 text-center text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)]">
              <CheckCircle2 className="mx-auto text-[#f4c56d]" size={72} />
              <h2 className="mt-8 font-display text-6xl leading-none text-[#f4c56d]">Order Confirmed</h2>
              <p className="mt-6 font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/72">
                Thanks, {formData.name.split(' ')[0] || 'friend'}. Your confirmation has been sent to <strong>{formData.email}</strong>.
              </p>
              <Link
                to="/shop"
                className="mt-9 inline-flex items-center justify-center border border-[#f4c56d]/30 px-8 py-5 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
              >
                Return to Shop
              </Link>
            </div>
          ) : (
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="min-w-0">
                {error && (
                  <div className="mb-6 flex items-start gap-4 border border-native-clay/32 bg-native-clay/10 p-5 text-native-clay">
                    <AlertCircle className="mt-0.5 shrink-0" size={22} />
                    <div>
                      <p className="font-tribal text-xs font-bold uppercase tracking-[0.22em]">Checkout Issue</p>
                      <p className="mt-1 font-sans text-sm font-semibold">{error}</p>
                    </div>
                  </div>
                )}

                {step === 'cart' && (
                  <div className="space-y-6">
                    <div className="min-w-0 border border-[#120d0b]/14 bg-[#120d0b] p-6 text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)] md:p-8">
                      <h2 className="border-b border-[#f4c56d]/14 pb-5 font-display text-4xl leading-none text-[#f4c56d]">
                        Your Bounty
                      </h2>
                      <div className="mt-7 space-y-6">
                        {cart.map(item => (
                          <div key={item.productId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[#f4c56d]/10 pb-5 last:border-0 last:pb-0 sm:gap-5">
                            <div className="min-w-0">
                              {(() => {
                                const product = products.find(p => p.id === item.productId);
                                const maxQty = Math.max(product?.stock || item.quantity, item.quantity);
                                return (
                                  <>
                                    <h3 className="break-words font-display text-3xl leading-none text-[#f4c56d]">{item.name}</h3>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                      <div className="flex items-center rounded-full border border-[#f4c56d]/16 bg-[#f5ecda]/4">
                                        <button
                                          type="button"
                                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                                          className="flex h-11 w-11 items-center justify-center rounded-full text-[#f5f0e6] transition hover:bg-[#f4c56d]/8"
                                          aria-label={`Decrease quantity for ${item.name}`}
                                        >
                                          <Minus size={16} />
                                        </button>
                                        <span className="w-12 text-center font-sans text-sm font-semibold uppercase tracking-[0.18em] text-[#f5f0e6]">
                                          {item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateCartQuantity(item.productId, Math.min(maxQty, item.quantity + 1))}
                                          disabled={item.quantity >= maxQty}
                                          className="flex h-11 w-11 items-center justify-center rounded-full text-[#f5f0e6] transition hover:bg-[#f4c56d]/8 disabled:cursor-not-allowed disabled:opacity-35"
                                          aria-label={`Increase quantity for ${item.name}`}
                                        >
                                          <Plus size={16} />
                                        </button>
                                      </div>
                                      <p className="font-sans text-sm font-semibold text-[#f5f0e6]/58">
                                        ${item.price.toFixed(2)} each
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <p className="font-display text-xl text-[#f1dfb8] sm:text-2xl">${(item.quantity * item.price).toFixed(2)}</p>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="border border-[#f4c56d]/16 p-2.5 text-[#f5f0e6]/45 transition hover:border-native-clay hover:text-native-clay sm:p-3"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => goToStep('shipping')}
                        className="inline-flex items-center justify-center gap-3 border border-native-clay bg-native-clay px-8 py-5 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:-translate-y-1 hover:bg-[#a63d2b]"
                      >
                        Proceed <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {step === 'shipping' && (
                  <form onSubmit={handleShippingSubmit} className="border border-[#120d0b]/14 bg-[#f7e7c0] p-6 shadow-[0_26px_70px_rgba(18,13,11,0.18)] md:p-8">
                    <h2 className="flex items-center gap-3 font-display text-4xl leading-none text-[#120d0b]">
                      <Truck className="text-native-clay" size={30} /> Shipping Destination
                    </h2>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">Recipient Name</label>
                        <input
                          required
                          value={formData.name}
                          onChange={event => {
                            setFormData({ ...formData, name: event.target.value });
                            setFieldErrors(prev => ({ ...prev, name: '' }));
                          }}
                          className={fieldClass(!!fieldErrors.name)}
                          placeholder="Full Name"
                        />
                        {fieldErrors.name && <p className="mt-2 text-sm font-semibold text-native-clay">{fieldErrors.name}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">Email Address</label>
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={event => {
                            setFormData({ ...formData, email: event.target.value });
                            setFieldErrors(prev => ({ ...prev, email: '' }));
                          }}
                          className={fieldClass(!!fieldErrors.email)}
                          placeholder="updates@example.com"
                        />
                        {fieldErrors.email && <p className="mt-2 text-sm font-semibold text-native-clay">{fieldErrors.email}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">Street Address</label>
                        <input
                          required
                          value={formData.address}
                          onChange={event => {
                            setFormData({ ...formData, address: event.target.value });
                            setFieldErrors(prev => ({ ...prev, address: '' }));
                          }}
                          className={fieldClass(!!fieldErrors.address)}
                          placeholder="42 Brine Boulevard, Unit 3"
                        />
                        {fieldErrors.address && <p className="mt-2 text-sm font-semibold text-native-clay">{fieldErrors.address}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">Suburb / City</label>
                        <input
                          required
                          value={formData.suburb}
                          onChange={event => {
                            setFormData({ ...formData, suburb: event.target.value });
                            setFieldErrors(prev => ({ ...prev, suburb: '' }));
                          }}
                          className={fieldClass(!!fieldErrors.suburb)}
                          placeholder="Sydney"
                        />
                        {fieldErrors.suburb && <p className="mt-2 text-sm font-semibold text-native-clay">{fieldErrors.suburb}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">State / Territory</label>
                        <select
                          required
                          value={formData.state}
                          onChange={event => {
                            setFormData({ ...formData, state: event.target.value });
                            setFieldErrors(prev => ({ ...prev, state: '', postcode: '' }));
                          }}
                          className={fieldClass(!!fieldErrors.state)}
                        >
                          {AU_STATES.map(state => <option key={state.value} value={state.value}>{state.label}</option>)}
                        </select>
                        {fieldErrors.state && <p className="mt-2 text-sm font-semibold text-native-clay">{fieldErrors.state}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">Postcode</label>
                        <input
                          required
                          inputMode="numeric"
                          maxLength={4}
                          value={formData.postcode}
                          onChange={event => {
                            const value = event.target.value.replace(/\D/g, '').slice(0, 4);
                            setFormData({ ...formData, postcode: value });
                            setFieldErrors(prev => ({ ...prev, postcode: '' }));
                          }}
                          className={fieldClass(!!fieldErrors.postcode)}
                          placeholder="2000"
                        />
                        {fieldErrors.postcode && <p className="mt-2 text-sm font-semibold text-native-clay">{fieldErrors.postcode}</p>}
                      </div>
                    </div>

                    <div className="mt-8">
                      <label className="mb-3 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">Delivery Speed</label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          { method: 'standard' as const, icon: Package, title: 'Standard', days: '3-7 business days', cost: standardCost },
                          { method: 'express' as const, icon: Zap, title: 'Express', days: '1-3 business days', cost: expressCost },
                        ].map(option => (
                          <button
                            key={option.method}
                            type="button"
                            onClick={() => setShippingMethod(option.method)}
                            className={`border p-5 text-left transition ${
                              shippingMethod === option.method
                                ? 'border-native-clay bg-native-clay/10'
                                : 'border-[#120d0b]/14 bg-white/42 hover:border-native-clay/55'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <option.icon className="text-native-clay" size={22} />
                              <span className="font-display text-2xl leading-none text-[#120d0b]">{option.title}</span>
                            </div>
                            <p className="mt-3 font-sans text-sm font-semibold text-[#3d2a21]/72">
                              {option.days} via {shippingConfig?.carrierName || 'Australia Post'}
                            </p>
                            <p className="mt-4 font-display text-3xl leading-none text-native-clay">
                              {option.cost === 0 ? 'FREE' : `$${option.cost.toFixed(2)}`}
                            </p>
                            {option.method === 'standard' && (
                              <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#3d2a21]/55">
                                {subtotal >= freeShippingThreshold
                                  ? `Free over $${freeShippingThreshold.toFixed(0)} unlocked`
                                  : `$${amountToFreeShipping.toFixed(2)} to free standard`}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 space-y-1 text-center font-sans text-sm font-semibold text-[#3d2a21]/60">
                        <p>Order weight: {(totalWeightGrams / 1000).toFixed(2)} kg</p>
                        {shippingBandLabel && (
                          <p>
                            Shipping band: {shippingBandLabel}
                            {subtotal < freeShippingThreshold && ` • Free standard over $${freeShippingThreshold.toFixed(0)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-10 flex items-center justify-between border-t border-[#120d0b]/14 pt-7">
                      <button type="button" onClick={() => goToStep('cart')} className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#120d0b]/62 transition hover:text-[#120d0b]">
                        Back
                      </button>
                      <button type="submit" className="border border-native-clay bg-native-clay px-8 py-4 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#a63d2b]">
                        Continue to Pay
                      </button>
                    </div>
                  </form>
                )}

                {step === 'payment' && (
                  <div>
                    <div className="mb-6 flex flex-wrap justify-center gap-4 font-tribal text-xs font-bold uppercase tracking-[0.18em] text-[#120d0b]/52">
                      <span className="inline-flex items-center gap-2"><Lock size={15} /> SSL Encrypted</span>
                      <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Secure Gateway</span>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="border border-[#120d0b]/14 bg-[#f7e7c0] p-6 shadow-[0_26px_70px_rgba(18,13,11,0.18)] md:p-8">
                      <h2 className="flex items-center gap-3 font-display text-4xl leading-none text-[#120d0b]">
                        <CreditCard className="text-native-clay" size={30} /> Payment Method
                      </h2>

                      <div className="mt-8 border border-[#120d0b]/14 bg-white/42 p-6">
                        <div className="mb-5 flex justify-between gap-4 font-tribal text-xs font-bold uppercase tracking-[0.18em] text-[#120d0b]/58">
                          <span>Credit / Debit Card</span>
                          <span>Square</span>
                        </div>
                        {squareError ? (
                          <div className="flex items-center gap-3 border border-native-clay/32 bg-native-clay/10 p-4 font-sans text-sm font-semibold text-native-clay">
                            <AlertCircle size={17} /> {squareError}
                          </div>
                        ) : (
                          <div className="relative min-h-[88px]">
                            {!squareReady && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f7e7c0]/80">
                                <Loader2 className="animate-spin text-native-clay" size={22} />
                              </div>
                            )}
                            <div id="square-card-container" className="min-h-[88px]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-10 flex items-center justify-between border-t border-[#120d0b]/14 pt-7">
                        <button type="button" onClick={() => goToStep('shipping')} disabled={isProcessing} className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#120d0b]/62 transition hover:text-[#120d0b]">
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessing || !squareReady || !!squareError}
                          className="inline-flex items-center justify-center gap-3 border border-native-clay bg-native-clay px-8 py-4 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#a63d2b] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? (
                            <><Loader2 className="animate-spin" size={18} /> Processing</>
                          ) : !squareReady && !squareError ? (
                            <><Loader2 className="animate-spin" size={18} /> Loading</>
                          ) : (
                            <>Pay ${total.toFixed(2)}</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
                <div className="min-w-0 border border-[#120d0b]/14 bg-[#120d0b] p-6 text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)] md:p-8">
                  <h2 className="border-b border-[#f4c56d]/14 pb-5 font-display text-4xl leading-none text-[#f4c56d]">
                    Summary
                  </h2>

                  <div className="mt-6 max-h-64 space-y-4 overflow-y-auto pr-2">
                    {cart.map(item => (
                      <div key={item.productId} className="flex justify-between gap-4 font-sans text-sm font-semibold text-[#f5f0e6]/70">
                        <span>{item.quantity} x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-[1.75rem] border border-[#f4c56d]/12 bg-[#f5ecda]/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-tribal text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4c56d]">
                          Free Standard
                        </p>
                        <p className="mt-2 font-sans text-sm font-semibold text-[#f5f0e6]/72">
                          {freeShippingUnlocked
                            ? `Unlocked over $${freeShippingThreshold.toFixed(0)}`
                            : `$${amountToFreeShipping.toFixed(2)} to go`}
                        </p>
                      </div>
                      <div className="text-right font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#f5f0e6]/52">
                        <p>{formatWeightLabel(totalWeightGrams)}</p>
                        {shippingBandLabel && <p className="mt-2">{shippingBandLabel} band</p>}
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f5ecda]/10">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#9f3b2e_0%,#d37a55_48%,#f4c56d_100%)] transition-[width] duration-300"
                        style={{ width: `${freeShippingProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-7 space-y-3 border-t border-[#f4c56d]/14 pt-6 font-sans text-sm font-semibold text-[#f5f0e6]/62">
                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    {settings.gstEnabled && <div className="flex justify-between"><span>GST {settings.gstRate}%</span><span>${tax.toFixed(2)}</span></div>}
                    <div className="flex justify-between">
                      <span>{summaryShippingLabel}</span>
                      <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                  </div>

                  <div className="mt-7 flex items-end justify-between border-t border-dashed border-[#f4c56d]/20 pt-6">
                    <span className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/56">Total</span>
                    <span className="font-display text-5xl leading-none text-[#f4c56d]">${total.toFixed(2)}</span>
                  </div>

                  {step === 'payment' && (
                    <div className="mt-7 border border-[#f4c56d]/14 p-4 text-center font-sans text-sm font-semibold text-[#f5f0e6]/64">
                      Shipping to {formData.suburb} {formData.state} {formData.postcode}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Cart;
