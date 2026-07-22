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

const flashStories = [
  { src: '/brand/pickle-art-cucumbers.jpg', title: 'Clean crunch', copy: 'Cucumber flash for the jars that start crisp.' },
  { src: '/brand/pickle-art-roast-jalapeno.jpg', title: 'Roast heat', copy: 'A charred jalapeno mark for a slower burn.' },
  { src: '/brand/pickle-art-sweet-smokey.jpg', title: 'Smoke & fire', copy: 'Bold bottle art built to read from across the shelf.' },
  { src: '/brand/pickle-art-onions.jpg', title: 'Sharp bite', copy: 'The ingredient becomes the badge, direct and unmistakable.' },
];

const About = () => {
  const { siteContent } = useStore();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const storyHeroImage = siteContent?.about.heroImage || '/brand/pickle-nick-hand-bottles.jpg';
  const storyFeatureImage = siteContent?.home.founderImage || '/brand/pickle-nick-hand-bottles.jpg';
  usePageMotion(rootRef);

  return (
    <div ref={rootRef} className="page-shell content-page">
      <header className="page-hero page-hero--story">
        <div className="page-hero__flash">
          <img src={storyHeroImage} alt="Nick holding two Pickle Nick hot sauces" data-parallax-media />
        </div>
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
            <img src={storyFeatureImage} alt="Pickle Nick products at the maker's bench" data-parallax-media />
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

      <section className="flash-story" aria-labelledby="flash-story-title">
        <div className="page-width">
          <div className="flash-story__head" data-scroll-reveal>
            <div>
              <p className="eyeline">Ink with a job</p>
              <h2 id="flash-story-title" className="display">The flash is part of the flavour.</h2>
            </div>
            <p className="body-copy">
              Nick's tattoo language is not wallpaper. Each mark identifies the ingredient, the heat, and the attitude of the batch before the lid comes off.
            </p>
          </div>
          <div className="flash-story__rail">
            {flashStories.map(item => (
              <figure key={item.title} className="flash-story__item" data-scroll-reveal>
                <img src={item.src} alt={`${item.title} Pickle Nick tattoo flash`} data-parallax-media />
                <figcaption>
                  <strong>{item.title}</strong>
                  <span>{item.copy}</span>
                </figcaption>
              </figure>
            ))}
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
