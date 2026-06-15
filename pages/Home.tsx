import React, { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Hammer, Leaf, Sparkles, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const BrineDepthScene = lazy(() => import('../components/visual/BrineDepthScene'));

const heroMock = '/design/pickle-nick-hero-mock.png';

const heroStageStyle: React.CSSProperties = {
  width: 'max(100vw, 143.786svh)',
  height: 'max(100svh, 69.548vw)',
};

const proofPoints = [
  { icon: Sparkles, title: 'Small Batch', desc: 'Handmade in tiny batches.' },
  { icon: Flame, title: 'Bold Flavours', desc: 'Big spice. Deep character.' },
  { icon: Leaf, title: 'Real Ingredients', desc: 'No fillers. No nonsense.' },
  { icon: Hammer, title: 'Custom Made', desc: 'You dream it. We pickle it.' },
];

const desktopHotspot =
  'absolute z-30 rounded-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#f4c56d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120d0b]';

const Home = () => {
  const { products } = useStore();
  const homeRef = useRef<HTMLDivElement | null>(null);
  const featuredProducts = products.filter(product => product.featured).slice(0, 4);
  const showcaseProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);

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

        gsap.set('[data-mock-stage]', { y: 18, opacity: 0, scale: 0.986 });

        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .to('[data-mock-stage]', { y: 0, opacity: 1, scale: 1, duration: 0.92 });

        mm.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.to('[data-mock-image]', {
            scale: 1.018,
            yPercent: -1.2,
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
        className="relative isolate h-[100svh] overflow-hidden bg-[#070504]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_22%,rgba(244,197,109,0.16),transparent_34%),radial-gradient(circle_at_18%_64%,rgba(188,75,53,0.12),transparent_30%),#070504]" />

        <div className="absolute inset-0 hidden items-start justify-center sm:flex">
          <div data-mock-stage className="relative shrink-0 overflow-hidden" style={heroStageStyle}>
            <img
              data-mock-image
              src={heroMock}
              alt="Pickle Nick achar house hero with custom pickle jars and tattoo flash styling"
              className="absolute inset-0 h-full w-full origin-center object-cover"
            />
            <div data-depth-scene className="pointer-events-none absolute inset-0 z-20 opacity-55 mix-blend-screen">
              <Suspense fallback={null}>
                <BrineDepthScene />
              </Suspense>
            </div>

            <h1 className="sr-only">Pickle Nick custom pickles, hot sauce, and small-batch brine.</h1>

            <Link to="/shop" aria-label="Shop" className={`${desktopHotspot} left-[63.6%] top-[4.2%] h-[4.4%] w-[4.7%]`} />
            <Link to="/contact" aria-label="Custom Jar" className={`${desktopHotspot} left-[68.7%] top-[4.2%] h-[4.4%] w-[8.1%]`} />
            <Link to="/about" aria-label="Our Story" className={`${desktopHotspot} left-[77.3%] top-[4.2%] h-[4.4%] w-[7.4%]`} />
            <Link to="/contact" aria-label="Contact" className={`${desktopHotspot} left-[85.4%] top-[4.2%] h-[4.4%] w-[6.2%]`} />
            <Link to="/cart" aria-label="Cart" className={`${desktopHotspot} left-[90.7%] top-[3.6%] h-[5.6%] w-[3.8%]`} />
            <Link to="/shop" aria-label="Open menu" className={`${desktopHotspot} left-[94.5%] top-[3.6%] h-[5.6%] w-[3.8%]`} />
            <Link to="/shop" aria-label="Shop the batch" className={`${desktopHotspot} left-[9.8%] top-[49.2%] h-[5.8%] w-[18.8%]`} />
            <Link to="/contact" aria-label="Build a custom jar" className={`${desktopHotspot} left-[9.8%] top-[56.6%] h-[5.8%] w-[18.8%]`} />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-start overflow-hidden sm:hidden">
          <div data-mock-stage className="relative shrink-0 overflow-hidden" style={heroStageStyle}>
            <img
              data-mock-image
              src={heroMock}
              alt="Pickle Nick achar house hero with custom pickle jars and tattoo flash styling"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div data-depth-scene className="pointer-events-none absolute inset-0 opacity-45 mix-blend-screen">
              <Suspense fallback={null}>
                <BrineDepthScene />
              </Suspense>
            </div>
            <h1 className="sr-only">Pickle Nick custom pickles, hot sauce, and small-batch brine.</h1>
            <Link to="/shop" aria-label="Shop" className={`${desktopHotspot} left-[63.6%] top-[4.2%] h-[4.4%] w-[4.7%]`} />
            <Link to="/contact" aria-label="Custom Jar" className={`${desktopHotspot} left-[68.7%] top-[4.2%] h-[4.4%] w-[8.1%]`} />
            <Link to="/about" aria-label="Our Story" className={`${desktopHotspot} left-[77.3%] top-[4.2%] h-[4.4%] w-[7.4%]`} />
            <Link to="/contact" aria-label="Contact" className={`${desktopHotspot} left-[85.4%] top-[4.2%] h-[4.4%] w-[6.2%]`} />
            <Link to="/cart" aria-label="Cart" className={`${desktopHotspot} left-[90.7%] top-[3.6%] h-[5.6%] w-[3.8%]`} />
            <Link to="/shop" aria-label="Open menu" className={`${desktopHotspot} left-[94.5%] top-[3.6%] h-[5.6%] w-[3.8%]`} />
            <Link to="/shop" aria-label="Shop the batch" className={`${desktopHotspot} left-[9.8%] top-[49.2%] h-[5.8%] w-[18.8%]`} />
            <Link to="/contact" aria-label="Build a custom jar" className={`${desktopHotspot} left-[9.8%] top-[56.6%] h-[5.8%] w-[18.8%]`} />
          </div>
        </div>
      </section>

      <section className="bg-[#f1dfb8] px-5 pb-10 pt-20 text-[#120d0b] lg:px-8">
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
                className="group inline-flex items-center justify-center gap-3 self-start border border-[#120d0b] px-7 py-4 font-tribal text-sm font-bold uppercase tracking-[0.2em] transition hover:bg-[#120d0b] hover:text-[#f1dfb8] md:self-auto"
              >
                View all jars <ArrowRight size={18} className="transition group-hover:translate-x-1" />
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
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover opacity-95 sepia-[.14] transition duration-700 group-hover:scale-110 group-hover:sepia-0"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-7xl text-[#f4c56d]/25">PN</div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-[#f1dfb8] px-4 py-1 font-display text-xl text-[#120d0b]">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.featured && (
                    <Star className="absolute right-4 top-4 text-[#f4c56d] drop-shadow" fill="currentColor" size={26} />
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
                subtitle="Custom batch desk"
                className="relative mb-7"
                labelClassName="text-3xl leading-none"
              />
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.3em] text-native-clay">
                Custom Jar Brief
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
                  className="group inline-flex items-center justify-center gap-3 border border-native-clay bg-native-clay px-7 py-4 font-tribal text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:-translate-y-1 hover:bg-[#a63d2b]"
                >
                  Start a brief <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center border border-[#f4c56d]/28 px-7 py-4 font-tribal text-sm font-bold uppercase tracking-[0.2em] text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
                >
                  Shop the batch
                </Link>
              </div>
            </div>

            <div className="relative bg-[#f1dfb8] p-7 text-[#120d0b] md:p-10 lg:p-12">
              <div className="absolute right-6 top-6 hidden font-display text-[8rem] leading-none text-[#120d0b]/[0.035] sm:block">
                PN
              </div>
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
                Batch Notes
              </p>
              <h3 className="mt-3 max-w-md font-display text-4xl leading-none sm:text-[2.9rem]">
                Made to order, not made to look polite
              </h3>

              <div className="mt-7 divide-y divide-[#120d0b]/14 border-y border-[#120d0b]/14">
                {[
                  { number: '01', title: 'Crunch', desc: 'Pickle, chilli, mango, mixed veg, or a stranger idea from the pantry.' },
                  { number: '02', title: 'Heat', desc: 'Bright, smoky, savage, sweet, or somewhere in the middle.' },
                  { number: '03', title: 'Mark', desc: 'A custom label direction and small-batch finish made for the occasion.' },
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
                  Achar House
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
