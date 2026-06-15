import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, ShoppingBasket, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';
import BrandedProductImage from '../components/brand/BrandedProductImage';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find(item => item.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#120d0b] px-5 pt-36 text-center text-[#f5f0e6]">
        <p className="font-display text-5xl text-[#f4c56d]">Product not found</p>
        <button
          onClick={() => navigate('/shop')}
          className="mt-8 border border-[#f4c56d]/35 px-7 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
        >
          Back to shop
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120d0b] px-5 pb-20 pt-28 text-[#f5f0e6] lg:px-8">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_74%_18%,rgba(244,197,109,0.17),transparent_34%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
      <img
        src="/brand/pickle-nick-warrior-tattoo-hero-v2.png"
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-0 h-[38rem] w-[58rem] max-w-none object-cover object-[68%_45%] opacity-[0.13] mix-blend-screen"
      />

      <div className="relative mx-auto max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-10 inline-flex items-center gap-3 font-tribal text-xs font-bold uppercase tracking-[0.24em] text-[#f4c56d]/72 transition hover:text-[#f4c56d]"
        >
          <ArrowLeft size={16} /> Back to shop
        </button>
        <NickLogo size="md" className="mb-8" />

        <div className="grid gap-10 border border-[#f4c56d]/18 bg-[#0b0807]/86 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.42)] md:grid-cols-[0.95fr_1.05fr] md:p-8 lg:gap-12 lg:p-10">
          <div className="relative md:sticky md:top-28 md:self-start">
            <div className="absolute -bottom-4 -right-4 h-full w-full border border-[#f4c56d]/22" />
            <div className="relative aspect-[4/5] overflow-hidden border border-[#f4c56d]/18 bg-[#201611]">
              <BrandedProductImage product={product} variant="detail" className="h-full w-full" forceBrandBackdrop />
              {product.featured && (
                <div className="absolute right-5 top-24 z-30 border border-[#f4c56d]/35 bg-[#120d0b]/78 p-3 text-[#f4c56d] backdrop-blur">
                  <Star fill="currentColor" size={24} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-tribal text-xs font-bold uppercase tracking-[0.26em] text-native-clay">
              {product.category}
            </p>
            <h1 className="mt-4 font-display text-[3.8rem] leading-[0.88] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-6xl lg:text-7xl">
              {product.name}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <p className="font-display text-5xl text-[#f1dfb8]">${product.price.toFixed(2)}</p>
              <span className={`border px-4 py-2 font-tribal text-xs font-bold uppercase tracking-[0.22em] ${
                product.stock > 0
                  ? 'border-[#f4c56d]/24 text-[#f4c56d]/82'
                  : 'border-native-clay/42 text-native-clay'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 border-y border-[#f4c56d]/14 text-center font-tribal text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5f0e6]/58 sm:text-xs">
              <span className="border-r border-[#f4c56d]/14 px-2 py-4">Nick marked</span>
              <span className="border-r border-[#f4c56d]/14 px-2 py-4">Small batch</span>
              <span className="px-2 py-4">Custom heat</span>
            </div>

            <div className="my-8 border-b border-[#f4c56d]/16 pb-6">
              <p className="font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/76">
                {product.description}
              </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-5">
              <div className="flex items-center border border-[#f4c56d]/18 bg-black/20">
                <button
                  className="flex h-14 w-14 items-center justify-center text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <span className="w-20 text-center font-display text-3xl text-[#f1dfb8]">{qty}</span>
                <button
                  className="flex h-14 w-14 items-center justify-center text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b] disabled:cursor-not-allowed disabled:opacity-35"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={qty >= product.stock}
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`inline-flex w-full items-center justify-center gap-4 border px-8 py-5 font-tribal text-sm font-bold uppercase tracking-[0.22em] transition ${
                product.stock === 0
                  ? 'cursor-not-allowed border-white/12 bg-white/5 text-white/32'
                  : added
                    ? 'border-[#f4c56d] bg-[#f4c56d] text-[#120d0b]'
                    : 'border-native-clay bg-native-clay text-white shadow-[0_16px_38px_rgba(188,75,53,0.35)] hover:-translate-y-1 hover:bg-[#a63d2b]'
              }`}
            >
              {product.stock === 0 ? (
                <span>Sold Out</span>
              ) : added ? (
                <>
                  <Check size={24} />
                  <span>Added To Basket</span>
                </>
              ) : (
                <>
                  <ShoppingBasket size={24} />
                  <span>Add To Basket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
