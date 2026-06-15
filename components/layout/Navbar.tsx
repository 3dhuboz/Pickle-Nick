import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBasket, User as UserIcon, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/contact', label: 'Custom Jar' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const { cart, siteContent, currentUser, logoutCustomer } = useStore();
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#120d0b]/90 via-[#120d0b]/62 to-transparent backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#f4c56d]/35 bg-[#f5f0e6] shadow-[0_0_26px_rgba(244,197,109,0.18)]">
            <img
              src={siteContent?.general.logoUrl || '/logo.svg'}
              alt="Pickle Nick Logo"
              className="h-full w-full object-cover p-1 sepia-[.2]"
            />
          </span>
          <span className="hidden font-display text-xl uppercase tracking-[0.16em] text-[#f4c56d] sm:block">
            Pickle Nick
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.slice(1).map(item => (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={`font-tribal text-sm font-bold uppercase tracking-[0.22em] transition-colors ${
                isActive(item.to) ? 'text-[#f4c56d]' : 'text-[#f5f0e6]/70 hover:text-[#f4c56d]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[#f5f0e6]">
          <Link
            to={currentUser ? '/account' : '/login'}
            className="rounded-full border border-[#f4c56d]/20 bg-white/5 p-3 transition hover:border-[#f4c56d]/60 hover:bg-[#f4c56d]/10"
            title={currentUser ? 'My Account' : 'Login'}
          >
            <UserIcon size={20} />
          </Link>

          <Link
            to="/cart"
            className="relative rounded-full border border-[#f4c56d]/20 bg-white/5 p-3 transition hover:border-[#f4c56d]/60 hover:bg-[#f4c56d]/10"
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
            className="rounded-full border border-[#f4c56d]/20 bg-white/5 p-3 transition hover:border-[#f4c56d]/60 hover:bg-[#f4c56d]/10 md:hidden"
            onClick={() => setIsMenuOpen(value => !value)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-[#f4c56d]/10 bg-[#120d0b]/96 px-4 pb-6 pt-2 md:hidden">
          <div className="mx-auto flex max-w-md flex-col gap-1">
            {navItems.map(item => (
              <Link
                key={`${item.to}-${item.label}-mobile`}
                to={item.to}
                className="rounded-2xl px-5 py-4 font-tribal text-sm font-bold uppercase tracking-[0.2em] text-[#f5f0e6]/80 transition hover:bg-[#f4c56d]/10 hover:text-[#f4c56d]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl px-5 py-4 text-left font-tribal text-sm font-bold uppercase tracking-[0.2em] text-native-clay transition hover:bg-native-clay/10"
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
