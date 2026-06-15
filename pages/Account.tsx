import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Package, Save, Truck, User as UserIcon } from 'lucide-react';
import { Order, User } from '../types';
import { useStore } from '../context/StoreContext';
import NickLogo from '../components/brand/NickLogo';

const statusClass = (status: Order['status']) => {
  if (status === 'delivered') return 'bg-[#5f7f32]';
  if (status === 'shipped') return 'bg-[#f4c56d]';
  return 'bg-native-clay';
};

const Account = () => {
  const { currentUser, orders, updateUser, logoutCustomer, settings } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>({});
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (currentUser) setForm(currentUser);
  }, [currentUser]);

  const userOrders = orders.filter(order =>
    (currentUser?.id && order.userId === currentUser.id) ||
    (currentUser?.email && order.customerEmail === currentUser.email)
  );

  const handleSaveProfile = async () => {
    if (!currentUser || !form) return;
    await updateUser({ ...currentUser, ...form } as User);
    setIsEditing(false);
    setSaveMessage('Profile updated');
    window.setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleLogout = async () => {
    await logoutCustomer();
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#120d0b] text-[#f5f0e6]">
      <section className="relative overflow-hidden px-5 pb-14 pt-32 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(244,197,109,0.16),transparent_32%),linear-gradient(135deg,rgba(244,197,109,0.08)_1px,transparent_1px),#120d0b] bg-[auto,28px_28px,auto]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7 border-b border-[#f4c56d]/18 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <NickLogo size="md" className="mb-6" />
            <p className="font-tribal text-sm font-bold uppercase tracking-[0.28em] text-native-clay">
              Customer Pantry
            </p>
            <h1 className="mt-4 font-display text-[4rem] leading-[0.9] text-[#f4c56d] drop-shadow-[0_8px_26px_rgba(0,0,0,0.65)] sm:text-7xl">
              Your Pantry
            </h1>
            <p className="mt-6 font-sans text-xl font-semibold text-[#f5f0e6]/72">
              Welcome back, {currentUser.name.split(' ')[0]}.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-3 border border-[#f4c56d]/22 px-6 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d] transition hover:border-native-clay hover:bg-native-clay hover:text-white"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </section>

      <section className="bg-[#f1dfb8] px-5 py-16 text-[#120d0b] lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="border border-[#120d0b]/14 bg-[#120d0b] p-7 text-[#f5f0e6] shadow-[0_26px_70px_rgba(18,13,11,0.22)]">
            <h2 className="flex items-center gap-3 font-display text-4xl leading-none text-[#f4c56d]">
              <UserIcon className="text-native-clay" size={30} /> Identity
            </h2>

            <div className="mt-9 space-y-7">
              <div>
                <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/72">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    value={form.name || ''}
                    onChange={event => setForm({ ...form, name: event.target.value })}
                    className="w-full border border-[#f4c56d]/18 bg-[#0b0807] px-5 py-4 font-sans text-lg font-semibold text-[#f5f0e6] outline-none transition focus:border-native-clay"
                  />
                ) : (
                  <p className="font-sans text-lg font-semibold text-[#f5f0e6]/76">{currentUser.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/72">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    value={form.email || ''}
                    onChange={event => setForm({ ...form, email: event.target.value })}
                    className="w-full border border-[#f4c56d]/18 bg-[#0b0807] px-5 py-4 font-sans text-lg font-semibold text-[#f5f0e6] outline-none transition focus:border-native-clay"
                  />
                ) : (
                  <p className="font-sans text-lg font-semibold text-[#f5f0e6]/76">{currentUser.email}</p>
                )}
              </div>

              <div className="border-t border-[#f4c56d]/14 pt-7">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="border border-[#f4c56d]/18 px-5 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/72 transition hover:text-[#f4c56d]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="inline-flex items-center justify-center gap-2 border border-native-clay bg-native-clay px-5 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#a63d2b]"
                    >
                      <Save size={15} /> Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full border border-[#f4c56d]/22 px-5 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
                  >
                    Edit Details
                  </button>
                )}
                {saveMessage && (
                  <p className="mt-5 text-center font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]">
                    {saveMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border border-[#120d0b]/14 bg-[#f7e7c0] p-6 shadow-[0_26px_70px_rgba(18,13,11,0.18)] md:p-8">
            <h2 className="font-display text-4xl leading-none text-[#120d0b]">Order History</h2>

            {userOrders.length === 0 ? (
              <div className="mt-9 border border-dashed border-[#120d0b]/18 bg-[#120d0b]/5 px-6 py-16 text-center">
                <Package size={56} className="mx-auto text-[#120d0b]/22" />
                <p className="mt-6 font-display text-4xl leading-none text-[#120d0b]/56">No orders yet</p>
                <button
                  onClick={() => navigate('/shop')}
                  className="mt-8 border border-[#120d0b] px-7 py-4 font-tribal text-xs font-bold uppercase tracking-[0.22em] transition hover:bg-[#120d0b] hover:text-[#f1dfb8]"
                >
                  Visit the shop
                </button>
              </div>
            ) : (
              <div className="mt-9 space-y-6">
                {userOrders.map(order => (
                  <div key={order.id} className="border border-[#120d0b]/14 bg-[#120d0b] p-6 text-[#f5f0e6]">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div>
                        <p className="font-mono text-sm font-bold text-[#f4c56d]/82">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-2 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/46">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 ${statusClass(order.status)}`} />
                          <span className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]">
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="md:text-right">
                        <p className="font-display text-4xl leading-none text-[#f4c56d]">${order.total.toFixed(2)}</p>
                        <p className="mt-2 font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/46">
                          {order.items.length} items
                        </p>
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-6 border border-[#f4c56d]/16 p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <Truck className="text-native-clay" size={28} />
                            <div>
                              <p className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f4c56d]/72">
                                {settings.shippingConfig?.carrierName || 'Courier'}
                              </p>
                              <p className="mt-1 font-mono text-lg font-bold text-[#f5f0e6]">{order.trackingNumber}</p>
                            </div>
                          </div>
                          <a
                            href={`${settings.shippingConfig?.trackingBaseUrl}${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 border border-[#f4c56d]/22 px-5 py-3 font-tribal text-xs font-bold uppercase tracking-[0.2em] text-[#f4c56d] transition hover:bg-[#f4c56d] hover:text-[#120d0b]"
                          >
                            Track <ExternalLink size={15} />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 border-t border-[#f4c56d]/14 pt-5">
                      <p className="font-tribal text-xs font-bold uppercase tracking-[0.22em] text-[#f5f0e6]/42">Jar list</p>
                      <div className="mt-4 space-y-3">
                        {order.items.map((item, index) => (
                          <div key={`${item.productId}-${index}`} className="flex justify-between gap-4 font-sans text-sm font-semibold text-[#f5f0e6]/72">
                            <span>{item.quantity} x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Account;
