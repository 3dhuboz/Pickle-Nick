import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBasket, Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const Navbar = () => {
  const { cart, siteContent, currentUser, logoutCustomer } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path 
    ? 'text-native-clay font-bold' 
    : 'text-native-black/60 hover:text-native-clay transition-colors';

  const handleLogout = async () => {
      await logoutCustomer();
      navigate('/');
  };

  return (
    <nav className="sticky top-6 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 backdrop-blur-xl shadow-card rounded-full border border-native-black/5 px-6 sm:px-10">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo Image */}
          <Link to="/" className="flex-shrink-0 flex items-center group relative z-10">
             <div className="h-16 w-16 bg-white border border-native-black/5 overflow-hidden shadow-sm transform transition-all group-hover:scale-105 group-hover:shadow-md flex items-center justify-center rounded-full">
                <img 
                  src={siteContent?.general.logoUrl || "/logo.svg"}
                  alt="Pickle Nick Logo" 
                  className="h-full w-full object-cover p-1 sepia-[.15]" 
                />
             </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-14 lg:space-x-16">
            <Link to="/" className={`font-tribal text-sm font-bold uppercase tracking-[0.2em] ${isActive('/')}`}>Home</Link>
            <Link to="/shop" className={`font-tribal text-sm font-bold uppercase tracking-[0.2em] ${isActive('/shop')}`}>Shop</Link>
            <Link to="/about" className={`font-tribal text-sm font-bold uppercase tracking-[0.2em] ${isActive('/about')}`}>About</Link>
            <Link to="/contact" className={`font-tribal text-sm font-bold uppercase tracking-[0.2em] ${isActive('/contact')}`}>Contact</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                 <Link to="/account" className="flex items-center gap-3 group">
                    <span className="hidden lg:block font-tribal text-sm font-bold uppercase tracking-[0.2em] text-native-clay group-hover:text-native-black transition-colors">{currentUser.name.split(' ')[0]}</span>
                    <div className="p-3 bg-native-sand/50 border border-native-black/5 rounded-full hover:bg-native-black hover:text-white transition-all shadow-inner">
                        <UserIcon size={22} />
                    </div>
                 </Link>
              </div>
            ) : (
              <Link to="/login" className="p-3 bg-native-sand/50 border border-native-black/5 rounded-full text-native-black hover:bg-native-black hover:text-white transition-all shadow-inner" title="Login">
                <UserIcon size={22} />
              </Link>
            )}

            <Link to="/cart" className="relative p-3 text-native-black hover:bg-native-black hover:text-white transition-all group bg-native-sand/50 border border-native-black/5 rounded-full shadow-inner">
              <ShoppingBasket size={22} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-native-turquoise text-white font-display text-sm h-6 w-6 rounded-full flex items-center justify-center border border-white shadow-sm animate-in zoom-in duration-300">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-3 text-native-black bg-native-sand/50 border border-native-black/5 rounded-full shadow-inner"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-white/95 backdrop-blur-xl rounded-[2rem] border border-native-black/5 shadow-card overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-8 space-y-2 flex flex-col text-center">
            <Link to="/" className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-black py-4 hover:bg-native-sand/50 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/shop" className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-black py-4 hover:bg-native-sand/50 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>Shop</Link>
            <Link to="/about" className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-black py-4 hover:bg-native-sand/50 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/contact" className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-black py-4 hover:bg-native-sand/50 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            
            <div className="h-px bg-native-black/5 my-4 mx-8"></div>

            {currentUser ? (
               <>
                 <Link to="/account" className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-turquoise py-4 hover:bg-native-turquoise/5 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>My Account</Link>
                 <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-clay py-4 hover:bg-native-clay/5 rounded-2xl transition-colors">Logout</button>
               </>
            ) : (
               <Link to="/login" className="font-tribal text-base font-bold uppercase tracking-[0.2em] text-native-clay py-4 hover:bg-native-clay/5 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;