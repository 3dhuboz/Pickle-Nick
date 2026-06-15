import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Leaf, Twitter } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import NickLogo from '../brand/NickLogo';

const Footer = () => {
  const { siteContent } = useStore();

  return (
    <footer className="mt-auto overflow-hidden bg-[#120d0b] text-[#f5f0e6]">
      <div className="h-2 w-full bg-[linear-gradient(90deg,#bc4b35,#f4c56d,#5f7f32,#bc4b35)] opacity-75" />

      <div className="border-y border-[#f4c56d]/12 bg-[#0b0807] py-4">
        <div className="mx-auto max-w-7xl overflow-hidden px-4">
          <div className="flex w-max gap-8 whitespace-nowrap font-tribal text-sm font-bold uppercase tracking-[0.22em] text-[#f4c56d]/58 animate-drift">
            <span>* Hand Packed</span>
            <span>* Toasted Spice</span>
            <span>* Slow Brined</span>
            <span>* Made To Bite Back</span>
            <span>* Hand Packed</span>
            <span>* Toasted Spice</span>
            <span>* Slow Brined</span>
            <span>* Made To Bite Back</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.15fr_0.7fr_0.9fr] lg:px-8">
        <div>
          <NickLogo
            size="lg"
            showName
            subtitle={siteContent?.general.tagline || 'Made To Bite Back'}
            labelClassName="text-4xl leading-none"
          />
          <p className="mt-7 max-w-md font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/64">
            Small-batch jars with warm spice, sharp brine, and a proper crunch.
          </p>
        </div>

        <div>
          <h4 className="font-tribal text-sm font-bold uppercase tracking-[0.24em] text-native-clay">
            Navigation
          </h4>
          <ul className="mt-6 space-y-4 font-display text-2xl leading-none text-[#f4c56d]">
            <li><Link to="/shop" className="transition hover:text-[#f1dfb8]">Shop</Link></li>
            <li><Link to="/about" className="transition hover:text-[#f1dfb8]">Our Story</Link></li>
            <li><Link to="/contact" className="transition hover:text-[#f1dfb8]">Custom Jar</Link></li>
            <li><Link to="/admin/login" className="font-sans text-sm font-semibold text-[#f5f0e6]/28 transition hover:text-[#f5f0e6]/65">Admin Login</Link></li>
          </ul>
        </div>

        <div className="md:text-right">
          <h4 className="font-tribal text-sm font-bold uppercase tracking-[0.24em] text-native-clay">
            Follow the Pickle Trail
          </h4>
          <div className="mt-6 flex gap-3 md:justify-end">
            {[
              { icon: Facebook, href: 'https://www.facebook.com/thatpicklenick', label: 'Facebook' },
              { icon: Instagram, href: '#', label: 'Instagram' },
              { icon: Twitter, href: '#', label: 'Twitter' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target={item.href === '#' ? undefined : '_blank'}
                rel={item.href === '#' ? undefined : 'noopener noreferrer'}
                aria-label={item.label}
                className="border border-[#f4c56d]/22 p-3 text-[#f4c56d] transition hover:border-native-clay hover:bg-native-clay hover:text-white"
              >
                <item.icon size={20} />
              </a>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#f5f0e6]/34 md:justify-end">
            <Leaf size={14} />
            <span>&copy; {new Date().getFullYear()} Pickle Nick Co.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
