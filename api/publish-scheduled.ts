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

// ── Facebook token health check ───────────────────────────────────

async function checkFbToken(pageId: string, accessToken: string): Promise<{ valid: boolean; errorCode?: number; errorMsg?: string }> {
  try {
    const res = await fetch(`${FB_BASE}/${pageId}?fields=id&access_token=${accessToken}`);
    const data = await res.json();
    if (data.error) {
      return { valid: false, errorCode: data.error.code, errorMsg: data.error.message };
    }
    return { valid: true };
  } catch (err: any) {
    return { valid: false, errorMsg: err?.message || 'Network error checking token' };
  }
}

async function sendTokenExpiredAlert(
  resendKey: string,
  adminEmail: string,
  fromName: string,
  fromEmail: string,
  errorMsg: string
): Promise<void> {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      subject: '⚠ Facebook token expired — scheduled posts paused',
      html: `<div style="font-family:sans-serif;padding:24px;max-width:560px">
        <h2 style="color:#dc2626;margin:0 0 12px">⚠ Facebook Token Expired</h2>
        <p style="color:#374151">Your Facebook Page Access Token has expired. <strong>All scheduled posts are paused</strong> until you reconnect.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0">
          <p style="margin:0;font-size:13px;color:#991b1b"><strong>Error:</strong> ${errorMsg}</p>
        </div>
        <h3 style="color:#111827;font-size:15px;margin:20px 0 8px">How to fix (2 minutes):</h3>
        <ol style="color:#374151;font-size:14px;line-height:1.7;padding-left:20px">
          <li>Go to <a href="https://developers.facebook.com/tools/explorer" style="color:#2563eb">developers.facebook.com/tools/explorer</a></li>
          <li>Select your App → click <strong>Generate Access Token</strong></li>
          <li>Switch the dropdown from User to your <strong>Page</strong></li>
          <li>Copy the token</li>
          <li>In admin: <strong>Settings → Social Media API → Paste token manually</strong></li>
          <li>Save, then click <strong>Run Publisher</strong> in Social Spirit to retry</li>
        </ol>
        <p style="color:#6b7280;font-size:12px;margin-top:20px">Your scheduled posts are untouched and will publish automatically once a valid token is saved.</p>
      </div>`
    })
  }).catch(() => {});
}

// ── Main Handler ────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept an optional Authorization header for manual triggers from the app
  // Cron calls arrive with x-vercel-cron: 1 header

  // Accept both plain and VITE_-prefixed env vars (VITE_ prefix is added by Vite for client builds
  // but serverless functions can also read them via process.env)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const fbApiKey  = process.env.FIREBASE_API_KEY    || process.env.VITE_FIREBASE_API_KEY;

  if (!projectId || !fbApiKey) {
    return res.status(500).json({
      error: 'Missing Firebase env vars. Add VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in Vercel project settings.'
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

    // 3. Health-check the token BEFORE touching any posts
    const tokenCheck = await checkFbToken(fbPageId, fbAccessToken);
    if (!tokenCheck.valid) {
      console.error('FB token invalid:', tokenCheck.errorMsg);
      // Send immediate email alert so admin can fix it without checking logs
      const resendKey: string = settings?.emailConfig?.resendApiKey || (process.env.RESEND_API_KEY ?? '');
      const adminEmail: string = settings?.emailConfig?.adminEmail || (process.env.ADMIN_EMAIL ?? '');
      if (resendKey && adminEmail) {
        await sendTokenExpiredAlert(
          resendKey, adminEmail,
          settings?.emailConfig?.fromName || 'Pickle Nick',
          settings?.emailConfig?.fromEmail || 'noreply@picklenick.au',
          tokenCheck.errorMsg || 'Token validation failed'
        );
      }
      return res.status(200).json({
        message: 'Facebook token expired or invalid. Posts NOT marked as failed — they will retry once a new token is saved. Admin alert sent.',
        tokenError: tokenCheck.errorMsg,
        ...results
      });
    }

    // 4. Query all posts from Firestore (token is valid — safe to proceed)
    const postsRes = await fetch(`${base}/posts?key=${fbApiKey}&pageSize=200`);
    const postsData = await postsRes.json();
    const allDocs: any[] = postsData?.documents || [];

    const now = Date.now();

    // 5. Filter: scheduled posts whose time has arrived (up to 48h past due for catchup)
    const MAX_ATTEMPTS = 5;
    const CATCHUP_WINDOW_MS = 48 * 60 * 60 * 1000;
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
        const scheduled = new Date(p['scheduledTime'] as string).getTime();
        if (scheduled > now) return false;                          // not due yet
        if (now - scheduled > CATCHUP_WINDOW_MS) return false;     // too old, skip
        if ((p['publishAttempts'] ?? 0) >= MAX_ATTEMPTS) return false; // too many failures
        return true;
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

        // 6. Update post status in Firestore (success)
        // Note: we intentionally clear imageUrl after publish — the image lives on Facebook now
        // and storing large base64 strings back to Firestore would exceed the 1MB field limit.
        const docId = post._docName?.split('/').pop();
        if (docId) {
          const updated = toFsDoc({
            ...post,
            _docName: undefined,
            status: 'published',
            imageUrl: null,
            fbPostId,
            publishAttempts: 0,
            publishError: null,
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
        const errMsg = err?.message || 'Unknown error';
        results.errors.push(`Post ${post.id || 'unknown'}: ${errMsg}`);
        console.error('Publish error:', err);

        // Persist the failure so admin can see it and we don't retry forever
        const docId = post._docName?.split('/').pop();
        if (docId) {
          const attempts = (post.publishAttempts ?? 0) + 1;
          const failDoc = toFsDoc({
            ...post,
            _docName: undefined,
            publishAttempts: attempts,
            publishError: `[${new Date().toISOString()}] ${errMsg}`,
            updatedAt: Date.now()
          });
          await fetch(`${base}/posts/${docId}?key=${fbApiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(failDoc)
          }).catch(() => {/* ignore secondary write failure */});
        }
      }
    }
  } catch (err: any) {
    console.error('Cron handler error:', err);
    return res.status(500).json({ error: err?.message || 'Handler failed', ...results });
  }

  // ── Email admin if any posts failed ────────────────────────────────
  if (results.failed > 0) {
    try {
      const settingsRes2 = await fetch(`${fsBase(projectId)}/settings/main?key=${fbApiKey}`);
      const settingsDoc2 = await settingsRes2.json();
      const s2 = fromFsDoc(settingsDoc2);
      const resendKey: string = s2?.emailConfig?.resendApiKey || (process.env.RESEND_API_KEY ?? '');
      const adminEmail: string = s2?.emailConfig?.adminEmail || (process.env.ADMIN_EMAIL ?? '');
      const fromName: string = s2?.emailConfig?.fromName || 'Pickle Nick';
      const fromEmail: string = s2?.emailConfig?.fromEmail || 'noreply@picklenick.au';
      if (resendKey && adminEmail) {
        const errorList = results.errors.map(e => `<li style="font-size:13px;color:#666;margin:4px 0">${e}</li>`).join('');
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: adminEmail,
            subject: `⚠ ${results.failed} social post(s) failed to publish`,
            html: `<div style="font-family:sans-serif;padding:24px;max-width:520px">
              <h2 style="color:#dc2626;margin:0 0 12px">⚠ Social Post Publish Failure</h2>
              <p style="color:#374151">${results.failed} scheduled post(s) could not be published to Facebook.</p>
              <ul style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 12px 12px 28px;margin:16px 0">${errorList}</ul>
              <p style="color:#6b7280;font-size:13px">Log in to admin → Social Spirit → Calendar to view and retry failed posts.</p>
              <p style="color:#6b7280;font-size:13px">Published this run: <strong>${results.published}</strong> &nbsp;|&nbsp; Failed: <strong style="color:#dc2626">${results.failed}</strong></p>
            </div>`
          })
        }).catch(() => {});
      }
    } catch { /* don't let email failure affect the main response */ }
  }

  return res.status(200).json({
    message: `Published ${results.published} post(s). Images generated: ${results.imageGenerated}. Failed: ${results.failed}.`,
    ...results
  });
}
