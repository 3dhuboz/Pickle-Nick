import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Leaf, Timer } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const About = () => {
  const { siteContent } = useStore();
  const heading = siteContent?.about.heading || 'Old ways. Bold bite.';
  const story = siteContent?.about.text || 'Pickle Nick is built around small batches, real crunch, toasted spice, and custom jars made with a little theatre.';

  return (
    <div className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-16 pt-32 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(244,197,109,0.17),transparent_32%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 border-b border-[#f4c56d]/18 pb-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <NickLogo size="md" className="mb-6" />
            <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
              Brine House
            </p>
            <h1 className="mt-4 font-display text-[4rem] leading-[0.9] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-7xl md:text-8xl">
              Our Story
            </h1>
          </div>
          <p className="max-w-2xl font-sans text-xl font-semibold leading-relaxed text-[#f5f0e6]/76 lg:justify-self-end">
            Custom pickles with rugged heat, tattoo-flash labels, and small-batch attitude.
          </p>
        </div>
      </section>

      <section className="bg-[#f1dfb8] px-5 py-20 text-[#120d0b] lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-t border-[#120d0b]/18 pt-7">
            <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
              Nick's Counter
            </p>
            <h2 className="mt-4 font-display text-[3.4rem] leading-[0.92] sm:text-6xl">
              {heading}
            </h2>
            <div className="mt-8 whitespace-pre-line font-sans text-lg font-medium leading-relaxed text-[#3d2a21]">
              {story}
            </div>
          </div>

          <div className="grid gap-5">
            {[
              { icon: Leaf, title: 'The Produce', desc: 'Chosen for crunch, colour, and how well it carries spice after packing.' },
              { icon: Flame, title: 'The Brine', desc: 'Bright vinegar, salt, heat, and toasted spice balanced around each jar.' },
              { icon: Timer, title: 'The Wait', desc: 'Small batches are given time to settle before they leave the counter.' },
            ].map(item => (
              <div key={item.title} className="grid grid-cols-[auto_1fr] gap-5 border border-[#120d0b]/14 bg-[#120d0b] p-6 text-[#f5f0e6]">
                <item.icon className="mt-1 text-native-clay" size={30} />
                <div>
                  <h3 className="font-tribal text-sm font-bold uppercase tracking-[0.22em] text-[#f4c56d]">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-sans text-sm font-semibold leading-relaxed text-[#f5f0e6]/72">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl border-t border-[#120d0b]/18 pt-10 text-center">
          <p className="mx-auto max-w-3xl font-display text-4xl leading-tight text-[#120d0b]">
            Made to bite back, packed to be remembered.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-3 border border-[#120d0b] px-8 py-4 font-tribal text-sm font-bold uppercase tracking-[0.22em] transition hover:bg-[#120d0b] hover:text-[#f1dfb8]"
          >
            Taste the batch <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
