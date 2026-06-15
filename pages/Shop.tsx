import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Flame, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const Shop = () => {
  const { products, categories } = useStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const shopRef = useRef<HTMLDivElement | null>(null);

  const productCategories = Array.from(new Set(products.map(product => product.category).filter(Boolean)));
  const availableCategoryNames = ['All', ...categories.map(category => category.name)];

  productCategories.forEach(category => {
    if (!availableCategoryNames.includes(category)) availableCategoryNames.push(category);
  });

  const filteredProducts = products.filter(product => {
    const matchesCategory = filter === 'All' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCategory = categories.find(category => category.name === filter);

  useLayoutEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled || !shopRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.from('[data-shop-reveal]', {
          y: 24,
          opacity: 0,
          duration: 0.72,
          stagger: 0.055,
          ease: 'power3.out',
        });

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.utils.toArray<HTMLElement>('[data-product-card]').forEach((card, index) => {
            gsap.from(card, {
              y: 34,
              opacity: 0,
              rotateX: index % 2 === 0 ? 2 : -2,
              duration: 0.68,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                once: true,
              },
            });
          });
        }
      }, shopRef);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [filter, search]);

  return (
    <div ref={shopRef} className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-16 pt-32 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(244,197,109,0.18),transparent_30%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
        <div className="absolute inset-y-0 left-0 hidden w-28 border-r border-[#f4c56d]/12 bg-[linear-gradient(135deg,rgba(244,197,109,0.15)_1px,transparent_1px),linear-gradient(45deg,rgba(188,75,53,0.16)_1px,transparent_1px)] bg-[length:22px_22px] lg:block" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-[#f4c56d]/18 pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div data-shop-reveal>
              <NickLogo size="md" className="mb-6" />
              <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
                Pickle Nick Counter
              </p>
              <h1 className="mt-4 font-display text-[4.2rem] leading-[0.9] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-7xl md:text-8xl">
                The Shop
              </h1>
            </div>

            <div data-shop-reveal className="max-w-2xl lg:justify-self-end">
              <p className="font-sans text-xl font-semibold leading-relaxed text-[#f5f0e6]/76">
                {activeCategory?.description || 'Custom pickles, hot sauce, achar jars, and small-batch provisions built for serious crunch.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/82">
                <span className="border border-[#f4c56d]/22 px-4 py-2">Small Batch</span>
                <span className="border border-[#f4c56d]/22 px-4 py-2">Custom Heat</span>
                <span className="border border-[#f4c56d]/22 px-4 py-2">Achar House</span>
              </div>
            </div>
          </div>

          <div data-shop-reveal className="sticky top-24 z-30 mt-8 border border-[#f4c56d]/18 bg-[#120d0b]/88 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden items-center gap-2 px-3 font-tribal text-xs font-bold uppercase tracking-[0.24em] text-[#f4c56d]/62 lg:inline-flex">
                  <Filter size={15} /> Filter
                </span>
                {availableCategoryNames.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={`border px-5 py-3 font-tribal text-xs font-bold uppercase tracking-[0.18em] transition ${
                      filter === category
                        ? 'border-native-clay bg-native-clay text-white shadow-[0_12px_28px_rgba(188,75,53,0.28)]'
                        : 'border-[#f4c56d]/20 text-[#f5f0e6]/72 hover:border-[#f4c56d]/60 hover:text-[#f4c56d]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <label className="flex min-w-0 items-center border border-[#f4c56d]/20 bg-black/18 px-5 text-[#f5f0e6] focus-within:border-[#f4c56d]/65 lg:w-[360px]">
                <Search className="mr-3 text-[#f4c56d]/58" size={19} />
                <input
                  type="text"
                  placeholder="Search goods"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="w-full bg-transparent py-4 font-tribal text-sm font-bold uppercase tracking-[0.2em] outline-none placeholder:text-[#f5f0e6]/32"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f1dfb8] px-5 py-16 text-[#120d0b] lg:px-8">
        <div className="mx-auto max-w-7xl">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  data-product-card
                  className="group flex min-h-full flex-col overflow-hidden border border-[#120d0b]/16 bg-[#120d0b] text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)] transition duration-500 hover:-translate-y-2"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#201611]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover opacity-95 sepia-[.14] transition duration-700 group-hover:scale-[1.08] group-hover:sepia-0"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-7xl text-[#f4c56d]/25">PN</div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#120d0b]/78 backdrop-blur-[2px]">
                        <span className="border border-[#f4c56d]/42 px-5 py-3 font-tribal text-xs font-bold uppercase tracking-[0.28em] text-[#f4c56d]">
                          Sold Out
                        </span>
                      </div>
                    )}
                    <div className="absolute left-4 top-4 bg-[#f1dfb8] px-4 py-1 font-display text-xl text-[#120d0b]">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col border-t border-[#f4c56d]/18 p-6">
                    <p className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/75">
                      {product.category}
                    </p>
                    <h2 className="mt-3 font-display text-3xl leading-none text-[#f4c56d]">
                      {product.name}
                    </h2>
                    <p className="mt-4 line-clamp-3 flex-1 font-sans text-sm font-medium leading-relaxed text-[#f5f0e6]/72">
                      {product.description}
                    </p>
                    <span className="mt-6 inline-flex items-center justify-center border border-[#f4c56d]/24 px-5 py-3 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay transition group-hover:border-native-clay group-hover:bg-native-clay group-hover:text-white">
                      Open Jar
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl border border-[#120d0b]/16 bg-[#120d0b] px-8 py-16 text-center text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)]">
              <Flame className="mx-auto mb-6 text-native-clay" size={48} />
              <p className="font-display text-5xl leading-none text-[#f4c56d]">No goods found</p>
              <p className="mt-5 font-sans text-lg font-semibold text-[#f5f0e6]/70">
                That shelf is empty. Reset the counter and try again.
              </p>
              <button
                onClick={() => {
                  setFilter('All');
                  setSearch('');
                }}
                className="mt-8 border border-[#f4c56d]/35 px-7 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Shop;
