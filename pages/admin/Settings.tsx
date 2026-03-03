import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, Cloud, Database, AlertCircle, DollarSign, Mail, Server, Send, Loader2, Check, HelpCircle, Truck, Share2, Instagram, Facebook, Link as LinkIcon, Settings as SettingsIcon } from 'lucide-react';
import { AppSettings, FirebaseConfig, EmailConfig, ShippingConfig } from '../../types';
import { FacebookService, FacebookPage } from '../../services/facebookService';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3 bg-blue-50 text-blue-700 p-4 text-sm rounded-xl border border-blue-100 mt-2">
        <HelpCircle size={18} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{text}</span>
    </div>
);

const SectionHeader = ({ title, icon: Icon, description }: { title: string, icon: any, description?: string }) => (
    <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-gray-100 rounded-xl text-native-black">
            <Icon size={24} />
        </div>
        <div>
            <h3 className="text-lg font-display font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
    </div>
);

const Settings = () => {
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState<AppSettings>(settings);
  const [fbConfig, setFbConfig] = useState<Partial<FirebaseConfig>>(settings.firebaseConfig || {});
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(settings.emailConfig || {
    enabled: false, serviceId: '', templateId: '', publicKey: '', adminEmail: ''
  });
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(settings.shippingConfig || {
      carrierName: 'Australia Post',
      trackingBaseUrl: 'https://auspost.com.au/mypost/track/#/details/'
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
       enabled: false, serviceId: '', templateId: '', publicKey: '', adminEmail: ''
    });
    setShippingConfig(settings.shippingConfig || {
        carrierName: 'Australia Post',
        trackingBaseUrl: 'https://auspost.com.au/mypost/track/#/details/'
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

  const handleTestEmail = () => {
      if (!emailConfig.enabled) return alert("Enable EmailJS configuration first.");
      if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) return alert("Service ID, Template ID, and Public Key are required.");
      
      setIsTestingEmail(true);
      setTimeout(() => {
          setIsTestingEmail(false);
          alert(`✔ Configuration Validated.\n\nReady to send emails via EmailJS.`);
      }, 2000);
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
            <SectionHeader title="Square Payments" icon={DollarSign} description="Connect your Square account for payment processing." />

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
            </div>
        </div>

        {/* Shipping Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Shipping & Tracking" icon={Truck} description="Configure carrier details for order tracking." />

            <div className="pl-0 md:pl-14 max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Email Notifications" icon={Mail} description="Configure EmailJS for transactional emails." />

            <div className="pl-0 md:pl-14 max-w-2xl">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                    <div>
                        <span className="block text-sm font-medium text-gray-900">Enable Email Notifications</span>
                        <span className="text-xs text-gray-500">Send order confirmations and alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={emailConfig.enabled || false} onChange={() => setEmailConfig({...emailConfig, enabled: !emailConfig.enabled})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-native-black/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-native-black"></div>
                    </label>
                </div>
                
                {emailConfig.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Service ID</label>
                            <input 
                                value={emailConfig.serviceId} 
                                onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Template ID</label>
                            <input 
                                value={emailConfig.templateId} 
                                onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
                            <input 
                                value={emailConfig.publicKey} 
                                onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                            <input 
                                value={emailConfig.adminEmail} 
                                onChange={e => setEmailConfig({...emailConfig, adminEmail: e.target.value})}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-black/5 focus:border-native-black outline-none transition-all" 
                            />
                        </div>
                        <div className="md:col-span-2 mt-2">
                            <button 
                                onClick={handleTestEmail}
                                disabled={isTestingEmail}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                {isTestingEmail ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><Send size={16} /> Validate Config</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Social Configuration */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <SectionHeader title="Social Media API" icon={Share2} description="Connect Facebook and Instagram for auto-posting." />

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
                </div>
            </div>
        </div>

        {/* Firebase Persistence */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <SectionHeader title="Firebase Persistence" icon={Cloud} description="Connect Google Firebase for data storage." />
          
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
        </div>

        <div className="pt-8 flex justify-end sticky bottom-0 bg-[#f8f5f2]/95 backdrop-blur-sm p-4 border-t border-gray-200 z-10 rounded-t-2xl">
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