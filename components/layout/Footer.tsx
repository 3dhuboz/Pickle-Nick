import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Mail } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import NickLogo from '../brand/NickLogo';

const Footer = () => {
  const { siteContent } = useStore();
  const email = siteContent?.general.email || 'hello@picklenick.au';

  return (
    <footer className="site-footer">
      <div className="page-width site-footer__top">
        <div className="site-footer__intro">
          <NickLogo size="lg" showName subtitle={siteContent?.general.tagline || 'Made to bite back'} />
          <p>Small-batch pickles and hot sauce with real ingredients, proper crunch, and enough heat to earn the label.</p>
        </div>

        <div>
          <p className="site-footer__heading">Navigation</p>
          <div className="site-footer__links">
            <Link to="/shop">Shop</Link>
            <Link to="/about">Our story</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/account">Account</Link>
          </div>
        </div>

        <div>
          <p className="site-footer__heading">Find Nick</p>
          <div className="site-footer__social">
            <a className="icon-button" href="https://www.facebook.com/thatpicklenick" target="_blank" rel="noopener noreferrer" aria-label="Pickle Nick on Facebook">
              <Facebook size={18} strokeWidth={1.8} />
            </a>
            <a className="icon-button" href={`mailto:${email}`} aria-label={`Email ${email}`}>
              <Mail size={18} strokeWidth={1.8} />
            </a>
          </div>
          <p className="body-copy" style={{ marginTop: 18 }}>{email}</p>
        </div>
      </div>

      <div className="page-width site-footer__bottom">
        <span>&copy; {new Date().getFullYear()} Pickle Nick</span>
        <span>Hand packed in Australia</span>
        <Link to="/admin/login" style={{ color: 'inherit', textDecoration: 'none' }}>Admin</Link>
      </div>
    </footer>
  );
};

export default Footer;
