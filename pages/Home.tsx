import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Flame, Leaf, PackageCheck, Plus, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BrandedProductImage from '../components/brand/BrandedProductImage';
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';
import { usePageMotion } from '../hooks/usePageMotion';

const BrineDepthScene = lazy(() => import('../components/visual/BrineDepthScene'));

const proofPoints = [
  { icon: PackageCheck, title: 'Small batch', copy: 'Packed by hand in short runs.' },
  { icon: Flame, title: 'Full flavour', copy: 'Sharp brine and proper heat.' },
  { icon: Leaf, title: 'Real ingredients', copy: 'No filler. No shortcuts.' },
  { icon: ShieldCheck, title: 'Nick marked', copy: 'The real label on every bottle.' },
];

const Home = () => {
  const { products, addToCart } = useStore();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const featuredProducts = products.filter(product => product.featured).slice(0, 4);
  const batch = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);

  usePageMotion(rootRef);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    let cancelled = false;
    let motionContext: { revert: () => void } | undefined;
    let revertMedia: (() => void) | undefined;

    const initialiseHeroDepth = async () => {
      const { gsap } = await import('gsap');
      if (cancelled || !rootRef.current) return;

      motionContext = gsap.context(() => {
        const mediaContext = gsap.matchMedia();
        revertMedia = () => mediaContext.revert();
        mediaContext.add(
          {
            desktop: '(min-width: 761px)',
            reduceMotion: '(prefers-reduced-motion: reduce)',
          },
          context => {
            if (!context.conditions?.desktop || context.conditions.reduceMotion) return;

            gsap.to('.home-hero__left-mark', {
              xPercent: 4,
              yPercent: -3,
              rotation: -5,
              duration: 12,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          },
        );
      }, rootRef);
    };

    void initialiseHeroDepth();

    return () => {
      cancelled = true;
      revertMedia?.();
      motionContext?.revert();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const startPlayback = () => {
      if (document.hidden) return;
      void video.play().catch(() => setVideoPlaying(false));
    };
    const handlePlaying = () => setVideoPlaying(true);
    const handleWaiting = () => setVideoPlaying(false);
    const handleVisibility = () => startPlayback();

    video.addEventListener('canplay', startPlayback);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    document.addEventListener('visibilitychange', handleVisibility);
    startPlayback();

    return () => {
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleQuickAdd = (productId: string) => {
    const product = products.find(item => item.id === productId);
    if (!product || product.stock <= 0) return;
    addToCart(product, 1);
    setAddedId(product.id);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAddedId(null), 1600);
  };

  return (
    <div ref={rootRef} className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero__poster"
          src="/brand/pickle-nick-brine-hero-source.png"
          alt=""
          aria-hidden="true"
        />
        <video
          ref={videoRef}
          className={`home-hero__video${videoPlaying ? ' is-playing' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/brand/pickle-nick-brine-hero-source.png"
          disablePictureInPicture
          data-parallax-media
          aria-hidden="true"
        >
          <source src="/brand/pickle-nick-brine-hero.mp4" type="video/mp4" />
        </video>
        <div className="home-hero__scrim" aria-hidden="true" />
        <div className="home-hero__left-depth" aria-hidden="true">
          <img className="home-hero__left-mark" src={NICK_LOGO_SRC} alt="" />
        </div>
        <Suspense fallback={null}><BrineDepthScene /></Suspense>
        <div className="home-hero__seal" data-reveal aria-hidden="true">
          <img src={NICK_LOGO_SRC} alt="" data-parallax-media />
        </div>

        <div className="page-width home-hero__inner">
          <div className="home-hero__content">
            <div className="home-hero__brand" data-reveal>
              <img src={NICK_LOGO_SRC} alt="Pickle Nick" />
            </div>
            <h1 id="home-title" className="display home-hero__title" data-reveal>Made to bite back.</h1>
            <p className="home-hero__copy" data-reveal>
              Small-batch pickles and hot sauce with a clean crunch, serious heat, and Nick's mark on every bottle.
            </p>
            <div className="home-hero__actions" data-reveal>
              <Link className="button button--primary" to="/shop">Shop the batch <ArrowRight size={17} /></Link>
              <Link className="button button--ghost" to="/about">Meet Nick <ArrowRight size={17} /></Link>
            </div>
          </div>
        </div>

        <div className="home-hero__proof" aria-label="Product qualities">
          <span>Hand packed</span>
          <span>Real ingredients</span>
          <span>Australian made</span>
          <span>Full bite</span>
        </div>
      </section>

      <section className="paper-band" aria-label="How Pickle Nick makes each batch">
        <div className="page-width paper-band__inner">
          <div className="paper-band__lead" data-scroll-reveal>
            <p className="eyeline" style={{ color: 'var(--red)' }}>The house rules</p>
            <h2>Old-school care. Fresh bite.</h2>
            <p>Everything that matters, nothing that gets in the way.</p>
          </div>
          {proofPoints.map(point => (
            <div key={point.title} className="paper-band__item" data-scroll-reveal>
              <point.icon size={20} strokeWidth={1.8} />
              <strong>{point.title}</strong>
              <p>{point.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dark-section dark-section--maker">
        <div className="page-width batch-layout">
          <div className="batch-layout__intro" data-scroll-reveal>
            <p className="eyeline">Fresh from the bench</p>
            <h2 className="display">The current batch.</h2>
            <p className="body-copy">Pick a jar, choose your heat, and get it on the way. No mystery labels and no stock artwork, just Nick's real range.</p>
            <Link className="button button--line" to="/shop">See everything <ArrowRight size={16} /></Link>
          </div>

          <div>
            {batch.length > 0 ? batch.map(product => (
              <article key={product.id} className="product-row" data-scroll-reveal>
                <Link to={`/product/${product.id}`} className="product-row__media" aria-label={`View ${product.name}`}>
                  <BrandedProductImage product={product} />
                </Link>
                <Link to={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
                  <p className="product-row__category">{product.category || 'Small batch'}</p>
                  <h3 className="product-row__name">{product.name}</h3>
                  <p className="product-row__description">{product.description}</p>
                </Link>
                <span className="product-row__price">${product.price.toFixed(2)}</span>
                <button
                  type="button"
                  className="icon-button product-row__action"
                  onClick={() => handleQuickAdd(product.id)}
                  disabled={product.stock <= 0}
                  title={product.stock > 0 ? `Add ${product.name} to basket` : 'Sold out'}
                  aria-label={product.stock > 0 ? `Add ${product.name} to basket` : `${product.name} is sold out`}
                >
                  {addedId === product.id ? <Check size={17} /> : <Plus size={17} />}
                </button>
              </article>
            )) : (
              <div className="empty-state" data-scroll-reveal>
                <h2 className="display">The next batch is brewing.</h2>
                <p className="body-copy">Check back shortly for fresh stock.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="light-section">
        <div className="page-width story-split">
          <div className="story-media" data-scroll-reveal>
            <img src="/brand/pickle-nick-onions-prep.jpg" alt="Fresh onions being prepared for a Pickle Nick batch" data-parallax-media />
            <img className="story-media__logo" src={NICK_LOGO_SRC} alt="" aria-hidden="true" />
          </div>
          <div className="story-copy" data-scroll-reveal>
            <p className="eyeline" style={{ color: 'var(--red)' }}>Start with the good stuff</p>
            <h2 className="display">Real ingredients do the heavy lifting.</h2>
            <p className="body-copy" style={{ color: 'var(--muted-light)' }}>
              Fresh vegetables, bright chillies, sharp vinegar, and the time it takes to let each batch find its bite. Nick keeps the process hands-on from prep to label.
            </p>
            <Link className="button button--dark" to="/about">How Nick works <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="dark-section">
        <div className="page-width story-split story-split--reverse">
          <div className="story-copy" data-scroll-reveal>
            <p className="eyeline">From Nick's hands</p>
            <h2 className="display">The label matches the maker.</h2>
            <p className="body-copy">
              The tattoo-flash artwork is part of the real product, not a layer pasted on for the website. Every bottle keeps the same bold, handmade character you see in Nick's range.
            </p>
            <Link className="button button--line" to="/shop">Find your heat <ArrowRight size={16} /></Link>
          </div>
          <div className="story-media" data-scroll-reveal>
            <img src="/brand/pickle-nick-hand-bottles.jpg" alt="Nick holding two Pickle Nick hot sauces" data-parallax-media />
            <img className="story-media__logo" src={NICK_LOGO_SRC} alt="" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="signature-banner">
        <img src="/brand/pickle-nick-firepit-lineup.jpg" alt="Pickle Nick hot sauce lineup beside the fire" data-parallax-media />
        <div className="page-width signature-banner__inner">
          <div className="signature-banner__copy" data-scroll-reveal>
            <p className="eyeline">Pick a bottle</p>
            <h2 className="display">Bring the bite home.</h2>
            <p className="body-copy">Choose a clean chilli hit, a smoky slow burn, or a jar with serious crunch.</p>
            <Link className="button button--primary" to="/shop">Shop Pickle Nick <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
