import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, Layout, Info, Phone, Link, Image as ImageIcon, Upload, Wand2, Loader2, Sparkles, User, Palette, X, Edit, Maximize2, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { SiteContent } from '../../types';
import { generateSiteImage } from '../../services/aiService';
import { useAuth } from '@clerk/clerk-react';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-2 text-xs font-sans rounded border border-yellow-200 mb-6">
        <HelpCircle size={14} className="shrink-0 mt-0.5" />
        <span>{text}</span>
    </div>
);

// --- Modal Image Editor ---
const ImageEditorModal = ({ label, value, onClose, onSave }: { label: string, value: string, onClose: () => void, onSave: (val: string) => void }) => {
    const { getToken } = useAuth();
    const [mode, setMode] = useState<'url' | 'upload' | 'ai'>('url');
    const [tempValue, setTempValue] = useState(value);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempValue(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAIGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const token = await getToken() || '';
            const img = await generateSiteImage(prompt, token);
            setTempValue(img);
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Image generation failed.");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-native-black/80 backdrop-blur-sm p-4">
            <div className="bg-native-sand w-full max-w-2xl shadow-2xl border-4 border-native-black flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-native-black/10 bg-white">
                    <h3 className="font-display text-2xl uppercase text-native-black">Editing: {label}</h3>
                    <button onClick={onClose} className="text-native-black hover:text-native-clay"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-fabric-texture">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Preview Section */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-native-earth uppercase tracking-widest font-tribal">Current Visual</label>
                            <div className="aspect-square w-full bg-white border-2 border-native-black p-2 shadow-card flex items-center justify-center overflow-hidden">
                                {tempValue ? (
                                    <img src={tempValue} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon size={48} className="text-native-black/20" />
                                )}
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="space-y-6">
                            <div className="flex bg-white border border-native-black/20 p-1 rounded-sm">
                                <button 
                                    onClick={() => setMode('url')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'url' ? 'bg-native-black text-white' : 'text-native-earth hover:bg-native-sand'}`}
                                >
                                    URL Link
                                </button>
                                <button 
                                    onClick={() => setMode('upload')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'upload' ? 'bg-native-black text-white' : 'text-native-earth hover:bg-native-sand'}`}
                                >
                                    Upload
                                </button>
                                <button 
                                    onClick={() => setMode('ai')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'ai' ? 'bg-native-turquoise text-white' : 'text-native-earth hover:bg-native-sand'}`}
                                >
                                    AI Gen
                                </button>
                            </div>

                            {mode === 'url' && (
                                <div className="space-y-2 animate-in fade-in">
                                    <p className="text-xs text-native-earth">Paste a direct link to an image.</p>
                                    <input 
                                        value={tempValue}
                                        onChange={e => setTempValue(e.target.value)}
                                        className="w-full p-3 border border-native-black/20 font-mono text-xs focus:border-native-black outline-none bg-white"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            )}

                            {mode === 'upload' && (
                                <div className="space-y-2 animate-in fade-in">
                                    <p className="text-xs text-native-earth">Select a file from your device.</p>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-native-black/20 border-dashed rounded-lg cursor-pointer bg-white hover:bg-native-sand/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-native-earth" />
                                            <p className="text-xs text-native-earth uppercase font-bold">Click to upload</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            )}

                            {mode === 'ai' && (
                                <div className="space-y-2 animate-in fade-in">
                                    <div className="flex justify-between items-center">
                                         <p className="text-xs text-native-earth">Describe the image you want.</p>
                                         <span className="text-[10px] bg-native-turquoise text-white px-2 py-0.5 uppercase font-bold">Beta</span>
                                    </div>
                                    <textarea 
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        className="w-full p-3 border border-native-black/20 font-sans text-sm focus:border-native-turquoise outline-none bg-white h-24"
                                        placeholder="E.g. A rustic wooden barrel of pickles in a sunlit barn..."
                                    />
                                    <button 
                                        onClick={handleAIGenerate}
                                        disabled={loading || !prompt}
                                        className="w-full py-3 bg-native-turquoise text-white font-tribal uppercase font-bold text-xs tracking-widest hover:bg-native-black transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        Conjure Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-native-black/10 bg-white flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 font-tribal uppercase font-bold text-native-earth hover:bg-native-sand/50 transition-colors">Cancel</button>
                    <button onClick={() => onSave(tempValue)} className="px-8 py-2 bg-native-black text-white font-tribal uppercase tracking-widest hover:bg-native-clay transition-colors shadow-lg">Confirm Change</button>
                </div>
            </div>
        </div>
    );
};

// --- Visual Card Component ---
const VisualCard = ({ label, value, onEdit, square }: { label: string, value: string, onEdit: () => void, square?: boolean }) => {
    return (
        <div className="group relative bg-white border border-native-black/10 shadow-sm hover:shadow-card hover:-translate-y-1 transition-all duration-300">
            <div className={`${square ? 'aspect-square' : 'aspect-video'} w-full overflow-hidden bg-native-sand/20 relative`}>
                {value ? (
                    <img src={value} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-native-black/20"><ImageIcon size={32} /></div>
                )}
                
                {/* Overlay Action */}
                <div className="absolute inset-0 bg-native-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                        onClick={onEdit}
                        className="bg-white text-native-black px-4 py-2 font-tribal text-xs uppercase font-bold tracking-widest hover:bg-native-turquoise hover:text-white transition-colors flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300"
                    >
                        <Edit size={14} /> Change
                    </button>
                </div>
            </div>
            <div className="p-4 border-t border-native-black/5 bg-white">
                <h4 className="font-tribal text-xs uppercase font-bold text-native-black tracking-wider truncate" title={label}>{label}</h4>
                <p className="text-[10px] text-native-earth/60 truncate mt-1 font-mono">{value?.substring(0, 30)}...</p>
            </div>
        </div>
    );
};

const CMS = () => {
    const { siteContent, updateSiteContent } = useStore();
    const [content, setContent] = useState<SiteContent | null>(null);
    const [activeTab, setActiveTab] = useState<'text' | 'visuals' | 'contact'>('visuals');
    
    // Editor State
    const [editingField, setEditingField] = useState<{ path: string, label: string, value: string } | null>(null);
    
    // Save State
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (siteContent) setContent(siteContent);
    }, [siteContent]);

    const handleSave = async () => {
        if (content) {
            setSaveStatus('saving');
            try {
                await updateSiteContent(content);
                setSaveStatus('success');
                // Reset status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000);
            } catch (error: any) {
                console.error("Save failed", error);
                if (error.message && error.message.includes('quota')) {
                    alert(error.message);
                }
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 4000);
            }
        }
    };

    const handleImageUpdate = (newValue: string) => {
        if (!content || !editingField) return;
        
        // Deep clone to update nested properties safely
        const newContent = JSON.parse(JSON.stringify(content));
        
        // Ugly but effective way to set nested property by path string like "home.heroImage"
        const keys = editingField.path.split('.');
        if (keys.length === 2) {
             // @ts-ignore
            newContent[keys[0]][keys[1]] = newValue;
        }

        setContent(newContent);
        setEditingField(null);
    };

    if (!content) return <div>Loading Scrolls...</div>;

    const visuals = [
        { label: "Brand Logo", path: "general.logoUrl", value: content.general.logoUrl },
        { label: "Favicon / Browser Icon", path: "general.faviconUrl", value: content.general.faviconUrl || content.general.logoUrl, square: true },
        { label: "Founder (The Alchemist)", path: "home.founderImage", value: content.home.founderImage },
        { label: "Gallery Banner (Gravel)", path: "home.galleryImage1", value: content.home.galleryImage1 },
        { label: "Gallery Detail (Rows)", path: "home.galleryImage2", value: content.home.galleryImage2 },
        { label: "Gallery Detail (Sauce)", path: "home.galleryImage3", value: content.home.galleryImage3 },
        { label: "Mascot: Bottom Left", path: "general.mascotUrl1", value: content.general.mascotUrl1 },
        { label: "Mascot: Top Right", path: "general.mascotUrl2", value: content.general.mascotUrl2 },
    ];

    const isConnected = true; // Always connected via Cloudflare Worker

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-end border-b-2 border-native-black/10 pb-6 gap-4">
                <div>
                    <h1 className="text-5xl font-display text-native-black uppercase mb-2">Content Scribe</h1>
                    <div className="flex items-center gap-2">
                        <p className="font-sans text-native-earth text-lg italic">"Rewrite the legend of the pickle."</p>
                        {!isConnected && (
                            <span className="text-xs bg-native-leather text-white px-2 py-1 rounded flex items-center gap-1 font-bold uppercase tracking-wider">
                                <AlertCircle size={12} /> Offline Mode (Local Only)
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saveStatus === 'saving' || saveStatus === 'success'}
                    className={`
                        px-8 py-3 font-display text-xl uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 min-w-[200px] justify-center
                        ${saveStatus === 'idle' ? 'bg-native-clay text-white hover:bg-native-black' : ''}
                        ${saveStatus === 'saving' ? 'bg-native-black text-white cursor-wait' : ''}
                        ${saveStatus === 'success' ? 'bg-native-turquoise text-white cursor-default' : ''}
                        ${saveStatus === 'error' ? 'bg-red-600 text-white' : ''}
                    `}
                >
                    {saveStatus === 'idle' && <><Save size={20} /> Save Changes</>}
                    {saveStatus === 'saving' && <><Loader2 size={20} className="animate-spin" /> Saving...</>}
                    {saveStatus === 'success' && <><Check size={20} /> Saved</>}
                    {saveStatus === 'error' && <><AlertCircle size={20} /> Failed</>}
                </button>
            </div>

            <HelpTip text="Change the text and images on your public website. Remember to click 'Save Changes' at the top when you are done!" />

            {/* Tabs */}
            <div className="flex gap-1 mb-8 border-b border-native-black/20">
                <button 
                    onClick={() => setActiveTab('visuals')}
                    className={`px-6 py-3 font-tribal uppercase text-sm font-bold tracking-widest transition-colors ${activeTab === 'visuals' ? 'bg-native-black text-white' : 'text-native-earth hover:bg-native-sand'}`}
                >
                    <div className="flex items-center gap-2"><ImageIcon size={16} /> Visual Gallery</div>
                </button>
                <button 
                    onClick={() => setActiveTab('text')}
                    className={`px-6 py-3 font-tribal uppercase text-sm font-bold tracking-widest transition-colors ${activeTab === 'text' ? 'bg-native-black text-white' : 'text-native-earth hover:bg-native-sand'}`}
                >
                    <div className="flex items-center gap-2"><Layout size={16} /> Text & Copy</div>
                </button>
                <button 
                    onClick={() => setActiveTab('contact')}
                    className={`px-6 py-3 font-tribal uppercase text-sm font-bold tracking-widest transition-colors ${activeTab === 'contact' ? 'bg-native-black text-white' : 'text-native-earth hover:bg-native-sand'}`}
                >
                    <div className="flex items-center gap-2"><Info size={16} /> Identity & Contact</div>
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* --- VISUALS TAB --- */}
                {activeTab === 'visuals' && (
                    <div className="space-y-8">
                        <div className="bg-white p-6 border-l-4 border-native-turquoise shadow-sm mb-8">
                            <h3 className="font-display text-xl uppercase text-native-black mb-2">Visual Registry</h3>
                            <p className="text-native-earth/80 font-sans text-sm">Manage all imagery across the realm. Click 'Change' to upload files, paste URLs, or conjure new images with AI.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {visuals.map((img) => (
                                <VisualCard 
                                    key={img.path}
                                    label={img.label}
                                    value={img.value}
                                    square={(img as any).square}
                                    onEdit={() => setEditingField(img)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TEXT TAB --- */}
                {activeTab === 'text' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Home Page Text */}
                        <section className="bg-white p-8 shadow-card border-t-4 border-native-turquoise h-full">
                            <div className="flex items-center gap-3 mb-6 text-native-turquoise border-b border-native-black/5 pb-4">
                                <Layout size={24} />
                                <h3 className="font-display text-2xl uppercase text-native-black">Home Page</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Hero Heading</label>
                                    <input 
                                        value={content.home.heroHeading}
                                        onChange={e => setContent({...content, home: {...content.home, heroHeading: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-display text-lg focus:border-native-turquoise outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Hero SubHeading</label>
                                    <input 
                                        value={content.home.heroSubheading}
                                        onChange={e => setContent({...content, home: {...content.home, heroSubheading: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-tribal uppercase focus:border-native-turquoise outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Hero Blurb</label>
                                    <textarea 
                                        value={content.home.heroText}
                                        onChange={e => setContent({...content, home: {...content.home, heroText: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-sans h-32 focus:border-native-turquoise outline-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* About Page */}
                        <section className="bg-white p-8 shadow-card border-t-4 border-native-leather h-full">
                            <div className="flex items-center gap-3 mb-6 text-native-leather border-b border-native-black/5 pb-4">
                                <Link size={24} />
                                <h3 className="font-display text-2xl uppercase text-native-black">Our Story</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Heading</label>
                                    <input 
                                        value={content.about.heading}
                                        onChange={e => setContent({...content, about: {...content.about, heading: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-display text-lg focus:border-native-leather outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Story Text</label>
                                    <textarea 
                                        value={content.about.text}
                                        onChange={e => setContent({...content, about: {...content.about, text: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-sans h-64 focus:border-native-leather outline-none"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* --- CONTACT TAB --- */}
                {activeTab === 'contact' && (
                    <div className="max-w-3xl">
                        <section className="bg-white p-8 shadow-card border-l-4 border-native-black">
                            <div className="flex items-center gap-3 mb-6 text-native-black border-b border-native-black/5 pb-4">
                                <Info size={24} />
                                <h3 className="font-display text-2xl uppercase">Identity & Contact</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Brand Name</label>
                                    <input 
                                        value={content.general.brandName}
                                        onChange={e => setContent({...content, general: {...content.general, brandName: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-display text-lg outline-none focus:border-native-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Tagline</label>
                                    <input 
                                        value={content.general.tagline}
                                        onChange={e => setContent({...content, general: {...content.general, tagline: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-tribal uppercase outline-none focus:border-native-black"
                                    />
                                </div>
                                <div className="md:col-span-2 border-t border-native-black/5 my-2"></div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Site URL</label>
                                    <input 
                                        value={content.general.siteUrl || ''}
                                        onChange={e => setContent({...content, general: {...content.general, siteUrl: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-mono text-sm outline-none focus:border-native-black"
                                        placeholder="https://picklenick.au"
                                    />
                                    <p className="text-[10px] text-native-earth/60 mt-1">Used in canonical URL, Open Graph, and structured data for SEO.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">SEO Description</label>
                                    <textarea 
                                        value={content.general.seoDescription || ''}
                                        onChange={e => setContent({...content, general: {...content.general, seoDescription: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-sans text-sm outline-none focus:border-native-black h-20"
                                        placeholder="Artisan pickles, fermented goods, and bold sauces — handcrafted in small batches and delivered Australia-wide."
                                    />
                                    <p className="text-[10px] text-native-earth/60 mt-1">Shown in Google search results and social media link previews. Aim for 120–160 characters.</p>
                                </div>
                                <div className="md:col-span-2 border-t border-native-black/5 my-2"></div>
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Email</label>
                                    <input 
                                        value={content.general.email}
                                        onChange={e => setContent({...content, general: {...content.general, email: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-sans outline-none focus:border-native-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Phone</label>
                                    <input 
                                        value={content.general.phone}
                                        onChange={e => setContent({...content, general: {...content.general, phone: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-sans outline-none focus:border-native-black"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-native-earth mb-2 uppercase tracking-widest font-tribal">Address</label>
                                    <input 
                                        value={content.general.address}
                                        onChange={e => setContent({...content, general: {...content.general, address: e.target.value}})}
                                        className="w-full p-3 border border-native-black/20 font-sans outline-none focus:border-native-black"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Modal */}
            {editingField && (
                <ImageEditorModal 
                    label={editingField.label}
                    value={editingField.value}
                    onClose={() => setEditingField(null)}
                    onSave={handleImageUpdate}
                />
            )}
        </div>
    );
};

export default CMS;