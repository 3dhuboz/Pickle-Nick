import React, { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronDown, Flame, Leaf, Menu, PackageCheck, ShieldCheck, ShoppingBasket, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';
import BrandedProductImage from '../components/brand/BrandedProductImage';

const BrineDepthScene = lazy(() => import('../components/visual/BrineDepthScene'));

const heroBackground = '/brand/pickle-nick-warrior-tattoo-hero-v2.png';
const sealMark = '/brand/pickle-nick-seal-made-to-bite-back.png';

const proofPoints = [
  { icon: PackageCheck, title: 'Small Batch', desc: 'Handmade in tiny batches.' },
  { icon: Flame, title: 'Bold Flavours', desc: 'Big spice. Deep character.' },
  { icon: Leaf, title: 'Real Ingredients', desc: 'No fillers. No nonsense.' },
  { icon: ShieldCheck, title: 'Nick Marked', desc: 'Stamped and sealed.' },
  { icon: Sparkles, title: 'Made To Bite Back', desc: 'Old ways. New fire.' },
  { icon: BadgeCheck, title: 'Hand Packed', desc: 'Small runs only.' },
];

const heroNavItems = [
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

const Home = () => {
  const { products, cart, addToCart } = useStore();
  const homeRef = useRef<HTMLDivElement | null>(null);
  const featuredProducts = products.filter(product => product.featured).slice(0, 4);
  const showcaseProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);
  const batchProducts = showcaseProducts.slice(0, 4);
  const featuredBatchProduct = showcaseProducts[0] || products[0];
  const supportingBatchProducts = batchProducts.filter(product => product.id !== featuredBatchProduct?.id).slice(0, 3);
  const heroProofPoints = proofPoints.slice(0, 4);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useLayoutEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled || !homeRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      let mm: ReturnType<typeof gsap.matchMedia> | undefined;
      const ctx = gsap.context(() => {
        mm = gsap.matchMedia();

        gsap.set('[data-hero-brand], [data-hero-copy], [data-hero-actions], [data-paper-proof], [data-hero-plate]', {
          y: 24,
          opacity: 0,
        });
        gsap.set('[data-hero-bg]', { scale: 1.035 });

        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .to('[data-hero-brand]', { y: 0, opacity: 1, duration: 0.78 })
          .to('[data-hero-copy]', { y: 0, opacity: 1, duration: 0.82 }, '-=0.52')
          .to('[data-hero-actions]', { y: 0, opacity: 1, duration: 0.72 }, '-=0.46')
          .to('[data-paper-proof]', { y: 0, opacity: 1, duration: 0.72, stagger: 0.06 }, '-=0.52')
          .to('[data-hero-plate]', { y: 0, opacity: 1, duration: 0.78 }, '-=0.74');

        mm.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.to('[data-hero-bg]', {
            scale: 1.08,
            yPercent: -2.2,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-hero-section]',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });

          gsap.to('[data-hero-plate]', {
            yPercent: -8,
            rotate: 1.4,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-hero-section]',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });

          gsap.to('[data-depth-scene]', {
            yPercent: 4,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-hero-section]',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });

          gsap.utils.toArray<HTMLElement>('[data-depth-card]').forEach((card, index) => {
            gsap.from(card, {
              y: 42,
              opacity: 0,
              rotateX: index % 2 === 0 ? 2 : -2,
              duration: 0.82,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 86%',
                once: true,
              },
            });
          });

          gsap.utils.toArray<HTMLElement>('[data-method-row]').forEach((row, index) => {
            gsap.from(row, {
              x: index % 2 === 0 ? -24 : 24,
              opacity: 0,
              duration: 0.78,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: row,
                start: 'top 90%',
                once: true,
              },
            });
          });

          const posterCleanups: Array<() => void> = [];

          gsap.utils.toArray<HTMLElement>('[data-poster-card]').forEach((card, index) => {
            const media = card.querySelector<HTMLElement>('[data-poster-media]');
            const copy = card.querySelector<HTMLElement>('[data-poster-copy]');

            gsap.from(card, {
              y: 34,
              opacity: 0,
              rotate: index % 2 === 0 ? -0.6 : 0.6,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                once: true,
              },
            });

            const handlePointerMove = (event: PointerEvent) => {
              const bounds = card.getBoundingClientRect();
              const x = (event.clientX - bounds.left) / bounds.width - 0.5;
              const y = (event.clientY - bounds.top) / bounds.height - 0.5;

              gsap.to(card, {
                rotateX: y * -3,
                rotateY: x * 4,
                y: -8,
                duration: 0.45,
                ease: 'power3.out',
                overwrite: true,
              });
              gsap.to(media, {
                x: x * 7,
                y: y * 5,
                duration: 0.55,
                ease: 'power3.out',
                overwrite: true,
              });
              gsap.to(copy, {
                x: x * -3,
                duration: 0.55,
                ease: 'power3.out',
                overwrite: true,
              });
            };

            const handlePointerLeave = () => {
              gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                y: 0,
                duration: 0.65,
                ease: 'elastic.out(1, 0.6)',
                overwrite: true,
              });
              gsap.to([media, copy], {
                x: 0,
                y: 0,
                duration: 0.58,
                ease: 'power3.out',
                overwrite: true,
              });
            };

            card.addEventListener('pointermove', handlePointerMove);
            card.addEventListener('pointerleave', handlePointerLeave);
            posterCleanups.push(() => {
              card.removeEventListener('pointermove', handlePointerMove);
              card.removeEventListener('pointerleave', handlePointerLeave);
            });
          });

          return () => {
            posterCleanups.forEach(cleanupPosterCard => cleanupPosterCard());
          };
        });
      }, homeRef);

      cleanup = () => {
        mm?.revert();
        ctx.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={homeRef} className="overflow-hidden bg-[#120d0b] text-[#f5f0e6]">
      <section
        data-hero-section
        className="tribal-shell relative isolate overflow-hidden bg-[#0e0907] px-5 pb-6 pt-5 text-[#f5ecda] lg:px-8"
      >
        <img
          data-hero-bg
          src={heroBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full origin-center object-cover object-[68%_44%] opacity-78 sm:object-[70%_42%]"
        />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute right-[5%] top-20 hidden w-[17rem] lg:block"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,9,7,0.96)_0%,rgba(14,9,7,0.88)_36%,rgba(14,9,7,0.48)_58%,rgba(14,9,7,0.7)_100%),radial-gradient(circle_at_20%_18%,rgba(245,236,218,0.08),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(111,74,44,0.12),transparent_24%)]" />
        <div className="tribal-contours absolute inset-0" aria-hidden="true" />
        <div className="tribal-side-etch absolute inset-y-0 left-0 hidden w-24 lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(14,9,7,0.16),transparent_18%,transparent_78%,rgba(14,9,7,0.9))]" />

        <div data-depth-scene className="pointer-events-none absolute inset-0 z-10 opacity-34 mix-blend-screen">
          <Suspense fallback={null}>
            <BrineDepthScene />
          </Suspense>
        </div>

        <header className="relative z-30 mx-auto max-w-[88rem]">
          <div className="tribal-toprail flex items-center justify-between gap-4 rounded-[2rem] border border-[#f5ecda]/12 bg-[#120c09]/64 px-4 py-3 shadow-[0_22px_54px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <Link
              to="/"
              data-hero-brand
              className="flex items-center gap-3"
              aria-label="Pickle Nick home"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#f5ecda]/28 bg-[#efe1bf] p-1 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                <img
                  src={sealMark}
                  alt="Pickle Nick logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block font-tribal text-2xl font-semibold leading-none text-[#f5ecda]">Pickle Nick</span>
                <span className="mt-1 block font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">Made to bite back</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {heroNavItems.map(item => (
                <Link
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  className="tribal-nav-link inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-[#f5ecda]/68 transition hover:text-[#f5ecda]"
                >
                  {item.label}
                  {item.label === 'Shop' && <ChevronDown size={13} />}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/cart"
                className="tribal-icon-button relative flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="Cart"
              >
                <ShoppingBasket size={18} />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#9f3b2e] text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <Link
                to="/contact"
                className="tribal-contact hidden min-h-11 items-center justify-center rounded-full px-6 font-sans text-xs font-semibold uppercase tracking-[0.18em] xl:inline-flex"
              >
                Talk to Nick
              </Link>
              <Link
                to="/shop"
                className="tribal-icon-button flex h-11 w-11 items-center justify-center rounded-full md:hidden"
                aria-label="Open shop"
              >
                <Menu size={19} />
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-20 mx-auto grid max-w-[88rem] gap-8 pb-4 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,29rem)] lg:items-center lg:gap-10 lg:pb-4">
          <div className="max-w-[35rem]">
            <h1 data-hero-copy className="tribal-hero-title font-tribal text-[4.2rem] font-semibold leading-[0.84] text-[#f5ecda] sm:text-[5.2rem] lg:text-[6.4rem]">
              <span className="block">Pickle</span>
              <span className="block">Nick</span>
            </h1>
            <p data-hero-copy className="mt-4 font-display text-[2rem] leading-none text-[#9f3b2e] drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)] sm:text-[2.45rem]">
              Bold. Brined. Brilliant.
            </p>
            <p data-hero-copy className="mt-5 max-w-2xl font-sans text-[1.58rem] font-semibold leading-tight text-[#f5ecda] sm:text-[1.9rem]">
              Small-batch pickles, hot sauce, and brine with bite.
            </p>
            <p data-hero-copy className="mt-4 max-w-xl font-sans text-base font-medium leading-relaxed text-[#f5ecda]/70 sm:text-lg">
              Clean lines, dark leather depth, stamped seals, and tattoo-flash restraint built around Nick&apos;s mark.
            </p>

            <div data-hero-actions className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/shop"
                className="tribal-cta tribal-cta-primary group"
              >
                <span>Shop the batch</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="tribal-cta tribal-cta-secondary group"
              >
                <span>Talk to Nick</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div data-hero-plate className="tribal-stage relative hidden min-h-[30rem] lg:block">
            {featuredBatchProduct && (
              <div className="tribal-stage-panel relative overflow-hidden rounded-[2.35rem] border border-[#f5ecda]/12 bg-[#140d0a]/76 p-4 shadow-[0_36px_90px_rgba(0,0,0,0.46)] backdrop-blur-md">
                <div className="tribal-stage-mark absolute right-4 top-4 rounded-full border border-[#f5ecda]/14 bg-[#140d0a]/72 px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b69273]">
                  Nick Marked
                </div>
                <BrandedProductImage
                  product={featuredBatchProduct}
                  variant="detail"
                  className="h-[22rem] rounded-[1.8rem]"
                  imageClassName="scale-105"
                  forceBrandBackdrop
                  lineOnly
                  hideLabel
                />
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                      Featured Batch
                    </p>
                    <p className="mt-2 font-tribal text-3xl font-semibold leading-none text-[#f5ecda]">
                      {featuredBatchProduct.name}
                    </p>
                  </div>
                  <p className="font-sans text-lg font-semibold text-[#f5ecda]">
                    ${featuredBatchProduct.price.toFixed(2)}
                  </p>
                </div>
                <p className="mt-3 max-w-md font-sans text-sm font-medium leading-relaxed text-[#f5ecda]/66">
                  {featuredBatchProduct.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-30 mx-auto -mt-3 max-w-[88rem] lg:-mt-8">
          <div className="paper-proof-strip pickle-paper relative overflow-hidden rounded-[2.5rem] px-6 py-6 sm:px-8 lg:px-10">
            <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-left" />
            <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-right" />
            <div className="paper-grain" />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_repeat(4,minmax(0,0.82fr))] lg:items-start">
              <div className="pr-2">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                  Nick Marked
                </p>
                <h2 className="mt-2 font-tribal text-[2.25rem] font-semibold leading-[0.92] text-[#120d0b] sm:text-[2.75rem]">
                  Made to bite back
                </h2>
                <p className="mt-2 max-w-md font-sans text-sm font-semibold leading-relaxed text-[#3d2a21]/80 sm:text-base">
                  Old ways. Bold heat. Small runs stamped with Nick&apos;s seal.
                </p>
              </div>
              {heroProofPoints.map(point => (
                <div key={point.title} data-paper-proof className="paper-proof">
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

      <section data-batch-poster className="batch-shell relative overflow-hidden bg-[#120c09] px-5 pb-16 pt-12 text-[#f5ecda] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(245,236,218,0.05),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(111,74,44,0.12),transparent_26%),linear-gradient(180deg,rgba(245,236,218,0.02),transparent_22%,transparent_78%,rgba(0,0,0,0.16))]" />
        <div className="batch-shell-lines absolute inset-0" aria-hidden="true" />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute bottom-8 right-[-2rem] hidden w-48 lg:block"
        />
        <div className="relative mx-auto max-w-[88rem]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                  The Batch
                </p>
                <img
                  src={sealMark}
                  alt=""
                  aria-hidden="true"
                  className="hidden h-10 w-10 rounded-full border border-[#f5ecda]/10 bg-[#140d0a]/60 p-1 opacity-80 lg:block"
                />
              </div>
              <h2 className="mt-3 font-tribal text-[3rem] font-semibold leading-[0.9] text-[#f5ecda] sm:text-[3.6rem]">
                Clean heat, small runs
              </h2>
              <p className="mt-4 max-w-xl font-sans text-base font-medium leading-relaxed text-[#f5ecda]/66 sm:text-lg">
                One featured batch in front, supporting jars behind it, and a cleaner shelf cut from the same poster world as the hero.
              </p>
            </div>
            <Link
              to="/shop"
              className="tribal-link-chip inline-flex min-h-11 items-center justify-center gap-3 self-start rounded-full px-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#f5ecda]"
            >
              View all products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            {featuredBatchProduct && (
              <article data-depth-card className="batch-feature-shell overflow-hidden rounded-[2.3rem] border border-[#f5ecda]/12 bg-[#16100d]/78 p-4 shadow-[0_28px_72px_rgba(0,0,0,0.34)] backdrop-blur-md">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
                  <Link
                    to={`/product/${featuredBatchProduct.id}`}
                    className="group relative block overflow-hidden rounded-[1.8rem]"
                  >
                    <BrandedProductImage
                      product={featuredBatchProduct}
                      variant="detail"
                      className="h-[23rem] rounded-[1.8rem]"
                      imageClassName="group-hover:scale-105"
                      forceBrandBackdrop
                      lineOnly
                      hideLabel
                    />
                  </Link>
                  <div className="px-2 pb-2 lg:px-0">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                      Featured Batch
                    </p>
                    <h3 className="mt-3 font-tribal text-[2.65rem] font-semibold leading-[0.92] text-[#f5ecda]">
                      {featuredBatchProduct.name}
                    </h3>
                    <p className="mt-3 font-sans text-lg font-semibold text-[#f5ecda]">
                      ${featuredBatchProduct.price.toFixed(2)}
                    </p>
                    <p className="mt-4 max-w-lg font-sans text-base font-medium leading-relaxed text-[#f5ecda]/64">
                      {featuredBatchProduct.description}
                    </p>
                    <div className="batch-traits mt-5 flex flex-wrap gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f5ecda]/78">
                      <span>Crunchy</span>
                      <span>Medium Heat</span>
                      <span>Small Batch</span>
                    </div>
                    <button
                      type="button"
                      data-add-featured-batch
                      onClick={() => addToCart(featuredBatchProduct, 1)}
                      className="tribal-cta tribal-cta-primary mt-6 min-h-11 px-6 text-xs"
                    >
                      <span>Add to cart</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            )}

            <div className="grid gap-4">
              {supportingBatchProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  data-depth-card
                  data-poster-card
                  className="support-card group overflow-hidden rounded-[2rem] border border-[#f5ecda]/10 bg-[#17110e]/72 p-3 shadow-[0_20px_54px_rgba(0,0,0,0.28)] backdrop-blur-md transition"
                >
                  <div className="grid items-center gap-4 sm:grid-cols-[8.7rem_minmax(0,1fr)]">
                    <div data-poster-media className="overflow-hidden rounded-[1.45rem]">
                      <BrandedProductImage
                        product={product}
                        className="h-[10.5rem] rounded-[1.45rem]"
                        imageClassName="group-hover:scale-105"
                        forceBrandBackdrop
                        lineOnly
                        hideLabel
                      />
                    </div>
                    <div data-poster-copy className="support-card-copy px-1 py-1">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">
                        {product.category || 'Small Batch'}
                      </p>
                      <p className="support-card-name mt-2 font-tribal text-[2rem] font-semibold leading-[0.92] text-[#f5ecda]">
                        {product.name}
                      </p>
                      <p className="mt-2 font-sans text-sm font-semibold text-[#f5ecda]">
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="mt-3 line-clamp-2 max-w-md font-sans text-sm font-medium leading-relaxed text-[#f5ecda]/58">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-batch-notes-section className="relative overflow-hidden bg-[#120d0b] px-5 pb-20 pt-8 text-[#f5f0e6] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(245,236,218,0.04),transparent_26%),radial-gradient(circle_at_84%_16%,rgba(111,74,44,0.12),transparent_30%),linear-gradient(180deg,rgba(245,236,218,0.02),transparent_22%,transparent_78%,rgba(0,0,0,0.18))]" />

        <div className="relative mx-auto max-w-[88rem] overflow-hidden rounded-[2.8rem] border border-[#f5ecda]/12 bg-[linear-gradient(135deg,rgba(18,13,11,0.96),rgba(10,7,5,0.92))] shadow-[0_34px_96px_rgba(0,0,0,0.38)]">
          <img
            src={sealMark}
            alt=""
            aria-hidden="true"
            className="tribal-seal-watermark tribal-seal-watermark--ink absolute left-[-3rem] top-8 hidden w-40 lg:block"
          />
          <img
            src={sealMark}
            alt=""
            aria-hidden="true"
            className="tribal-seal-watermark tribal-seal-watermark--paper absolute bottom-6 right-[-2.5rem] hidden w-44 lg:block"
          />

          <div data-depth-card className="grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <NickLogo
                size="md"
                showName
                subtitle="Made to bite back"
                className="relative mb-6"
                labelClassName="text-3xl leading-none"
              />
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                Nick Marked
              </p>
              <h2 className="mt-3 max-w-xl font-tribal text-[3rem] font-semibold leading-[0.9] text-[#f5ecda] sm:text-[3.45rem]">
                Stamped in small runs
              </h2>
              <p className="mt-5 max-w-xl font-sans text-base font-medium leading-relaxed text-[#f5ecda]/68 sm:text-lg">
                The seal, the label, and the batch stay front and center. Cleaner lines. Better depth. No filler props, just jars with presence.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/about"
                  className="tribal-cta tribal-cta-secondary min-h-11 px-6 text-xs"
                >
                  <span>Our story</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/contact"
                  className="tribal-link-chip inline-flex min-h-11 items-center justify-center gap-3 rounded-full px-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#f5ecda]"
                >
                  Talk to Nick <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(235,219,185,0.98),rgba(223,202,160,0.92))] px-6 py-8 text-[#18110d] sm:px-8 lg:px-10 lg:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,255,255,0.52),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(159,59,46,0.12),transparent_22%),repeating-linear-gradient(102deg,rgba(82,47,23,0.05)_0_1px,transparent_1px_12px),repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_14px)] opacity-80" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <img
                    src={sealMark}
                    alt=""
                    aria-hidden="true"
                    className="h-14 w-14 rounded-full border border-[#120d0b]/10 bg-[#f5ecda]/58 p-1 shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
                  />
                  <div>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                      Seal Notes
                    </p>
                    <p className="mt-1 font-tribal text-3xl font-semibold leading-none text-[#120d0b]">
                      Nick&apos;s mark, proper finish
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {[
                    { number: '01', kicker: 'Crunch', title: 'Snap first', desc: 'Jars are chosen for bite, hold, and the kind of crunch that lands before the heat does.' },
                    { number: '02', kicker: 'Heat', title: 'Burn clean', desc: 'Bright, smoky, sharp, or deep enough to leave a mark, but always easy to read at first glance.' },
                    { number: '03', kicker: 'Seal', title: 'Stamp it', desc: "Nick's seal keeps showing up across the page so the brand feels authored, not decorated after the fact." },
                  ].map(item => (
                    <div key={item.number} data-method-row className="tribal-method-row">
                      <span className="tribal-method-index">{item.number}</span>
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                          {item.kicker}
                        </p>
                        <h3 className="mt-1 font-tribal text-[1.8rem] font-semibold leading-[0.94] text-[#120d0b] sm:text-[2rem]">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-xl font-sans text-base font-medium leading-relaxed text-[#3d2a21]/82">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
