import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { generateSocialContent, generateMarketingImage, analyzePostTimes, generateRecommendations, generateSmartSchedule } from '../../services/aiService';
import type { SmartScheduledPostResult } from '../../services/aiService';
import { SocialPost, ContentCalendarStats } from '../../types';
import { useAuth } from '@clerk/react';
import { ToastProvider, useToast } from '../../components/Toast';
import {
  Sparkles, Settings, Calendar, BarChart3, Wand2, Image as ImageIcon,
  Loader2, Trash2, Facebook, Instagram, CheckCircle, Zap, Save, X, Brain,
  ChevronLeft, ChevronRight, Clock, Edit2, Eye, Plus, Send, Link2, Link2Off,
  RefreshCw, TrendingUp, Users, Activity, AlertTriangle
} from 'lucide-react';
import { FacebookService } from '../../services/facebookService';

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
  const { posts, addPost, deletePost, settings } = useStore();
  const { toast } = useToast();
  const { getToken } = useAuth();
  const tok = () => getToken().then(t => t ?? '');
  const [activeTab, setActiveTab] = useState<'create' | 'calendar' | 'smart' | 'insights' | 'settings'>('smart');

  // Profile & Stats
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('pn_social_profile');
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
  });
  const [stats, setStats] = useState<ContentCalendarStats>(() => {
    const saved = localStorage.getItem('pn_social_stats');
    return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
  });

  // Persist profile & stats to localStorage
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
  const [saturationMode, setSaturationMode] = useState(false);
  const [smartCount, setSmartCount] = useState(7);

  // Smart post image generation
  const [smartPostImages, setSmartPostImages] = useState<Record<number, string>>({});
  const [autoGenSet, setAutoGenSet] = useState<Set<number>>(new Set()); // all pending
  const [currentGenIdx, setCurrentGenIdx] = useState<number | null>(null);  // actively generating
  const [imgGenDone, setImgGenDone] = useState(0); // completed count
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIdx, setUploadTargetIdx] = useState<number | null>(null);

  const autoGenerateAllImages = async (posts: SmartScheduledPostResult[]) => {
    const token = await tok();
    const allIdxs = new Set(posts.map((_, i) => i));
    setAutoGenSet(allIdxs);
    setImgGenDone(0);
    for (let i = 0; i < posts.length; i++) {
      const prompt = posts[i].imagePrompt || posts[i].topic;
      setCurrentGenIdx(i);
      if (!prompt) {
        setAutoGenSet(prev => { const s = new Set(prev); s.delete(i); return s; });
        setImgGenDone(d => d + 1);
        continue;
      }
      try {
        const img = await generateMarketingImage(prompt, token);
        if (img) setSmartPostImages(prev => ({ ...prev, [i]: img }));
      } catch { /* silently skip failed images */ }
      setAutoGenSet(prev => { const s = new Set(prev); s.delete(i); return s; });
      setImgGenDone(d => d + 1);
    }
    setCurrentGenIdx(null);
  };

  const handleUploadImage = (idx: number) => {
    setUploadTargetIdx(idx);
    uploadFileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetIdx === null) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setSmartPostImages(prev => ({ ...prev, [uploadTargetIdx]: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setUploadTargetIdx(null);
  };

  // Generation ticker
  const TICKER_STEPS_NORMAL = [
    { label: 'Analysing your brand profile & location...', pct: 5 },
    { label: 'Researching best posting times for your audience...', pct: 15 },
    { label: 'Identifying top content pillars for your industry...', pct: 25 },
    { label: 'Studying hashtag themes & trending topics...', pct: 35 },
    { label: 'Determining ideal platform mix & image aesthetic...', pct: 45 },
    { label: 'Building strategy from research insights...', pct: 55 },
    { label: 'Writing post captions with your brand tone...', pct: 65 },
    { label: 'Scheduling at researched peak engagement times...', pct: 75 },
    { label: 'Crafting image prompts for each post...', pct: 83 },
    { label: 'Weaving in researched hashtags...', pct: 90 },
    { label: 'Almost there — finalising your calendar...', pct: 96 },
  ];
  const TICKER_STEPS_SATURATION = [
    { label: 'Activating saturation mode — maximum volume campaign...', pct: 5 },
    { label: 'Researching peak intra-day posting windows...', pct: 12 },
    { label: 'Mapping 7-day blitz schedule (3-5 posts/day)...', pct: 22 },
    { label: 'Building 7-pillar content variety matrix...', pct: 32 },
    { label: 'Calculating platform saturation split...', pct: 42 },
    { label: 'Engineering anti-fatigue content rotation...', pct: 52 },
    { label: 'Writing high-frequency captions with varied formats...', pct: 63 },
    { label: 'Spacing posts across all daily time windows...', pct: 73 },
    { label: 'Crafting unique image prompts for every post...', pct: 82 },
    { label: 'Loading niche + broad hashtag mix per post...', pct: 90 },
    { label: 'Finalising your 7-day saturation campaign...', pct: 96 },
  ];
  const TICKER_STEPS = saturationMode ? TICKER_STEPS_SATURATION : TICKER_STEPS_NORMAL;
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    if (!isSmartGenerating) { setTickerIdx(0); return; }
    const id = setInterval(() => {
      setTickerIdx(prev => (prev < TICKER_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(id);
  }, [isSmartGenerating]);

  // Insights State
  const [recommendations, setRecommendations] = useState('');
  const [bestTimes, setBestTimes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Facebook connection (from global settings)
  const fbConnected = !!(settings?.fbPageId && settings?.fbPageAccessToken);
  const fbPageName = settings?.fbPageName || '';
  const [isPublishing, setIsPublishing] = useState(false);

  // Live Facebook Stats
  interface LiveFbStats {
    fanCount: number;
    followersCount: number;
    reach28d: number;
    engagedUsers28d: number;
    engagementRate: number;
  }
  const [liveStats, setLiveStats] = useState<LiveFbStats | null>(null);
  const [isPullingStats, setIsPullingStats] = useState(false);
  const [lastPulled, setLastPulled] = useState<Date | null>(null);
  const [publisherRunning, setPublisherRunning] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<{ published: number; failed: number; message: string; errors: string[]; time: Date } | null>(null);

  // AI is proxied through Cloudflare Worker — no client-side API key needed
  const hasApiKey = true;

  // ── Pull Facebook Live Stats ──
  const handlePullStats = async () => {
    if (!settings?.fbPageId || !settings?.fbPageAccessToken) {
      toast('Connect a Facebook page in Settings first.', 'warning');
      return;
    }
    setIsPullingStats(true);
    try {
      const data = await FacebookService.getPageStats(settings.fbPageId, settings.fbPageAccessToken);
      setLiveStats(data);
      setLastPulled(new Date());
      // Sync into AI stats so insights use real numbers
      setStats(prev => ({
        ...prev,
        followers: data.followersCount || data.fanCount,
        reach: data.reach28d,
        engagement: data.engagementRate,
      }));
      toast('Live stats updated from Facebook!', 'success');
    } catch (e: any) {
      toast(`Stats pull failed: ${e?.message?.substring(0, 100) || 'Unknown error'}`, 'error');
    }
    setIsPullingStats(false);
  };

  // ── Run Publisher Now ──
  const handleRunPublisher = async () => {
    setPublisherRunning(true);
    try {
      const token = await tok();
      const res = await fetch('/api/publish', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const result = { published: data.published ?? 0, failed: data.failed ?? 0, message: data.message || '', errors: data.errors || [], time: new Date() };
      setLastRunResult(result);
      if (result.failed > 0) {
        toast(`${result.failed} post(s) failed to publish. Check Calendar for details.`, 'error');
      } else if (result.published > 0) {
        toast(`Published ${result.published} post(s) to Facebook!`, 'success');
      } else {
        toast(result.message || 'No posts due right now.', 'info');
      }
    } catch (e: any) {
      toast(`Publisher error: ${e?.message?.substring(0, 80) || 'Unknown'}`, 'error');
    }
    setPublisherRunning(false);
  };

  // ── Content Generation ──
  const handleGenerate = async () => {
    if (!topic.trim()) { toast('Enter a topic first.', 'warning'); return; }
    setIsGenerating(true);
    try {
      const token = await tok();
      const result = await generateSocialContent(topic, platform, token, profile.name, profile.type, profile.tone);
      setGeneratedContent(result.content);
      setGeneratedHashtags(result.hashtags || []);
    } catch (e: any) {
      toast(`Generation failed: ${e?.message?.substring(0, 80) || 'Unknown error'}`, 'error');
    }
    setIsGenerating(false);
  };

  const handlePublishToFacebook = async () => {
    if (!settings?.fbPageId || !settings?.fbPageAccessToken) {
      toast('Facebook page not connected. Go to Settings to connect.', 'warning');
      return;
    }
    setIsPublishing(true);
    try {
      await FacebookService.init(settings.fbAppId);
      const fullText = generatedHashtags.length > 0
        ? `${generatedContent}\n\n${generatedHashtags.join(' ')}`
        : generatedContent;
      await FacebookService.postToPage(settings.fbPageId, settings.fbPageAccessToken, fullText, generatedImage || undefined);
      toast('Published to Facebook!', 'success');
    } catch (e: any) {
      toast(`Publish failed: ${e?.message?.substring(0, 100) || 'Unknown error'}`, 'error');
    }
    setIsPublishing(false);
  };

  const handleGenerateImage = async () => {
    if (!topic.trim()) { toast('Enter a topic first.', 'warning'); return; }
    setIsGeneratingImage(true);
    try {
      const token = await tok();
      const img = await generateMarketingImage(`${profile.type}: ${topic}`, token);
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
    const fbActive = !!(settings?.fbPageId && settings?.fbPageAccessToken);
    const igActive = !!(settings?.instaAppId);
    const activePlatforms = (fbActive || igActive)
      ? { facebook: fbActive, instagram: igActive }
      : { facebook: true, instagram: true };
    setIsSmartGenerating(true);
    setSmartPostImages({});
    setAutoGenSet(new Set());
    try {
      const token = await tok();
      const result = await generateSmartSchedule(profile.name, profile.type, profile.tone, stats, token, smartCount, profile.location || 'Australia', activePlatforms, saturationMode);
      setSmartPosts(result.posts);
      setSmartStrategy(result.strategy);
      // Auto-generate images in the background after posts are ready
      autoGenerateAllImages(result.posts);
    } catch (e: any) {
      toast(`Smart schedule failed: ${e?.message?.substring(0, 80) || 'Unknown'}`, 'error');
    }
    setIsSmartGenerating(false);
  };

  const handleAcceptSmartPosts = async () => {
    const total = smartPosts.length;
    try {
      for (let i = 0; i < smartPosts.length; i++) {
        const sp = smartPosts[i];
        const newPost: SocialPost = {
          id: `sp_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          platform: sp.platform as SocialPost['platform'],
          content: sp.content,
          hashtags: sp.hashtags,
          scheduledTime: sp.scheduledFor,
          status: 'scheduled',
          imageUrl: smartPostImages[i] || undefined,
          imagePrompt: sp.imagePrompt,
          reasoning: sp.reasoning,
          pillar: sp.pillar,
          topic: sp.topic
        };
        await addPost(newPost);
      }
      toast(`${total} posts scheduled and added to calendar!`, 'success');
    } catch (e: any) {
      toast(`Failed to save posts: ${e?.message?.substring(0, 100) || 'Unknown error'}`, 'error');
    } finally {
      setSmartPosts([]);
      setSmartStrategy('');
      setSmartPostImages({});
      setAutoGenSet(new Set());
      setCurrentGenIdx(null);
    }
  };

  // ── Insights ──
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const token = await tok();
      const [recs, times] = await Promise.all([
        generateRecommendations(profile.name, profile.type, stats, token),
        analyzePostTimes(profile.type, profile.location, token)
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

  // ── Edit Post (upsert) ──
  const handleEditPost = async (post: SocialPost) => {
    await addPost(post);
    toast('Post updated.');
  };

  // ── Publish Now (manual from calendar) ──
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const handlePublishNow = async (post: SocialPost) => {
    if (!settings?.fbPageId || !settings?.fbPageAccessToken) {
      toast('Facebook page not connected. Go to Settings to connect.', 'warning');
      return;
    }
    setPublishingPostId(post.id);
    try {
      const hashtags = post.hashtags?.length ? '\n\n' + post.hashtags.join(' ') : '';
      const message = `${post.content}${hashtags}`;
      await FacebookService.postToPageDirect(settings.fbPageId, settings.fbPageAccessToken, message, post.imageUrl);
      await addPost({ ...post, status: 'published' });
      toast('Published to Facebook!', 'success');
    } catch (e: any) {
      toast(`Publish failed: ${e?.message?.substring(0, 100) || 'Unknown error'}`, 'error');
    }
    setPublishingPostId(null);
  };

  // ── Tab Config ──
  const tabs = [
    { id: 'smart' as const, label: 'AI Autopilot', icon: Zap },
    { id: 'create' as const, label: 'Create Post', icon: Wand2 },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
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
          <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
            {fbConnected ? (
              <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <Link2 size={13} /> {fbPageName || 'Facebook'} Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <Link2Off size={13} /> Facebook Not Connected
              </span>
            )}
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

      {/* Social Command Center */}
      <div className="bg-native-black rounded-2xl p-5 md:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white font-display font-bold text-lg tracking-wide">SOCIAL COMMAND CENTER</h2>
              <p className="text-white/40 text-xs mt-0.5">Manage content, schedule posts, and track growth.</p>
            </div>
            <div className="flex items-center gap-2">
              {lastPulled && (
                <span className="text-white/30 text-[10px]">
                  Updated {lastPulled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={handlePullStats}
                disabled={isPullingStats || !fbConnected}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-40"
                title={!fbConnected ? 'Connect a Facebook page in Settings first' : 'Pull live stats from Facebook'}
              >
                <RefreshCw size={14} className={isPullingStats ? 'animate-spin' : ''} />
                {isPullingStats ? 'Pulling...' : 'Refresh Stats'}
              </button>
              <button
                onClick={handleRunPublisher}
                disabled={publisherRunning || !fbConnected}
                className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-40"
                title={!fbConnected ? 'Connect a Facebook page first' : 'Manually run the post publisher now'}
              >
                <Send size={14} className={publisherRunning ? 'animate-pulse' : ''} />
                {publisherRunning ? 'Publishing...' : 'Run Publisher'}
              </button>
            </div>
            {lastRunResult && (
              <span className={`text-[10px] flex items-center gap-1 ${
                lastRunResult.failed > 0 ? 'text-red-400' : lastRunResult.published > 0 ? 'text-green-400' : 'text-white/30'
              }`}>
                {lastRunResult.failed > 0 ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                Last run {lastRunResult.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: {lastRunResult.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Followers</span>
                <Users size={16} className="text-blue-400 opacity-70" />
              </div>
              <p className="text-3xl font-display font-bold text-white">
                {liveStats ? liveStats.followersCount.toLocaleString() : (stats.followers || '—')}
              </p>
              {liveStats ? (
                <p className="text-[10px] text-white/30 mt-1">Page fans &amp; followers</p>
              ) : (
                <p className="text-[10px] text-white/30 mt-1">{fbConnected ? 'Pull stats to get live data' : 'Connect Facebook to see live data'}</p>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Reach</span>
                <Activity size={16} className="text-purple-400 opacity-70" />
              </div>
              <p className="text-3xl font-display font-bold text-white">
                {liveStats ? liveStats.reach28d.toLocaleString() : (stats.reach || '—')}
              </p>
              {liveStats ? (
                <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><TrendingUp size={10} /> Unique accounts reached (28d)</p>
              ) : (
                <p className="text-[10px] text-white/30 mt-1">{fbConnected ? 'Pull stats to get live data' : 'Connect Facebook to see live data'}</p>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Engagement</span>
                <TrendingUp size={16} className="text-amber-400 opacity-70" />
              </div>
              <p className="text-3xl font-display font-bold text-white">
                {liveStats ? `${liveStats.engagementRate}%` : (stats.engagement ? `${stats.engagement}%` : '—')}
              </p>
              {liveStats ? (
                <p className="text-[10px] text-white/30 mt-1">{liveStats.engagedUsers28d.toLocaleString()} engaged users (28d)</p>
              ) : (
                <p className="text-[10px] text-white/30 mt-1">{fbConnected ? 'Pull stats to get live data' : 'Connect Facebook to see live data'}</p>
              )}
            </div>
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
              <button onClick={handleGenerate} disabled={isGenerating} className="bg-native-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md transition">
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
                {fbConnected && (
                  <button
                    onClick={handlePublishToFacebook}
                    disabled={isPublishing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md transition disabled:opacity-60"
                  >
                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Publish to Facebook
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CALENDAR TAB ═══ */}
      {activeTab === 'calendar' && <CalendarView posts={posts} onDelete={handleDeletePost} onEdit={handleEditPost} onPublishNow={handlePublishNow} publishingPostId={publishingPostId} onCreateClick={() => setActiveTab('create')} fbConnected={fbConnected} />}

      {/* ═══ SMART AI TAB (HERO) ═══ */}
      {activeTab === 'smart' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-native-black via-gray-900 to-native-black rounded-2xl p-8 md:p-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold">AI Autopilot</h2>
                  <p className="text-white/50 text-xs">Powered by Gemini</p>
                </div>
              </div>
              <p className="text-white/70 text-sm max-w-lg mb-6 leading-relaxed">
                One click. Your entire content calendar — written, scheduled, and optimized for maximum engagement. AI handles the strategy, topics, timing, hashtags, and platform selection.
              </p>
              {/* Saturation Mode Toggle */}
              <div
                onClick={() => {
                  const next = !saturationMode;
                  setSaturationMode(next);
                  setSmartCount(next ? 21 : 7);
                }}
                className={`cursor-pointer rounded-2xl border px-4 py-3 flex items-start gap-3 transition mb-2 max-w-lg ${
                  saturationMode
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-white/5 border-white/15 hover:bg-white/10'
                }`}
              >
                <div className={`mt-0.5 w-9 h-5 rounded-full flex items-center transition-all flex-shrink-0 ${
                  saturationMode ? 'bg-red-500 justify-end' : 'bg-white/20 justify-start'
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white mx-0.5 shadow" />
                </div>
                <div>
                  <p className={`text-sm font-bold leading-tight ${saturationMode ? 'text-red-300' : 'text-white/80'}`}>
                    {saturationMode ? '🔥 Saturation Mode ON' : 'Saturation Mode'}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5 leading-snug">
                    {saturationMode
                      ? '3–5 posts/day · 7-day blitz · anti-fatigue content rotation'
                      : 'Post as frequently as possible to maximise algorithmic reach'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">How many posts?</label>
                  {saturationMode ? (
                    <select value={smartCount} onChange={e => setSmartCount(Number(e.target.value))} className="bg-white/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-400 backdrop-blur-sm" title="Post count">
                      <option value={21} className="text-gray-900">21 posts (3/day · 7 days)</option>
                      <option value={28} className="text-gray-900">28 posts (4/day · 7 days)</option>
                      <option value={35} className="text-gray-900">35 posts (5/day · 7 days)</option>
                    </select>
                  ) : (
                    <select value={smartCount} onChange={e => setSmartCount(Number(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-400 backdrop-blur-sm" title="Post count">
                      <option value={5} className="text-gray-900">5 posts (1 week)</option>
                      <option value={7} className="text-gray-900">7 posts (1 week)</option>
                      <option value={10} className="text-gray-900">10 posts (2 weeks)</option>
                      <option value={14} className="text-gray-900">14 posts (2 weeks)</option>
                    </select>
                  )}
                </div>
                <button onClick={handleSmartSchedule} disabled={isSmartGenerating} className={`text-white font-bold px-8 py-3 rounded-xl transition flex items-center gap-2 text-sm shadow-lg disabled:opacity-60 ${
                  saturationMode
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-500/25'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-amber-500/25'
                }`}>
                  {isSmartGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  {isSmartGenerating ? 'Generating...' : saturationMode ? 'Launch Saturation Campaign' : 'Generate My Schedule'}
                </button>
              </div>
              {!hasApiKey && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-yellow-300 text-xs flex items-center gap-2">
                  <Sparkles size={14} /> Set your Gemini API key in the <button onClick={() => setActiveTab('settings')} className="underline hover:text-yellow-200">Settings tab</button> to activate AI.
                </div>
              )}
            </div>
          </div>

          {/* Generation Ticker */}
          {isSmartGenerating && (
            <div className="bg-native-black border border-amber-500/20 rounded-2xl p-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(245,158,11,0.07),transparent_55%)]" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">AI is building your schedule</p>
                    <p className="text-white/40 text-xs">This takes 15–40 seconds — hang tight</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-in-out"
                      style={{ width: `${TICKER_STEPS[tickerIdx].pct}%` }}
                    />
                  </div>
                  <p className="text-amber-300 text-xs font-medium">{TICKER_STEPS[tickerIdx].pct}% complete</p>
                </div>

                {/* Current step */}
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="text-amber-400 animate-spin flex-shrink-0" />
                  <span className="text-white/80 text-sm">{TICKER_STEPS[tickerIdx].label}</span>
                </div>

                {/* Completed steps */}
                <div className="space-y-1.5">
                  {TICKER_STEPS.slice(0, tickerIdx).map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                      <span className="text-white/30 text-xs line-through">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          {!isSmartGenerating && smartPosts.length === 0 && !smartStrategy && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Brain, title: 'Smart Strategy', desc: 'AI analyzes your brand, audience, and goals to create a tailored content strategy.' },
                { icon: Calendar, title: 'Perfect Timing', desc: 'Posts are scheduled at optimal times based on your audience\'s activity patterns.' },
                { icon: Sparkles, title: 'Ready to Post', desc: 'Complete captions, hashtags, and image prompts — accept them all in one click.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                    <item.icon size={18} className="text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Strategy Result */}
          {smartStrategy && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 className="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2"><Brain size={16} /> AI Strategy</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{smartStrategy}</p>
            </div>
          )}

          {/* Generated Posts */}
          {smartPosts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-gray-900 text-lg">{smartPosts.length} Posts Ready</h3>
                <button onClick={handleAcceptSmartPosts} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md transition">
                  <CheckCircle size={16} /> Accept All & Schedule
                </button>
              </div>
              {/* Image generation progress banner */}
              {autoGenSet.size > 0 && (
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-indigo-700">AI is selecting the best image for each post</span>
                    <span className="text-indigo-400 ml-2">— {imgGenDone} of {smartPosts.length} done</span>
                  </div>
                  <div className="w-32 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((imgGenDone / smartPosts.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {smartPosts.map((sp, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">#{i + 1}</span>
                      {sp.platform === 'instagram' ? <Instagram size={14} className="shrink-0" /> : <Facebook size={14} className="shrink-0" />}
                      <span className="text-xs text-gray-400">{new Date(sp.scheduledFor).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(sp.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {sp.pillar && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 font-semibold">{sp.pillar}</span>}
                    </div>
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">{sp.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {sp.hashtags.map((t, j) => <span key={j} className="text-[10px] text-amber-600 font-medium">{t}</span>)}
                    </div>
                    {sp.reasoning && <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-100 pt-2">{sp.reasoning}</p>}
                    {/* Image — auto-generated by AI, dismissible, replaceable */}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      {autoGenSet.has(i) ? (
                        <div className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg ${
                          currentGenIdx === i
                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                            : 'text-gray-400 bg-gray-50 border border-gray-100'
                        }`}>
                          <Loader2 size={12} className={`animate-spin shrink-0 ${currentGenIdx === i ? 'text-indigo-500' : 'text-gray-300'}`} />
                          {currentGenIdx === i ? 'AI generating image now…' : 'In queue — AI will generate soon'}
                        </div>
                      ) : smartPostImages[i] ? (
                        <div className="relative group">
                          <img src={smartPostImages[i]} alt="AI suggested" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                            <Sparkles size={9} /> AI Suggestion
                          </div>
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleUploadImage(i)}
                              title="Use my own image"
                              className="bg-white/90 hover:bg-blue-50 border border-gray-200 text-blue-600 p-1 rounded-md"
                            ><ImageIcon size={11} /></button>
                            <button
                              onClick={() => setSmartPostImages(prev => { const c = { ...prev }; delete c[i]; return c; })}
                              title="Dismiss AI image"
                              className="bg-white/90 hover:bg-red-50 border border-gray-200 p-1 rounded-md"
                            ><X size={11} className="text-red-500" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUploadImage(i)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition w-full justify-center"
                        >
                          <ImageIcon size={12} /> Upload your own image
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <button onClick={handleAcceptSmartPosts} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 text-sm shadow-md transition">
                  <CheckCircle size={16} /> Accept All & Add to Calendar
                </button>
              </div>
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

          {/* AI Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" /> AI Services</h3>
            <p className="text-sm text-gray-600">AI is powered by <strong>OpenRouter</strong> (text) and <strong>Cloudflare Workers AI</strong> (images), proxied securely through the Worker. No API key required here — configure <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">OPENROUTER_API_KEY</code> via <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">wrangler secret put</code>.</p>
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> AI features active</p>
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

      {/* Hidden file input for custom image upload */}
      <input ref={uploadFileRef} type="file" accept="image/*" title="Upload custom image" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarView = ({ posts, onDelete, onEdit, onPublishNow, publishingPostId, fbConnected, onCreateClick }: {
  posts: SocialPost[];
  onDelete: (id: string) => void;
  onEdit: (post: SocialPost) => void;
  onPublishNow: (post: SocialPost) => void;
  publishingPostId: string | null;
  fbConnected: boolean;
  onCreateClick: () => void;
}) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Inline edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<SocialPost['status']>('scheduled');

  const startEdit = (post: SocialPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditTime(post.scheduledTime?.slice(0, 16) || '');
    setEditStatus(post.status);
  };
  const cancelEdit = () => setEditingPostId(null);
  const saveEdit = (post: SocialPost) => {
    const reset = editStatus === 'scheduled';
    onEdit({
      ...post,
      content: editContent,
      scheduledTime: editTime || post.scheduledTime,
      status: editStatus,
      ...(reset ? { publishAttempts: 0, publishError: undefined } : {})
    });
    setEditingPostId(null);
  };

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
                            ${p.publishError ? 'bg-red-100 text-red-700' :
                              p.status === 'published' ? 'bg-green-100 text-green-700' :
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
                        {post.publishError && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-medium">Error</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                      {post.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.hashtags.slice(0, 5).map((t, i) => <span key={i} className="text-[10px] text-amber-600 font-medium">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(post)} title="Edit post" className="text-gray-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => onDelete(post.id)} title="Delete post" className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
                            post.publishError ? 'bg-red-100 text-red-700 border border-red-200' :
                              post.status === 'published' ? 'bg-green-50 text-green-700 border border-green-200' :
                              post.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>{post.status}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {post.pillar && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">{post.pillar}</span>}
                          {post.topic && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-medium">{post.topic}</span>}
                        </div>

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
                        {post.publishError && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-red-600">
                            <AlertTriangle size={11} />
                            <span className="font-semibold">Failed:</span> {post.publishError.substring(0, 80)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        {fbConnected && post.status !== 'published' && (
                          <button
                            onClick={() => onPublishNow(post)}
                            disabled={publishingPostId === post.id}
                            title="Publish to Facebook now"
                            className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                          >
                            {publishingPostId === post.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        )}
                        <button onClick={() => startEdit(post)} title="Edit post" className="text-gray-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete(post.id)} title="Delete post" className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {editingPostId === post.id && (
                      <div className="mt-3 pt-3 border-t border-amber-100 space-y-3 bg-amber-50/50 rounded-xl p-3">
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          title="Edit post content"
                          className="w-full bg-white border border-amber-200 rounded-lg p-3 text-sm text-gray-800 resize-y min-h-[80px] outline-none focus:border-amber-400"
                        />
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="datetime-local"
                            value={editTime}
                            onChange={e => setEditTime(e.target.value)}
                            title="Scheduled time"
                            className="bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-amber-400"
                          />
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value as SocialPost['status'])}
                            title="Post status"
                            className="bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-amber-400"
                          >
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(post)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1 transition">
                            <Save size={12} /> Save
                          </button>
                          <button onClick={cancelEdit} className="bg-white text-gray-500 hover:text-gray-700 text-xs font-medium px-4 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 transition">
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
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