/**
 * Cloudflare Worker — Hourly scheduled post publisher for Pickle Nick.
 * Replaces Vercel cron: { path: "/api/publish-scheduled", schedule: "0 * * * *" }
 *
 * Deploy with: wrangler deploy
 * Cron trigger is configured in wrangler.toml
 */

interface Env {
  FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
  VITE_FIREBASE_API_KEY: string;
  FB_PAGE_ID?: string;
  FB_PAGE_ACCESS_TOKEN?: string;
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL?: string;
}

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

// ── Gemini image generation ─────────────────────────────────────────

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

// ── Facebook posting ────────────────────────────────────────────────

async function postTextToFacebook(pageId: string, accessToken: string, message: string): Promise<string> {
  const res = await fetch(`${FB_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken })
  });
  const data: any = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.id;
}

async function postPhotoToFacebook(pageId: string, accessToken: string, message: string, imageBase64: string): Promise<string> {
  const [header, b64data] = imageBase64.split(',');
  const mimeMatch = header.match(/data:(image\/[^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  // CF Workers: use Uint8Array instead of Buffer
  const imageBytes = Uint8Array.from(atob(b64data), c => c.charCodeAt(0));

  const form = new FormData();
  const blob = new Blob([imageBytes], { type: mimeType });
  form.append('source', blob, 'post-image.jpg');
  form.append('message', message);
  form.append('access_token', accessToken);
  form.append('published', 'true');

  const res = await fetch(`${FB_BASE}/${pageId}/photos`, { method: 'POST', body: form });
  const data: any = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.post_id || data.id;
}

async function checkFbToken(pageId: string, accessToken: string): Promise<{ valid: boolean; errorCode?: number; errorMsg?: string }> {
  try {
    const res = await fetch(`${FB_BASE}/${pageId}?fields=id&access_token=${accessToken}`);
    const data: any = await res.json();
    if (data.error) return { valid: false, errorCode: data.error.code, errorMsg: data.error.message };
    return { valid: true };
  } catch (err: any) {
    return { valid: false, errorMsg: err?.message || 'Network error checking token' };
  }
}

async function sendTokenExpiredAlert(resendKey: string, adminEmail: string, fromName: string, fromEmail: string, errorMsg: string): Promise<void> {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      subject: '⚠ Facebook token expired — scheduled posts paused',
      html: `<div style="font-family:sans-serif;padding:24px;max-width:560px">
        <h2 style="color:#dc2626;margin:0 0 12px">⚠ Facebook Token Expired</h2>
        <p>Your Facebook Page Access Token has expired. <strong>All scheduled posts are paused</strong> until you reconnect.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0">
          <p style="margin:0;font-size:13px;color:#991b1b"><strong>Error:</strong> ${errorMsg}</p>
        </div>
        <p style="color:#6b7280;font-size:12px;margin-top:20px">Your scheduled posts are untouched and will publish automatically once a valid token is saved.</p>
      </div>`
    })
  }).catch(() => {});
}

// ── Core publish logic (shared between scheduled and HTTP triggers) ──

async function runPublisher(env: Env): Promise<{ message: string; published: number; failed: number; imageGenerated: number; errors: string[] }> {
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
  const fbApiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY;

  if (!projectId || !fbApiKey) {
    throw new Error('Missing Firebase env vars: FIREBASE_PROJECT_ID and FIREBASE_API_KEY required.');
  }

  const base = fsBase(projectId);
  const results = { published: 0, failed: 0, imageGenerated: 0, errors: [] as string[] };

  const settingsRes = await fetch(`${base}/settings/main?key=${fbApiKey}`);
  const settingsDoc = await settingsRes.json();
  const settings = fromFsDoc(settingsDoc);

  const fbPageId: string = settings?.fbPageId || (env.FB_PAGE_ID ?? '');
  const fbAccessToken: string = settings?.fbPageAccessToken || (env.FB_PAGE_ACCESS_TOKEN ?? '');

  const socialRes = await fetch(`${base}/settings/social?key=${fbApiKey}`);
  const socialDoc = await socialRes.json();
  const socialConfig = fromFsDoc(socialDoc);
  const geminiKey: string = socialConfig?.geminiKey || (env.GEMINI_API_KEY ?? '');

  if (!fbPageId || !fbAccessToken) {
    return { message: 'Facebook page not configured.', ...results };
  }

  const tokenCheck = await checkFbToken(fbPageId, fbAccessToken);
  if (!tokenCheck.valid) {
    const resendKey: string = settings?.emailConfig?.resendApiKey || (env.RESEND_API_KEY ?? '');
    const adminEmail: string = settings?.emailConfig?.adminEmail || (env.ADMIN_EMAIL ?? '');
    if (resendKey && adminEmail) {
      await sendTokenExpiredAlert(resendKey, adminEmail,
        settings?.emailConfig?.fromName || 'Pickle Nick',
        settings?.emailConfig?.fromEmail || 'noreply@picklenick.au',
        tokenCheck.errorMsg || 'Token validation failed'
      );
    }
    return { message: 'Facebook token expired. Admin alert sent.', ...results };
  }

  const postsRes = await fetch(`${base}/posts?key=${fbApiKey}&pageSize=200`);
  const postsData: any = await postsRes.json();
  const allDocs: any[] = postsData?.documents || [];

  const now = Date.now();
  const MAX_ATTEMPTS = 5;
  const CATCHUP_WINDOW_MS = 48 * 60 * 60 * 1000;

  const duePosts = allDocs
    .map((d: any) => { const f = fromFsDoc(d); return f ? { ...f, _docName: d.name as string } : null; })
    .filter((p): p is Record<string, any> & { _docName: string } => {
      if (!p || p['status'] !== 'scheduled' || !p['scheduledTime']) return false;
      const scheduled = new Date(p['scheduledTime'] as string).getTime();
      if (scheduled > now || now - scheduled > CATCHUP_WINDOW_MS) return false;
      return (p['publishAttempts'] ?? 0) < MAX_ATTEMPTS;
    });

  if (duePosts.length === 0) {
    return { message: 'No posts due for publishing.', ...results };
  }

  for (const post of duePosts) {
    try {
      let imageDataUrl: string | null = post.imageUrl || null;
      if (!imageDataUrl && post.imagePrompt && geminiKey) {
        const generated = await generateImage(post.imagePrompt, geminiKey);
        if (generated) { imageDataUrl = generated; results.imageGenerated++; }
      }

      const hashtags = Array.isArray(post.hashtags) && post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : '';
      const message = `${post.content}${hashtags}`;

      let fbPostId: string;
      if (imageDataUrl && imageDataUrl.startsWith('data:image/')) {
        fbPostId = await postPhotoToFacebook(fbPageId, fbAccessToken, message, imageDataUrl);
      } else {
        fbPostId = await postTextToFacebook(fbPageId, fbAccessToken, message);
      }

      const docId = post._docName?.split('/').pop();
      if (docId) {
        const updated = toFsDoc({ ...post, _docName: undefined, status: 'published', imageUrl: null, fbPostId, publishAttempts: 0, publishError: null, updatedAt: Date.now() });
        await fetch(`${base}/posts/${docId}?key=${fbApiKey}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      }
      results.published++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Post ${post.id || 'unknown'}: ${err?.message || 'Unknown error'}`);
      const docId = post._docName?.split('/').pop();
      if (docId) {
        const attempts = (post.publishAttempts ?? 0) + 1;
        const failDoc = toFsDoc({ ...post, _docName: undefined, publishAttempts: attempts, publishError: `[${new Date().toISOString()}] ${err?.message}`, updatedAt: Date.now() });
        await fetch(`${base}/posts/${docId}?key=${fbApiKey}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(failDoc) }).catch(() => {});
      }
    }
  }

  if (results.failed > 0) {
    const s2 = fromFsDoc(await (await fetch(`${base}/settings/main?key=${fbApiKey}`)).json());
    const resendKey: string = s2?.emailConfig?.resendApiKey || (env.RESEND_API_KEY ?? '');
    const adminEmail: string = s2?.emailConfig?.adminEmail || (env.ADMIN_EMAIL ?? '');
    if (resendKey && adminEmail) {
      const errorList = results.errors.map(e => `<li style="font-size:13px;color:#666;margin:4px 0">${e}</li>`).join('');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: `${s2?.emailConfig?.fromName || 'Pickle Nick'} <${s2?.emailConfig?.fromEmail || 'noreply@picklenick.au'}>`,
          to: adminEmail,
          subject: `⚠ ${results.failed} social post(s) failed to publish`,
          html: `<div style="font-family:sans-serif;padding:24px;max-width:520px"><h2 style="color:#dc2626">⚠ Publish Failure</h2><ul style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 12px 12px 28px">${errorList}</ul></div>`
        })
      }).catch(() => {});
    }
  }

  return { message: `Published ${results.published}. Images generated: ${results.imageGenerated}. Failed: ${results.failed}.`, ...results };
}

// ── Cloudflare Worker exports ───────────────────────────────────────

export default {
  // Scheduled cron trigger (replaces Vercel cron)
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const result = await runPublisher(env);
      console.log('[CRON]', result.message);
    } catch (err: any) {
      console.error('[CRON ERROR]', err?.message);
    }
  },

  // HTTP handler for manual triggers from the admin UI
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
    try {
      const result = await runPublisher(env);
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || 'Handler failed' }), { status: 500 });
    }
  }
};
