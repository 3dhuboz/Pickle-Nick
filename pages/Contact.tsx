import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const Contact = () => {
  const { siteContent, sendMessage } = useStore();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const general = siteContent?.general;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage({
      id: `msg-${Date.now()}`,
      ...form,
      read: false,
      createdAt: new Date().toISOString(),
    });
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    window.setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-16 pt-32 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(244,197,109,0.16),transparent_32%),radial-gradient(circle_at_12%_84%,rgba(188,75,53,0.12),transparent_28%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,auto,28px_28px,auto]" />
        <div className="relative mx-auto max-w-7xl border-b border-[#f4c56d]/18 pb-12">
          <NickLogo size="md" className="mb-6" />
          <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
            Custom Jar Desk
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-[4rem] leading-[0.9] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-7xl md:text-8xl">
            Build a Custom Jar
          </h1>
          <p className="mt-8 max-w-2xl font-sans text-xl font-semibold leading-relaxed text-[#f5f0e6]/76">
            Tell Nick the crunch, the heat, and the occasion. The batch can go gentle, savage, smoky, sweet, or somewhere stranger.
          </p>
        </div>
      </section>

      <section className="bg-[#f1dfb8] px-5 py-20 text-[#120d0b] lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-[#120d0b]/14 bg-[#120d0b] p-8 text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)]">
            <h2 className="font-display text-4xl leading-none text-[#f4c56d]">
              Coordinates
            </h2>

            <div className="mt-10 space-y-8">
              {[
                { icon: MapPin, title: 'Counter', value: general?.address || 'Australia' },
                { icon: Mail, title: 'Email', value: general?.email || 'orders@picklenick.au' },
                { icon: Phone, title: 'Phone', value: general?.phone || 'By request' },
              ].map(item => (
                <div key={item.title} className="grid grid-cols-[auto_1fr] gap-5 border-t border-[#f4c56d]/14 pt-6">
                  <item.icon className="text-native-clay" size={25} />
                  <div>
                    <h3 className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/76">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-sans text-lg font-semibold leading-relaxed text-[#f5f0e6]/76">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#120d0b]/14 bg-[#f7e7c0] p-6 shadow-[0_26px_70px_rgba(18,13,11,0.18)] md:p-10">
            {!sent ? (
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div>
                  <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={event => setForm({ ...form, name: event.target.value })}
                    className="w-full border border-[#120d0b]/16 bg-[#120d0b]/5 px-5 py-4 font-sans text-lg font-semibold text-[#120d0b] outline-none transition placeholder:text-[#120d0b]/32 focus:border-native-clay focus:bg-white"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={event => setForm({ ...form, email: event.target.value })}
                    className="w-full border border-[#120d0b]/16 bg-[#120d0b]/5 px-5 py-4 font-sans text-lg font-semibold text-[#120d0b] outline-none transition placeholder:text-[#120d0b]/32 focus:border-native-clay focus:bg-white"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-native-clay">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={event => setForm({ ...form, message: event.target.value })}
                    className="w-full resize-none border border-[#120d0b]/16 bg-[#120d0b]/5 px-5 py-4 font-sans text-lg font-semibold text-[#120d0b] outline-none transition placeholder:text-[#120d0b]/32 focus:border-native-clay focus:bg-white"
                    placeholder="Crunch, heat, quantity, date, or wild idea"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-3 border border-native-clay bg-native-clay px-8 py-5 font-tribal text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_16px_38px_rgba(188,75,53,0.28)] transition hover:-translate-y-1 hover:bg-[#a63d2b]"
                >
                  Send Brief <Send size={18} />
                </button>
              </form>
            ) : (
              <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">
                <div className="mb-7 border border-native-clay bg-native-clay p-6 text-white">
                  <Send size={42} />
                </div>
                <h3 className="font-display text-5xl leading-none text-[#120d0b]">Message sent</h3>
                <p className="mt-5 max-w-md font-sans text-lg font-semibold leading-relaxed text-[#3d2a21]">
                  The brief is on Nick's counter.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
