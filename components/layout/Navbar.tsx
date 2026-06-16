import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBasket, User as UserIcon, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import NickLogo from '../brand/NickLogo';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const { cart, currentUser, logoutCustomer } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  if (location.pathname === '/') {
    return null;
  }

  const handleLogout = async () => {
    await logoutCustomer();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto flex max-w-[88rem] items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-[#f5ecda]/12 bg-[linear-gradient(180deg,rgba(18,12,9,0.94),rgba(18,12,9,0.82))] px-4 py-3 shadow-[0_22px_54px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
        <NickLogo
          to="/"
          size="sm"
          showName
          imageClassName="h-12 w-12"
          labelClassName="hidden text-xl leading-none sm:block"
        />

        <div className="hidden items-center gap-8 md:flex">
          {navItems.slice(1).map(item => (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={`tribal-nav-link font-sans text-sm font-semibold uppercase tracking-[0.16em] transition-colors ${
                isActive(item.to) ? 'text-[#f5ecda]' : 'text-[#f5f0e6]/70 hover:text-[#f5ecda]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[#f5f0e6]">
          <Link
            to={currentUser ? '/account' : '/login'}
            className="tribal-icon-button flex h-11 w-11 items-center justify-center rounded-full"
            title={currentUser ? 'My Account' : 'Login'}
          >
            <UserIcon size={20} />
          </Link>

          <Link
            to="/cart"
            className="tribal-icon-button relative flex h-11 w-11 items-center justify-center rounded-full"
            title="Cart"
          >
            <ShoppingBasket size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-native-clay text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="tribal-icon-button flex h-11 w-11 items-center justify-center rounded-full md:hidden"
            onClick={() => setIsMenuOpen(value => !value)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="mx-auto mt-3 max-w-[88rem] rounded-[2rem] border border-[#f5ecda]/10 bg-[linear-gradient(180deg,rgba(18,13,11,0.98),rgba(10,7,5,0.94))] px-4 pb-4 pt-3 shadow-[0_18px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm md:hidden">
          <div className="mx-auto flex max-w-md flex-col gap-1">
            {navItems.map(item => (
              <Link
                key={`${item.to}-${item.label}-mobile`}
                to={item.to}
                className="rounded-full px-5 py-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-[#f5f0e6]/80 transition hover:bg-[#f5ecda]/8 hover:text-[#f5ecda]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-5 py-4 text-left font-sans text-sm font-semibold uppercase tracking-[0.18em] text-[#9f3b2e] transition hover:bg-[#9f3b2e]/10"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
