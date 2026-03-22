import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, ShoppingBasket, Check, Star } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find(p => p.id === id);

  if (!product) return <div className="p-20 text-center text-4xl font-display uppercase text-native-black">Product not found</div>;

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-native-sand min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-native-black/60 hover:text-native-clay mb-10 font-tribal text-[10px] font-bold uppercase tracking-[0.3em] transition-all group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Pantry
        </button>

        <div className="bg-white p-10 md:p-16 shadow-card rounded-[3rem] border border-native-black/5 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            {/* Image */}
            <div className="relative group">
               <div className="absolute inset-0 border border-native-turquoise/20 rounded-[2.5rem] translate-x-4 translate-y-4 transition-transform group-hover:translate-x-6 group-hover:translate-y-6"></div>
               <div className="relative bg-gray-50 border border-native-black/5 rounded-[2rem] h-[550px] overflow-hidden shadow-sm">
                  {product.image
                    ? <img src={product.image} alt={product.name} className="w-full h-full object-cover sepia-[.1] group-hover:sepia-0 group-hover:scale-105 transition-all duration-700" />
                    : <div className="w-full h-full flex items-center justify-center bg-native-sand/50"><span className="font-display text-[10rem] opacity-10">🥒</span></div>
                  }
               </div>
               <div className="absolute top-8 right-8 bg-native-turquoise text-white p-4 rounded-2xl shadow-ink border border-white/10 animate-in fade-in zoom-in duration-500">
                  <Star fill="currentColor" size={24} className="drop-shadow-sm" />
               </div>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center">
              <span className="text-native-clay font-bold font-tribal uppercase tracking-[0.3em] text-[10px] mb-4 bg-native-clay/5 px-4 py-1.5 rounded-full inline-block w-fit">{product.category}</span>
              <h1 className="font-display text-5xl md:text-7xl text-native-black mb-6 uppercase leading-[0.9] drop-shadow-sm">{product.name}</h1>
              <div className="flex items-center gap-6 mb-10">
                 <p className="text-5xl font-display text-native-black drop-shadow-sm">${product.price.toFixed(2)}</p>
                 <span className="px-5 py-2 bg-native-turquoise/5 text-native-turquoise text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-native-turquoise/10 shadow-sm">In Stock</span>
              </div>
              
              <div className="mb-12 text-native-earth/70 font-sans text-lg leading-relaxed border-y border-native-black/5 py-8">
                <p>{product.description}</p>
              </div>

              <div className="flex items-center space-x-8 mb-10">
                <div className="flex items-center border border-native-black/5 bg-native-sand/30 rounded-full overflow-hidden shadow-inner p-1">
                  <button 
                    className="w-14 h-14 flex items-center justify-center text-2xl hover:bg-white hover:text-native-clay font-bold rounded-full transition-all text-native-black shadow-sm"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    -
                  </button>
                  <span className="px-8 font-display text-3xl w-24 text-center text-native-black">{qty}</span>
                  <button 
                    className="w-14 h-14 flex items-center justify-center text-2xl hover:bg-white hover:text-native-clay font-bold rounded-full transition-all text-native-black shadow-sm"
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    disabled={qty >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`
                  w-full py-6 font-display text-2xl uppercase tracking-[0.2em] flex items-center justify-center space-x-4 transition-all rounded-full shadow-ink hover:shadow-lg hover:-translate-y-1 active:translate-y-0
                  ${product.stock === 0 
                    ? 'bg-gray-200 cursor-not-allowed text-gray-400 shadow-none hover:translate-y-0' 
                    : added 
                      ? 'bg-native-turquoise text-white border border-native-turquoise shadow-lg' 
                      : 'bg-native-clay text-white border border-native-clay hover:bg-native-black hover:border-native-black'}
                `}
              >
                {product.stock === 0 ? (
                  <span>Sold Out</span>
                ) : added ? (
                  <>
                    <Check size={32} className="drop-shadow-sm" />
                    <span>Added To Basket</span>
                  </>
                ) : (
                  <>
                    <ShoppingBasket size={32} className="drop-shadow-sm" />
                    <span>Add to Basket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;