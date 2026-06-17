import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Flame, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBasket } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BrandedProductImage from '../components/brand/BrandedProductImage';
import NickLogo from '../components/brand/NickLogo';
import { calculateShippingCost, cloneShippingConfig, getFreeShippingProgress, getShippingTierDetails } from '../lib/shipping';

const sealMark = '/brand/pickle-nick-seal-made-to-bite-back.png';

const detailProofs = [
  { icon: PackageCheck, title: 'Small Batch', desc: 'Packed in short runs.' },
  { icon: Flame, title: 'Bold Heat', desc: 'Built for a proper bite.' },
  { icon: ShieldCheck, title: 'Nick Marked', desc: 'Stamped before it leaves.' },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, settings } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const product = products.find(item => item.id === id);
  const relatedProducts = products.filter(item => item.id !== id).slice(0, 3);

  useLayoutEffect(() => {
    if (!product) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled || !detailRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.from('[data-detail-reveal]', {
          y: 24,
          opacity: 0,
          duration: 0.72,
          stagger: 0.06,
          ease: 'power3.out',
        });

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.utils.toArray<HTMLElement>('[data-detail-card]').forEach(card => {
            gsap.from(card, {
              y: 28,
              opacity: 0,
              duration: 0.76,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                once: true,
              },
            });
          });
        }
      }, detailRef);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [id, product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#120d0b] px-5 pt-36 text-center text-[#f5f0e6]">
        <p className="font-tribal text-5xl font-semibold text-[#f5ecda]">Product not found</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="tribal-cta tribal-cta-primary mt-8 px-6 text-xs"
        >
          <span>Back to shop</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const shippingConfig = cloneShippingConfig(settings.shippingConfig);
  const previewSubtotal = product.price * qty;
  const previewWeightGrams = (product.weight || shippingConfig.defaultWeightGrams) * qty;
  const previewStandardShipping = calculateShippingCost({
    shippingConfig,
    totalWeightGrams: previewWeightGrams,
    subtotal: previewSubtotal,
    method: 'standard',
  });
  const previewTier = getShippingTierDetails(shippingConfig, previewWeightGrams);
  const {
    threshold: freeShippingThreshold,
    amountRemaining: freeShippingRemaining,
    unlocked: freeShippingUnlocked,
  } = getFreeShippingProgress(shippingConfig, previewSubtotal);

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div ref={detailRef} className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-10 pt-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(245,236,218,0.05),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(111,74,44,0.16),transparent_28%),linear-gradient(180deg,rgba(245,236,218,0.02),transparent_24%,rgba(0,0,0,0.16))]" />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute right-[-2rem] top-10 hidden w-56 lg:block"
        />

        <div className="relative mx-auto max-w-[88rem]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            data-detail-reveal
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#f5ecda]/10 bg-[#120d0b]/56 px-4 py-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#f5ecda]/74 transition hover:border-[#f5ecda]/24 hover:text-[#f5ecda]"
          >
            <ArrowLeft size={16} /> Back to shop
          </button>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)]">
            <div data-detail-reveal className="tribal-stage-panel relative overflow-hidden rounded-[2.8rem] border border-[#f5ecda]/12 bg-[#140d0a]/78 p-4 shadow-[0_34px_92px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-6">
              <div className="absolute right-6 top-6 z-20 rounded-full border border-[#f5ecda]/14 bg-[#120d0b]/66 px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b69273]">
                Nick Marked
              </div>
              <BrandedProductImage
                product={product}
                variant="detail"
                className="h-[24rem] rounded-[2rem] sm:h-[31rem]"
                forceBrandBackdrop
                lineOnly
                hideLabel
              />
            </div>

            <div data-detail-reveal className="rounded-[2.8rem] border border-[#f5ecda]/12 bg-[#0d0907]/84 p-6 shadow-[0_34px_92px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-8">
              <NickLogo size="sm" className="mb-6" />
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                {product.category || 'Small Batch'}
              </p>
              <h1 className="mt-3 font-tribal text-[3.2rem] font-semibold leading-[0.9] text-[#f5ecda] sm:text-[4.2rem]">
                {product.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <p className="font-sans text-2xl font-semibold text-[#f5ecda]">
                  ${product.price.toFixed(2)}
                </p>
                <span className={`rounded-full border px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  product.stock > 0
                    ? 'border-[#f5ecda]/12 bg-[#120d0b]/45 text-[#f5ecda]/74'
                    : 'border-[#9f3b2e]/35 bg-[#9f3b2e]/10 text-[#d57d6f]'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
                </span>
              </div>

              <p className="mt-6 max-w-xl font-sans text-lg font-medium leading-relaxed text-[#f5ecda]/72">
                {product.description}
              </p>

              <div className="batch-traits mt-6 flex flex-wrap gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f5ecda]/78">
                <span>Crunchy</span>
                <span>Bold Heat</span>
                <span>Small Batch</span>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-[#f5ecda]/10 bg-[#120d0b]/45 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                      Shipping Preview
                    </p>
                    <p className="mt-2 font-sans text-sm font-semibold text-[#f5ecda] sm:text-base">
                      {previewStandardShipping === 0
                        ? 'Free standard for this quantity'
                        : `Est. standard $${previewStandardShipping.toFixed(2)} for ${qty} jar${qty > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {previewTier.label && (
                    <div className="rounded-full border border-[#f5ecda]/12 bg-[#f5ecda]/5 px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5ecda]/74">
                      {previewTier.label}
                    </div>
                  )}
                </div>
                <p className="mt-3 font-sans text-sm font-medium leading-relaxed text-[#f5ecda]/62">
                  {freeShippingUnlocked
                    ? `Free standard unlocked over $${freeShippingThreshold.toFixed(0)}.`
                    : `Free standard over $${freeShippingThreshold.toFixed(0)}. Add $${freeShippingRemaining.toFixed(2)} more to unlock it.`}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center rounded-full border border-[#f5ecda]/12 bg-[#120d0b]/45">
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[#f5ecda] transition hover:bg-[#f5ecda]/8"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-14 text-center font-sans text-lg font-semibold text-[#f5ecda]">{qty}</span>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[#f5ecda] transition hover:bg-[#f5ecda]/8 disabled:cursor-not-allowed disabled:opacity-35"
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    disabled={qty >= product.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`tribal-cta px-6 text-xs ${
                    product.stock === 0
                      ? 'cursor-not-allowed border border-[#f5ecda]/10 bg-[#120d0b]/36 text-[#f5ecda]/28'
                      : added
                        ? 'tribal-cta-primary'
                        : 'tribal-cta-primary'
                  }`}
                >
                  {product.stock === 0 ? (
                    <span>Sold out</span>
                  ) : added ? (
                    <>
                      <Check size={16} />
                      <span>Added to basket</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBasket size={16} />
                      <span>Add to basket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div data-detail-reveal className="mt-6 pickle-paper paper-proof-strip relative overflow-hidden rounded-[2.55rem] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:px-8 lg:px-10">
            <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-left" />
            <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-right" />
            <div className="paper-grain" />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.82fr))] lg:items-start">
              <div className="pr-2">
                <NickLogo size="sm" className="mb-3" imageClassName="h-11 w-11" />
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                  Counter Notes
                </p>
                <h2 className="mt-2 font-tribal text-[2.2rem] font-semibold leading-[0.92] text-[#120d0b] sm:text-[2.7rem]">
                  Packed to bite back
                </h2>
                <p className="mt-2 max-w-md font-sans text-sm font-semibold leading-relaxed text-[#3d2a21]/80 sm:text-base">
                  The jar, the label, and the seal stay sharp from first look through to cart.
                </p>
              </div>

              {detailProofs.map(point => (
                <div key={point.title} className="paper-proof">
                  <point.icon className="mt-1 shrink-0 text-[#9f3b2e]" size={18} />
                  <div className="min-w-0">
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#120d0b]">
                      {point.title}
                    </p>
                    <p className="mt-1 font-sans text-sm font-medium leading-snug text-[#3d2a21]/80">
                      {point.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="batch-shell relative overflow-hidden bg-[#120c09] px-5 pb-20 pt-4 text-[#f5ecda] lg:px-8">
          <div className="relative mx-auto max-w-[88rem]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                  More from the batch
                </p>
                <h2 className="mt-2 font-tribal text-[2.6rem] font-semibold leading-[0.9] text-[#f5ecda]">
                  Keep the shelf moving
                </h2>
              </div>
              <Link
                to="/shop"
                className="tribal-link-chip inline-flex min-h-11 items-center justify-center gap-3 self-start rounded-full px-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#f5ecda]"
              >
                View all products <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map(item => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  data-detail-card
                  className="support-card group overflow-hidden rounded-[2rem] border border-[#f5ecda]/10 bg-[#17110e]/74 p-3 shadow-[0_20px_54px_rgba(0,0,0,0.28)] backdrop-blur-md transition"
                >
                  <div className="grid items-center gap-4 sm:grid-cols-[8.7rem_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[1.45rem]">
                      <BrandedProductImage
                        product={item}
                        className="h-[10.5rem] rounded-[1.45rem]"
                        imageClassName="group-hover:scale-105"
                        forceBrandBackdrop
                        lineOnly
                      />
                    </div>
                    <div className="support-card-copy px-1 py-1">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">
                        {item.category || 'Small Batch'}
                      </p>
                      <p className="support-card-name mt-2 font-tribal text-[2rem] font-semibold leading-[0.92] text-[#f5ecda]">
                        {item.name}
                      </p>
                      <p className="mt-2 font-sans text-sm font-semibold text-[#f5ecda]">
                        ${item.price.toFixed(2)}
                      </p>
                      <p className="mt-3 line-clamp-2 font-sans text-sm font-medium leading-relaxed text-[#f5ecda]/58">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
