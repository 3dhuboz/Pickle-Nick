import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const About = () => {
  const { siteContent } = useStore();

  if (!siteContent) return <div></div>;

  return (
    <div className="py-24 px-4 bg-native-sand min-h-screen">
      <div className="max-w-4xl mx-auto">
         <div className="text-center mb-16">
            <h1 className="font-display text-6xl md:text-8xl text-native-black mb-4 uppercase leading-none drop-shadow-sm">Our Heritage</h1>
            <div className="inline-flex items-center gap-4 text-native-clay">
               <div className="h-0.5 w-12 bg-native-clay rounded-full"></div>
               <span className="font-sans font-bold uppercase tracking-[0.3em]">Est. 2024</span>
               <div className="h-0.5 w-12 bg-native-clay rounded-full"></div>
            </div>
         </div>

         <div className="bg-white p-8 md:p-16 shadow-card rounded-[3rem] border border-native-black/5 relative overflow-hidden">
            {/* Decorative Pattern */}
            <div className="absolute top-0 left-0 w-full h-2 bg-tribal opacity-10"></div>
            
            <div className="prose prose-xl prose-stone mx-auto font-sans text-native-black/80 relative z-10">
               <h2 className="font-display text-4xl text-center text-native-black uppercase mb-10 pb-4 border-b border-native-clay/30">{siteContent.about.heading}</h2>
               
               <div className="font-medium text-lg leading-relaxed mb-8 whitespace-pre-line text-native-earth">
                  {siteContent.about.text}
               </div>

               <div className="bg-native-sand/50 p-8 rounded-3xl border border-native-black/5 my-12 shadow-inner">
                 <h3 className="font-display text-3xl uppercase text-native-clay mb-6 text-center">Our Process</h3>
                 <ul className="space-y-6 text-lg">
                    <li className="flex items-start">
                       <span className="text-native-turquoise mr-4 text-2xl">★</span>
                       <span className="text-native-black/80"><strong>The Cucumber:</strong> Sourced within 50 miles of our facility. If it travels more than an hour, it's rejected.</span>
                    </li>
                    <li className="flex items-start">
                       <span className="text-native-turquoise mr-4 text-2xl">★</span>
                       <span className="text-native-black/80"><strong>The Brine:</strong> A secret family recipe using apple cider vinegar base. No harsh chemicals.</span>
                    </li>
                    <li className="flex items-start">
                       <span className="text-native-turquoise mr-4 text-2xl">★</span>
                       <span className="text-native-black/80"><strong>The Wait:</strong> 48 hours in oak barrels. Not 47. Not 49. Perfection has a schedule.</span>
                    </li>
                 </ul>
               </div>
               
               <p className="text-center italic text-native-clay font-serif text-xl">
                  "We don't just make pickles. We preserve tradition."
               </p>
            </div>
         </div>
         
         <div className="mt-16 text-center">
             <Link to="/shop" className="inline-block bg-native-black text-native-sand font-display text-2xl uppercase px-12 py-5 rounded-full shadow-ink hover:shadow-lg hover:-translate-y-1 transition-all tracking-widest">
               Taste The Tradition
             </Link>
         </div>
      </div>
    </div>
  );
};

export default About;