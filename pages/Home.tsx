import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Star, ShieldCheck, Leaf, Clock, ArrowRight, Sun, Feather, Mountain, Flame, Hammer, Quote, Download } from 'lucide-react';

const Home = () => {
  const { products, siteContent, installPrompt, triggerInstall } = useStore();
  const featuredProducts = products.filter(p => p.featured).slice(0, 3);
  
  if (!siteContent) return <div className="min-h-screen bg-native-sand"></div>;

  return (
    <div className="bg-native-sand">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 rounded-b-[3rem] shadow-wampum bg-native-sand z-20">
        
        {/* Abstract Geometry Background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-native-turquoise/5 transform skew-x-12 translate-x-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-native-clay/5 rounded-tr-[100px] blur-2xl"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-6 text-native-clay animate-pulse">
                 <Flame size={24} fill="currentColor" />
                 <span className="font-tribal text-lg tracking-[0.3em] uppercase font-bold">Est. 2024 • Native Flavor</span>
                 <Flame size={24} fill="currentColor" />
              </div>
              
              <h1 className="font-display text-6xl md:text-8xl text-native-black mb-6 leading-none drop-shadow-lg">
                {siteContent.home.heroHeading}
              </h1>
              <h2 className="font-tribal text-2xl md:text-4xl text-native-leather uppercase tracking-widest mb-8 inline-block pb-2 border-b-2 border-native-turquoise/50">
                {siteContent.home.heroSubheading}
              </h2>
              
              <p className="font-sans text-xl text-native-earth font-medium mb-12 leading-relaxed max-w-lg mx-auto md:mx-0 pl-6 border-l-4 border-native-black/20">
                {siteContent.home.heroText}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                <Link 
                  to="/shop" 
                  className="bg-native-clay text-white border-2 border-native-clay font-display text-2xl px-10 py-5 uppercase tracking-widest shadow-wampum hover:shadow-wampum-hover rounded-full transition-all transform hover:-translate-y-1"
                >
                  Shop The Batch
                </Link>
                {installPrompt ? (
                    <button 
                      onClick={triggerInstall}
                      className="bg-native-turquoise text-white border-2 border-native-turquoise font-display text-2xl px-10 py-5 uppercase tracking-widest hover:bg-native-black hover:border-native-black rounded-full transition-all flex items-center justify-center gap-3 shadow-ink"
                    >
                      <Download size={24} /> Install App
                    </button>
                ) : (
                    <Link 
                      to="/about" 
                      className="bg-transparent text-native-black border-2 border-native-black font-display text-2xl px-10 py-5 uppercase tracking-widest hover:bg-native-black hover:text-white rounded-full transition-all shadow-ink hover:shadow-lg"
                    >
                      Our Story
                    </Link>
                )}
              </div>
           </div>
           
           <div className="relative flex justify-center">
              {/* Central Image Container - Leather Shield Style */}
              <div className="relative z-10 group">
                 <div className="absolute inset-0 bg-native-turquoise rounded-full blur-3xl opacity-20 transform scale-110 group-hover:opacity-40 transition-opacity duration-700"></div>
                 
                 {/* Main Logo Image */}
                 <div className="relative bg-native-sand p-4 rounded-full border border-native-black/10 shadow-2xl transform transition-transform duration-700 group-hover:scale-105">
                    <div className="rounded-full overflow-hidden border-4 border-native-clay h-80 w-80 md:h-96 md:w-96 relative bg-white flex items-center justify-center shadow-inner">
                       <img
                           src={siteContent.general.logoUrl || "/logo.svg"}
                           alt="Pickle Nick Logo"
                           className="w-full h-full object-cover sepia-[.15]"
                       />
                    </div>
                 </div>

                 {/* Decorative Feathers/Charms */}
                 <div className="absolute -bottom-6 left-0 md:left-10 bg-native-black text-native-sand px-8 py-3 font-display text-xl uppercase tracking-widest shadow-xl transform -rotate-6 rounded-xl z-20 border border-native-sand/20">
                    Small Batch
                 </div>
                 <div className="absolute top-10 -right-4 bg-native-clay text-white p-5 rounded-full shadow-xl border-4 border-native-sand z-20 animate-bounce delay-700">
                    <Sun size={32} />
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- SECTION: THE ALCHEMIST (FOUNDER) --- */}
      <section className="py-24 px-4 bg-native-sand bg-fabric-texture relative overflow-hidden">
         {/* Tribal Pattern Overlay */}
         <div className="absolute top-0 left-0 w-full h-4 bg-tribal opacity-40"></div>
         
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <div className="relative order-2 md:order-1">
               <div className="absolute top-4 left-4 w-full h-full border-2 border-native-turquoise rounded-2xl z-0"></div>
               <div className="relative z-10 bg-white p-2 shadow-xl rounded-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  {siteContent.home.founderImage ? (
                    <img
                      src={siteContent.home.founderImage}
                      alt="Nick The Founder"
                      className="w-full h-[500px] object-cover grayscale hover:grayscale-0 transition-all duration-700 rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-[500px] bg-native-sand/60 rounded-xl flex items-center justify-center">
                      <span className="font-display text-2xl text-native-earth/30 uppercase tracking-widest">Photo Coming Soon</span>
                    </div>
                  )}
                  <div className="bg-white p-4 text-center rounded-b-xl">
                     <p className="font-display text-2xl text-native-black uppercase">Nick "The Brine" Keeper</p>
                  </div>
               </div>
            </div>

            {/* Text Side */}
            <div className="order-1 md:order-2">
               <h2 className="font-display text-5xl md:text-7xl text-native-black mb-6 uppercase leading-none drop-shadow-sm">
                  The Man Behind <br/><span className="text-native-clay">The Jar</span>
               </h2>
               <div className="h-1.5 w-32 bg-native-turquoise mb-8 rounded-full"></div>
               
               <div className="relative mb-8 bg-white/50 p-8 rounded-3xl border border-native-black/5 shadow-sm">
                  <Quote className="absolute -top-4 -left-2 text-native-black/10" size={60} />
                  <p className="font-sans text-xl md:text-2xl text-native-earth font-medium italic leading-relaxed relative z-10">
                     "I didn't start Pickle Nick to fill shelves. I started it to fill a void. Real flavor doesn't come from a factory line; it comes from dirty hands, patience, and a little bit of madness."
                  </p>
               </div>

               <p className="font-sans text-lg text-native-black/70 mb-10 pl-2">
                  Every jar is a testament to the American spirit. Handmade, hand-packed, and sealed with a promise of quality that you can taste in the crunch.
               </p>

               <div className="flex gap-4">
                  <div className="flex items-center gap-2 font-tribal text-sm uppercase tracking-widest text-native-black border border-native-black/10 px-6 py-3 bg-white rounded-full shadow-sm">
                     <Hammer size={16} /> Hand Crafted
                  </div>
                  <div className="flex items-center gap-2 font-tribal text-sm uppercase tracking-widest text-native-black border border-native-black/10 px-6 py-3 bg-white rounded-full shadow-sm">
                     <Clock size={16} /> Slow Aged
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- SECTION: THE VISUAL TESTAMENT (PRODUCT IMAGES) --- */}
      <section className="py-24 bg-native-black text-native-sand relative rounded-3xl mx-4 my-8 shadow-2xl overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 mb-16 text-center relative z-10">
            <h2 className="font-display text-5xl md:text-7xl text-white uppercase mb-4 drop-shadow-md">Visual Testament</h2>
            <div className="flex justify-center items-center gap-4 text-native-clay">
               <div className="h-0.5 w-20 bg-native-clay rounded-full"></div>
               <span className="font-tribal uppercase tracking-[0.4em] font-bold">Proof of Process</span>
               <div className="h-0.5 w-20 bg-native-clay rounded-full"></div>
            </div>
         </div>

         {/* Parallax / Wide Banner */}
         <div className="w-full h-[500px] relative overflow-hidden mb-16 border-y-4 border-native-clay/50 group">
            <div className="absolute inset-0 bg-gradient-to-b from-native-black/60 via-transparent to-native-black/60 z-10 pointer-events-none"></div>
            {siteContent.home.galleryImage1 ? (
              <img
                src={siteContent.home.galleryImage1}
                alt="Lineup on Gravel"
                className="w-full h-full object-cover object-center fixed-attachment-hack transform group-hover:scale-105 transition-transform duration-[2000ms]"
              />
            ) : (
              <div className="w-full h-full bg-native-earth/20" />
            )}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
               <h3 className="font-display text-6xl md:text-9xl text-white/90 uppercase tracking-widest drop-shadow-2xl text-center leading-none opacity-80 mix-blend-overlay">
                  Born In<br/>The Fire
               </h3>
            </div>
         </div>

         {/* Grid of Details */}
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 -mt-24 relative z-30">
            <div className="bg-white p-2 shadow-2xl transform rotate-1 hover:-rotate-1 transition-transform duration-500 rounded-2xl">
               <div className="relative h-96 overflow-hidden rounded-xl">
                  {siteContent.home.galleryImage2 ? (
                    <img src={siteContent.home.galleryImage2} alt="Production Rows" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-native-earth/20" />
                  )}
                  <div className="absolute bottom-4 left-4 bg-native-clay text-white px-6 py-2 font-tribal uppercase tracking-widest text-sm rounded-full shadow-lg">
                     The Arsenal
                  </div>
               </div>
            </div>
            <div className="bg-white p-2 shadow-2xl transform -rotate-1 hover:rotate-1 transition-transform duration-500 md:mt-12 rounded-2xl">
               <div className="relative h-96 overflow-hidden rounded-xl">
                  {siteContent.home.galleryImage3 ? (
                    <img src={siteContent.home.galleryImage3} alt="Sauce Detail" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-native-earth/20" />
                  )}
                  <div className="absolute bottom-4 right-4 bg-native-turquoise text-white px-6 py-2 font-tribal uppercase tracking-widest text-sm rounded-full shadow-lg">
                     Liquid Gold
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Featured Products - The Shop */}
      <section className="py-24 px-4 bg-native-sand bg-leather-texture relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 pb-6 border-b-2 border-native-black/10">
             <div>
               <span className="font-tribal text-native-clay text-xl tracking-[0.4em] uppercase font-bold">The Provisioner</span>
               <h2 className="font-display text-5xl md:text-6xl text-native-black uppercase mt-2 drop-shadow-sm">
                 Bounty of the Season
               </h2>
             </div>
             <Link to="/shop" className="group flex items-center font-display text-2xl uppercase text-native-black hover:text-native-clay transition-colors mt-6 md:mt-0 bg-white px-6 py-2 rounded-full shadow-sm hover:shadow-md border border-native-black/5">
               View All Goods <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={28} />
             </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredProducts.map(product => (
              <div key={product.id} className="bg-white text-native-black rounded-3xl shadow-card hover:shadow-wampum group flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-2 border border-native-black/5">
                {/* Decorative Pattern Top */}
                <div className="h-1.5 w-full bg-tribal opacity-30 absolute top-0 z-10"></div>
                
                <div className="relative h-80 overflow-hidden bg-native-sand/20">
                  {product.image
                    ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 sepia-[.1] group-hover:sepia-0" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="font-display text-6xl opacity-20">🥒</span></div>
                  }
                  <div className="absolute top-4 right-4 bg-white/95 text-native-black px-4 py-1 font-display text-xl rounded-full shadow-md border border-native-black/5">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.featured && (
                      <div className="absolute top-4 left-4 text-native-clay drop-shadow-lg">
                          <Star fill="currentColor" size={32} />
                      </div>
                  )}
                </div>
                
                <div className="p-8 flex-1 flex flex-col justify-between relative bg-white">
                  <div>
                    <span className="text-native-turquoise font-tribal text-xs font-bold uppercase tracking-[0.2em] mb-2 block">{product.category}</span>
                    <h3 className="font-display text-3xl text-native-black leading-none mb-3 uppercase">{product.name}</h3>
                    <p className="font-sans text-native-earth/80 mb-6 leading-relaxed text-sm line-clamp-3">{product.description}</p>
                  </div>
                  
                  <Link 
                    to={`/product/${product.id}`}
                    className="w-full block text-center bg-native-black text-white font-tribal text-lg uppercase py-3 rounded-full hover:bg-native-clay transition-all shadow-ink hover:shadow-lg"
                  >
                    Claim This
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards Section */}
      <section className="py-24 px-4 bg-white relative border-t border-native-black/5 rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-5xl md:text-7xl text-native-black mb-4 uppercase tracking-wide drop-shadow-sm">
              Sacred Standards
            </h2>
            <div className="flex justify-center items-center gap-4">
               <div className="h-0.5 w-20 bg-native-leather rounded-full"></div>
               <Mountain className="text-native-turquoise" size={32} />
               <div className="h-0.5 w-20 bg-native-leather rounded-full"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Clock, title: "Aged by Moon", desc: "Fermented for 48 hours under the watch of time. We respect the process." },
              { icon: Leaf, title: "Earth Born", desc: "Harvested from local soil. Rooted in nature, untouched by synthetics." },
              { icon: ShieldCheck, title: "Pure Spirit", desc: "No artificial dyes or additives. Just the honest bounty of the land." }
            ].map((item, index) => (
              <div key={index} className="bg-native-sand p-10 text-center relative group rounded-3xl border border-native-black/5 hover:border-native-black/20 hover:bg-white transition-all duration-500 shadow-card hover:shadow-wampum">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-native-turquoise text-white p-4 rounded-full border-4 border-native-sand shadow-xl group-hover:bg-native-clay group-hover:scale-110 transition-all">
                  <item.icon size={32} />
                </div>
                <h3 className="font-display text-2xl mt-8 mb-4 uppercase tracking-wider">{item.title}</h3>
                <p className="font-sans font-medium text-lg opacity-80 leading-relaxed text-native-earth">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;