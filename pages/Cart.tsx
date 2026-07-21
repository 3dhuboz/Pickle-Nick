import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
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
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';
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
  const numericPostcode = Number.parseInt(postcode, 10);
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
    const isValid = ranges[state].some(([low, high]) => numericPostcode >= low && numericPostcode <= high);
    if (!isValid) return `Postcode ${postcode} doesn't match ${state}. Please check.`;
  }

  return null;
};

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

const fieldClass = (hasError?: boolean) => `checkout-input ${hasError ? 'is-error' : ''}`;

const checkoutSteps: Array<{ key: Exclude<CheckoutStep, 'success'>; label: string }> = [
  { key: 'cart', label: 'Review' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
];

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

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = settings.gstEnabled ? subtotal * (settings.gstRate / 100) : 0;
  const shippingConfig = cloneShippingConfig(settings.shippingConfig);
  const defaultWeight = shippingConfig.defaultWeightGrams || 500;
  const totalWeightGrams = cart.reduce((total, item) => {
    const product = products.find(candidate => candidate.id === item.productId);
    return total + (product?.weight || defaultWeight) * item.quantity;
  }, 0);
  const { label: shippingBandLabel } = getShippingTierDetails(shippingConfig, totalWeightGrams);
  const {
    threshold: freeShippingThreshold,
    amountRemaining: amountToFreeShipping,
    progressPercent: freeShippingProgressPercent,
    unlocked: freeShippingUnlocked,
  } = getFreeShippingProgress(shippingConfig, subtotal);

  const calculateForMethod = useCallback((method: 'standard' | 'express') => calculateShippingCost({
    shippingConfig,
    totalWeightGrams,
    subtotal,
    method,
  }), [shippingConfig, subtotal, totalWeightGrams]);

  const standardCost = calculateForMethod('standard');
  const expressCost = calculateForMethod('express');
  const shippingCost = shippingMethod === 'express' ? expressCost : standardCost;
  const total = subtotal + tax + shippingCost;
  const summaryShippingLabel = step === 'cart'
    ? 'Estimated standard shipping'
    : shippingMethod === 'express' ? 'Express shipping' : 'Standard shipping';

  useEffect(() => {
    if (!currentUser) return;
    setFormData(value => ({ ...value, name: currentUser.name, email: currentUser.email }));
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
      .catch((mountError: Error) => {
        if (!cancelled) setSquareError(mountError.message || 'Failed to load payment form');
      });

    return () => {
      cancelled = true;
      squareDestroyRef.current?.();
    };
  }, [step, settings]);

  const goToStep = (nextStep: CheckoutStep) => {
    setError(null);
    setStep(nextStep);
    window.scrollTo(0, 0);
  };

  const handleShippingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Valid email is required.';
    if (!formData.address.trim() || formData.address.trim().length < 5) errors.address = 'Enter a valid street address.';
    if (!formData.suburb.trim()) errors.suburb = 'Suburb or city is required.';
    if (!formData.state) errors.state = 'Please select a state.';
    const postcodeError = validatePostcode(formData.postcode, formData.state);
    if (postcodeError) errors.postcode = postcodeError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please correct the highlighted fields.');
      return;
    }
    goToStep('payment');
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
      goToStep('success');
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'An unexpected error occurred during payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="page-shell content-page">
        <main className="page-width empty-state" style={{ marginTop: 72 }}>
          <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" />
          <h1 className="display" style={{ fontSize: 52 }}>Your basket is empty.</h1>
          <p className="body-copy">Pick a jar or bottle and it will show up here.</p>
          <Link className="button button--primary" to="/shop">Shop the batch <ArrowRight size={16} /></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell checkout-page">
      <header className="page-hero checkout-hero">
        <div className="page-width">
          <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" />
          <div className="checkout-hero__row">
            <div>
              <p className="eyeline">Secure checkout</p>
              <h1 className="display">Your basket.</h1>
            </div>
            {step !== 'success' ? (
              <ol className="checkout-steps" aria-label="Checkout progress">
                {checkoutSteps.map((item, index) => (
                  <li key={item.key} className={step === item.key ? 'is-active' : ''}>
                    <span>{index + 1}</span>{item.label}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </header>

      <section className="checkout-area">
        <div className="page-width">
          {step === 'success' ? (
            <div className="checkout-success">
              <CheckCircle2 size={48} color="var(--red)" />
              <h2 className="display">Order confirmed.</h2>
              <p>Thanks, {formData.name.split(' ')[0] || 'friend'}. A confirmation has been sent to <strong>{formData.email}</strong>.</p>
              <Link className="button button--dark" to="/shop">Return to shop <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <div className="checkout-grid">
              <div className="checkout-main">
                {error ? (
                  <div className="checkout-error" role="alert">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                  </div>
                ) : null}

                {step === 'cart' ? (
                  <section className="checkout-panel">
                    <div className="checkout-panel__head">
                      <h2 className="display">Review the batch.</h2>
                      <span>{cart.reduce((count, item) => count + item.quantity, 0)} item{cart.reduce((count, item) => count + item.quantity, 0) === 1 ? '' : 's'}</span>
                    </div>
                    <div className="checkout-items">
                      {cart.map(item => {
                        const product = products.find(candidate => candidate.id === item.productId);
                        const maxQuantity = Math.max(product?.stock || item.quantity, item.quantity);
                        return (
                          <div key={item.productId} className="checkout-item">
                            <div>
                              <h3>{item.name}</h3>
                              <p>${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="quantity-control quantity-control--light" aria-label={`Quantity for ${item.name}`}>
                              <button type="button" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease quantity for ${item.name}`}><Minus size={15} /></button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => updateCartQuantity(item.productId, Math.min(maxQuantity, item.quantity + 1))} disabled={item.quantity >= maxQuantity} aria-label={`Increase quantity for ${item.name}`}><Plus size={15} /></button>
                            </div>
                            <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                            <button type="button" className="checkout-remove" onClick={() => removeFromCart(item.productId)} aria-label={`Remove ${item.name}`}><Trash2 size={17} /></button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="checkout-actions checkout-actions--end">
                      <button type="button" className="button button--dark" onClick={() => goToStep('shipping')}>Continue to shipping <ArrowRight size={16} /></button>
                    </div>
                  </section>
                ) : null}

                {step === 'shipping' ? (
                  <form className="checkout-panel" onSubmit={handleShippingSubmit}>
                    <div className="checkout-panel__head">
                      <h2 className="display">Where is it going?</h2>
                      <Truck size={22} color="var(--red)" />
                    </div>
                    <div className="checkout-fields">
                      <div className="field checkout-field checkout-field--wide">
                        <label htmlFor="shipping-name">Recipient name</label>
                        <input id="shipping-name" required value={formData.name} onChange={event => { setFormData(value => ({ ...value, name: event.target.value })); setFieldErrors(value => ({ ...value, name: '' })); }} className={fieldClass(Boolean(fieldErrors.name))} autoComplete="name" />
                        {fieldErrors.name ? <small>{fieldErrors.name}</small> : null}
                      </div>
                      <div className="field checkout-field checkout-field--wide">
                        <label htmlFor="shipping-email">Email address</label>
                        <input id="shipping-email" type="email" required value={formData.email} onChange={event => { setFormData(value => ({ ...value, email: event.target.value })); setFieldErrors(value => ({ ...value, email: '' })); }} className={fieldClass(Boolean(fieldErrors.email))} autoComplete="email" />
                        {fieldErrors.email ? <small>{fieldErrors.email}</small> : null}
                      </div>
                      <div className="field checkout-field checkout-field--wide">
                        <label htmlFor="shipping-address">Street address</label>
                        <input id="shipping-address" required value={formData.address} onChange={event => { setFormData(value => ({ ...value, address: event.target.value })); setFieldErrors(value => ({ ...value, address: '' })); }} className={fieldClass(Boolean(fieldErrors.address))} autoComplete="street-address" />
                        {fieldErrors.address ? <small>{fieldErrors.address}</small> : null}
                      </div>
                      <div className="field checkout-field">
                        <label htmlFor="shipping-suburb">Suburb or city</label>
                        <input id="shipping-suburb" required value={formData.suburb} onChange={event => { setFormData(value => ({ ...value, suburb: event.target.value })); setFieldErrors(value => ({ ...value, suburb: '' })); }} className={fieldClass(Boolean(fieldErrors.suburb))} autoComplete="address-level2" />
                        {fieldErrors.suburb ? <small>{fieldErrors.suburb}</small> : null}
                      </div>
                      <div className="field checkout-field">
                        <label htmlFor="shipping-state">State or territory</label>
                        <select id="shipping-state" required value={formData.state} onChange={event => { setFormData(value => ({ ...value, state: event.target.value })); setFieldErrors(value => ({ ...value, state: '', postcode: '' })); }} className={fieldClass(Boolean(fieldErrors.state))} autoComplete="address-level1">
                          {AU_STATES.map(state => <option key={state.value} value={state.value}>{state.label}</option>)}
                        </select>
                        {fieldErrors.state ? <small>{fieldErrors.state}</small> : null}
                      </div>
                      <div className="field checkout-field">
                        <label htmlFor="shipping-postcode">Postcode</label>
                        <input id="shipping-postcode" required inputMode="numeric" maxLength={4} value={formData.postcode} onChange={event => { const postcode = event.target.value.replace(/\D/g, '').slice(0, 4); setFormData(value => ({ ...value, postcode })); setFieldErrors(value => ({ ...value, postcode: '' })); }} className={fieldClass(Boolean(fieldErrors.postcode))} autoComplete="postal-code" />
                        {fieldErrors.postcode ? <small>{fieldErrors.postcode}</small> : null}
                      </div>
                    </div>

                    <div className="checkout-delivery">
                      <p className="checkout-label">Delivery speed</p>
                      <div className="checkout-methods">
                        {[
                          { method: 'standard' as const, icon: Package, title: 'Standard', days: '3-7 business days', cost: standardCost },
                          { method: 'express' as const, icon: Zap, title: 'Express', days: '1-3 business days', cost: expressCost },
                        ].map(option => (
                          <button key={option.method} type="button" className={`checkout-method ${shippingMethod === option.method ? 'is-active' : ''}`} onClick={() => setShippingMethod(option.method)} aria-pressed={shippingMethod === option.method}>
                            <option.icon size={20} />
                            <span><strong>{option.title}</strong><small>{option.days} via {shippingConfig.carrierName}</small></span>
                            <b>{option.cost === 0 ? 'Free' : `$${option.cost.toFixed(2)}`}</b>
                          </button>
                        ))}
                      </div>
                      <p className="checkout-caption">Order weight: {formatWeightLabel(totalWeightGrams)}{shippingBandLabel ? ` · ${shippingBandLabel}` : ''}</p>
                    </div>

                    <div className="checkout-actions">
                      <button type="button" className="button button--dark" onClick={() => goToStep('cart')}>Back</button>
                      <button type="submit" className="button button--primary">Continue to payment <ArrowRight size={16} /></button>
                    </div>
                  </form>
                ) : null}

                {step === 'payment' ? (
                  <form className="checkout-panel" onSubmit={handlePaymentSubmit}>
                    <div className="checkout-panel__head">
                      <h2 className="display">Payment.</h2>
                      <CreditCard size={23} color="var(--red)" />
                    </div>
                    <div className="checkout-security"><span><Lock size={15} /> SSL encrypted</span><span><ShieldCheck size={15} /> Secure gateway</span></div>
                    <div className="checkout-payment">
                      <div className="checkout-payment__head"><span>Credit or debit card</span><span>Square</span></div>
                      {squareError ? (
                        <div className="checkout-error"><AlertCircle size={17} /> {squareError}</div>
                      ) : (
                        <div className="checkout-square">
                          {!squareReady ? <div className="checkout-square__loading"><Loader2 className="animate-spin" size={22} /> Loading secure form</div> : null}
                          <div id="square-card-container" className="min-h-[88px]" />
                        </div>
                      )}
                    </div>
                    <div className="checkout-actions">
                      <button type="button" className="button button--dark" onClick={() => goToStep('shipping')} disabled={isProcessing}>Back</button>
                      <button type="submit" className="button button--primary" disabled={isProcessing || !squareReady || Boolean(squareError)}>
                        {isProcessing ? <><Loader2 className="animate-spin" size={17} /> Processing</> : !squareReady && !squareError ? <><Loader2 className="animate-spin" size={17} /> Loading</> : `Pay $${total.toFixed(2)}`}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              <aside className="checkout-summary">
                <h2 className="display">Summary.</h2>
                <div className="checkout-summary__items">
                  {cart.map(item => (
                    <div key={item.productId}><span>{item.quantity} x {item.name}</span><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>
                  ))}
                </div>

                <div className="checkout-progress">
                  <div><span>Free standard shipping</span><strong>{freeShippingUnlocked ? 'Unlocked' : `$${amountToFreeShipping.toFixed(2)} to go`}</strong></div>
                  <div className="checkout-progress__track"><span style={{ width: `${freeShippingProgressPercent}%` }} /></div>
                  <small>{formatWeightLabel(totalWeightGrams)}{shippingBandLabel ? ` · ${shippingBandLabel}` : ''}</small>
                </div>

                <div className="checkout-totals">
                  <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                  {settings.gstEnabled ? <div><span>GST {settings.gstRate}%</span><strong>${tax.toFixed(2)}</strong></div> : null}
                  <div><span>{summaryShippingLabel}</span><strong>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</strong></div>
                  <div className="checkout-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
                </div>

                {step === 'payment' ? <p className="checkout-destination">Shipping to {formData.suburb} {formData.state} {formData.postcode}</p> : null}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Cart;
