import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Leaf, Timer } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const sealMark = '/brand/pickle-nick-logo.jpg';

const storyPoints = [
  { icon: Leaf, title: 'The Produce', desc: 'Chosen for crunch, colour, and the way it holds sharp spice after packing.' },
  { icon: Flame, title: 'The Brine', desc: 'Bright vinegar, salt, heat, and toasted spice balanced around every label.' },
  { icon: Timer, title: 'The Wait', desc: 'Small batches are given time to settle before they hit the shelf.' },
];

const About = () => {
  const { siteContent } = useStore();
  const heading = siteContent?.about.heading || 'Old ways. Bold bite.';
  const story = siteContent?.about.text || 'Pickle Nick is built around small batches, real crunch, toasted spice, and jars that earn the seal before they leave the counter.';
  const aboutRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled || !aboutRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.from('[data-about-reveal]', {
          y: 24,
          opacity: 0,
          duration: 0.72,
          stagger: 0.06,
          ease: 'power3.out',
        });

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.utils.toArray<HTMLElement>('[data-about-card]').forEach(card => {
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
      }, aboutRef);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={aboutRef} className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-10 pt-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(245,236,218,0.05),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(111,74,44,0.18),transparent_28%),linear-gradient(180deg,rgba(245,236,218,0.02),transparent_24%,rgba(0,0,0,0.12))]" />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute right-[-2rem] top-12 hidden w-56 lg:block"
        />

        <div className="relative mx-auto max-w-[88rem]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
            <div data-about-reveal className="rounded-[2.7rem] border border-[#f5ecda]/12 bg-[#0d0907]/84 p-6 shadow-[0_30px_86px_rgba(0,0,0,0.36)] backdrop-blur-md sm:p-8">
              <NickLogo size="md" className="mb-6" />
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                Nick Marked
              </p>
              <h1 className="mt-3 max-w-2xl font-tribal text-[3.25rem] font-semibold leading-[0.88] text-[#f5ecda] sm:text-[4.2rem]">
                Our story stays close to the jar
              </h1>
              <p className="mt-5 max-w-2xl font-sans text-lg font-semibold leading-relaxed text-[#f5ecda]/74 sm:text-xl">
                Small-batch pickles with sharp heat, dark poster energy, and a seal that keeps the whole brand feeling authored.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop"
                  className="tribal-cta tribal-cta-primary px-6 text-xs"
                >
                  <span>Shop the batch</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/contact"
                  className="tribal-cta tribal-cta-secondary px-6 text-xs"
                >
                  <span>Talk to Nick</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div data-about-reveal className="rounded-[2.7rem] border border-[#f5ecda]/12 bg-[#140d0a]/78 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-md sm:p-8">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                What holds
              </p>
              <div className="mt-4 space-y-5">
                {storyPoints.map(point => (
                  <div key={point.title} data-about-card className="rounded-[1.8rem] border border-[#f5ecda]/10 bg-[#120d0b]/40 p-5">
                    <div className="flex items-start gap-4">
                      <point.icon className="mt-1 text-[#b69273]" size={18} />
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">
                          {point.title}
                        </p>
                        <p className="mt-2 font-sans text-base font-medium leading-relaxed text-[#f5ecda]/68">
                          {point.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div data-about-reveal className="mt-6 pickle-paper paper-proof-strip relative overflow-hidden rounded-[2.55rem] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:px-8 lg:px-10">
            <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-left" />
            <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-right" />
            <div className="paper-grain" />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.82fr))] lg:items-start">
              <div className="pr-2">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                  The Nick Way
                </p>
                <h2 className="mt-2 font-tribal text-[2.2rem] font-semibold leading-[0.92] text-[#120d0b] sm:text-[2.75rem]">
                  Made to bite back
                </h2>
                <p className="mt-2 max-w-md font-sans text-sm font-semibold leading-relaxed text-[#3d2a21]/80 sm:text-base">
                  The story is simple: choose the right produce, build a brine with presence, and seal the batch once it earns its place.
                </p>
              </div>

              {storyPoints.map(point => (
                <div key={`${point.title}-paper`} className="paper-proof">
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

      <section className="batch-shell relative overflow-hidden bg-[#120c09] px-5 pb-20 pt-4 text-[#f5ecda] lg:px-8">
        <div data-about-reveal className="relative mx-auto max-w-[88rem] overflow-hidden rounded-[2.75rem] border border-[#f5ecda]/12 bg-[linear-gradient(135deg,rgba(18,13,11,0.96),rgba(10,7,5,0.92))] shadow-[0_34px_96px_rgba(0,0,0,0.38)]">
          <img
            src={sealMark}
            alt=""
            aria-hidden="true"
            className="tribal-seal-watermark tribal-seal-watermark--ink absolute left-[-3rem] top-8 hidden w-40 lg:block"
          />

          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                Story Notes
              </p>
              <h2 className="mt-3 max-w-xl font-tribal text-[3rem] font-semibold leading-[0.9] text-[#f5ecda] sm:text-[3.45rem]">
                {heading}
              </h2>
              <div className="mt-5 max-w-xl whitespace-pre-line font-sans text-base font-medium leading-relaxed text-[#f5ecda]/68 sm:text-lg">
                {story}
              </div>
            </div>

            <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(235,219,185,0.98),rgba(223,202,160,0.92))] px-6 py-8 text-[#18110d] sm:px-8 lg:px-10 lg:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,255,255,0.52),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(159,59,46,0.12),transparent_22%),repeating-linear-gradient(102deg,rgba(82,47,23,0.05)_0_1px,transparent_1px_12px),repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_14px)] opacity-80" />
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <NickLogo size="sm" imageClassName="h-14 w-14 border-[#120d0b]/10 bg-[#f5ecda]/58 shadow-[0_12px_24px_rgba(0,0,0,0.12)]" />
                  <div>
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                      Batch Values
                    </p>
                    <p className="mt-1 font-tribal text-3xl font-semibold leading-none text-[#120d0b]">
                      Small runs, no filler
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {[
                    { number: '01', kicker: 'Select', title: 'Choose for crunch', desc: 'Everything starts with produce that feels alive enough to hold spice and still bite clean.' },
                    { number: '02', kicker: 'Build', title: 'Season with intent', desc: 'The brine is there to carry heat and depth, not hide what the jar already has going for it.' },
                    { number: '03', kicker: 'Seal', title: 'Stamp it right', desc: "Nick's seal matters because it turns every jar into a signed batch, not a generic shelf product." },
                  ].map(item => (
                    <div key={item.number} className="tribal-method-row">
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

export default About;
