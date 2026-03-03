import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Search, Tent } from 'lucide-react';
import { Category } from '../types';

const Shop = () => {
  const { products, categories } = useStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Merge store categories with "All" option
  // Note: We prioritize the rich categories from the store, but if products exist with categories 
  // NOT in the store list, we still want to filter them, though they won't have hero images.
  const productCategories = Array.from(new Set(products.map(p => p.category)));
  const availableCategoryNames = ['All', ...categories.map(c => c.name)];
  
  // Ensure we don't miss categories that have products but no rich category object (fallback)
  productCategories.forEach(c => {
      if(!availableCategoryNames.includes(c)) availableCategoryNames.push(c);
  });

  const filteredProducts = products.filter(p => {
    const matchesCategory = filter === 'All' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCategory = categories.find(c => c.name === filter);

  return (
    <div className="min-h-screen py-16 px-4 bg-native-sand bg-fabric-texture">
      <div className="max-w-7xl mx-auto">
        
        {/* HERO HEADER - Updates based on category */}
        <div className="mb-12 text-center bg-white/50 relative overflow-hidden shadow-card rounded-[3rem] border border-native-black/5">
          {activeCategory ? (
              <div className="relative h-64 md:h-96 w-full group overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 z-10 transition-colors group-hover:bg-black/30"></div>
                  <img src={activeCategory.image} alt={activeCategory.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-white drop-shadow-2xl">
                      <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.8] mb-4 drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">{activeCategory.name}</h1>
                      <p className="font-tribal font-bold text-lg md:text-2xl tracking-[0.4em] uppercase opacity-90 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">{activeCategory.description}</p>
                  </div>
              </div>
          ) : (
              <div className="py-16 relative">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-1 bg-tribal opacity-10"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-tribal opacity-10"></div>
                
                <h1 className="font-display text-7xl md:text-9xl text-native-black uppercase leading-[0.8] mb-4 drop-shadow-sm">The Shop</h1>
                <p className="font-tribal font-bold text-xl md:text-2xl mt-6 text-native-clay tracking-[0.4em] uppercase">Provisions & Preserves</p>
              </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 bg-white/80 backdrop-blur-md p-3 rounded-full border border-native-black/5 shadow-card sticky top-32 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start pl-4">
            <span className="font-tribal text-[10px] text-native-earth/60 mr-4 uppercase tracking-[0.3em] font-bold hidden lg:block">Filter By:</span>
            <button
                onClick={() => setFilter('All')}
                className={`px-8 py-3 font-tribal text-xs font-bold uppercase tracking-widest transition-all rounded-full ${ 
                  filter === 'All' 
                    ? 'bg-native-turquoise text-white shadow-ink' 
                    : 'bg-transparent text-native-black hover:bg-native-sand/50'
                }`}
              >
                All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.name)}
                className={`px-8 py-3 font-tribal text-xs font-bold uppercase tracking-widest transition-all rounded-full ${ 
                  filter === cat.name
                    ? 'bg-native-turquoise text-white shadow-ink' 
                    : 'bg-transparent text-native-black hover:bg-native-sand/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-[400px] pr-2">
            <div className="bg-native-sand/30 border border-native-black/5 flex items-center rounded-full focus-within:bg-white focus-within:border-native-clay/30 transition-all shadow-inner group">
                <Search className="ml-6 text-native-earth/40 group-focus-within:text-native-clay transition-colors" size={20} />
                <input
                type="text"
                placeholder="SEARCH GOODS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-6 py-4 bg-transparent font-tribal text-xs font-bold uppercase tracking-widest outline-none placeholder:text-native-earth/30 text-native-black"
                />
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {filteredProducts.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="group h-full">
                {/* Rugged Card Style */}
                <div className="bg-white border border-native-black/5 h-full flex flex-col shadow-card hover:shadow-lg hover:-translate-y-2 transition-all duration-500 relative rounded-[2.5rem] overflow-hidden">
                  
                  <div className="aspect-square overflow-hidden bg-native-sand relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-native-black/70 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white font-tribal text-xl font-bold uppercase border border-white/30 px-6 py-3 tracking-[0.3em] rounded-full">Barren</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-native-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-native-black font-display text-lg">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col items-center text-center bg-white">
                    <span className="text-native-clay text-[10px] font-bold font-tribal uppercase tracking-[0.3em] mb-4 bg-native-clay/5 px-4 py-1 rounded-full">{product.category}</span>
                    <h3 className="font-display text-3xl text-native-black mb-4 leading-[0.9] uppercase flex-grow drop-shadow-sm">{product.name}</h3>
                    
                    <div className="w-12 h-0.5 bg-native-black/5 rounded-full mb-6"></div>
                    
                    <div className="flex flex-col w-full gap-4">
                      <span className="text-3xl font-display text-native-turquoise drop-shadow-sm">${product.price.toFixed(2)}</span>
                      <span className="text-native-black font-tribal font-bold text-[10px] uppercase tracking-[0.3em] border border-native-black/10 py-4 rounded-full shadow-sm group-hover:bg-native-black group-hover:text-white transition-all duration-300">
                          View Item
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-native-black/5 shadow-card animate-in fade-in zoom-in duration-500">
            <div className="bg-native-sand/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Tent className="text-native-earth/20" size={48} />
            </div>
            <p className="font-display text-5xl text-native-black mb-6 uppercase drop-shadow-sm">No Goods Found</p>
            <button 
              onClick={() => {setFilter('All'); setSearch('')}}
              className="text-native-clay font-bold hover:text-native-black font-tribal text-xs uppercase tracking-[0.3em] underline underline-offset-8 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;