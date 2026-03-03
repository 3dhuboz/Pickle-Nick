import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { generateSocialContent, generateSocialImage, getPostingAdvice, researchSocialTopic, analyzeSocialMetrics } from '../../services/geminiService';
import { SocialPost, SocialMetrics } from '../../types';
import { Facebook, Instagram, Wand2, Loader2, Image as ImageIcon, Sparkles, Send, BarChart2, Search, HelpCircle, X, ExternalLink, MousePointerClick, Check, AlertCircle, Edit2, Calendar, Share2, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { FacebookService } from '../../services/facebookService';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3 bg-blue-50 text-blue-700 p-4 text-sm rounded-xl border border-blue-100 mb-6">
        <HelpCircle size={18} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{text}</span>
    </div>
);

const SocialAI = () => {
  const { posts, addPost, settings } = useStore();
  
  // Content Generation State
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<SocialPost['platform']>('instagram');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [generatedContent, setGeneratedContent] = useState<{ content: string, hashtags: string[] } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Editing State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Research/Oracle State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);

  // Metrics State
  const [metrics] = useState<SocialMetrics>({
    followers: 1250,
    engagementRate: 4.2,
    weeklyReach: 5400,
    clicks: 342
  });
  const [analyzingMetric, setAnalyzingMetric] = useState<string | null>(null);
  const [metricAnalysis, setMetricAnalysis] = useState<string | null>(null);

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setEditingPostId(null); // Clear edit mode if generating new
    try {
      const [contentRes, adviceRes, imageRes] = await Promise.allSettled([
        generateSocialContent(topic, platform === 'both' ? 'instagram' : platform),
        getPostingAdvice(platform === 'both' ? 'instagram' : platform),
        generateSocialImage(topic)
      ]);

      if (contentRes.status === 'fulfilled') setGeneratedContent(contentRes.value);
      if (adviceRes.status === 'fulfilled') setAdvice(adviceRes.value || '');
      if (imageRes.status === 'fulfilled') setGeneratedImage(imageRes.value);
    } catch (error) {
      console.error(error);
      alert('Failed to generate content. Check API Key.');
    } finally {
      setLoading(false);
    }
  };

  const startEditPost = (post: SocialPost) => {
      setEditingPostId(post.id);
      setTopic(''); // Clear generation topic
      setPlatform(post.platform);
      setGeneratedContent({ content: post.content, hashtags: post.hashtags });
      setGeneratedImage(post.imageUrl || null);
      setScheduledDate(post.scheduledTime);
      setAdvice("Editing an existing post...");
      window.scrollTo(0,0);
  };

  const handleSchedule = async () => {
    if (!generatedContent || !scheduledDate) return;
    setSaveStatus('saving');
    
    try {
        const newPost: SocialPost = {
          id: editingPostId || `post-${Date.now()}`,
          platform,
          content: generatedContent.content,
          hashtags: generatedContent.hashtags,
          imageUrl: generatedImage || undefined,
          scheduledTime: scheduledDate,
          status: 'scheduled'
        };
        await addPost(newPost); // Handles add or update depending on implementation (StorageService savePost creates or overwrites)
        
        setSaveStatus('success');
        setTimeout(() => {
            setSaveStatus('idle');
            // Reset form
            setGeneratedContent(null);
            setGeneratedImage(null);
            setTopic('');
            setEditingPostId(null);
            setScheduledDate('');
        }, 1500);

    } catch (e) {
        console.error(e);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const [isPostingLive, setIsPostingLive] = useState(false);

  const handlePostNow = async () => {
      if (!generatedContent) return;
      
      if ((platform === 'facebook' || platform === 'both') && !settings.fbPageId) {
          alert("Please connect your Facebook Business Page in Settings first.");
          return;
      }

      setIsPostingLive(true);
      try {
          // Initialize FB if needed
          if (settings.fbAppId) {
              await FacebookService.init(settings.fbAppId);
          }

          const fullMessage = `${generatedContent.content}\n\n${generatedContent.hashtags.join(' ')}`;
          
          if ((platform === 'facebook' || platform === 'both') && settings.fbPageId && settings.fbPageAccessToken) {
              await FacebookService.postToPage(
                  settings.fbPageId, 
                  settings.fbPageAccessToken, 
                  fullMessage, 
                  generatedImage || undefined
              );
          }

          // Save to history
          const newPost: SocialPost = {
              id: editingPostId || `post-${Date.now()}`,
              platform,
              content: generatedContent.content,
              hashtags: generatedContent.hashtags,
              imageUrl: generatedImage || undefined,
              scheduledTime: new Date().toISOString(),
              status: 'published'
          };
          await addPost(newPost);

          alert("Successfully posted to Facebook!");
          
          // Reset form
          setGeneratedContent(null);
          setGeneratedImage(null);
          setTopic('');
          setEditingPostId(null);
          setScheduledDate('');
      } catch (e: any) {
          console.error("Failed to post live:", e);
          alert(`Failed to post: ${e.message || 'Unknown error'}`);
      } finally {
          setIsPostingLive(false);
      }
  };

  const handleResearch = async () => {
      if(!researchQuery) return;
      setResearchLoading(true);
      try {
          const res = await researchSocialTopic(researchQuery);
          setResearchResult(res);
      } catch(e) { console.error(e); }
      setResearchLoading(false);
  };

  const handleMetricClick = async (name: string, value: string | number) => {
      setAnalyzingMetric(name);
      setMetricAnalysis(null);
      try {
          const analysis = await analyzeSocialMetrics(name, value);
          setMetricAnalysis(analysis);
      } catch(e) { console.error(e); }
  };

  // Sorted Posts for Planner View
  const sortedPosts = [...posts].sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-native-black mb-2">Social Spirit</h1>
        <p className="text-gray-500">AI-powered content creation and social media management.</p>
      </div>

      {/* --- Section 1: Interactive Metrics Dashboard --- */}
      <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart2 className="text-gray-400" size={20} /> Performance Pulse
              </h3>
              {settings.fbAppId ? (
                   <span className="text-green-600 text-xs font-medium bg-green-50 px-3 py-1 rounded-full flex items-center gap-2 border border-green-100">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Connection
                   </span>
              ) : (
                   <span className="text-gray-400 text-xs font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                       Simulated Data (Connect API in Settings)
                   </span>
              )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                  label="Total Followers" 
                  value={metrics.followers.toLocaleString()} 
                  trend="+12%" 
                  onClick={() => handleMetricClick('Follower Count', metrics.followers)}
              />
              <MetricCard 
                  label="Engagement Rate" 
                  value={`${metrics.engagementRate}%`} 
                  trend="+0.5%" 
                  onClick={() => handleMetricClick('Engagement Rate', `${metrics.engagementRate}%`)}
              />
              <MetricCard 
                  label="Weekly Reach" 
                  value={metrics.weeklyReach.toLocaleString()} 
                  trend="-3%" 
                  isNegative 
                  onClick={() => handleMetricClick('Weekly Reach', metrics.weeklyReach)}
              />
              <MetricCard 
                  label="Link Clicks" 
                  value={metrics.clicks.toLocaleString()} 
                  trend="+8%" 
                  onClick={() => handleMetricClick('Link Clicks', metrics.clicks)}
              />
          </div>
          <p className="text-right text-xs text-gray-400 mt-2 flex justify-end items-center gap-1">
              <MousePointerClick size={12}/> Click tiles to investigate
          </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* --- Section 2: The Creator --- */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-1">
                    {editingPostId ? "Refine Content" : "Create Content"}
                </h3>
                <p className="text-sm text-gray-500">Generate new posts or edit existing ones.</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Sparkles size={20} />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Platform</label>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setPlatform('facebook')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${platform === 'facebook' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <Facebook size={18} /> Facebook
                </button>
                <button 
                  onClick={() => setPlatform('instagram')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${platform === 'instagram' ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <Instagram size={18} /> Instagram
                </button>
                <button 
                  onClick={() => setPlatform('both')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${platform === 'both' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <Share2 size={18} /> Both
                </button>
              </div>
            </div>

            {!editingPostId && (
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Topic / Idea</label>
                <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What would you like to post about today? (e.g., 'New spicy pickle launch')"
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-base focus:bg-white focus:border-native-black focus:ring-1 focus:ring-native-black outline-none h-40 resize-none transition-all placeholder-gray-400"
                />
                </div>
            )}

            {!editingPostId && (
                <button 
                onClick={handleGenerate}
                disabled={loading || !topic}
                className="w-full bg-native-black text-white font-medium text-lg py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-3"
                >
                {loading ? <><Loader2 className="animate-spin" /> Generating...</> : <><Wand2 size={20} /> Generate Content</>}
                </button>
            )}
          </div>
        </div>

        {/* --- Section 3: The Vision (Preview) & The Oracle --- */}
        <div className="flex flex-col h-full gap-8">
            
            {/* The Vision */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-semibold text-gray-900">Preview</h3>
                    {editingPostId && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Editing Mode</span>
                    )}
                </div>

                {generatedContent ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        {editingPostId && (
                            <button onClick={() => { setEditingPostId(null); setGeneratedContent(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        )}

                        {generatedImage && (
                                <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-6">
                                <img src={generatedImage} alt="AI Generated" className="w-full h-64 object-cover hover:scale-105 transition-transform duration-700" />
                                </div>
                        )}
                        
                        <textarea 
                            value={generatedContent.content} 
                            onChange={e => setGeneratedContent({...generatedContent, content: e.target.value})}
                            className="w-full p-0 border-none text-gray-800 font-sans text-base leading-relaxed whitespace-pre-wrap outline-none bg-transparent resize-none focus:ring-0"
                            rows={6}
                        />
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <input 
                                value={generatedContent.hashtags.join(' ')}
                                onChange={e => setGeneratedContent({...generatedContent, hashtags: e.target.value.split(' ')})}
                                className="w-full text-blue-600 font-medium text-sm border-none focus:ring-0 outline-none bg-transparent placeholder-blue-300"
                                placeholder="#hashtags"
                            />
                        </div>

                        {advice && (
                            <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                                <Sparkles size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block font-semibold mb-1 text-blue-900">AI Suggestion:</strong> 
                                    "{advice}"
                                </div>
                            </div>
                        )}

                        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 flex gap-2">
                                    <input 
                                        type="datetime-local" 
                                        className="flex-1 p-2.5 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-native-black focus:ring-1 focus:ring-native-black"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleSchedule}
                                        disabled={!scheduledDate || saveStatus !== 'idle'}
                                        className={`
                                            px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center
                                            ${saveStatus === 'idle' ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}
                                            ${saveStatus === 'saving' ? 'bg-gray-900 text-white cursor-wait' : ''}
                                            ${saveStatus === 'success' ? 'bg-green-600 text-white cursor-default' : ''}
                                            ${saveStatus === 'error' ? 'bg-red-600 text-white cursor-default' : ''}
                                        `}
                                    >
                                        {saveStatus === 'idle' && <><Calendar size={16} /> {editingPostId ? 'Update' : 'Schedule'}</>}
                                        {saveStatus === 'saving' && <><Loader2 size={16} className="animate-spin" /> Saving...</>}
                                        {saveStatus === 'success' && <><Check size={16} /> Done</>}
                                        {saveStatus === 'error' && <><AlertCircle size={16} /> Failed</>}
                                    </button>
                                </div>
                                <div className="flex items-center justify-center text-xs font-bold text-gray-400 uppercase">OR</div>
                                <button 
                                    onClick={handlePostNow}
                                    disabled={isPostingLive}
                                    className="bg-[#1877F2] text-white font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-[#1877F2]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {isPostingLive ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : <><Globe size={16} /> Post Now</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-12 text-center min-h-[300px]">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ImageIcon size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-medium">Content preview will appear here.</p>
                    </div>
                )}
            </div>

            {/* The Oracle (Research) */}
            <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Search size={120} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-display font-semibold mb-2 flex items-center gap-2">
                        <Search className="text-blue-400" size={20} /> Market Research
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">Analyze trends, hashtags, and competitor strategies.</p>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            value={researchQuery} 
                            onChange={e => setResearchQuery(e.target.value)}
                            placeholder="e.g. 'Best hashtags for organic food'"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                        />
                        <button 
                            onClick={handleResearch}
                            disabled={researchLoading || !researchQuery}
                            className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {researchLoading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                        </button>
                    </div>
                    
                    {researchResult && (
                         <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-sm leading-relaxed whitespace-pre-line text-gray-300">
                             {researchResult}
                         </div>
                    )}
                </div>
            </div>

        </div>
      </div>

      {/* --- Section 4: Planner (Sorted) --- */}
      <div className="mt-16">
          <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
              <h3 className="text-2xl font-display font-semibold text-gray-900 flex items-center gap-3">
                  <Calendar className="text-gray-400" /> Scheduled Posts
              </h3>
          </div>
          
          <div className="space-y-4">
              {sortedPosts.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      No scheduled posts found. Use the generator above to create content.
                  </div>
              ) : (
                  sortedPosts.map(post => (
                      <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-center group">
                          {/* Time */}
                          <div className="md:w-32 text-center md:text-left shrink-0">
                              <span className="block text-2xl font-bold text-gray-900 leading-none">{new Date(post.scheduledTime).getDate()}</span>
                              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{new Date(post.scheduledTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="block text-xs text-gray-400 mt-1 font-mono">{new Date(post.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                  {post.platform === 'facebook' && <Facebook size={14} className="text-blue-600" />}
                                  {post.platform === 'instagram' && <Instagram size={14} className="text-pink-600" />}
                                  {post.platform === 'both' && <Share2 size={14} className="text-purple-600" />}
                                  <span className="text-xs font-semibold text-gray-900 capitalize">{post.platform}</span>
                              </div>
                              <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEditPost(post)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                              >
                                  <Edit2 size={14} /> Edit
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* --- Analysis Modal --- */}
      {analyzingMetric && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white max-w-lg w-full shadow-2xl rounded-2xl p-8 relative">
                  <button onClick={() => setAnalyzingMetric(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  
                  <h3 className="text-xl font-display font-semibold text-gray-900 mb-1">Metric Analysis</h3>
                  <p className="text-sm text-gray-500 mb-6">Deep dive into {analyzingMetric}</p>

                  {!metricAnalysis ? (
                      <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                          <Loader2 className="animate-spin mb-4 text-blue-600" size={32} />
                          <p className="text-sm font-medium">Analyzing data patterns...</p>
                      </div>
                  ) : (
                      <div>
                          <div className="bg-blue-50 rounded-xl p-6 text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                            {metricAnalysis}
                          </div>
                          <div className="mt-6 flex justify-end">
                             <button onClick={() => setAnalyzingMetric(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Close</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

const MetricCard = ({ label, value, trend, isNegative, onClick }: any) => (
    <div 
        onClick={onClick}
        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group relative overflow-hidden"
    >
        <div className="absolute top-4 right-4 text-gray-300 group-hover:text-blue-400 transition-colors">
            <BarChart2 size={18} />
        </div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-end gap-3">
            <h4 className="text-3xl font-bold text-gray-900 leading-none">{value}</h4>
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isNegative ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                {isNegative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {trend}
            </span>
        </div>
    </div>
);

export default SocialAI;