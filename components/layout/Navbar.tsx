import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import NickLogo from '../brand/NickLogo';

const navItems = [
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const { cart, currentUser, logoutCustomer } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    await logoutCustomer();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <div className="site-nav__inner">
        <NickLogo to="/" size="sm" showName subtitle="Made to bite back" />

        <div className="site-nav__links">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="site-nav__link"
              aria-current={location.pathname === item.to ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="site-nav__actions">
          <Link
            to={currentUser ? '/account' : '/login'}
            className="icon-button"
            title={currentUser ? 'My account' : 'Sign in'}
            aria-label={currentUser ? 'My account' : 'Sign in'}
          >
            <UserRound size={18} strokeWidth={1.8} />
          </Link>
          <Link to="/cart" className="icon-button" title="Basket" aria-label={`Basket with ${cartItemCount} items`}>
            <ShoppingBag size={18} strokeWidth={1.8} />
            {cartItemCount > 0 ? <span className="cart-count">{cartItemCount}</span> : null}
          </Link>
          <button
            type="button"
            className="icon-button site-nav__menu-button"
            onClick={() => setIsMenuOpen(value => !value)}
            aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="site-nav__mobile">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          {navItems.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)}>{item.label}</Link>
          ))}
          {currentUser ? <button type="button" onClick={handleLogout}>Sign out</button> : null}
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
