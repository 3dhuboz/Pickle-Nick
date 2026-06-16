import React, { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronDown, Flame, Leaf, Menu, PackageCheck, ShieldCheck, ShoppingBasket, Sparkles, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';
import BrandedProductImage from '../components/brand/BrandedProductImage';

const BrineDepthScene = lazy(() => import('../components/visual/BrineDepthScene'));

const heroBackground = '/brand/pickle-nick-warrior-tattoo-hero-v2.png';

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
        className="tribal-poster-hero relative isolate min-h-[860px] overflow-hidden bg-[#050607] px-5 text-[#f5f0e6] sm:min-h-[820px] lg:min-h-[760px] xl:min-h-[760px] lg:px-8"
      >
        <img
          data-hero-bg
          src={heroBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full origin-center object-cover object-[64%_44%] opacity-72 sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,7,0.98)_0%,rgba(3,5,7,0.88)_35%,rgba(3,5,7,0.24)_64%,rgba(3,5,7,0.62)_100%),radial-gradient(circle_at_70%_28%,rgba(32,174,210,0.16),transparent_28%),radial-gradient(circle_at_22%_70%,rgba(188,75,53,0.16),transparent_30%)]" />
        <div className="poster-blueprint absolute inset-0" aria-hidden="true" />
        <div className="poster-tribal-band absolute inset-y-0 left-0 hidden w-32 lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,5,7,0.2),transparent_18%,transparent_76%,rgba(3,5,7,0.96))]" />

        <div data-depth-scene className="pointer-events-none absolute inset-0 z-10 opacity-45 mix-blend-screen">
          <Suspense fallback={null}>
            <BrineDepthScene />
          </Suspense>
        </div>

        <header className="relative z-30 mx-auto flex max-w-[88rem] items-center justify-between pt-7">
          <Link
            to="/"
            data-hero-brand
            className="flex items-center gap-4 rounded-full border border-[#f4c56d]/22 bg-[#050607]/54 py-2 pl-2 pr-6 shadow-[0_0_38px_rgba(32,174,210,0.08),0_18px_46px_rgba(0,0,0,0.42)] backdrop-blur-md"
            aria-label="Pickle Nick home"
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f1dfb8] p-1">
              <img
                src="/brand/pickle-nick-logo.jpg"
                alt="Pickle Nick logo"
                className="h-full w-full rounded-full object-cover"
              />
            </span>
            <span className="hidden sm:block">
              <span className="block font-sans text-xl font-black uppercase leading-none tracking-[0.08em] text-[#f5f0e6]">Pickle Nick</span>
              <span className="mt-1 block font-tribal text-[10px] font-bold uppercase tracking-[0.26em] text-[#27a9d8]">Made to bite back</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex lg:gap-11">
            {heroNavItems.map(item => (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className="poster-nav-link inline-flex items-center gap-2 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/72 transition hover:text-[#fff1c3]"
              >
                {item.label}
                {item.label === 'Shop' && <ChevronDown size={13} />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#f4c56d]/28 bg-[#050607]/64 text-[#f4c56d] backdrop-blur transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
              aria-label="Cart"
            >
              <ShoppingBasket size={19} />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-native-clay text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link
              to="/contact"
              className="hidden min-h-12 items-center justify-center rounded-full border border-[#27a9d8]/50 bg-[#050607]/42 px-7 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f5f0e6] backdrop-blur transition hover:bg-[#27a9d8] hover:text-[#031018] xl:inline-flex"
            >
              Talk to Nick
            </Link>
            <Link
              to="/shop"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4c56d]/28 bg-[#050607]/64 text-[#f4c56d] backdrop-blur transition hover:bg-[#f4c56d] hover:text-[#120d0b] md:hidden"
              aria-label="Open shop"
            >
              <Menu size={20} />
            </Link>
          </div>
        </header>

        <div className="relative z-40 mx-auto grid max-w-[88rem] gap-10 pb-48 pt-8 sm:pb-44 lg:grid-cols-[minmax(0,0.95fr)_minmax(28rem,0.78fr)] lg:items-center lg:pb-40 lg:pt-8">
          <div className="max-w-[53rem]">
            <h1 data-hero-copy className="poster-hero-title font-sans text-[4rem] font-black uppercase leading-[0.95] tracking-[0.05em] text-white sm:text-7xl lg:text-[5.4rem] xl:text-[6.15rem]">
              <span className="block">Pickle</span>
              <span className="block">Nick</span>
            </h1>
            <p data-hero-copy className="mt-4 max-w-2xl font-sans text-2xl font-light leading-tight text-[#f5f0e6]/94 sm:text-3xl">
              Small-batch pickles. Hot sauce. Brine with a bite.
            </p>
            <p data-hero-copy className="mt-4 max-w-xl font-sans text-base font-semibold leading-relaxed text-[#f5f0e6]/78 sm:text-lg">
              American tribal tattoo linework, clean poster geometry, and Nick's stamped mark on every jar. Rugged heat without the fake folklore.
            </p>

            <div data-hero-actions className="relative z-50 mt-5 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/shop"
                className="pickle-button pickle-button-primary group"
              >
                <span>Shop the batch</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="pickle-button pickle-button-secondary group"
              >
                <span>Talk to Nick</span>
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="poster-callouts relative z-40 mt-6 hidden max-w-3xl grid-cols-3 gap-3 sm:grid">
              <span>Small Batch</span>
              <span>Nick Marked</span>
              <span>Clean Heat</span>
            </div>
          </div>

          <div data-hero-plate className="poster-product-stage relative z-20 hidden min-h-[34rem] lg:block">
            <div className="poster-node poster-node-top">Nick Mark</div>
            <div className="poster-node poster-node-mid">Smoked Heat</div>
            <div className="poster-node poster-node-low">Crunch Point</div>
            <div className="poster-product-card absolute right-0 top-0 w-[28rem] overflow-hidden rounded-[2.4rem] bg-[#050607]/76 p-4 shadow-[0_42px_110px_rgba(0,0,0,0.62)] backdrop-blur-md xl:w-[32rem]">
              {featuredBatchProduct && (
                <BrandedProductImage
                  product={featuredBatchProduct}
                  variant="detail"
                  className="h-[31rem] rounded-[2rem]"
                  imageClassName="scale-105"
                  forceBrandBackdrop
                  lineOnly
                />
              )}
            </div>
          </div>
        </div>

        <div className="pickle-paper paper-proof-strip absolute inset-x-0 bottom-0 z-30 px-5 pb-6 pt-7 text-[#120d0b] sm:pb-6 sm:pt-6">
          <span className="paper-grain" aria-hidden="true" />
          <img
            src="/brand/pickle-nick-logo.jpg"
            alt=""
            aria-hidden="true"
            className="paper-brand-mark paper-brand-mark-left"
          />
          <img
            src="/brand/pickle-nick-logo.jpg"
            alt=""
            aria-hidden="true"
            className="paper-brand-mark paper-brand-mark-right"
          />
          <div className="mx-auto grid max-w-[86rem] gap-3 sm:gap-4 lg:grid-cols-[0.72fr_1.58fr] lg:items-center">
            <div>
              <p className="font-tribal text-[10px] font-bold uppercase tracking-[0.24em] text-native-clay sm:text-xs">
                Nick's Brine House
              </p>
              <p className="mt-1 font-display text-3xl leading-none sm:text-4xl">
                Made to bite back
              </p>
              <p className="mt-2 hidden max-w-md font-sans text-sm font-semibold leading-relaxed text-[#3d2a21]/78 sm:block">
                Old ways. Bold heat. Small-batch jars stamped with Nick's mark.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-tribal text-[9px] font-bold uppercase tracking-[0.14em] text-[#3d2a21]/70 sm:hidden">
                <span>Small batch</span>
                <span>Bold heat</span>
                <span>Nick marked</span>
              </div>
            </div>

            <div className="hidden grid-cols-3 gap-2 sm:grid sm:gap-3 lg:grid-cols-6">
              {proofPoints.map(point => (
                <div key={point.title} data-paper-proof className="paper-proof">
                  <point.icon className="shrink-0 text-native-clay" size={24} />
                  <div className="min-w-0">
                    <h3 className="font-tribal text-[9px] font-bold uppercase leading-snug tracking-[0.12em] text-[#120d0b] sm:text-[10px] md:text-xs">
                      {point.title}
                    </h3>
                    <p className="mt-1 hidden font-sans text-xs font-semibold leading-snug text-[#3d2a21]/74 md:block">
                      {point.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-batch-poster className="batch-showcase relative overflow-hidden bg-[#090605] px-5 pb-14 pt-8 text-[#f5f0e6] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(244,197,109,0.08),transparent_24%),radial-gradient(circle_at_16%_80%,rgba(188,75,53,0.11),transparent_26%),linear-gradient(135deg,rgba(244,197,109,0.07)_1px,transparent_1px),#090605] bg-[auto,auto,28px_28px,auto]" />
        <div className="batch-linework" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[86rem] gap-7 xl:grid-cols-[17.5rem_minmax(0,1fr)_27rem] xl:items-start">
          <div data-depth-card className="batch-intro pt-3">
            <div className="mb-5 h-20 w-20 rounded-full bg-[#f1ddb0] p-1 shadow-[0_0_0_1px_rgba(244,197,109,0.35),0_22px_38px_rgba(0,0,0,0.28)]">
              <img src="/brand/pickle-nick-logo.jpg" alt="Pickle Nick" className="h-full w-full rounded-full object-cover" />
            </div>
            <h2 className="batch-poster-title font-display text-[2.8rem] leading-[0.9] text-[#f4c56d] sm:text-[3rem] xl:text-[2.9rem]">
              <span className="block whitespace-nowrap">Shop The</span>
              <span className="block">Batch</span>
            </h2>
            <div className="batch-intro-line mt-4 h-px w-44" />
            <p className="mt-5 max-w-xs font-sans text-base font-semibold leading-relaxed text-[#f5f0e6]/72">
              Small-batch pickles and hot sauces that punch above their weight.
            </p>
            <Link
              to="/shop"
              className="batch-pill-link mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 font-tribal text-xs font-bold uppercase tracking-[0.2em] text-[#f4c56d] transition hover:text-[#fff1c3]"
            >
              View all products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="batch-product-grid grid grid-cols-2 gap-4 sm:grid-cols-4 xl:gap-5">
            {batchProducts.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                data-depth-card
                data-poster-card
                className="group batch-product-card relative overflow-hidden rounded-[1.85rem] bg-[#120c09]/58 p-2 text-[#f5f0e6] transition duration-500"
              >
                <div data-poster-media className="batch-product-media relative aspect-[4/5] overflow-hidden rounded-[1.45rem] bg-[#201611]/18">
                  <BrandedProductImage product={product} className="h-full w-full" imageClassName="group-hover:scale-110" forceBrandBackdrop lineOnly hideLabel />
                  {product.featured && (
                    <span className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-[#0a0705]/70 text-[#f4c56d] shadow-[0_0_22px_rgba(244,197,109,0.22)] backdrop-blur">
                      <Star fill="currentColor" size={18} />
                    </span>
                  )}
                </div>
                <div data-poster-copy className="batch-product-copy px-3 py-4">
                  <p className="batch-product-name font-display text-xl leading-none text-[#f4c56d] sm:text-2xl">
                    {product.name}
                  </p>
                  <p className="mt-2 font-tribal text-sm font-bold uppercase tracking-[0.16em] text-native-clay">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {featuredBatchProduct && (
            <aside data-depth-card className="batch-feature relative hidden overflow-hidden rounded-[2.25rem] bg-[#120c09]/62 p-3 lg:grid lg:grid-cols-[0.95fr_1fr] lg:gap-5 xl:grid-cols-1">
              <Link
                to={`/product/${featuredBatchProduct.id}`}
                className="group batch-feature-media relative block aspect-[4/3.8] overflow-hidden rounded-[1.8rem] bg-[#201611]/18 xl:aspect-[4/3]"
              >
                <BrandedProductImage product={featuredBatchProduct} className="h-full w-full" imageClassName="group-hover:scale-110" forceBrandBackdrop lineOnly />
              </Link>
              <div className="flex flex-col justify-center px-2 pb-2 xl:pt-2">
                <p className="font-display text-3xl leading-none text-[#f4c56d] xl:text-4xl">
                  {featuredBatchProduct.name}
                </p>
                <p className="mt-2 font-display text-2xl leading-none text-native-clay">
                  ${featuredBatchProduct.price.toFixed(2)}
                </p>
                <p className="mt-4 line-clamp-3 font-sans text-sm font-semibold leading-relaxed text-[#f5f0e6]/70">
                  {featuredBatchProduct.description}
                </p>
                <div className="batch-traits mt-5 flex flex-wrap gap-2 font-tribal text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4c56d]/78">
                  <span>Crunchy</span>
                  <span>Medium Heat</span>
                  <span>Small Batch</span>
                </div>
                <button
                  type="button"
                  data-add-featured-batch
                  onClick={() => addToCart(featuredBatchProduct, 1)}
                  className="batch-pill-link mt-5 inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 font-tribal text-xs font-bold uppercase tracking-[0.2em] text-native-clay transition hover:-translate-y-1 hover:text-[#ffcf78]"
                >
                  Add to cart <ArrowRight size={16} />
                </button>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section data-batch-notes-section className="relative overflow-hidden bg-[#120d0b] px-5 py-10 text-[#f5f0e6] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(188,75,53,0.16),transparent_31%),radial-gradient(circle_at_82%_22%,rgba(244,197,109,0.12),transparent_34%),linear-gradient(135deg,rgba(244,197,109,0.055)_1px,transparent_1px),#120d0b] bg-[auto,auto,30px_30px,auto]" />

        <div className="relative mx-auto max-w-7xl">
          <div data-depth-card className="grid overflow-hidden border border-[#f4c56d]/20 bg-[#080605] shadow-[0_32px_90px_rgba(0,0,0,0.38)] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative border-b border-[#f4c56d]/14 p-7 md:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-[#f4c56d]/10 opacity-40" />
              <NickLogo
                size="md"
                showName
                subtitle="Nick's batch desk"
                className="relative mb-7"
                labelClassName="text-3xl leading-none"
              />
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.3em] text-native-clay">
                Batch Notes
              </p>
              <h2 className="mt-4 max-w-xl font-display text-[2.55rem] leading-[0.92] text-[#f4c56d] sm:text-5xl md:text-[3.45rem]">
                Nick's mark, proper heat
              </h2>
              <p className="mt-6 max-w-xl font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/76">
                The range stays small: crunchy pickles, punchy sauces, and brine that earns the label before it leaves Nick's counter.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="pickle-button pickle-button-primary group"
                >
                  <span>Ask about stock</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/shop"
                  className="pickle-button pickle-button-secondary group"
                >
                  <span>Shop the batch</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="paper-panel relative bg-[#f1dfb8] p-7 text-[#120d0b] md:p-10 lg:p-12">
              <div className="absolute right-6 top-6 hidden font-display text-[8rem] leading-none text-[#120d0b]/[0.035] sm:block">
                PN
              </div>
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
                Tattoo Notes
              </p>
              <h3 className="mt-3 max-w-md font-display text-4xl leading-none sm:text-[2.9rem]">
                Made in small runs, not made to look polite
              </h3>

              <div className="mt-7 divide-y divide-[#120d0b]/14 border-y border-[#120d0b]/14">
                {[
                  { number: '01', title: 'Crunch', desc: 'Jars selected for snap, brine hold, and the first bite.' },
                  { number: '02', title: 'Heat', desc: 'Bright, smoky, sharp, or deep enough to leave a mark.' },
                  { number: '03', title: 'Mark', desc: "Nick's seal, old tattoo flash, and a small-batch finish." },
                ].map(item => (
                  <div key={item.number} data-depth-card className="grid gap-4 py-4 sm:grid-cols-[4.5rem_1fr] sm:items-start">
                    <span className="font-display text-4xl leading-none text-native-clay">{item.number}</span>
                    <div>
                      <h4 className="font-tribal text-sm font-bold uppercase tracking-[0.24em] text-[#120d0b]">{item.title}</h4>
                      <p className="mt-2 font-sans text-base font-semibold leading-relaxed text-[#3d2a21]/78">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="font-tribal text-xs font-bold uppercase tracking-[0.26em] text-[#120d0b]/55">
                  Made to bite back
                </p>
                <span className="border border-native-clay/35 px-4 py-2 font-display text-2xl leading-none text-native-clay">
                  Brine House
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
