import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Package, Save, Truck } from 'lucide-react';
import type { Order, User } from '../types';
import { useStore } from '../context/StoreContext';
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';
import { usePageMotion } from '../hooks/usePageMotion';

const statusColor = (status: Order['status']) => {
  if (status === 'delivered') return 'var(--green)';
  if (status === 'shipped') return 'var(--mustard)';
  return 'var(--red)';
};

const Account = () => {
  const { currentUser, orders, updateUser, logoutCustomer, settings } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>({});
  const [saveMessage, setSaveMessage] = useState('');
  const timerRef = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);

  usePageMotion(rootRef);

  useEffect(() => {
    if (currentUser) setForm(currentUser);
  }, [currentUser]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const userOrders = orders.filter(order =>
    (currentUser?.id && order.userId === currentUser.id)
    || (currentUser?.email && order.customerEmail === currentUser.email)
  );

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    await updateUser({ ...currentUser, ...form } as User);
    setIsEditing(false);
    setSaveMessage('Profile updated');
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleLogout = async () => {
    await logoutCustomer();
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div ref={rootRef} className="page-shell content-page">
      <header className="page-hero">
        <div className="page-width page-hero__row">
          <div>
            <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" data-reveal />
            <p className="eyeline" data-reveal>Your account</p>
            <h1 className="display" data-reveal>Your pantry.</h1>
          </div>
          <div data-reveal>
            <p className="body-copy">Welcome back, {currentUser.name.split(' ')[0]}. Your details and order history are all here.</p>
            <button type="button" className="button button--line" onClick={handleLogout} style={{ marginTop: 24 }}><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </header>

      <main className="page-width content-layout">
        <section data-scroll-reveal>
          <p className="eyeline">Profile</p>
          <h2 className="display" style={{ marginTop: 12 }}>Your details.</h2>

          <div className="contact-form" style={{ marginTop: 32 }}>
            <div className="field">
              <label htmlFor="account-name">Full name</label>
              {isEditing ? (
                <input id="account-name" value={form.name || ''} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} />
              ) : <p className="body-copy" style={{ margin: '12px 0 0', color: 'var(--paper)' }}>{currentUser.name}</p>}
            </div>
            <div className="field">
              <label htmlFor="account-email">Email address</label>
              {isEditing ? (
                <input id="account-email" type="email" value={form.email || ''} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} />
              ) : <p className="body-copy" style={{ margin: '12px 0 0', color: 'var(--paper)' }}>{currentUser.email}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 32 }}>
            {isEditing ? (
              <>
                <button type="button" className="button button--line" onClick={() => { setIsEditing(false); setForm(currentUser); }}>Cancel</button>
                <button type="button" className="button button--primary" onClick={handleSaveProfile}><Save size={16} /> Save profile</button>
              </>
            ) : (
              <button type="button" className="button button--line" onClick={() => setIsEditing(true)}>Edit details</button>
            )}
          </div>
          {saveMessage ? <p className="body-copy" style={{ color: 'var(--mustard)', marginTop: 16 }} aria-live="polite">{saveMessage}</p> : null}
        </section>

        <section data-scroll-reveal>
          <p className="eyeline">Order history</p>
          <h2 className="display" style={{ marginTop: 12 }}>Previous batches.</h2>

          {userOrders.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 28 }}>
              <Package size={38} color="var(--red)" />
              <h3 className="display" style={{ fontSize: 32, marginTop: 20 }}>No orders yet.</h3>
              <p className="body-copy">Your first batch will appear here after checkout.</p>
              <button type="button" className="button button--primary" onClick={() => navigate('/shop')}>Visit the shop</button>
            </div>
          ) : (
            <div style={{ marginTop: 30, borderTop: '1px solid var(--line-dark)' }}>
              {userOrders.map(order => (
                <article key={order.id} style={{ borderBottom: '1px solid var(--line-dark)', paddingBlock: 26 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--muted-dark)', fontSize: 12, fontWeight: 700 }}>#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="body-copy" style={{ margin: '7px 0 0', fontSize: 13 }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 0', color: statusColor(order.status), fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(order.status) }} /> {order.status}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: 'var(--paper)', fontSize: 22 }}>${order.total.toFixed(2)}</strong>
                      <p className="body-copy" style={{ margin: '6px 0 0', fontSize: 12 }}>{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    {order.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 8, color: 'var(--muted-dark)', fontSize: 13 }}>
                        <span>{item.quantity} x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.trackingNumber ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginTop: 20, borderTop: '1px solid var(--line-dark)', paddingTop: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-dark)', fontSize: 12 }}><Truck size={17} /> {order.trackingNumber}</span>
                      <a className="section-link" href={`${settings.shippingConfig?.trackingBaseUrl}${order.trackingNumber}`} target="_blank" rel="noopener noreferrer">Track <ExternalLink size={14} /></a>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Account;
