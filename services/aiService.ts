// AI service — all calls proxied through the Cloudflare Worker (/api/ai/*)
// No API keys exposed to the browser.

export interface SmartScheduleResult {
  posts: SmartScheduledPostResult[];
  strategy: string;
}

export interface SmartScheduledPostResult {
  platform: 'facebook' | 'instagram';
  scheduledFor: string;
  topic: string;
  content: string;
  hashtags: string[];
  imagePrompt: string;
  reasoning: string;
  pillar: string;
}

const aiText = async (prompt: string, token: string, jsonMode = false): Promise<string> => {
  const res = await fetch('/api/ai/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt, jsonMode }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.text ?? '';
};

const aiImage = async (prompt: string, token: string): Promise<string> => {
  const res = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    let msg = 'Image generation failed';
    try { const j = await res.json(); msg = (j as any).error || msg; } catch { msg = await res.text(); }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.url ?? '';
};

const parseJson = (raw: string): any => {
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
};

export const generateSocialContent = async (
  topic: string,
  platform: string,
  token: string,
  businessName = 'Pickle Nick',
  businessType = 'artisan pickle business',
  tone = 'Witty, elegant, slightly humorous, and appetizing'
) => {
  const prompt = `
You are an expert social media manager for "${businessName}", a ${businessType}.
Tone: ${tone}.
Write a catchy, engaging ${platform} post about: "${topic}".
Include relevant emojis and 5-10 relevant hashtags.
Return JSON with "content" (the post text) and "hashtags" (array of strings).
  `;
  const raw = await aiText(prompt, token, true);
  try { return parseJson(raw); } catch { return { content: '', hashtags: [] }; }
};

export const generateSocialImage = async (prompt: string, token: string): Promise<string> =>
  aiImage(prompt, token);

export const generateSiteImage = async (prompt: string, token: string): Promise<string> => {
  const imagePrompt = `Cinematic, high-quality photography for an artisan brand website. Subject: ${prompt}. Style: Rustic, authentic, sophisticated, tattoo-culture influence but elegant, warm lighting, high detail, 8k. No text overlays.`;
  return aiImage(imagePrompt, token);
};

export const generateCategoryImage = async (categoryName: string, token: string): Promise<string> => {
  const imagePrompt = `Wide cinematic banner photography for a product category named "${categoryName}". Style: Artisan food branding, dark rustic wood backgrounds, dramatic lighting, high detail, photorealistic. Subject: An artistic arrangement of ingredients and jars related to ${categoryName}. No text overlays.`;
  return aiImage(imagePrompt, token);
};

export const generateProductImage = async (name: string, category: string, description: string, token: string): Promise<string> => {
  const imagePrompt = `Professional high-end product photography of "${name}" (${category}). Visual Details based on description: ${description}. Setting: Rustic, artisanal style, sitting on a weathered dark oak table, dramatic natural lighting coming from a window, condensation on glass if applicable. Style: Photorealistic, 8k, highly detailed, appetizing food photography, elegant branding.`;
  return aiImage(imagePrompt, token);
};

export const generateMarketingImage = async (prompt: string, token: string): Promise<string | null> => {
  try { return await aiImage(`Professional marketing image: ${prompt}. High quality, vibrant, cinematic lighting, no text or watermarks.`, token); }
  catch { return null; }
};

export const getPostingAdvice = async (platform: string, token: string): Promise<string> =>
  aiText(`Best times to post on ${platform} for a food business to maximize engagement. Keep it brief and return a short 1-sentence tip.`, token);

export const researchSocialTopic = async (query: string, token: string): Promise<string> =>
  aiText(`As a social media expert for a niche food brand, research and provide specific advice on: "${query}". Provide 3 actionable bullet points. Keep the tone professional yet creative.`, token);

export const analyzeSocialMetrics = async (metricName: string, value: string | number, token: string): Promise<string> =>
  aiText(`I run a small artisan pickle business. My Facebook page has a ${metricName} of ${value}. 1. Is this good, average, or poor for a niche food brand? 2. Give me 2 specific strategies to improve this number next week. Keep the answer concise and encouraging.`, token);

export const analyzePostTimes = async (businessType: string, location: string, token: string): Promise<string> => {
  try {
    return await aiText(`What are the best times to post on Instagram and Facebook for a ${businessType} in ${location}? Give a concise bulleted list of 3 best time slots for the upcoming week.`, token);
  } catch { return 'Could not analyze times.'; }
};

export const generateRecommendations = async (businessName: string, businessType: string, stats: any, token: string): Promise<string> => {
  try {
    return await aiText(`You are a social media strategist for "${businessName}", a ${businessType}. Stats: Followers: ${stats.followers}, Reach: ${stats.reach}, Engagement: ${stats.engagement}%, Posts: ${stats.postsLast30Days}. Provide 3 specific, high-impact recommendations. Format as a concise bulleted list.`, token);
  } catch { return 'Unable to analyze stats at this time.'; }
};

export const generateProductDescription = async (name: string, category: string, token: string): Promise<string> =>
  aiText(`Write a sophisticated, artisanal, and appetizing product description for a ${category} item named "${name}". Focus on flavor profiles, textures, and traditional preservation methods. The tone should be whimsical, rustic, and premium. Keep it under 50 words.`, token);

export const generateSmartSchedule = async (
  businessName: string,
  businessType: string,
  tone: string,
  stats: any,
  token: string,
  postsToGenerate = 7,
  location = 'Australia',
  platforms: { facebook: boolean; instagram: boolean } = { facebook: true, instagram: true },
  saturationMode = false
): Promise<SmartScheduleResult> => {
  const now = new Date();
  const windowDays = saturationMode ? 7 : 14;
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const researchPrompt = saturationMode ? `
You are an expert social media growth hacker specialising in HIGH-FREQUENCY SATURATION posting strategies.
Research the optimal saturation posting plan for:
- Business: "${businessName}" — ${businessType}
- Location: ${location}
- Goal: Maximum algorithmic reach and traction through sheer posting volume
- Current stats: ${stats.followers} followers, ${stats.engagement}% engagement
Respond with ONLY a raw JSON object — no markdown, no code fences:
{"dailyPostingWindows":["07:00","10:00","12:30","16:00","19:30"],"contentVarietyStrategy":"string","contentPillars":["p1","p2","p3","p4","p5","p6","p7"],"hashtagThemes":["t1","t2","t3","t4"],"imageStyle":"string","platformSplit":{"facebook":40,"instagram":60},"saturationTactics":"string","bestContentMix":"string"}` : `
You are an expert social media researcher. Research the optimal social media strategy for:
- Business: "${businessName}" — ${businessType}
- Location: ${location}
- Current stats: ${stats.followers} followers, ${stats.engagement}% engagement
Respond with ONLY a raw JSON object — no markdown, no code fences:
{"bestPostingTimes":["HH:MM","HH:MM","HH:MM"],"bestDays":["Monday","Wednesday","Friday"],"contentPillars":["p1","p2","p3","p4","p5"],"hashtagThemes":["t1","t2","t3"],"imageStyle":"string","platformSplit":{"facebook":40,"instagram":60},"engagementTips":"string"}`;

  const saturationFallback = { dailyPostingWindows: ['07:00','10:00','12:30','16:00','19:30'], contentVarietyStrategy: 'Rotate promo, value, story, entertainment, and UGC each day', contentPillars: ['Product Showcase','Behind the Scenes','Customer Stories','Educational','Flash Deals','Trending/Seasonal','Community Engagement'], hashtagThemes: ['artisan food','local business','foodie culture','daily specials'], imageStyle: 'vibrant, appetizing, clean background with natural lighting', platformSplit: { facebook: 40, instagram: 60 }, saturationTactics: 'Post at every peak window daily, alternating content types so each post feels fresh.', bestContentMix: '30% promotional, 30% value/educational, 20% entertainment, 20% behind-the-scenes/story' };
  const normalFallback = { bestPostingTimes: ['09:00','12:00','18:00'], bestDays: ['Tuesday','Thursday','Saturday'], contentPillars: ['Product Showcase','Behind the Scenes','Customer Stories','Educational','Seasonal/Trending'], hashtagThemes: ['artisan food','local business','foodie culture'], imageStyle: 'vibrant, appetizing, clean background with natural lighting', platformSplit: { facebook: 40, instagram: 60 }, engagementTips: 'Post consistently and respond to every comment within 2 hours.' };

  let research: any = {};
  try {
    const raw = await aiText(researchPrompt, token, true);
    research = parseJson(raw);
  } catch { research = saturationMode ? saturationFallback : normalFallback; }

  let fbCount: number, igCount: number;
  if (platforms.facebook && !platforms.instagram) { fbCount = postsToGenerate; igCount = 0; }
  else if (platforms.instagram && !platforms.facebook) { igCount = postsToGenerate; fbCount = 0; }
  else { igCount = Math.round(postsToGenerate * (research.platformSplit?.instagram || 60) / 100); fbCount = postsToGenerate - igCount; }

  const postsPerDay = saturationMode ? Math.ceil(postsToGenerate / windowDays) : null;
  const postingWindows = saturationMode ? (research.dailyPostingWindows || saturationFallback.dailyPostingWindows) : (research.bestPostingTimes || normalFallback.bestPostingTimes);

  const prompt = saturationMode ? `
You are an aggressive social media growth strategist running a SATURATION CAMPAIGN for "${businessName}", a ${businessType}. Tone: ${tone}.
Location: ${location}. Current date: ${now.toISOString().split('T')[0]}.
Campaign window: ${now.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]} (${windowDays} days).
Stats: Followers ${stats.followers}, Engagement ${stats.engagement}%, Reach ${stats.reach}.
Daily posting windows: ${postingWindows.join(', ')}. Content variety: ${research.contentVarietyStrategy || saturationFallback.contentVarietyStrategy}.
Content pillars (rotate ALL): ${(research.contentPillars || saturationFallback.contentPillars).join(', ')}.
Platform split: ${fbCount} Facebook posts, ${igCount} Instagram posts.
Generate exactly ${postsToGenerate} posts, ~${postsPerDay} per day. Never same pillar twice in a row.
Respond ONLY with valid JSON: {"strategy":"string","posts":[{"platform":"facebook","scheduledFor":"${now.toISOString().split('T')[0]}T07:00:00","topic":"string","content":"string","hashtags":["#tag"],"imagePrompt":"string","reasoning":"string","pillar":"string"}]}` : `
You are a social media strategist for "${businessName}", a ${businessType}. Tone: ${tone}.
Location: ${location}. Current date: ${now.toISOString().split('T')[0]}.
Window: ${now.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]}.
Stats: Followers ${stats.followers}, Engagement ${stats.engagement}%, Reach ${stats.reach}.
Best posting times: ${postingWindows.join(', ')}. Best days: ${(research.bestDays || normalFallback.bestDays).join(', ')}.
Content pillars: ${(research.contentPillars || normalFallback.contentPillars).join(', ')}.
Platform split: ${fbCount} Facebook posts, ${igCount} Instagram posts.
Generate exactly ${postsToGenerate} posts spread across 2 weeks.
Respond ONLY with valid JSON: {"strategy":"string","posts":[{"platform":"facebook","scheduledFor":"${now.toISOString().split('T')[0]}T09:00:00","topic":"string","content":"string","hashtags":["#tag"],"imagePrompt":"string","reasoning":"string","pillar":"string"}]}`;

  try {
    const raw = await aiText(prompt, token, true);
    const data = parseJson(raw);
    return { posts: Array.isArray(data.posts) ? data.posts : [], strategy: data.strategy || '' };
  } catch (error: any) {
    console.error('Smart Schedule Error:', error);
    return { posts: [], strategy: `Error: ${error?.message || 'Unknown'}` };
  }
};
