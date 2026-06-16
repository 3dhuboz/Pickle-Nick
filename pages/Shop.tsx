import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, PackageCheck, Search, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';
import BrandedProductImage from '../components/brand/BrandedProductImage';

const sealMark = '/brand/pickle-nick-seal-made-to-bite-back.png';

const shelfProofs = [
  { icon: PackageCheck, title: 'Small Batch', desc: 'Tiny runs, packed by hand.' },
  { icon: Flame, title: 'Bold Heat', desc: 'Sharp, smoky, or slow-burn depth.' },
  { icon: ShieldCheck, title: 'Nick Marked', desc: 'Stamped with the seal before it leaves.' },
];

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
  const fallbackHeroProduct = products.find(product => product.featured) || products[0];
  const spotlightProduct = filteredProducts[0] || fallbackHeroProduct;
  const shelfProducts = filteredProducts.slice(0, 3);

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
          stagger: 0.05,
          ease: 'power3.out',
        });

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.utils.toArray<HTMLElement>('[data-product-card]').forEach((card, index) => {
            gsap.from(card, {
              y: 30,
              opacity: 0,
              rotateX: index % 2 === 0 ? 2 : -2,
              duration: 0.74,
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
      <section className="relative overflow-hidden px-5 pb-10 pt-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(245,236,218,0.05),transparent_22%),radial-gradient(circle_at_82%_16%,rgba(111,74,44,0.18),transparent_28%),linear-gradient(180deg,rgba(245,236,218,0.02),transparent_24%,rgba(0,0,0,0.12))]" />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute right-[-2rem] top-12 hidden w-56 lg:block"
        />

        <div className="relative mx-auto max-w-[88rem]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
            <div
              data-shop-reveal
              className="rounded-[2.7rem] border border-[#f5ecda]/12 bg-[#0d0907]/82 p-6 shadow-[0_30px_86px_rgba(0,0,0,0.36)] backdrop-blur-md sm:p-8"
            >
              <NickLogo size="md" className="mb-6" />
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                The Batch
              </p>
              <h1 className="mt-3 max-w-lg font-tribal text-[3.3rem] font-semibold leading-[0.88] text-[#f5ecda] sm:text-[4.25rem]">
                Shop the batch
              </h1>
              <p className="mt-5 max-w-xl font-sans text-lg font-semibold leading-relaxed text-[#f5ecda]/74 sm:text-xl">
                {activeCategory?.description || 'Small-batch pickles, hot sauces, and sharp jars that feel cut from the same poster wall as the home page.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {shelfProofs.map(item => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-full border border-[#f5ecda]/10 bg-[#140d0a]/66 px-4 py-3"
                  >
                    <item.icon className="text-[#b69273]" size={16} />
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5ecda]/88">
                        {item.title}
                      </p>
                      <p className="mt-1 font-sans text-xs font-medium text-[#f5ecda]/54">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {spotlightProduct && (
              <Link
                to={`/product/${spotlightProduct.id}`}
                data-shop-reveal
                className="tribal-stage-panel group relative overflow-hidden rounded-[2.7rem] border border-[#f5ecda]/12 bg-[#140d0a]/78 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-md"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-end">
                  <BrandedProductImage
                    product={spotlightProduct}
                    variant="detail"
                    className="h-[22rem] rounded-[2rem] sm:h-[24rem]"
                    imageClassName="group-hover:scale-105"
                    forceBrandBackdrop
                    lineOnly
                    hideLabel
                  />

                  <div className="pb-2">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                      Counter Pick
                    </p>
                    <h2 className="mt-3 font-tribal text-[2.5rem] font-semibold leading-[0.92] text-[#f5ecda] sm:text-[3rem]">
                      {spotlightProduct.name}
                    </h2>
                    <p className="mt-3 font-sans text-xl font-semibold text-[#f5ecda]">
                      ${spotlightProduct.price.toFixed(2)}
                    </p>
                    <p className="mt-4 max-w-lg font-sans text-base font-medium leading-relaxed text-[#f5ecda]/64">
                      {spotlightProduct.description}
                    </p>
                    <div className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full border border-[#f5ecda]/14 bg-[#120d0b]/56 px-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#f5ecda]">
                      Open jar <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          <div
            data-shop-reveal
            className="mt-6 rounded-[2.25rem] border border-[#f5ecda]/12 bg-[#140d0a]/74 p-4 shadow-[0_24px_68px_rgba(0,0,0,0.3)] backdrop-blur-md"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex min-h-12 items-center rounded-full border border-[#f5ecda]/12 bg-[#120d0b]/55 px-5 xl:w-[24rem]">
                <Search className="mr-3 text-[#b69273]" size={18} />
                <input
                  type="text"
                  placeholder="Search the batch"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="w-full bg-transparent font-sans text-sm font-semibold uppercase tracking-[0.12em] text-[#f5ecda] outline-none placeholder:text-[#f5ecda]/32"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {availableCategoryNames.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFilter(category)}
                    className={`rounded-full border px-4 py-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      filter === category
                        ? 'border-[#9f3b2e] bg-[#7b4f31] text-[#fff7e6] shadow-[0_14px_28px_rgba(34,19,13,0.26)]'
                        : 'border-[#f5ecda]/12 bg-[#120d0b]/42 text-[#f5ecda]/72 hover:border-[#f5ecda]/24 hover:text-[#f5ecda]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="batch-shell relative overflow-hidden bg-[#120c09] px-5 pb-20 pt-6 text-[#f5ecda] lg:px-8">
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute bottom-4 left-[-2rem] hidden w-44 lg:block"
        />

        <div className="relative mx-auto max-w-[88rem]">
          {spotlightProduct && shelfProducts.length > 0 && (
            <div
              data-shop-reveal
              className="pickle-paper relative overflow-hidden rounded-[2.55rem] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:px-8 lg:px-10"
            >
              <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-left" />
              <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-right" />
              <div className="paper-grain" />

              <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)_auto] lg:items-center">
                <div className="flex items-end">
                  {shelfProducts.map((product, index) => (
                    <div
                      key={`${product.id}-shelf`}
                      className={`relative h-28 w-24 overflow-hidden rounded-[1.3rem] border border-[#120d0b]/10 bg-[#120d0b]/10 shadow-[0_14px_28px_rgba(0,0,0,0.16)] ${index === 0 ? 'z-30' : index === 1 ? '-ml-5 z-20' : '-ml-5 z-10'}`}
                    >
                      <BrandedProductImage
                        product={product}
                        className="h-full w-full rounded-[1.3rem]"
                        forceBrandBackdrop
                        lineOnly
                        hideLabel
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                    Shelf Highlight
                  </p>
                  <h2 className="mt-2 font-tribal text-[2.2rem] font-semibold leading-[0.92] text-[#120d0b] sm:text-[2.7rem]">
                    {spotlightProduct.name}
                  </h2>
                  <p className="mt-3 max-w-2xl font-sans text-base font-semibold leading-relaxed text-[#3d2a21]/82">
                    Sharp labels, dark poster surfaces, and the seal woven through every jar on the shelf.
                  </p>
                </div>

                <Link
                  to={`/product/${spotlightProduct.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-[#120d0b]/18 bg-[#120d0b]/6 px-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#120d0b] transition hover:bg-[#120d0b] hover:text-[#f5ecda]"
                >
                  Open jar <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                Shelf Count
              </p>
              <h2 className="mt-2 font-tribal text-[2.7rem] font-semibold leading-[0.9] text-[#f5ecda]">
                {filteredProducts.length} jars in view
              </h2>
            </div>
            <p className="max-w-xl font-sans text-sm font-medium leading-relaxed text-[#f5ecda]/58 sm:text-right">
              Filter by batch, search by label, and jump straight into the jars that match the heat you want.
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  data-product-card
                  className="support-card group overflow-hidden rounded-[2rem] border border-[#f5ecda]/10 bg-[#17110e]/74 p-3 shadow-[0_20px_54px_rgba(0,0,0,0.28)] backdrop-blur-md transition"
                >
                  <div className="overflow-hidden rounded-[1.5rem]">
                    <BrandedProductImage
                      product={product}
                      className="h-[18rem] rounded-[1.5rem]"
                      imageClassName="group-hover:scale-105"
                      forceBrandBackdrop
                      lineOnly
                    />
                  </div>

                  <div className="support-card-copy px-1 pb-2 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">
                        {product.category || 'Small Batch'}
                      </p>
                      <p className="font-sans text-sm font-semibold text-[#f5ecda]">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="support-card-name mt-2 font-tribal text-[2rem] font-semibold leading-[0.92] text-[#f5ecda]">
                      {product.name}
                    </p>
                    <p className="mt-3 line-clamp-3 font-sans text-sm font-medium leading-relaxed text-[#f5ecda]/58">
                      {product.description}
                    </p>
                    <div className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#f5ecda]/10 bg-[#120d0b]/48 px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f5ecda]/74">
                      Open jar <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2.35rem] border border-[#f5ecda]/12 bg-[#140d0a]/74 px-8 py-16 text-center shadow-[0_24px_68px_rgba(0,0,0,0.28)]">
              <Flame className="mx-auto mb-6 text-[#9f3b2e]" size={42} />
              <p className="font-tribal text-[3rem] font-semibold leading-none text-[#f5ecda]">
                No jars in view
              </p>
              <p className="mx-auto mt-4 max-w-xl font-sans text-lg font-semibold leading-relaxed text-[#f5ecda]/68">
                That shelf is empty. Reset the counter and bring the full batch back into frame.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter('All');
                  setSearch('');
                }}
                className="tribal-cta tribal-cta-primary mt-8 px-6 text-xs"
              >
                <span>Reset shelf</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Shop;
