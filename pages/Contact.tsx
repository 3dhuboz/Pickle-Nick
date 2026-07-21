import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';
import { usePageMotion } from '../hooks/usePageMotion';

const Contact = () => {
  const { siteContent, sendMessage } = useStore();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const general = siteContent?.general;

  usePageMotion(rootRef);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage({
      id: `msg-${Date.now()}`,
      ...form,
      read: false,
      createdAt: new Date().toISOString(),
    });
    setForm({ name: '', email: '', message: '' });
    setSent(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSent(false), 5000);
  };

  const details = [
    { icon: MapPin, label: 'Based in', value: general?.address || 'Australia' },
    { icon: Mail, label: 'Email', value: general?.email || 'hello@picklenick.au' },
    { icon: Phone, label: 'Phone', value: general?.phone || 'Available by request' },
  ];

  return (
    <div ref={rootRef} className="page-shell content-page">
      <header className="page-hero">
        <div className="page-width page-hero__row">
          <div>
            <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" data-reveal />
            <p className="eyeline" data-reveal>Contact</p>
            <h1 className="display" data-reveal>Talk to Nick.</h1>
          </div>
          <p className="body-copy" data-reveal>Ask about stock, events, wholesale, or the next batch. Keep it direct and it will land on Nick's counter.</p>
        </div>
      </header>

      <main className="page-width content-layout">
        <section data-scroll-reveal>
          <p className="eyeline">Details</p>
          <h2 className="display" style={{ marginTop: 12 }}>A real person reads this.</h2>
          <p className="body-copy" style={{ marginTop: 20 }}>Send the useful details and Nick will get back to you as soon as the bench allows.</p>

          <div style={{ marginTop: 38, borderTop: '1px solid var(--line-dark)' }}>
            {details.map(item => (
              <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '36px 110px 1fr', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--line-dark)', paddingBlock: 18 }}>
                <item.icon size={18} color="var(--mustard)" strokeWidth={1.8} />
                <strong style={{ fontSize: 12, textTransform: 'uppercase' }}>{item.label}</strong>
                <span className="body-copy" style={{ fontSize: 14 }}>{item.value}</span>
              </div>
            ))}
          </div>

          <Link className="button button--line" to="/shop" style={{ marginTop: 30 }}>Shop the batch <ArrowRight size={16} /></Link>
        </section>

        <section data-scroll-reveal>
          {sent ? (
            <div style={{ minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '1px solid var(--line-dark)', borderBottom: '1px solid var(--line-dark)', paddingBlock: 36 }} aria-live="polite">
              <Send size={30} color="var(--red)" />
              <h2 className="display" style={{ marginTop: 24 }}>Message sent.</h2>
              <p className="body-copy" style={{ marginTop: 16 }}>Your note is on Nick's counter and ready for a reply.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="contact-name">Your name</label>
                <input id="contact-name" required value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} placeholder="Full name" autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="contact-email">Email address</label>
                <input id="contact-email" type="email" required value={form.email} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" required value={form.message} onChange={event => setForm(value => ({ ...value, message: event.target.value }))} placeholder="Stock, event date, quantity, or the question on your mind" />
              </div>
              <button type="submit" className="button button--primary" style={{ width: 'fit-content' }}>Send message <Send size={16} /></button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default Contact;
