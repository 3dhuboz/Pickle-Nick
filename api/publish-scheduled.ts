import type { VercelRequest, VercelResponse } from '@vercel/node';

const FB_BASE = 'https://graph.facebook.com/v21.0';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ── Firestore REST helpers ──────────────────────────────────────────

const fsBase = (projectId: string) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const fromFsVal = (v: any): any => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(fromFsVal);
  if ('mapValue' in v) {
    const obj: Record<string, any> = {};
    for (const [k, val] of Object.entries(v.mapValue?.fields || {})) obj[k] = fromFsVal(val);
    return obj;
  }
  return null;
};

const fromFsDoc = (doc: any): Record<string, any> | null => {
  if (!doc?.fields) return null;
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) obj[k] = fromFsVal(v);
  return obj;
};

const toFsVal = (v: any): any => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } };
  if (typeof v === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) { if (val !== undefined) fields[k] = toFsVal(val); }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
};

const toFsDoc = (obj: Record<string, any>) => {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) { if (v !== undefined) fields[k] = toFsVal(v); }
  return { fields };
};

// ── Gemini image generation via REST ───────────────────────────────

async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation'];
  for (const model of models) {
    try {
      const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Professional marketing photo for an artisan food brand. ${prompt}. Clean background, vibrant colors, appetizing presentation.` }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch { continue; }
  }
  return null;
}

// ── Facebook posting via Graph API REST ────────────────────────────

async function postTextToFacebook(pageId: string, accessToken: string, message: string): Promise<string> {
  const res = await fetch(`${FB_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.id;
}

async function postPhotoToFacebook(
  pageId: string,
  accessToken: string,
  message: string,
  imageBase64: string
): Promise<string> {
  const [header, b64data] = imageBase64.split(',');
  const mimeMatch = header.match(/data:(image\/[^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const imageBuffer = Buffer.from(b64data, 'base64');

  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  form.append('source', blob, 'post-image.jpg');
  form.append('message', message);
  form.append('access_token', accessToken);
  form.append('published', 'true');

  const res = await fetch(`${FB_BASE}/${pageId}/photos`, { method: 'POST', body: form });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.post_id || data.id;
}

// ── Main Handler ────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept an optional Authorization header for manual triggers from the app
  // Cron calls arrive with x-vercel-cron: 1 header

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const fbApiKey = process.env.FIREBASE_API_KEY;

  if (!projectId || !fbApiKey) {
    return res.status(500).json({
      error: 'Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY environment variables. Set these in your Vercel project settings.'
    });
  }

  const base = fsBase(projectId);
  const results = { published: 0, failed: 0, imageGenerated: 0, errors: [] as string[] };

  try {
    // 1. Read app settings to get FB credentials
    const settingsRes = await fetch(`${base}/settings/main?key=${fbApiKey}`);
    const settingsDoc = await settingsRes.json();
    const settings = fromFsDoc(settingsDoc);

    const fbPageId: string = settings?.fbPageId || (process.env.FB_PAGE_ID ?? '');
    const fbAccessToken: string = settings?.fbPageAccessToken || (process.env.FB_PAGE_ACCESS_TOKEN ?? '');

    // 2. Read Gemini key from social config
    const socialRes = await fetch(`${base}/settings/social?key=${fbApiKey}`);
    const socialDoc = await socialRes.json();
    const socialConfig = fromFsDoc(socialDoc);
    const geminiKey: string = socialConfig?.geminiKey || (process.env.GEMINI_API_KEY ?? '');

    if (!fbPageId || !fbAccessToken) {
      return res.status(200).json({
        message: 'Facebook page not configured. Set FB credentials in Social Spirit settings.',
        ...results
      });
    }

    // 3. Query all posts from Firestore
    const postsRes = await fetch(`${base}/posts?key=${fbApiKey}&pageSize=200`);
    const postsData = await postsRes.json();
    const allDocs: any[] = postsData?.documents || [];

    const now = Date.now();

    // 4. Filter: scheduled posts whose time has arrived
    type PostDoc = Record<string, any> & { _docName: string };
    const duePosts: PostDoc[] = allDocs
      .map((d: any): PostDoc | null => {
        const fields = fromFsDoc(d);
        if (!fields) return null;
        return { ...fields, _docName: d.name as string };
      })
      .filter((p): p is PostDoc => {
        if (!p || p['status'] !== 'scheduled') return false;
        if (!p['scheduledTime']) return false;
        return new Date(p['scheduledTime'] as string).getTime() <= now;
      });

    if (duePosts.length === 0) {
      return res.status(200).json({ message: 'No posts due for publishing at this time.', ...results });
    }

    // 5. Process each due post
    for (const post of duePosts) {
      try {
        let imageDataUrl: string | null = post.imageUrl || null;

        // Generate image if missing and we have a prompt + API key
        if (!imageDataUrl && post.imagePrompt && geminiKey) {
          const generated = await generateImage(post.imagePrompt, geminiKey);
          if (generated) {
            imageDataUrl = generated;
            results.imageGenerated++;
          }
        }

        // Build message with hashtags
        const hashtags = Array.isArray(post.hashtags) && post.hashtags.length > 0
          ? '\n\n' + post.hashtags.join(' ')
          : '';
        const message = `${post.content}${hashtags}`;

        // Post to Facebook
        let fbPostId: string;
        if (imageDataUrl && imageDataUrl.startsWith('data:image/')) {
          fbPostId = await postPhotoToFacebook(fbPageId, fbAccessToken, message, imageDataUrl);
        } else {
          fbPostId = await postTextToFacebook(fbPageId, fbAccessToken, message);
        }

        // 6. Update post status + image URL in Firestore
        const docId = post._docName?.split('/').pop();
        if (docId) {
          const updated = toFsDoc({
            ...post,
            _docName: undefined,
            status: 'published',
            imageUrl: imageDataUrl || post.imageUrl || null,
            fbPostId,
            updatedAt: Date.now()
          });
          await fetch(`${base}/posts/${docId}?key=${fbApiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          });
        }

        results.published++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Post ${post.id || 'unknown'}: ${err?.message || 'Unknown error'}`);
        console.error('Publish error:', err);
      }
    }
  } catch (err: any) {
    console.error('Cron handler error:', err);
    return res.status(500).json({ error: err?.message || 'Handler failed', ...results });
  }

  return res.status(200).json({
    message: `Published ${results.published} post(s). Images generated: ${results.imageGenerated}. Failed: ${results.failed}.`,
    ...results
  });
}
