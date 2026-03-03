import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please select one using the settings.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const generateSocialContent = async (topic: string, platform: string) => {
  const ai = getAIClient();
  const prompt = `
    You are the social media manager for 'Pickle Nick', a sophisticated yet whimsical artisan pickle business.
    Write a ${platform} post about: ${topic}.
    The tone should be witty, elegant, slightly humorous, and appetizing.
    Include 5-10 relevant hashtags.
    Return the response as a JSON object with 'content' (the post text) and 'hashtags' (array of strings).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
        model: 'gemini-3-flash-preview',
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
    model: 'gemini-3-flash-preview',
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
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text;
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
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text;
};