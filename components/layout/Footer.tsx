import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Feather, Mountain } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const Footer = () => {
  const { siteContent } = useStore();

  return (
    <footer className="bg-native-black text-native-sand mt-auto relative rounded-b-3xl overflow-hidden">
      {/* Top Tribal Border */}
      <div className="bg-tribal-dark h-2 w-full opacity-50"></div>

      {/* Marquee Style Banner */}
      <div className="bg-native-earth py-4 border-y border-native-sand/10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center overflow-hidden">
           <div className="flex gap-8 opacity-50 font-tribal text-sm tracking-widest uppercase whitespace-nowrap animate-drift">
              <span>✦ Hand Packed</span>
              <span>✦ Earth Grown</span>
              <span>✦ Spirit Fermented</span>
              <span>✦ Hand Packed</span>
              <span>✦ Earth Grown</span>
              <span>✦ Spirit Fermented</span>
              <span>✦ Hand Packed</span>
              <span>✦ Earth Grown</span>
              <span>✦ Spirit Fermented</span>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          
          {/* Brand Column */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-native-sand p-2 rounded-full h-16 w-16 flex items-center justify-center overflow-hidden border-2 border-native-silver/20 shadow-md">
                  <img src={siteContent?.general.logoUrl || "/logo.jpg"} className="h-full w-full object-contain" alt="Logo" />
                </div>
                <div>
                   <h3 className="font-display text-3xl text-native-sand uppercase tracking-wide">Pickle Nick</h3>
                   <span className="text-native-turquoise text-xs uppercase tracking-[0.3em] font-bold block">{siteContent?.general.tagline}</span>
                </div>
            </div>
            <p className="text-native-sand/60 font-sans text-lg max-w-xs leading-relaxed">
              Honoring the tradition of preservation. <br/>
              Bold flavors rooted in the earth.
            </p>
          </div>
          
          {/* Nav Column */}
          <div className="flex flex-col items-center">
            <h4 className="font-tribal text-xl mb-6 text-native-clay uppercase tracking-[0.2em] font-bold">Navigation</h4>
            <ul className="space-y-4 text-lg font-medium font-display tracking-wide">
              <li><Link to="/shop" className="hover:text-native-turquoise transition-colors">Shop</Link></li>
              <li><Link to="/about" className="hover:text-native-turquoise transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-native-turquoise transition-colors">Contact</Link></li>
              <li><Link to="/admin/login" className="text-native-sand/20 hover:text-white text-sm mt-4 block font-sans">Admin Login</Link></li>
            </ul>
          </div>

          {/* Social Column */}
          <div className="flex flex-col items-center md:items-end">
            <h4 className="font-tribal text-xl mb-6 text-native-clay uppercase tracking-[0.2em] font-bold">Join The Tribe</h4>
            <div className="flex justify-center md:justify-end space-x-4">
              <a href="https://www.facebook.com/thatpicklenick" target="_blank" rel="noopener noreferrer" className="bg-native-earth text-native-sand p-3 hover:bg-native-turquoise hover:text-white transition-all rounded-full shadow-lg border border-native-sand/10">
                <Facebook size={20} />
              </a>
              <a href="#" className="bg-native-earth text-native-sand p-3 hover:bg-native-turquoise hover:text-white transition-all rounded-full shadow-lg border border-native-sand/10">
                <Instagram size={20} />
              </a>
              <a href="#" className="bg-native-earth text-native-sand p-3 hover:bg-native-turquoise hover:text-white transition-all rounded-full shadow-lg border border-native-sand/10">
                <Twitter size={20} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-2 text-native-sand/30 text-sm font-sans">
              <Mountain size={14} />
              <span>&copy; {new Date().getFullYear()} Pickle Nick Co.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Pattern */}
      <div className="bg-native-turquoise/80 h-1.5 w-full"></div>
    </footer>
  );
};

export default Footer;