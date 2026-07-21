import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Hand, Leaf, PackageCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';
import { usePageMotion } from '../hooks/usePageMotion';

const method = [
  { icon: Leaf, title: 'Prep', copy: 'Fresh vegetables and bright chillies, cut by hand.' },
  { icon: PackageCheck, title: 'Brine', copy: 'Balanced for crunch, heat, and a clean finish.' },
  { icon: Hand, title: 'Pack', copy: 'Short runs keep every jar close to the process.' },
  { icon: Flame, title: 'Taste', copy: 'Nick checks the batch before the label goes on.' },
];

const About = () => {
  const { siteContent } = useStore();
  const rootRef = useRef<HTMLDivElement | null>(null);
  usePageMotion(rootRef);

  return (
    <div ref={rootRef} className="page-shell content-page">
      <header className="page-hero">
        <div className="page-width page-hero__row">
          <div>
            <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" data-reveal />
            <p className="eyeline" data-reveal>Our story</p>
            <h1 className="display" data-reveal>Made by hand. Signed by Nick.</h1>
          </div>
          <p className="body-copy" data-reveal>
            {siteContent?.about.text || 'Pickle Nick started with a simple idea: real ingredients, small batches, and flavours strong enough to stand behind.'}
          </p>
        </div>
      </header>

      <section className="dark-section" style={{ paddingTop: 40 }}>
        <div className="page-width story-split">
          <div className="story-media" data-scroll-reveal>
            <img src="/brand/pickle-nick-hand-bottles.jpg" alt="Nick holding Pickle Nick hot sauces" data-parallax-media />
            <img className="story-media__logo" src={NICK_LOGO_SRC} alt="" aria-hidden="true" />
          </div>
          <div className="story-copy" data-scroll-reveal>
            <p className="eyeline">The maker</p>
            <h2 className="display">The product looks like the person behind it.</h2>
            <p className="body-copy">
              Nick's range is direct, a little unruly, and built with care. The tattoo-flash labels come from the same place as the recipes: bold choices, honest ingredients, and no interest in blending into the shelf.
            </p>
            <Link className="button button--line" to="/shop">See the range <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="paper-band" aria-label="Pickle Nick process">
        <div className="page-width paper-band__inner">
          <div className="paper-band__lead" data-scroll-reveal>
            <p className="eyeline" style={{ color: 'var(--red)' }}>The process</p>
            <h2>Four moves. One proper batch.</h2>
            <p>Simple work, repeated carefully.</p>
          </div>
          {method.map(item => (
            <div key={item.title} className="paper-band__item" data-scroll-reveal>
              <item.icon size={20} strokeWidth={1.8} />
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="light-section">
        <div className="page-width story-split story-split--reverse">
          <div className="story-copy" data-scroll-reveal>
            <p className="eyeline" style={{ color: 'var(--red)' }}>At the bench</p>
            <h2 className="display">Good flavour starts before the jar.</h2>
            <p className="body-copy" style={{ color: 'var(--muted-light)' }}>
              The prep is visible, the batches stay small, and the labels tell you exactly whose work you are buying. That is the whole idea.
            </p>
            <Link className="button button--dark" to="/contact">Talk to Nick <ArrowRight size={16} /></Link>
          </div>
          <div className="story-media" data-scroll-reveal>
            <img src="/brand/pickle-nick-onions-prep.jpg" alt="Fresh onions prepared for a Pickle Nick batch" data-parallax-media />
            <img className="story-media__logo" src={NICK_LOGO_SRC} alt="" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
