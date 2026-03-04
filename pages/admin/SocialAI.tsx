import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { generateSocialContent, generateMarketingImage, analyzePostTimes, generateRecommendations, generateSmartSchedule } from '../../services/geminiService';
import type { SmartScheduledPostResult } from '../../services/geminiService';
import { SocialPost, ContentCalendarStats } from '../../types';
import { ToastProvider, useToast } from '../../components/Toast';
import {
  Sparkles, Settings, Calendar, BarChart3, Wand2, Image as ImageIcon,
  Loader2, Trash2, Facebook, Instagram, CheckCircle, Zap, Save, X, Brain,
  ChevronLeft, ChevronRight, Clock, Edit2, Eye, Plus
} from 'lucide-react';

const DEFAULT_STATS: ContentCalendarStats = {
  followers: 500,
  reach: 2000,
  engagement: 4.5,
  postsLast30Days: 8
};

interface BusinessProfile {
  name: string;
  type: string;
  description: string;
  tone: string;
  location: string;
}

const DEFAULT_PROFILE: BusinessProfile = {
  name: 'Pickle Nick',
  type: 'artisan pickle business',
  description: 'Handcrafted pickles and sauces with bold, authentic flavors.',
  tone: 'Witty, elegant, slightly humorous, and appetizing',
  location: 'Australia'
};

const SocialAIDashboard = () => {
  const { posts, addPost, deletePost } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'create' | 'calendar' | 'smart' | 'insights' | 'settings'>('create');

  // Profile & Stats
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('pn_social_profile');
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
  });
  const [stats, setStats] = useState<ContentCalendarStats>(() => {
    const saved = localStorage.getItem('pn_social_stats');
    return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
  });

  // Persist profile & stats
  useEffect(() => { localStorage.setItem('pn_social_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('pn_social_stats', JSON.stringify(stats)); }, [stats]);

  // Content Generator State
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'instagram'>('instagram');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Smart Schedule State
  const [smartPosts, setSmartPosts] = useState<SmartScheduledPostResult[]>([]);
  const [smartStrategy, setSmartStrategy] = useState('');
  const [isSmartGenerating, setIsSmartGenerating] = useState(false);
  const [smartCount, setSmartCount] = useState(7);

  // Insights State
  const [recommendations, setRecommendations] = useState('');
  const [bestTimes, setBestTimes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // API Key
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('pn_gemini_key') || '');
  const hasApiKey = !!localStorage.getItem('pn_gemini_key');

  // ── Content Generation ──
  const handleGenerate = async () => {
    if (!topic.trim()) { toast('Enter a topic first.', 'warning'); return; }
    if (!hasApiKey) { toast('Set your Gemini API key in Settings first.', 'warning'); return; }
    setIsGenerating(true);
    try {
      const result = await generateSocialContent(topic, platform);
      setGeneratedContent(result.content);
      setGeneratedHashtags(result.hashtags || []);
    } catch (e: any) {
      toast(`Generation failed: ${e?.message?.substring(0, 80) || 'Unknown error'}`, 'error');
    }
    setIsGenerating(false);
  };

  const handleGenerateImage = async () => {
    if (!topic.trim()) { toast('Enter a topic first.', 'warning'); return; }
    if (!hasApiKey) { toast('Set your Gemini API key in Settings first.', 'warning'); return; }
    setIsGeneratingImage(true);
    try {
      const img = await generateMarketingImage(`${profile.type}: ${topic}`);
      if (img) setGeneratedImage(img);
      else toast('Image generation failed. Try again.', 'error');
    } catch {
      toast('Image generation failed.', 'error');
    }
    setIsGeneratingImage(false);
  };

  const handleSavePost = async () => {
    if (!generatedContent) { toast('Generate content first.', 'warning'); return; }
    const post: SocialPost = {
      id: `sp_${Date.now()}`,
      platform,
      content: generatedContent,
      hashtags: generatedHashtags,
      scheduledTime: scheduleDate || new Date().toISOString(),
      status: scheduleDate ? 'scheduled' : 'draft',
      imageUrl: generatedImage || undefined,
      topic
    };
    await addPost(post);
    toast(`Post ${scheduleDate ? 'scheduled' : 'saved as draft'}!`);
    setGeneratedContent('');
    setGeneratedHashtags([]);
    setGeneratedImage(null);
    setTopic('');
    setScheduleDate('');
  };

  // ── Smart Schedule ──
  const handleSmartSchedule = async () => {
    if (!hasApiKey) { toast('Set your Gemini API key in Settings first.', 'warning'); return; }
    setIsSmartGenerating(true);
    try {
      const result = await generateSmartSchedule(profile.name, profile.type, profile.tone, stats, smartCount);
      setSmartPosts(result.posts);
      setSmartStrategy(result.strategy);
    } catch (e: any) {
      toast(`Smart schedule failed: ${e?.message?.substring(0, 80) || 'Unknown'}`, 'error');
    }
    setIsSmartGenerating(false);
  };

  const handleAcceptSmartPosts = async () => {
    for (const sp of smartPosts) {
      const newPost: SocialPost = {
        id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        platform: sp.platform as SocialPost['platform'],
        content: sp.content,
        hashtags: sp.hashtags,
        scheduledTime: sp.scheduledFor,
        status: 'scheduled',
        imagePrompt: sp.imagePrompt,
        reasoning: sp.reasoning,
        pillar: sp.pillar,
        topic: sp.topic
      };
      await addPost(newPost);
    }
    toast(`${smartPosts.length} posts added to calendar!`);
    setSmartPosts([]);
    setSmartStrategy('');
  };

  // ── Insights ──
  const handleAnalyze = async () => {
    if (!hasApiKey) { toast('Set your Gemini API key in Settings first.', 'warning'); return; }
    setIsAnalyzing(true);
    try {
      const [recs, times] = await Promise.all([
        generateRecommendations(profile.name, profile.type, stats),
        analyzePostTimes(profile.type, profile.location)
      ]);
      setRecommendations(recs || '');
      setBestTimes(times || '');
    } catch {
      toast('Analysis failed.', 'error');
    }
    setIsAnalyzing(false);
  };

  // ── Delete Post ──
  const handleDeletePost = async (id: string) => {
    await deletePost(id);
    toast('Post deleted.');
  };

  // ── Tab Config ──
  const tabs = [
    { id: 'create' as const, label: 'Create', icon: Wand2 },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'smart' as const, label: 'Smart AI', icon: Brain },
    { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-amber-500" size={28} />
            <div>
              <h1 className="text-3xl font-display text-native-black">Social Spirit</h1>
              <p className="text-sm text-gray-400">{profile.name}</p>
            </div>
          </div>
          <div className="text-xs">
            {hasApiKey ? (
              <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <CheckCircle size={14} /> AI Active
              </span>
            ) : (
              <span className="text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">No API Key</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <nav className="border-b border-gray-200 mb-8 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ═══ CREATE TAB ═══ */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2"><Wand2 className="text-amber-500" size={22} /> AI Content Generator</h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Topic / Prompt</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Weekend sale, new product launch, behind the scenes..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 resize-y min-h-[80px] outline-none focus:border-native-black"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-native-black"
                title="Platform"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
              <button onClick={handleGenerate} disabled={isGenerating} className="bg-native-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-md">
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                Generate Text
              </button>
              <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-md">
                {isGeneratingImage ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                Image
              </button>
            </div>
          </div>

          {/* Generated Output */}
          {generatedContent && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
                  {platform === 'instagram' ? <Instagram size={18} className="text-pink-500" /> : <Facebook size={18} className="text-blue-500" />}
                  Generated Post
                </h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{generatedContent}</div>
              {generatedHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generatedHashtags.map((tag, i) => (
                    <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 font-medium">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                  ))}
                </div>
              )}
              {generatedImage && (
                <img src={generatedImage} alt="Generated" className="w-full max-w-sm rounded-xl border border-gray-200 shadow-sm" />
              )}
              <div className="flex flex-wrap gap-3 items-end pt-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Schedule (optional)</label>
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} title="Schedule date and time" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm outline-none focus:border-native-black" />
                </div>
                <button onClick={handleSavePost} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md transition">
                  <Save size={16} /> {scheduleDate ? 'Schedule' : 'Save Draft'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CALENDAR TAB ═══ */}
      {activeTab === 'calendar' && <CalendarView posts={posts} onDelete={handleDeletePost} onCreateClick={() => setActiveTab('create')} />}

      {/* ═══ SMART AI TAB ═══ */}
      {activeTab === 'smart' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2"><Brain className="text-amber-500" size={22} /> Smart AI Scheduler</h2>
          <p className="text-gray-500">Let AI plan your entire content calendar for the next 2 weeks — optimized for engagement, timing, and variety.</p>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Posts to Generate</label>
                <select value={smartCount} onChange={e => setSmartCount(Number(e.target.value))} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm outline-none focus:border-native-black" title="Post count">
                  <option value={5}>5 posts</option>
                  <option value={7}>7 posts</option>
                  <option value={10}>10 posts</option>
                  <option value={14}>14 posts</option>
                </select>
              </div>
              <button onClick={handleSmartSchedule} disabled={isSmartGenerating} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-md">
                {isSmartGenerating ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                Generate Schedule
              </button>
            </div>

            {smartStrategy && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-800 text-sm mb-1">Strategy</h4>
                <p className="text-sm text-gray-700">{smartStrategy}</p>
              </div>
            )}
          </div>

          {smartPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-gray-900">{smartPosts.length} Posts Generated</h3>
                <button onClick={handleAcceptSmartPosts} className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md transition">
                  <CheckCircle size={16} /> Accept All & Add to Calendar
                </button>
              </div>
              {smartPosts.map((sp, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {sp.platform === 'instagram' ? <Instagram size={14} className="text-pink-500" /> : <Facebook size={14} className="text-blue-500" />}
                    <span className="text-xs text-gray-400">{new Date(sp.scheduledFor).toLocaleDateString()} {new Date(sp.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {sp.pillar && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">{sp.pillar}</span>}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{sp.content}</p>
                  <div className="flex flex-wrap gap-1">
                    {sp.hashtags.map((t, j) => <span key={j} className="text-[10px] text-amber-600 font-medium">{t}</span>)}
                  </div>
                  {sp.reasoning && <p className="text-xs text-gray-400 mt-2 italic">{sp.reasoning}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INSIGHTS TAB ═══ */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2"><BarChart3 className="text-amber-500" size={22} /> AI Insights</h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-gray-900">Your Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Followers', key: 'followers' as const },
                { label: 'Monthly Reach', key: 'reach' as const },
                { label: 'Engagement %', key: 'engagement' as const },
                { label: 'Posts (30d)', key: 'postsLast30Days' as const }
              ].map(s => (
                <div key={s.key}>
                  <label className="text-xs text-gray-500 block mb-1">{s.label}</label>
                  <input
                    type="number"
                    value={stats[s.key]}
                    onChange={e => setStats(prev => ({ ...prev, [s.key]: Number(e.target.value) }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm outline-none focus:border-native-black"
                  />
                </div>
              ))}
            </div>
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-native-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md transition">
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <BarChart3 size={16} />}
              Analyze & Recommend
            </button>
          </div>

          {recommendations && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-semibold text-amber-600 mb-3">Recommendations</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{recommendations}</div>
            </div>
          )}

          {bestTimes && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-semibold text-amber-600 mb-3">Best Posting Times</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{bestTimes}</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2"><Settings className="text-amber-500" size={22} /> Settings</h2>

          {/* API Key */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" /> Gemini API Key</h3>
            <p className="text-xs text-gray-500">Powers all AI features. Get a free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Google AI Studio</a>.</p>
            <div className="flex gap-2 max-w-lg">
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Paste your API key..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm outline-none focus:border-native-black"
              />
              <button
                onClick={() => {
                  localStorage.setItem('pn_gemini_key', apiKeyInput);
                  toast('API Key saved! AI features are now active.');
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                Save
              </button>
            </div>
            {hasApiKey && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Key configured</p>}
          </div>

          {/* Business Profile */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-gray-900">Business Profile</h3>
            <p className="text-xs text-gray-500">AI uses this to tailor content to your brand.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Business Name</label>
                <input value={profile.name} onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm outline-none focus:border-native-black" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Business Type</label>
                <input value={profile.type} onChange={e => setProfile(prev => ({ ...prev, type: e.target.value }))} placeholder="e.g., cafe, gym, retail store" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm outline-none focus:border-native-black" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Location</label>
                <input value={profile.location} onChange={e => setProfile(prev => ({ ...prev, location: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm outline-none focus:border-native-black" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tone / Voice</label>
                <input value={profile.tone} onChange={e => setProfile(prev => ({ ...prev, tone: e.target.value }))} placeholder="e.g., Casual and fun, Professional, Edgy" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm outline-none focus:border-native-black" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Business Description</label>
              <textarea value={profile.description} onChange={e => setProfile(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your business for better AI results..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm min-h-[60px] outline-none focus:border-native-black" />
            </div>
          </div>

          {/* Data */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-gray-900">Data</h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const data = JSON.stringify({ posts, profile, stats }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `social-spirit-export-${new Date().toISOString().split('T')[0]}.json`;
                  a.click(); URL.revokeObjectURL(url);
                  toast('Data exported!');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Export All Data
              </button>
              <button
                onClick={async () => {
                  if (confirm('Delete all social posts? This cannot be undone.')) {
                    for (const p of posts) { await deletePost(p.id); }
                    toast('All posts cleared.');
                  }
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 transition"
              >
                Clear All Posts
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Full-Featured Calendar Component
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarView = ({ posts, onDelete, onCreateClick }: { posts: SocialPost[]; onDelete: (id: string) => void; onCreateClick: () => void }) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const goToToday = () => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); setSelectedDate(toKey(today)); };
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = toKey(today);

  // Build a map: dateKey -> posts[]
  const postsByDate: Record<string, SocialPost[]> = {};
  posts.forEach(p => {
    const d = new Date(p.scheduledTime);
    const key = toKey(d);
    if (!postsByDate[key]) postsByDate[key] = [];
    postsByDate[key].push(p);
  });

  // Build calendar grid cells
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  const cells: { day: number; key: string; inMonth: boolean }[] = [];
  // Leading days from previous month
  const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLast - i;
    const mo = viewMonth === 0 ? 12 : viewMonth;
    const yr = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, key: `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, inMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, inMonth: true });
  }
  // Trailing days to fill to 6 rows (42 cells) or at least full rows
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const mo = viewMonth === 11 ? 1 : viewMonth + 2;
      const yr = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, key: `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, inMonth: false });
    }
  }

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] || []) : [];

  // Stats for month
  const monthPosts = posts.filter(p => {
    const d = new Date(p.scheduledTime);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const scheduledCount = monthPosts.filter(p => p.status === 'scheduled').length;
  const draftCount = monthPosts.filter(p => p.status === 'draft').length;
  const publishedCount = monthPosts.filter(p => p.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-semibold flex items-center gap-2"><Calendar className="text-amber-500" size={22} /> Content Calendar</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} title="Grid view" className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar size={14} />
            </button>
            <button onClick={() => setViewMode('list')} title="List view" className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BarChart3 size={14} />
            </button>
          </div>
          <button onClick={onCreateClick} className="bg-native-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm transition">
            <Plus size={14} /> New Post
          </button>
        </div>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-gray-900">{monthPosts.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Posts</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-blue-700">{scheduledCount}</p>
          <p className="text-xs text-blue-400 mt-1">Scheduled</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-gray-500">{draftCount}</p>
          <p className="text-xs text-gray-400 mt-1">Drafts</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-green-700">{publishedCount}</p>
          <p className="text-xs text-green-400 mt-1">Published</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} title="Previous month" className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20} className="text-gray-600" /></button>
          <div className="text-center">
            <h3 className="text-lg font-display font-semibold text-gray-900">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
            <button onClick={goToToday} className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-0.5">Today</button>
          </div>
          <button onClick={nextMonth} title="Next month" className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={20} className="text-gray-600" /></button>
        </div>

        {viewMode === 'grid' ? (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="text-center py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {cells.map((cell, idx) => {
                const dayPosts = postsByDate[cell.key] || [];
                const isToday = cell.key === todayKey;
                const isSelected = cell.key === selectedDate;
                const hasIG = dayPosts.some(p => p.platform === 'instagram');
                const hasFB = dayPosts.some(p => p.platform === 'facebook');

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(isSelected ? null : cell.key)}
                    className={`relative min-h-[80px] md:min-h-[100px] p-2 border-b border-r border-gray-100 text-left transition-all hover:bg-amber-50/40 group
                      ${!cell.inMonth ? 'bg-gray-50/50' : 'bg-white'}
                      ${isSelected ? 'ring-2 ring-inset ring-amber-400 bg-amber-50/60' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium block mb-1 ${
                      isToday ? 'bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center' :
                      !cell.inMonth ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {cell.day}
                    </span>

                    {/* Post indicators */}
                    {dayPosts.length > 0 && (
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 3).map(p => (
                          <div key={p.id} className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate
                            ${p.status === 'published' ? 'bg-green-100 text-green-700' :
                              p.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                            {p.platform === 'instagram' ? <Instagram size={9} className="shrink-0" /> : <Facebook size={9} className="shrink-0" />}
                            <span className="truncate hidden md:inline">{p.topic || p.content.slice(0, 20)}</span>
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[10px] text-gray-400 font-medium pl-1">+{dayPosts.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {/* Dot indicators for mobile */}
                    {dayPosts.length > 0 && (
                      <div className="flex gap-0.5 mt-1 md:hidden">
                        {hasIG && <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>}
                        {hasFB && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* List View */
          <div className="divide-y divide-gray-100">
            {monthPosts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts this month.</p>
              </div>
            ) : (
              [...monthPosts]
                .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                .map(post => (
                  <div key={post.id} className="px-6 py-4 flex gap-4 items-start hover:bg-gray-50 transition group">
                    {post.imageUrl && <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {post.platform === 'instagram' ? <Instagram size={13} className="text-pink-500" /> : <Facebook size={13} className="text-blue-500" />}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          post.status === 'published' ? 'bg-green-50 text-green-700 border border-green-200' :
                          post.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>{post.status}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{new Date(post.scheduledTime).toLocaleDateString()} {new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {post.pillar && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">{post.pillar}</span>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                      {post.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.hashtags.slice(0, 5).map((t, i) => <span key={i} className="text-[10px] text-amber-600 font-medium">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => onDelete(post.id)} className="text-red-400 hover:text-red-600 p-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete post">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDate && viewMode === 'grid' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setSelectedDate(null)} title="Close" className="p-1.5 hover:bg-gray-200 rounded-lg transition"><X size={16} className="text-gray-500" /></button>
            </div>
          </div>

          {selectedPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm mb-3">No posts on this day.</p>
              <button onClick={onCreateClick} className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1 mx-auto">
                <Plus size={14} /> Create a post
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {selectedPosts
                .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                .map(post => (
                  <div key={post.id} className="px-6 py-4 group">
                    <div className="flex gap-4 items-start">
                      {post.imageUrl && <img src={post.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-100 shadow-sm" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {post.platform === 'instagram' ? <Instagram size={15} className="text-pink-500" /> : <Facebook size={15} className="text-blue-500" />}
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            post.status === 'published' ? 'bg-green-50 text-green-700 border border-green-200' :
                            post.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>{post.status}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {post.pillar && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">{post.pillar}</span>}
                          {post.topic && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-medium">{post.topic}</span>}
                        </div>

                        {/* Expandable content */}
                        <div
                          className={`text-sm text-gray-700 leading-relaxed cursor-pointer ${expandedPostId === post.id ? 'whitespace-pre-wrap' : 'line-clamp-3'}`}
                          onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                        >
                          {post.content}
                        </div>
                        {post.content.length > 150 && (
                          <button
                            onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-1 flex items-center gap-1"
                          >
                            <Eye size={11} /> {expandedPostId === post.id ? 'Show less' : 'Read more'}
                          </button>
                        )}

                        {post.hashtags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {post.hashtags.map((tag, i) => (
                              <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                            ))}
                          </div>
                        )}

                        {post.reasoning && (
                          <p className="text-xs text-gray-400 mt-2 italic flex items-center gap-1"><Brain size={11} /> {post.reasoning}</p>
                        )}
                      </div>

                      <button onClick={() => onDelete(post.id)} className="text-red-400 hover:text-red-600 p-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete post">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SocialAI = () => (
  <ToastProvider>
    <SocialAIDashboard />
  </ToastProvider>
);

export default SocialAI;