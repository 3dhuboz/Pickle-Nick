import React, { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Hammer, Leaf, Menu, ShoppingBasket, Sparkles, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';
import BrandedProductImage from '../components/brand/BrandedProductImage';

const BrineDepthScene = lazy(() => import('../components/visual/BrineDepthScene'));

const heroBackground = '/brand/pickle-nick-warrior-tattoo-hero-v2.png';

const proofPoints = [
  { icon: Sparkles, title: 'Small Batch', desc: 'Handmade in tiny batches.' },
  { icon: Flame, title: 'Bold Flavours', desc: 'Big spice. Deep character.' },
  { icon: Leaf, title: 'Real Ingredients', desc: 'No fillers. No nonsense.' },
  { icon: Hammer, title: 'Custom Made', desc: 'You dream it. We pickle it.' },
];

const heroNavItems = [
  { to: '/shop', label: 'Shop' },
  { to: '/contact', label: 'Custom Jar' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

const Home = () => {
  const { products, cart } = useStore();
  const homeRef = useRef<HTMLDivElement | null>(null);
  const featuredProducts = products.filter(product => product.featured).slice(0, 4);
  const showcaseProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);
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
        className="relative isolate min-h-[100svh] overflow-hidden bg-[#070504] px-5 text-[#f5f0e6] lg:px-8"
      >
        <img
          data-hero-bg
          src={heroBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full origin-center object-cover object-[63%_50%] opacity-95 sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,5,4,0.98)_0%,rgba(7,5,4,0.86)_34%,rgba(7,5,4,0.24)_68%,rgba(7,5,4,0.5)_100%),radial-gradient(circle_at_68%_26%,rgba(244,197,109,0.12),transparent_28%),radial-gradient(circle_at_18%_68%,rgba(188,75,53,0.14),transparent_30%)]" />
        <div className="absolute inset-y-0 left-0 hidden w-28 bg-[linear-gradient(135deg,rgba(244,197,109,0.14)_1px,transparent_1px),linear-gradient(45deg,rgba(188,75,53,0.12)_1px,transparent_1px)] bg-[length:24px_24px] opacity-40 lg:block" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,5,4,0.28),transparent_18%,transparent_74%,rgba(7,5,4,0.9))]" />

        <div data-depth-scene className="pointer-events-none absolute inset-0 z-10 opacity-45 mix-blend-screen">
          <Suspense fallback={null}>
            <BrineDepthScene />
          </Suspense>
        </div>

        <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between pt-6">
          <NickLogo
            to="/"
            size="md"
            showName
            labelClassName="hidden text-2xl uppercase tracking-[0.18em] sm:block"
          />

          <nav className="hidden items-center gap-8 md:flex">
            {heroNavItems.map(item => (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className="font-tribal text-sm font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/74 transition hover:text-[#f4c56d]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#f4c56d]/28 bg-[#080605]/64 text-[#f4c56d] backdrop-blur transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
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
              to="/shop"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4c56d]/28 bg-[#080605]/64 text-[#f4c56d] backdrop-blur transition hover:bg-[#f4c56d] hover:text-[#120d0b] md:hidden"
              aria-label="Open shop"
            >
              <Menu size={20} />
            </Link>
          </div>
        </header>

        <div className="relative z-20 mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-7xl items-center pb-48 pt-10 sm:pb-44 lg:pb-48">
          <div className="max-w-[48rem]">
            <div data-hero-brand className="mb-5 inline-flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#f4c56d]/42 bg-[#080605] p-1 shadow-[0_18px_46px_rgba(0,0,0,0.58),0_0_0_5px_rgba(244,197,109,0.07)] sm:h-20 sm:w-20">
                <img
                  src="/brand/pickle-nick-seal-made-to-bite-back.png"
                  alt="Pickle Nick Made To Bite Back seal"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
              <span>
                <span className="block font-tribal text-xs font-bold uppercase tracking-[0.3em] text-native-clay">
                  Nick's Mark
                </span>
                <span className="mt-1 block font-tribal text-xs font-bold uppercase tracking-[0.24em] text-[#f4c56d]/66">
                  Tattoo brine house
                </span>
              </span>
            </div>

            <h1 data-hero-copy className="font-display text-[4rem] leading-[0.86] text-[#f4c56d] drop-shadow-[0_10px_30px_rgba(0,0,0,0.72)] sm:whitespace-nowrap sm:text-7xl lg:text-[7.2rem] xl:text-[8rem]">
              Pickle Nick
            </h1>
            <p data-hero-copy className="mt-3 font-display text-3xl leading-none text-native-clay drop-shadow-[0_8px_24px_rgba(0,0,0,0.72)] sm:text-4xl lg:text-5xl">
              Bold. Brined. Brilliant.
            </p>
            <p data-hero-copy className="mt-6 max-w-xl font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/82 sm:text-xl">
              Custom pickles, hot sauce, and small-batch brine with old tattoo flash, rugged heat, and Nick's mark on every jar.
            </p>

            <div data-hero-actions className="mt-7 flex flex-col gap-4 sm:flex-row">
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
                <span>Build a custom jar</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div
            data-hero-plate
            className="absolute bottom-36 right-0 hidden w-[18rem] rotate-[-2deg] border border-[#f4c56d]/28 bg-[#090605]/76 p-5 text-[#f5f0e6] shadow-[0_26px_70px_rgba(0,0,0,0.52)] backdrop-blur-md xl:block"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full border border-[#f4c56d]/35 bg-[#090605] p-1 shadow-[0_18px_38px_rgba(0,0,0,0.45)]">
              <img
                src="/brand/pickle-nick-seal-made-to-bite-back.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="pl-14">
              <p className="font-tribal text-[10px] font-bold uppercase tracking-[0.28em] text-native-clay">
                Custom Heat
              </p>
              <p className="mt-2 font-display text-3xl leading-none text-[#f4c56d]">
                Nick-marked jars
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#f4c56d]/16 pt-4 font-tribal text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5f0e6]/62">
              <span>Small batch</span>
              <span className="text-right">Tattoo heat</span>
              <span>Brass seal</span>
              <span className="text-right">Bold crunch</span>
            </div>
          </div>
        </div>

        <div className="pickle-paper absolute inset-x-0 bottom-0 z-30 px-5 pb-4 pt-7 text-[#120d0b] sm:pb-5 sm:pt-8">
          <div className="mx-auto grid max-w-7xl gap-3 sm:gap-4 lg:grid-cols-[0.85fr_1.35fr] lg:items-center">
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

            <div className="hidden grid-cols-4 gap-2 sm:grid sm:gap-3">
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

      <section className="paper-section bg-[#f1dfb8] px-5 pb-10 pt-20 text-[#120d0b] lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-8 border-b border-[#120d0b]/15 pb-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div data-depth-card>
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
                Live Batch
              </p>
              <h2 className="mt-3 font-display text-[2.7rem] leading-[0.95] sm:text-5xl md:text-6xl">
                Custom jars from Nick's counter
              </h2>
            </div>
            <div data-depth-card className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-2xl font-sans text-lg font-medium leading-relaxed text-[#3d2a21]">
                Hand-picked jars, hot sauces, and custom batch requests stay ready for the next feast.
              </p>
              <Link
                to="/shop"
                className="pickle-button pickle-button-ink group self-start md:self-auto"
              >
                <span>View all jars</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {proofPoints.map(point => (
              <div key={point.title} data-depth-card className="border-t border-[#120d0b]/20 pt-5">
                <point.icon className="mb-4 text-native-clay" size={32} />
                <h3 className="font-tribal text-sm font-bold uppercase tracking-[0.18em] text-[#120d0b]">{point.title}</h3>
                <p className="mt-3 font-sans text-sm font-medium leading-relaxed text-[#4e342e]/85">{point.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {showcaseProducts.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                data-depth-card
                className="group overflow-hidden border border-[#120d0b]/15 bg-[#120d0b] text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)] transition hover:-translate-y-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#201611]">
                  <BrandedProductImage product={product} className="h-full w-full" imageClassName="group-hover:scale-110" forceBrandBackdrop />
                  <div className="absolute right-4 top-4 z-30 bg-[#f1dfb8] px-4 py-1 font-display text-xl text-[#120d0b] shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.featured && (
                    <Star className="absolute right-4 top-16 z-30 text-[#f4c56d] drop-shadow" fill="currentColor" size={26} />
                  )}
                </div>
                <div className="border-t border-[#f4c56d]/18 p-6">
                  <p className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/75">{product.category}</p>
                  <h3 className="mt-3 font-display text-2xl leading-none text-[#f4c56d] sm:text-3xl">{product.name}</h3>
                  <p className="mt-4 line-clamp-3 font-sans text-sm font-medium leading-relaxed text-[#f5f0e6]/72">{product.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-tribal text-sm font-bold uppercase tracking-[0.18em] text-native-clay">
                    Open Jar <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-custom-brief-section className="relative overflow-hidden bg-[#120d0b] px-5 py-10 text-[#f5f0e6] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(188,75,53,0.16),transparent_31%),radial-gradient(circle_at_82%_22%,rgba(244,197,109,0.12),transparent_34%),linear-gradient(135deg,rgba(244,197,109,0.055)_1px,transparent_1px),#120d0b] bg-[auto,auto,30px_30px,auto]" />

        <div className="relative mx-auto max-w-7xl">
          <div data-depth-card className="grid overflow-hidden border border-[#f4c56d]/20 bg-[#080605] shadow-[0_32px_90px_rgba(0,0,0,0.38)] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative border-b border-[#f4c56d]/14 p-7 md:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-[#f4c56d]/10 opacity-40" />
              <NickLogo
                size="md"
                showName
                subtitle="Warrior batch desk"
                className="relative mb-7"
                labelClassName="text-3xl leading-none"
              />
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.3em] text-native-clay">
                Warrior Batch Brief
              </p>
              <h2 className="mt-4 max-w-xl font-display text-[2.55rem] leading-[0.92] text-[#f4c56d] sm:text-5xl md:text-[3.45rem]">
                Nick's mark, your heat
              </h2>
              <p className="mt-6 max-w-xl font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/76">
                Pick the crunch, choose the burn, and give Nick enough flavour direction to make the batch feel personal.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="pickle-button pickle-button-primary group"
                >
                  <span>Start a brief</span>
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
                Made to order, not made to look polite
              </h3>

              <div className="mt-7 divide-y divide-[#120d0b]/14 border-y border-[#120d0b]/14">
                {[
                  { number: '01', title: 'Crunch', desc: 'Pickle, chilli, mango, mixed veg, or a stranger idea from the pantry.' },
                  { number: '02', title: 'Heat', desc: 'Bright, smoky, savage, sweet, or somewhere in the middle.' },
                  { number: '03', title: 'Mark', desc: 'Nick-branded label direction and small-batch finish made for the occasion.' },
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
