import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, Cloud, Database, AlertCircle, DollarSign, Mail, Server, Send, Loader2, Check, HelpCircle, Truck, Share2, Instagram, Facebook, Link as LinkIcon, Settings as SettingsIcon, ChevronDown, ChevronRight, Lightbulb, CheckCircle2, Circle, ExternalLink, Zap, BookOpen } from 'lucide-react';
import { AppSettings, FirebaseConfig, EmailConfig, ShippingConfig } from '../../types';
import { FacebookService, FacebookPage } from '../../services/facebookService';
import { EmailService } from '../../services/emailService';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3 bg-blue-50 text-blue-700 p-4 text-sm rounded-xl border border-blue-100 mt-2">
        <HelpCircle size={18} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{text}</span>
    </div>
);

const HelpGuide = ({ title, steps, tip }: { title: string; steps: string[]; tip?: string }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="mt-3 border border-amber-200 rounded-xl overflow-hidden bg-amber-50/50">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-amber-50 transition">
                <BookOpen size={16} className="text-amber-600 shrink-0" />
                <span className="text-sm font-medium text-amber-800 flex-1">{title}</span>
                {open ? <ChevronDown size={16} className="text-amber-500" /> : <ChevronRight size={16} className="text-amber-500" />}
            </button>
            {open && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <ol className="space-y-2 ml-1">
                        {steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: step }} />
                            </li>
                        ))}
                    </ol>
                    {tip && <p className="text-xs text-amber-700 mt-3 pl-7 italic">{tip}</p>}
                </div>
            )}
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon, description, configured }: { title: string; icon: any; description?: string; configured?: boolean }) => (
    <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-xl ${configured ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-native-black'}`}>
            <Icon size={24} />
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-semibold text-gray-900">{title}</h3>
                {configured !== undefined && (
                    configured ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Ready</span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Setup needed</span>
                    )
                )}
            </div>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
    </div>
);

const Settings = () => {
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState<AppSettings>(settings);
  const [fbConfig, setFbConfig] = useState<Partial<FirebaseConfig>>(settings.firebaseConfig || {});
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(settings.emailConfig || {
    enabled: false, adminEmail: '', fromName: 'Pickle Nick', fromEmail: '', smtpEndpoint: '/api/send-email.php'
  });
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(settings.shippingConfig || {
      carrierName: 'Australia Post',
      trackingBaseUrl: 'https://auspost.com.au/mypost/track/#/details/',
      freeShippingThreshold: 75,
      defaultWeightGrams: 500,
      rates: [
        { maxWeightGrams: 500, standardPrice: 9.50, expressPrice: 15.90 },
        { maxWeightGrams: 1000, standardPrice: 12.50, expressPrice: 19.90 },
        { maxWeightGrams: 3000, standardPrice: 16.00, expressPrice: 26.50 },
        { maxWeightGrams: 5000, standardPrice: 20.00, expressPrice: 33.00 },
        { maxWeightGrams: 10000, standardPrice: 25.00, expressPrice: 42.00 }
      ]
  });
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Facebook Connection State
  const [isConnectingFb, setIsConnectingFb] = useState(false);
  const [fbPages, setFbPages] = useState<FacebookPage[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);

  useEffect(() => {
    setForm(settings);
    setFbConfig(settings.firebaseConfig || {});
    setEmailConfig(settings.emailConfig || {
       enabled: false, adminEmail: '', fromName: 'Pickle Nick', fromEmail: '', smtpEndpoint: '/api/send-email.php'
    });
    setShippingConfig(settings.shippingConfig || {
        carrierName: 'Australia Post',
        trackingBaseUrl: 'https://auspost.com.au/mypost/track/#/details/',
        freeShippingThreshold: 75,
        defaultWeightGrams: 500,
        rates: [
          { maxWeightGrams: 500, standardPrice: 9.50, expressPrice: 15.90 },
          { maxWeightGrams: 1000, standardPrice: 12.50, expressPrice: 19.90 },
          { maxWeightGrams: 3000, standardPrice: 16.00, expressPrice: 26.50 },
          { maxWeightGrams: 5000, standardPrice: 20.00, expressPrice: 33.00 },
          { maxWeightGrams: 10000, standardPrice: 25.00, expressPrice: 42.00 }
        ]
    });
  }, [settings]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    setTimeout(() => {
        try {
            const newSettings: AppSettings = {
              ...form,
              firebaseConfig: fbConfig as FirebaseConfig,
              emailConfig: emailConfig,
              shippingConfig: shippingConfig
            };
            updateSettings(newSettings);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, 600);
  };

  const handleTestEmail = async () => {
      if (!emailConfig.enabled) return alert("Enable email notifications first.");
      if (!emailConfig.adminEmail) return alert("Enter an admin email to receive the test.");
      
      setIsTestingEmail(true);
      try {
          const testSettings = { ...settings, emailConfig };
          const success = await EmailService.sendTestEmail(testSettings);
          if (success) {
              alert(`✔ Test email sent to ${emailConfig.adminEmail}`);
          } else {
              alert(`⚠ Email send failed. Ensure send-email.php is deployed on your SiteGround server and the endpoint URL is correct.`);
          }
      } catch (e: any) {
          alert(`⚠ Test failed: ${e.message || 'Unknown error'}`);
      } finally {
          setIsTestingEmail(false);
      }
  };

  const handleConnectFacebook = async () => {
      if (!form.fbAppId) {
          alert("Please enter and save your Facebook App ID first.");
          return;
      }
      
      setIsConnectingFb(true);
      try {
          await FacebookService.init(form.fbAppId);
          await FacebookService.login();
          const pages = await FacebookService.getPages();
          
          if (pages && pages.length > 0) {
              setFbPages(pages);
              setShowPageSelector(true);
          } else {
              alert("No Facebook Pages found for your account. Please ensure you have created a Business Page.");
          }
      } catch (error: any) {
          console.error("Facebook Connection Error:", error);
          alert(`Failed to connect: ${error.message || 'Unknown error'}`);
      } finally {
          setIsConnectingFb(false);
      }
  };

  const selectFacebookPage = (page: FacebookPage) => {
      setForm({
          ...form,
          fbPageId: page.id,
          fbPageName: page.name,
          fbPageAccessToken: page.access_token
      });
      setShowPageSelector(false);
  };

  const disconnectFacebookPage = () => {
      setForm({
          ...form,
          fbPageId: undefined,
          fbPageName: undefined,
          fbPageAccessToken: undefined
      });
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-native-black mb-2">Settings</h1>
        <p className="text-gray-500">Manage your store configuration and integrations.</p>
      </div>

      {/* ── Quick Setup Checklist ── */}
      {(() => {
        const checks = [
          { label: 'Payments configured', done: !!(form.squareApplicationId && form.squareAccessToken && form.squareLocationId), section: 'Square Payments' },
          { label: 'Shipping rates set', done: (shippingConfig.rates || []).length > 0, section: 'Shipping & Postage' },
          { label: 'Email notifications', done: !!(emailConfig.enabled && emailConfig.adminEmail && emailConfig.fromEmail), section: 'Email Notifications' },
          { label: 'Firebase database', done: !!(fbConfig.apiKey && fbConfig.projectId), section: 'Firebase Persistence' },
        ];
        const doneCount = checks.filter(c => c.done).length;
        const allDone = doneCount === checks.length;
        return (
          <div className={`mb-8 p-6 rounded-2xl border shadow-sm ${allDone ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              {allDone ? <CheckCircle2 size={22} className="text-green-600" /> : <Lightbulb size={22} className="text-amber-600" />}
              <div>
                <h2 className="font-display font-semibold text-gray-900">{allDone ? 'All Set!' : 'Quick Setup Checklist'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{allDone ? 'Your store is fully configured and ready to go.' : `${doneCount} of ${checks.length} integrations ready — complete the items below to go live.`}</p>
              </div>
            </div>
            {!allDone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {checks.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${c.done ? 'bg-white/60 text-gray-500' : 'bg-white text-gray-900 border border-amber-200 shadow-sm'}`}>
                    {c.done ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <Circle size={16} className="text-amber-400 shrink-0" />}
                    <span className={c.done ? 'line-through' : 'font-medium'}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
      
      <div className="space-y-8">

        {/* Inventory Settings */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <SectionHeader title="Inventory Controls" icon={Database} description="Manage stock thresholds and alerts." />
          
          <div className="pl-0 md:pl-14 max-w-2xl">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                    <input 
                        type="number"
                        value={form.lowStockThreshold || 10} 
                        onChange={e => setForm({...form, lowStockThreshold: parseInt(e.target.value)})}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                    />
                    <HelpTip text="When a product's stock drops below this number, it will show a warning on your dashboard." />
                </div>
          </div>
        </div>

        {/* Financial Settings (GST) */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <SectionHeader title="Financial Settings" icon={DollarSign} description="Taxation and currency configuration." />
          
          <div className="pl-0 md:pl-14 max-w-2xl">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                    <div>
                        <span className="block text-sm font-medium text-gray-900">Enable GST Charges</span>
                        <span className="text-xs text-gray-500">Add tax to customer cart totals</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={form.gstEnabled || false} onChange={() => setForm({...form, gstEnabled: !form.gstEnabled})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-native-black/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-native-black"></div>
                    </label>
                </div>
                
                {form.gstEnabled && (
                    <div className="animate-in fade-in slide-in-from-top-2 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={form.gstRate || 10} 
                                onChange={e => setForm({...form, gstRate: parseFloat(e.target.value)})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all pr-8" 
                            />
                            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                        </div>
                    </div>
                )}
          </div>
        </div>

        {/* Square Payment Config */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Square Payments" icon={DollarSign} description="Connect your Square account for payment processing." configured={!!(form.squareApplicationId && form.squareAccessToken && form.squareLocationId)} />

            <div className="pl-0 md:pl-14 max-w-2xl space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application ID</label>
                    <input 
                        value={form.squareApplicationId} 
                        onChange={e => setForm({...form, squareApplicationId: e.target.value})}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                        placeholder="sq0idp-..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                    <input 
                        type="password"
                        value={form.squareAccessToken} 
                        onChange={e => setForm({...form, squareAccessToken: e.target.value})}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                        placeholder="EAAA..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location ID</label>
                    <input 
                        value={form.squareLocationId} 
                        onChange={e => setForm({...form, squareLocationId: e.target.value})}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                        placeholder="L..."
                    />
                </div>
                <HelpTip text="Find these keys in your Square Developer Dashboard." />
                <HelpGuide
                    title="How do I set up Square payments?"
                    steps={[
                        'Go to <strong>developer.squareup.com</strong> and sign in (or create a free account).',
                        'Click <strong>Applications</strong> → <strong>Create Application</strong> and give it a name (e.g. "Pickle Nick Store").',
                        'On the app page, copy the <strong>Sandbox Application ID</strong> (starts with sq0idp-) and paste it above.',
                        'Go to the <strong>Credentials</strong> tab and copy the <strong>Sandbox Access Token</strong> (starts with EAAA).',
                        'Go to the <strong>Locations</strong> tab and copy your <strong>Location ID</strong> (starts with L).',
                        'Paste all three values above, then click <strong>Save Changes</strong> at the bottom of this page.',
                        'When you\'re ready to go live, switch to <strong>Production</strong> credentials in your Square dashboard.'
                    ]}
                    tip="Sandbox mode lets you test payments without real money. Switch to Production when your store is live."
                />
            </div>
        </div>

        {/* Shipping Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Shipping & Postage Rates" icon={Truck} description="Configure carrier, tracking, and weight-based postage rates for Standard and Express delivery." configured={(shippingConfig.rates || []).length > 0} />

            <div className="pl-0 md:pl-14 max-w-3xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Carrier Name</label>
                        <input 
                            value={shippingConfig.carrierName} 
                            onChange={e => setShippingConfig({...shippingConfig, carrierName: e.target.value})}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            placeholder="Australia Post"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tracking URL Base</label>
                        <input 
                            value={shippingConfig.trackingBaseUrl} 
                            onChange={e => setShippingConfig({...shippingConfig, trackingBaseUrl: e.target.value})}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Free Standard Shipping Over ($)</label>
                        <input 
                            type="number" step="1"
                            value={shippingConfig.freeShippingThreshold ?? 75} 
                            onChange={e => setShippingConfig({...shippingConfig, freeShippingThreshold: parseFloat(e.target.value) || 0})}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Item Weight (g)</label>
                        <input 
                            type="number"
                            value={shippingConfig.defaultWeightGrams ?? 500} 
                            onChange={e => setShippingConfig({...shippingConfig, defaultWeightGrams: parseInt(e.target.value) || 500})}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Weight-Based Rate Tiers</label>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                    <th className="p-3 text-left font-medium">Max Weight (g)</th>
                                    <th className="p-3 text-left font-medium">Standard ($)</th>
                                    <th className="p-3 text-left font-medium">Express ($)</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(shippingConfig.rates || []).map((rate, i) => (
                                    <tr key={i} className="border-t border-gray-100">
                                        <td className="p-2"><input type="number" value={rate.maxWeightGrams} onChange={e => { const r = [...(shippingConfig.rates||[])]; r[i] = {...r[i], maxWeightGrams: parseInt(e.target.value)||0}; setShippingConfig({...shippingConfig, rates: r}); }} className="w-full p-1.5 border border-gray-200 rounded text-sm text-center focus:border-native-black outline-none" /></td>
                                        <td className="p-2"><input type="number" step="0.01" value={rate.standardPrice} onChange={e => { const r = [...(shippingConfig.rates||[])]; r[i] = {...r[i], standardPrice: parseFloat(e.target.value)||0}; setShippingConfig({...shippingConfig, rates: r}); }} className="w-full p-1.5 border border-gray-200 rounded text-sm text-center focus:border-native-black outline-none" /></td>
                                        <td className="p-2"><input type="number" step="0.01" value={rate.expressPrice} onChange={e => { const r = [...(shippingConfig.rates||[])]; r[i] = {...r[i], expressPrice: parseFloat(e.target.value)||0}; setShippingConfig({...shippingConfig, rates: r}); }} className="w-full p-1.5 border border-gray-200 rounded text-sm text-center focus:border-native-black outline-none" /></td>
                                        <td className="p-2 text-center"><button title="Remove tier" onClick={() => { const r = [...(shippingConfig.rates||[])]; r.splice(i,1); setShippingConfig({...shippingConfig, rates: r}); }} className="text-red-400 hover:text-red-600 text-xs">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-2 bg-gray-50 border-t border-gray-100">
                            <button onClick={() => setShippingConfig({...shippingConfig, rates: [...(shippingConfig.rates||[]), {maxWeightGrams: 5000, standardPrice: 15, expressPrice: 25}]})} className="text-xs text-native-clay font-medium hover:underline">+ Add Tier</button>
                        </div>
                    </div>
                    <HelpTip text="Rates are matched by total order weight. The first tier whose max weight covers the order is used. Standard shipping becomes free when the cart exceeds the free shipping threshold above. Express always charges." />
                </div>
            </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Email Notifications" icon={Mail} description="Send order confirmations and shipping updates to customers." configured={!!(emailConfig.enabled && emailConfig.adminEmail && emailConfig.fromEmail && emailConfig.smtpPass)} />

            <div className="pl-0 md:pl-14 max-w-2xl">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                    <div>
                        <span className="block text-sm font-medium text-gray-900">Enable Email Notifications</span>
                        <span className="text-xs text-gray-500">Order confirmations, shipping alerts, and admin BCC</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={emailConfig.enabled || false} onChange={() => setEmailConfig({...emailConfig, enabled: !emailConfig.enabled})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-native-black/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-native-black"></div>
                    </label>
                </div>
                
                {emailConfig.enabled && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Your Business Name</label>
                                <input 
                                    value={emailConfig.fromName || ''} 
                                    onChange={e => setEmailConfig({...emailConfig, fromName: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                                    placeholder="Pickle Nick"
                                />
                                <span className="text-xs text-gray-400 mt-1 block">Shown as the sender name on emails</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sending Email Address</label>
                                <input 
                                    type="email"
                                    value={emailConfig.fromEmail || ''} 
                                    onChange={e => {
                                        const email = e.target.value;
                                        const domain = email.includes('@') ? email.split('@')[1] : '';
                                        setEmailConfig({
                                            ...emailConfig, 
                                            fromEmail: email,
                                            smtpHost: domain ? `mail.${domain}` : emailConfig.smtpHost,
                                            smtpUser: email,
                                        });
                                    }}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                                    placeholder="noreply@picklenick.com"
                                />
                                <span className="text-xs text-gray-400 mt-1 block">The email address customers see — must be created in SiteGround first</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notification Email</label>
                                <input 
                                    type="email"
                                    value={emailConfig.adminEmail || ''} 
                                    onChange={e => setEmailConfig({...emailConfig, adminEmail: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                                    placeholder="orders@picklenick.com"
                                />
                                <span className="text-xs text-gray-400 mt-1 block">You'll get a copy of every order email here</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Password</label>
                                <input 
                                    type="password"
                                    value={emailConfig.smtpPass || ''} 
                                    onChange={e => setEmailConfig({...emailConfig, smtpPass: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                                    placeholder="••••••••"
                                />
                                <span className="text-xs text-gray-400 mt-1 block">The password for your sending email (set in SiteGround)</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm text-gray-600">Security:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEmailConfig({...emailConfig, smtpSecure: 'ssl', smtpPort: 465})}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        (emailConfig.smtpSecure || 'ssl') === 'ssl' 
                                            ? 'bg-native-black text-white shadow-sm' 
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    SSL (Recommended)
                                </button>
                                <button
                                    onClick={() => setEmailConfig({...emailConfig, smtpSecure: 'tls', smtpPort: 587})}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        emailConfig.smtpSecure === 'tls' 
                                            ? 'bg-native-black text-white shadow-sm' 
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    TLS
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button 
                                onClick={handleTestEmail}
                                disabled={isTestingEmail}
                                className="px-5 py-2.5 bg-native-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                {isTestingEmail ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send Test Email</>}
                            </button>
                            <span className="text-xs text-gray-400">Sends a test to your admin email</span>
                        </div>

                        <HelpGuide
                            title="How do I set up email?"
                            steps={[
                                'In <strong>SiteGround Site Tools → Email → Accounts</strong>, create an email like <strong>noreply@picklenick.com</strong>.',
                                'Create a second one for yourself, like <strong>orders@picklenick.com</strong>.',
                                'Back here, enter the <strong>sending email</strong> and the <strong>password</strong> you just created.',
                                'Enter your <strong>admin notification email</strong> so you get order copies.',
                                'Click <strong>Send Test Email</strong> — if it arrives, you\'re all set!'
                            ]}
                            tip="The test email goes to your admin notification address. Check spam if it doesn't arrive within a minute."
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Social Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Social Media API" icon={Share2} description="Connect Facebook and Instagram for auto-posting." configured={!!(form.fbAppId && form.fbPageId)} />

            <div className="pl-0 md:pl-14 max-w-2xl space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Facebook size={18} className="text-blue-600" />
                        <h4 className="font-medium text-gray-900">Facebook Graph API</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                            <input 
                                value={form.fbAppId} 
                                onChange={e => setForm({...form, fbAppId: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">App Secret</label>
                            <input 
                                type="password"
                                value={form.fbAppSecret} 
                                onChange={e => setForm({...form, fbAppSecret: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-4">Business Page Connection</h5>
                        
                        {form.fbPageId ? (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                                        <Facebook size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{form.fbPageName || 'Connected Page'}</p>
                                        <p className="text-xs text-gray-500 font-mono">ID: {form.fbPageId}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={disconnectFacebookPage}
                                    className="text-xs font-medium text-red-600 hover:text-red-700 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <div>
                                <button 
                                    onClick={handleConnectFacebook}
                                    disabled={isConnectingFb || !form.fbAppId}
                                    className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-medium hover:bg-[#1877F2]/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                                >
                                    {isConnectingFb ? <><Loader2 size={16} className="animate-spin" /> Connecting...</> : <><LinkIcon size={16} /> Connect Facebook Page</>}
                                </button>
                                <p className="text-xs text-gray-500 mt-2">Enter App ID above first.</p>
                            </div>
                        )}

                        {showPageSelector && fbPages.length > 0 && (
                            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
                                <h6 className="font-semibold text-sm mb-3 text-gray-900">Select a Page to Connect:</h6>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {fbPages.map(page => (
                                        <button 
                                            key={page.id}
                                            onClick={() => selectFacebookPage(page)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-left"
                                        >
                                            {page.picture?.data?.url ? (
                                                <img src={page.picture.data.url} alt={page.name} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><Facebook size={14} /></div>
                                            )}
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{page.name}</p>
                                                <p className="text-xs text-gray-500">{page.category}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setShowPageSelector(false)}
                                    className="mt-4 text-xs text-gray-500 hover:text-gray-900 font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Instagram size={18} className="text-pink-600" />
                        <h4 className="font-medium text-gray-900">Instagram Graph API</h4>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Business ID</label>
                        <input 
                            value={form.instaAppId || ''} 
                            onChange={e => setForm({...form, instaAppId: e.target.value})}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            placeholder="1784..."
                        />
                    </div>
                    <HelpGuide
                        title="How do I connect Facebook & Instagram?"
                        steps={[
                            'Go to <strong>developers.facebook.com</strong> and create a <strong>Facebook Developer</strong> account (it\'s free).',
                            'Click <strong>My Apps → Create App</strong>, choose <strong>Business</strong> type, and name it.',
                            'On the app dashboard, find your <strong>App ID</strong> and <strong>App Secret</strong> — paste them above.',
                            'Click <strong>Save Changes</strong> at the bottom of this page, then click the blue <strong>Connect Facebook Page</strong> button.',
                            'A Facebook popup will ask you to choose which Page to connect — select your business page.',
                            'For Instagram, your Facebook Page must be <strong>linked to an Instagram Business account</strong> in Meta Business Suite.',
                            'Find your Instagram Business ID in <strong>Meta Business Suite → Settings → Accounts → Instagram</strong> and paste it above.'
                        ]}
                        tip="Social media auto-posting is optional. Your store works perfectly fine without it — this just adds convenience."
                    />
                </div>
            </div>
        </div>

        {/* Firebase Persistence */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <SectionHeader title="Firebase Persistence" icon={Cloud} description="Connect Google Firebase for cloud data storage." configured={!!(fbConfig.apiKey && fbConfig.projectId)} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 md:pl-14 max-w-3xl">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
               <input 
                 value={fbConfig.apiKey || ''} 
                 onChange={e => setFbConfig({...fbConfig, apiKey: e.target.value})}
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                 placeholder="AIzaSy..."
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Auth Domain</label>
               <input 
                 value={fbConfig.authDomain || ''} 
                 onChange={e => setFbConfig({...fbConfig, authDomain: e.target.value})}
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                 placeholder="project-id.firebaseapp.com"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
               <input 
                 value={fbConfig.projectId || ''} 
                 onChange={e => setFbConfig({...fbConfig, projectId: e.target.value})}
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                 placeholder="project-id"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Storage Bucket</label>
               <input 
                 value={fbConfig.storageBucket || ''} 
                 onChange={e => setFbConfig({...fbConfig, storageBucket: e.target.value})}
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                 placeholder="project-id.appspot.com"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Messaging Sender ID</label>
               <input 
                 value={fbConfig.messagingSenderId || ''} 
                 onChange={e => setFbConfig({...fbConfig, messagingSenderId: e.target.value})}
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                 placeholder="123456789"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
               <input 
                 value={fbConfig.appId || ''} 
                 onChange={e => setFbConfig({...fbConfig, appId: e.target.value})}
                 className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                 placeholder="1:123456:web:abcdef"
               />
            </div>
          </div>
          <div className="pl-0 md:pl-14 max-w-3xl">
            <HelpGuide
                title="How do I set up Firebase?"
                steps={[
                    'Go to <strong>console.firebase.google.com</strong> and sign in with your Google account.',
                    'Click <strong>Add Project</strong>, give it a name (e.g. "pickle-nick"), and follow the prompts.',
                    'Once your project is created, click the <strong>Web</strong> icon (&lt;/&gt;) to add a web app.',
                    'Firebase will show your config object — copy each value into the matching fields above.',
                    'In the left sidebar, go to <strong>Build → Firestore Database</strong> and click <strong>Create Database</strong>.',
                    'Choose <strong>Start in production mode</strong> and pick the closest server region.',
                    'Click <strong>Save Changes</strong> at the bottom of this page — your data will sync to the cloud automatically!'
                ]}
                tip="Without Firebase, your store data is saved in the browser only. Firebase keeps your products, orders, and settings safe in the cloud."
            />
          </div>
        </div>

        {/* Fixed Save Bar */}
        <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-[#f8f5f2]/95 backdrop-blur-sm border-t border-gray-200 z-30 px-10 py-4 flex justify-end">
            <button 
            onClick={handleSave}
            disabled={saveStatus !== 'idle'}
            className={`
                px-8 py-3 rounded-xl text-sm font-medium transition-all shadow-lg flex items-center gap-2 min-w-[200px] justify-center
                ${saveStatus === 'idle' ? 'bg-native-black text-white hover:bg-gray-800' : ''}
                ${saveStatus === 'saving' ? 'bg-native-black text-white cursor-wait' : ''}
                ${saveStatus === 'success' ? 'bg-green-600 text-white cursor-default' : ''}
                ${saveStatus === 'error' ? 'bg-red-600 text-white cursor-default' : ''}
            `}
            >
                {saveStatus === 'idle' && <><Save size={18} /> Save Changes</>}
                {saveStatus === 'saving' && <><Loader2 size={18} className="animate-spin" /> Saving...</>}
                {saveStatus === 'success' && <><Check size={18} /> Saved</>}
                {saveStatus === 'error' && <><AlertCircle size={18} /> Error</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;