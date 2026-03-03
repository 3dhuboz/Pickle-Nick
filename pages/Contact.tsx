import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const Contact = () => {
  const { siteContent, sendMessage } = useStore();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({
        id: `msg-${Date.now()}`,
        ...form,
        read: false,
        createdAt: new Date().toISOString()
    });
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  if (!siteContent) return <div></div>;

  return (
    <div className="py-24 px-4 bg-native-black min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-native-clay/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-native-turquoise/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="font-display text-6xl md:text-8xl text-native-sand mb-4 text-center uppercase leading-none drop-shadow-lg">Contact Us</h1>
        <p className="text-center text-native-turquoise font-sans uppercase tracking-[0.3em] mb-16 font-bold opacity-80">At Your Service</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info Card */}
          <div className="bg-native-sand p-12 rounded-[3rem] shadow-2xl border border-white/10">
            <h2 className="font-display text-4xl mb-12 uppercase text-native-black border-b border-native-clay/30 pb-4 inline-block">Coordinates</h2>
            
            <div className="space-y-10 font-sans text-native-black">
              <div className="flex items-start group">
                <div className="bg-native-black text-white p-4 rounded-full mr-6 shadow-ink group-hover:scale-110 transition-transform">
                   <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl uppercase mb-1 text-native-black opacity-60">Headquarters</h3>
                  <p className="text-lg font-medium">{siteContent.general.address}</p>
                </div>
              </div>

              <div className="flex items-start group">
                <div className="bg-native-black text-white p-4 rounded-full mr-6 shadow-ink group-hover:scale-110 transition-transform">
                   <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl uppercase mb-1 text-native-black opacity-60">Electronic Mail</h3>
                  <p className="text-lg font-medium">{siteContent.general.email}</p>
                </div>
              </div>

              <div className="flex items-start group">
                <div className="bg-native-black text-white p-4 rounded-full mr-6 shadow-ink group-hover:scale-110 transition-transform">
                   <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl uppercase mb-1 text-native-black opacity-60">Telephone</h3>
                  <p className="text-lg font-medium">{siteContent.general.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-native-black/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-native-clay/10 rounded-bl-full"></div>
            
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div>
                  <label className="block font-display text-xl uppercase mb-2 text-native-black opacity-70">Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full p-5 bg-native-sand/50 rounded-2xl border border-native-black/5 font-sans font-bold focus:border-native-clay/50 focus:bg-white transition-all outline-none shadow-inner" 
                    placeholder="FULL NAME" 
                  />
                </div>
                <div>
                  <label className="block font-display text-xl uppercase mb-2 text-native-black opacity-70">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full p-5 bg-native-sand/50 rounded-2xl border border-native-black/5 font-sans font-bold focus:border-native-clay/50 focus:bg-white transition-all outline-none shadow-inner" 
                    placeholder="EMAIL ADDRESS" 
                  />
                </div>
                <div>
                  <label className="block font-display text-xl uppercase mb-2 text-native-black opacity-70">Message</label>
                  <textarea 
                    rows={4} 
                    required
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full p-5 bg-native-sand/50 rounded-2xl border border-native-black/5 font-sans font-bold focus:border-native-clay/50 focus:bg-white transition-all outline-none shadow-inner resize-none" 
                    placeholder="HOW CAN WE HELP?"
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-native-clay text-white font-display text-2xl py-5 rounded-full uppercase hover:bg-native-black transition-all shadow-ink hover:shadow-lg mt-4 tracking-widest">
                  Send Message
                </button>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                 <div className="bg-native-turquoise text-white p-6 rounded-full mb-6 shadow-lg animate-bounce">
                    <Send size={48} />
                 </div>
                 <h3 className="font-display text-3xl uppercase text-native-black mb-4">Message Sent</h3>
                 <p className="font-sans text-lg text-native-earth">The spirit of your message travels to us now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;