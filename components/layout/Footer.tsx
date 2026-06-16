import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Leaf, Twitter } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import NickLogo from '../brand/NickLogo';

const sealMark = '/brand/pickle-nick-seal-made-to-bite-back.png';

const Footer = () => {
  const { siteContent } = useStore();

  return (
    <footer className="mt-auto overflow-hidden border-t border-[#f5ecda]/10 bg-[#0d0907] text-[#f5ecda]">
      <div className="relative mx-auto max-w-[88rem] px-5 py-14 lg:px-8">
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute left-[-2rem] top-6 hidden w-36 lg:block"
        />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--paper absolute bottom-2 right-[-1.5rem] hidden w-32 lg:block"
        />

        <div className="grid gap-12 md:grid-cols-[1.15fr_0.7fr_0.9fr]">
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
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
              Navigation
            </h4>
            <ul className="mt-5 space-y-3">
              <li><Link to="/shop" className="font-tribal text-[2rem] font-semibold leading-none text-[#f5ecda] transition hover:text-[#fff7e6]">Shop</Link></li>
              <li><Link to="/about" className="font-tribal text-[2rem] font-semibold leading-none text-[#f5ecda] transition hover:text-[#fff7e6]">Our Story</Link></li>
              <li><Link to="/contact" className="font-tribal text-[2rem] font-semibold leading-none text-[#f5ecda] transition hover:text-[#fff7e6]">Contact</Link></li>
              <li><Link to="/admin/login" className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-[#f5ecda]/30 transition hover:text-[#f5ecda]/68">Admin Login</Link></li>
            </ul>
          </div>

          <div className="md:text-right">
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
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
                  className="tribal-icon-button flex h-12 w-12 items-center justify-center rounded-full text-[#f5ecda]"
                >
                  <item.icon size={20} />
                </a>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#f5f0e6]/34 md:justify-end">
              <Leaf size={14} />
              <span>&copy; {new Date().getFullYear()} Pickle Nick</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#f5ecda]/10 pt-5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5ecda]/45 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>Hand Packed</span>
            <span>Slow Brined</span>
            <span>Bold Flavours</span>
            <span>Nick Marked</span>
          </div>
          <span>Made to bite back</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
