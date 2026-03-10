import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pn_gemini_key');
    if (stored) return stored;
  }
  return process.env.API_KEY || '';
};

const getAIClient = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error("API Key is missing. Set it in the Social Spirit settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
    });
};

export const generateSocialContent = async (
  topic: string,
  platform: string,
  businessName = 'Pickle Nick',
  businessType = 'artisan pickle business',
  tone = 'Witty, elegant, slightly humorous, and appetizing'
) => {
  const ai = getAIClient();
  const prompt = `
    You are an expert social media manager for "${businessName}", a ${businessType}.
    Tone: ${tone}.
    Write a catchy, engaging ${platform} post about: "${topic}".
    Include relevant emojis and 5-10 relevant hashtags.
    Return JSON with "content" (the post text) and "hashtags" (array of strings).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  return response.text ? JSON.parse(response.text) : { content: '', hashtags: [] };
};

export const generateSocialImage = async (prompt: string): Promise<string> => {
  const ai = getAIClient();
  const imagePrompt = `Professional food photography of artisan pickles, ${prompt}, highly detailed, cinematic lighting, appetizing, elegant styling, dark green branding tones.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          return await compressImage(rawBase64);
       }
    }
    throw new Error("No image generated");
  } catch (e) {
    console.error("Image generation failed", e);
    throw e;
  }
};

export const generateSiteImage = async (prompt: string): Promise<string> => {
    const ai = getAIClient();
    const imagePrompt = `
      Cinematic, high-quality photography for an artisan brand website.
      Subject: ${prompt}.
      Style: Rustic, authentic, sophisticated, tattoo-culture influence but elegant, warm lighting, high detail, 8k.
      No text overlays.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: imagePrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9" // Wider for site banners
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
         if (part.inlineData) {
            const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
            return await compressImage(rawBase64, 1200);
         }
      }
      throw new Error("No image generated");
    } catch (e) {
      console.error("Site image generation failed", e);
      throw e;
    }
  };

export const generateCategoryImage = async (categoryName: string): Promise<string> => {
    const ai = getAIClient();
    const imagePrompt = `
      Wide cinematic banner photography for a product category named "${categoryName}".
      Style: Artisan food branding, dark rustic wood backgrounds, dramatic lighting, high detail, photorealistic.
      Subject: An artistic arrangement of ingredients and jars related to ${categoryName}.
      No text overlays.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: imagePrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
         if (part.inlineData) {
            const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
            return await compressImage(rawBase64, 1200);
         }
      }
      throw new Error("No image generated");
    } catch (e) {
      console.error("Category image generation failed", e);
      throw e;
    }
  };

export const generateProductImage = async (name: string, category: string, description: string): Promise<string> => {
  const ai = getAIClient();
  const imagePrompt = `
    Professional high-end product photography of "${name}" (${category}).
    Visual Details based on description: ${description}.
    Setting: Rustic, artisanal style, sitting on a weathered dark oak table, dramatic natural lighting coming from a window, condensation on glass if applicable.
    Style: Photorealistic, 8k, highly detailed, appetizing food photography, elegant branding.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          return await compressImage(rawBase64);
       }
    }
    throw new Error("No image generated");
  } catch (e) {
    console.error("Product image generation failed", e);
    throw e;
  }
};

export const getPostingAdvice = async (platform: string) => {
    const ai = getAIClient();
    const prompt = `Best times to post on ${platform} for a food business to maximize engagement. Keep it brief and return a short 1-sentence tip.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
    });
    return response.text;
}

export const researchSocialTopic = async (query: string) => {
  const ai = getAIClient();
  const prompt = `
    As a social media expert for a niche food brand, research and provide specific advice on: "${query}".
    Provide 3 actionable bullet points.
    Keep the tone professional yet creative.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt
  });
  return response.text;
};

export const analyzeSocialMetrics = async (metricName: string, value: string | number) => {
  const ai = getAIClient();
  const prompt = `
    I run a small artisan pickle business. My Facebook page has a ${metricName} of ${value}.
    1. Is this good, average, or poor for a niche food brand?
    2. Give me 2 specific strategies to improve this number next week.
    Keep the answer concise and encouraging.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt
  });
  return response.text;
};

export const generateMarketingImage = async (prompt: string): Promise<string | null> => {
  const ai = getAIClient();
  const models = ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Professional marketing image: ${prompt}. High quality, vibrant, cinematic lighting, no text or watermarks.`,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        } as any,
      });
      const parts = (response as any)?.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const raw = `data:${mimeType};base64,${part.inlineData.data}`;
            // Compress to stay well under Firestore's 1 MB field limit
            return await compressImage(raw, 700, 0.65);
          }
        }
      }
    } catch (error) {
      console.warn(`Gemini Image (${model}):`, error);
      continue;
    }
  }
  return null;
};

export const analyzePostTimes = async (businessType: string, location: string) => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `What are the best times to post on Instagram and Facebook for a ${businessType} in ${location}? Give a concise bulleted list of 3 best time slots for the upcoming week.`
    });
    return response.text;
  } catch (error) {
    return "Could not analyze times.";
  }
};

export const generateRecommendations = async (businessName: string, businessType: string, stats: any) => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `
        You are a social media strategist for "${businessName}", a ${businessType}.
        Stats: Followers: ${stats.followers}, Reach: ${stats.reach}, Engagement: ${stats.engagement}%, Posts: ${stats.postsLast30Days}.
        Provide 3 specific, high-impact recommendations. Format as a concise bulleted list.
      `
    });
    return response.text || "No recommendations generated.";
  } catch (error) {
    return "Unable to analyze stats at this time.";
  }
};

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

export const generateSmartSchedule = async (
  businessName: string,
  businessType: string,
  tone: string,
  stats: any,
  postsToGenerate: number = 7,
  location: string = 'Australia',
  platforms: { facebook: boolean; instagram: boolean } = { facebook: true, instagram: true },
  saturationMode: boolean = false
): Promise<SmartScheduleResult> => {
  const ai = getAIClient();
  try {
    const now = new Date();
    // Saturation = 7-day blitz window; normal = 14-day spread
    const windowDays = saturationMode ? 7 : 14;
    const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    // ── Phase 1: Research ──────────────────────────────────────────
    const researchPrompt = saturationMode ? `
You are an expert social media growth hacker specialising in HIGH-FREQUENCY SATURATION posting strategies.
Research the optimal saturation posting plan for:
- Business: "${businessName}" — ${businessType}
- Location: ${location}
- Goal: Maximum algorithmic reach and traction through sheer posting volume
- Current stats: ${stats.followers} followers, ${stats.engagement}% engagement

Saturation posting means 3-5 posts per day across platforms. Research how to do this without audience fatigue.

Respond with ONLY a raw JSON object — no markdown, no code fences:
{
  "dailyPostingWindows": ["07:00", "10:00", "12:30", "16:00", "19:30"],
  "contentVarietyStrategy": "how to vary content across 5 daily posts to avoid fatigue",
  "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4", "pillar5", "pillar6", "pillar7"],
  "hashtagThemes": ["theme1", "theme2", "theme3", "theme4"],
  "imageStyle": "description of ideal image aesthetic",
  "platformSplit": { "facebook": 40, "instagram": 60 },
  "saturationTactics": "2-sentence tactical description of how to sustain volume without burning out the audience",
  "bestContentMix": "ratio/description of promo vs value vs entertainment vs story posts for saturation"
}` : `
You are an expert social media researcher. Research the optimal social media strategy for:
- Business: "${businessName}" — ${businessType}
- Location: ${location}
- Audience: local customers and online shoppers
- Current stats: ${stats.followers} followers, ${stats.engagement}% engagement

Research and provide a concise JSON object with exactly these fields:
{
  "bestPostingTimes": ["HH:MM", "HH:MM", "HH:MM"],
  "bestDays": ["Monday", "Wednesday", "Friday"],
  "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4", "pillar5"],
  "hashtagThemes": ["theme1", "theme2", "theme3"],
  "imageStyle": "description of ideal image aesthetic for this business type",
  "platformSplit": { "facebook": 40, "instagram": 60 },
  "engagementTips": "one sentence of the most impactful tactic for this business type"
}

Respond with ONLY the raw JSON object — no markdown, no code fences.`;

    const saturationFallback = {
      dailyPostingWindows: ['07:00', '10:00', '12:30', '16:00', '19:30'],
      contentVarietyStrategy: 'Rotate promo, value, story, entertainment, and UGC each day',
      contentPillars: ['Product Showcase', 'Behind the Scenes', 'Customer Stories', 'Educational', 'Flash Deals', 'Trending/Seasonal', 'Community Engagement'],
      hashtagThemes: ['artisan food', 'local business', 'foodie culture', 'daily specials'],
      imageStyle: 'vibrant, appetizing, clean background with natural lighting',
      platformSplit: { facebook: 40, instagram: 60 },
      saturationTactics: 'Post at every peak window daily, alternating content types so each post feels fresh. Vary formats: static images, carousels, reels-style captions, polls, and behind-the-scenes.',
      bestContentMix: '30% promotional, 30% value/educational, 20% entertainment, 20% behind-the-scenes/story'
    };
    const normalFallback = {
      bestPostingTimes: ['09:00', '12:00', '18:00'],
      bestDays: ['Tuesday', 'Thursday', 'Saturday'],
      contentPillars: ['Product Showcase', 'Behind the Scenes', 'Customer Stories', 'Educational', 'Seasonal/Trending'],
      hashtagThemes: ['artisan food', 'local business', 'foodie culture'],
      imageStyle: 'vibrant, appetizing, clean background with natural lighting',
      platformSplit: { facebook: 40, instagram: 60 },
      engagementTips: 'Post consistently and respond to every comment within 2 hours.'
    };

    let research: any = {};
    try {
      const researchRes = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: researchPrompt,
      });
      const researchRaw = (researchRes.text || '').trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      if (researchRaw) research = JSON.parse(researchRaw);
    } catch {
      research = saturationMode ? saturationFallback : normalFallback;
    }

    // ── Phase 2: Generate Schedule ─────────────────────────────────
    // Override AI platform split with the admin's actual connected platforms
    let fbCount: number;
    let igCount: number;
    if (platforms.facebook && !platforms.instagram) {
      fbCount = postsToGenerate; igCount = 0;
    } else if (platforms.instagram && !platforms.facebook) {
      igCount = postsToGenerate; fbCount = 0;
    } else {
      igCount = Math.round(postsToGenerate * (research.platformSplit?.instagram || 60) / 100);
      fbCount = postsToGenerate - igCount;
    }

    const postsPerDay = saturationMode ? Math.ceil(postsToGenerate / windowDays) : null;
    const postingWindows = saturationMode
      ? (research.dailyPostingWindows || saturationFallback.dailyPostingWindows)
      : (research.bestPostingTimes || normalFallback.bestPostingTimes);

    const prompt = saturationMode ? `
You are an aggressive social media growth strategist running a SATURATION CAMPAIGN for "${businessName}", a ${businessType}. Tone: ${tone}.
Location: ${location}. Current date: ${now.toISOString().split('T')[0]}.
Campaign window: ${now.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]} (${windowDays} days).
Stats: Followers ${stats.followers}, Engagement ${stats.engagement}%, Reach ${stats.reach}.

SATURATION RESEARCH INSIGHTS:
- Daily posting windows: ${postingWindows.join(', ')}
- Content variety strategy: ${research.contentVarietyStrategy || saturationFallback.contentVarietyStrategy}
- Content pillars (rotate ALL of them): ${(research.contentPillars || saturationFallback.contentPillars).join(', ')}
- Hashtag themes: ${(research.hashtagThemes || saturationFallback.hashtagThemes).join(', ')}
- Image aesthetic: ${research.imageStyle || saturationFallback.imageStyle}
- Saturation tactics: ${research.saturationTactics || saturationFallback.saturationTactics}
- Content mix: ${research.bestContentMix || saturationFallback.bestContentMix}
- Platform split: ${fbCount} Facebook posts, ${igCount} Instagram posts

SATURATION RULES:
1. Generate exactly ${postsToGenerate} posts (${fbCount} facebook, ${igCount} instagram).
2. Spread ~${postsPerDay} posts per day across the ${windowDays}-day window.
3. Use ALL ${postingWindows.length} daily time windows — never schedule two posts at the same time on the same day.
4. Each day must have DIFFERENT content pillars — NO two consecutive posts from the same pillar.
5. Vary the format: some posts are punchy 1-liners, some are storytelling, some are questions/polls, some are product-focused, some are behind-the-scenes.
6. Hashtags must be highly relevant and varied per post (8-12 per post, mix broad and niche).
7. Every post needs a unique, specific imagePrompt for AI image generation.

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "strategy": "2-sentence saturation strategy summary explaining the volume approach and content variety",
  "posts": [
    {
      "platform": "facebook",
      "scheduledFor": "${now.toISOString().split('T')[0]}T07:00:00",
      "topic": "short topic label",
      "content": "full post caption with emojis and personality matching tone",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "imagePrompt": "detailed image description matching the researched aesthetic",
      "reasoning": "which content pillar + time window this uses and why",
      "pillar": "content pillar name"
    }
  ]
}` : `
You are a social media strategist for "${businessName}", a ${businessType}. Tone: ${tone}.
Location: ${location}. Current date: ${now.toISOString().split('T')[0]}.
Window: ${now.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]}.
Stats: Followers ${stats.followers}, Engagement ${stats.engagement}%, Reach ${stats.reach}.

RESEARCH INSIGHTS (use these to inform every decision):
- Best posting times: ${postingWindows.join(', ')}
- Best days: ${(research.bestDays || normalFallback.bestDays).join(', ')}
- Content pillars to use: ${(research.contentPillars || normalFallback.contentPillars).join(', ')}
- Hashtag themes: ${(research.hashtagThemes || normalFallback.hashtagThemes).join(', ')}
- Image aesthetic: ${research.imageStyle || 'vibrant and appetizing'}
- Platform split: ${fbCount} Facebook posts, ${igCount} Instagram posts
- Key engagement tip: ${research.engagementTips || ''}

Generate exactly ${postsToGenerate} posts (${fbCount} facebook, ${igCount} instagram).
Spread them across the 2-week window. Use the researched best times and days.
Rotate through ALL content pillars. Each post needs a specific imagePrompt matching the image aesthetic above.
Hashtags must be relevant to the hashtag themes researched above (8-12 per post).

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "strategy": "2-sentence strategy summary referencing the research insights",
  "posts": [
    {
      "platform": "facebook",
      "scheduledFor": "${now.toISOString().split('T')[0]}T09:00:00",
      "topic": "short topic label",
      "content": "full post caption with emojis and personality matching tone",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "imagePrompt": "detailed image description matching the researched aesthetic",
      "reasoning": "why this content pillar + time was chosen based on research",
      "pillar": "content pillar name from the researched list"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const raw = (response.text || '').trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const data = raw ? JSON.parse(raw) : { posts: [], strategy: '' };
    return { posts: Array.isArray(data.posts) ? data.posts : [], strategy: data.strategy || '' };
  } catch (error: any) {
    console.error("Smart Schedule Error:", error);
    return { posts: [], strategy: `Error: ${error?.message || 'Unknown'}` };
  }
};

export const generateProductDescription = async (name: string, category: string) => {
  const ai = getAIClient();
  const prompt = `
    Write a sophisticated, artisanal, and appetizing product description for a ${category} item named "${name}".
    Focus on flavor profiles, textures, and traditional preservation methods.
    The tone should be whimsical, rustic, and premium.
    Keep it under 50 words.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt
  });
  return response.text;
};