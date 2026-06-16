import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const sealMark = '/brand/pickle-nick-seal-made-to-bite-back.png';

const Contact = () => {
  const { siteContent, sendMessage } = useStore();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const contactRef = useRef<HTMLDivElement | null>(null);

  const general = siteContent?.general;

  useLayoutEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled || !contactRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.from('[data-contact-reveal]', {
          y: 24,
          opacity: 0,
          duration: 0.72,
          stagger: 0.06,
          ease: 'power3.out',
        });

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.utils.toArray<HTMLElement>('[data-contact-card]').forEach(card => {
            gsap.from(card, {
              y: 28,
              opacity: 0,
              duration: 0.76,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                once: true,
              },
            });
          });
        }
      }, contactRef);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

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
    <div ref={contactRef} className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-20 pt-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(245,236,218,0.05),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(111,74,44,0.18),transparent_28%),linear-gradient(180deg,rgba(245,236,218,0.02),transparent_24%,rgba(0,0,0,0.12))]" />
        <img
          src={sealMark}
          alt=""
          aria-hidden="true"
          className="tribal-seal-watermark tribal-seal-watermark--ink absolute right-[-2rem] top-12 hidden w-56 lg:block"
        />

        <div className="relative mx-auto max-w-[88rem]">
          <div data-contact-reveal className="rounded-[2.8rem] border border-[#f5ecda]/12 bg-[#0d0907]/84 p-6 shadow-[0_30px_86px_rgba(0,0,0,0.36)] backdrop-blur-md sm:p-8">
            <NickLogo size="md" className="mb-6" />
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
              Talk to Nick
            </p>
            <h1 className="mt-3 max-w-3xl font-tribal text-[3.2rem] font-semibold leading-[0.88] text-[#f5ecda] sm:text-[4.2rem]">
              Contact the counter
            </h1>
            <p className="mt-5 max-w-2xl font-sans text-lg font-semibold leading-relaxed text-[#f5ecda]/74 sm:text-xl">
              Ask about stock, events, wholesale, or the current small-batch range. Keep it direct and Nick will see it at the counter.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div data-contact-reveal className="rounded-[2.7rem] border border-[#f5ecda]/12 bg-[#140d0a]/78 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-md sm:p-8">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b69273]">
                Coordinates
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { icon: MapPin, title: 'Counter', value: general?.address || 'Australia' },
                  { icon: Mail, title: 'Email', value: general?.email || 'orders@picklenick.au' },
                  { icon: Phone, title: 'Phone', value: general?.phone || 'By request' },
                ].map(item => (
                  <div key={item.title} data-contact-card className="rounded-[1.7rem] border border-[#f5ecda]/10 bg-[#120d0b]/44 p-5">
                    <div className="flex items-start gap-4">
                      <item.icon className="mt-1 text-[#b69273]" size={18} />
                      <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b69273]">
                          {item.title}
                        </p>
                        <p className="mt-2 font-sans text-base font-medium leading-relaxed text-[#f5ecda]/72">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop"
                  className="tribal-cta tribal-cta-primary px-6 text-xs"
                >
                  <span>Shop the batch</span>
                </Link>
                <Link
                  to="/about"
                  className="tribal-cta tribal-cta-secondary px-6 text-xs"
                >
                  <span>Our story</span>
                </Link>
              </div>
            </div>

            <div data-contact-reveal className="pickle-paper relative overflow-hidden rounded-[2.8rem] px-6 py-8 shadow-[0_30px_78px_rgba(0,0,0,0.24)] sm:px-8 lg:px-10">
              <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-left" />
              <img src={sealMark} alt="" aria-hidden="true" className="paper-brand-mark paper-brand-mark-right" />
              <div className="paper-grain" />

              <div className="relative z-10">
                <div className="mb-6">
                  <NickLogo size="sm" className="mb-3" imageClassName="h-11 w-11" />
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9f3b2e]">
                    Message Sheet
                  </p>
                  <h2 className="mt-2 font-tribal text-[2.5rem] font-semibold leading-[0.9] text-[#120d0b] sm:text-[3rem]">
                    Leave it at the counter
                  </h2>
                </div>

                {!sent ? (
                  <form onSubmit={handleSubmit} className="grid gap-5">
                    <div>
                      <label className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f3b2e]">
                        Your name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={event => setForm({ ...form, name: event.target.value })}
                        className="w-full rounded-[1.3rem] border border-[#120d0b]/14 bg-[#120d0b]/6 px-5 py-4 font-sans text-base font-semibold text-[#120d0b] outline-none transition placeholder:text-[#120d0b]/34 focus:border-[#9f3b2e] focus:bg-[#fffaf0]"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f3b2e]">
                        Email address
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={event => setForm({ ...form, email: event.target.value })}
                        className="w-full rounded-[1.3rem] border border-[#120d0b]/14 bg-[#120d0b]/6 px-5 py-4 font-sans text-base font-semibold text-[#120d0b] outline-none transition placeholder:text-[#120d0b]/34 focus:border-[#9f3b2e] focus:bg-[#fffaf0]"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f3b2e]">
                        Message
                      </label>
                      <textarea
                        rows={6}
                        required
                        value={form.message}
                        onChange={event => setForm({ ...form, message: event.target.value })}
                        className="w-full resize-none rounded-[1.3rem] border border-[#120d0b]/14 bg-[#120d0b]/6 px-5 py-4 font-sans text-base font-semibold text-[#120d0b] outline-none transition placeholder:text-[#120d0b]/34 focus:border-[#9f3b2e] focus:bg-[#fffaf0]"
                        placeholder="Stock, event date, quantity, or the question on your mind"
                      />
                    </div>

                    <button
                      type="submit"
                      className="tribal-cta tribal-cta-primary px-6 text-xs"
                    >
                      <span>Send message</span>
                      <Send size={16} />
                    </button>
                  </form>
                ) : (
                  <div className="flex min-h-[26rem] flex-col items-start justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#120d0b]/12 bg-[#120d0b]/8 text-[#9f3b2e] shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                      <Send size={26} />
                    </div>
                    <h3 className="mt-6 font-tribal text-[2.8rem] font-semibold leading-[0.9] text-[#120d0b]">
                      Message sent
                    </h3>
                    <p className="mt-4 max-w-md font-sans text-lg font-semibold leading-relaxed text-[#3d2a21]/82">
                      Your note is on Nick's counter and ready for a reply.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
