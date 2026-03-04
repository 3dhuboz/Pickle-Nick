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
        model: 'gemini-1.5-flash',
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
            return `data:${mimeType};base64,${part.inlineData.data}`;
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
      model: 'gemini-1.5-flash',
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
      model: 'gemini-1.5-flash',
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
  postsToGenerate: number = 7
): Promise<SmartScheduleResult> => {
  const ai = getAIClient();
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const prompt = `
You are a social media strategist for "${businessName}", a ${businessType}. Tone: ${tone}.
Current date: ${now.toISOString().split('T')[0]}.
Window: ${now.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]}.
Stats: Followers ${stats.followers}, Engagement ${stats.engagement}%, Reach ${stats.reach}.

Generate exactly ${postsToGenerate} social media posts spread across the next 2 weeks.
Mix platforms (facebook and instagram). Schedule at optimal times for an Australian audience.

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation. Format:
{
  "strategy": "2-sentence strategy summary",
  "posts": [
    {
      "platform": "facebook",
      "scheduledFor": "2025-01-15T09:00:00",
      "topic": "short topic",
      "content": "full post caption with emojis",
      "hashtags": ["#tag1", "#tag2"],
      "imagePrompt": "image description for AI generation",
      "reasoning": "why this post at this time",
      "pillar": "content pillar name"
    }
  ]
}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const raw = (response.text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
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