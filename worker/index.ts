import { Env, requireAdmin, optionalAuth, jsonResponse, jsonError, corsHeaders } from './auth';

export type { Env };

// ── Helpers ──────────────────────────────────────────────────────────────────

const stamp = (data: any) => ({ ...data, updated_at: Date.now() });

const uid = () => crypto.randomUUID();

const rowToProduct = (r: any) => ({
  id: r.id, name: r.name, description: r.description, price: r.price,
  stock: r.stock, image: r.image, category: r.category, featured: !!r.featured,
  weight: r.weight, updatedAt: r.updated_at,
});

const rowToCategory = (r: any) => ({
  id: r.id, name: r.name, image: r.image, description: r.description, updatedAt: r.updated_at,
});

const rowToOrder = (r: any, items: any[]) => ({
  id: r.id, userId: r.user_id, customerName: r.customer_name, customerEmail: r.customer_email,
  shippingAddress: r.shipping_address, subtotal: r.subtotal, tax: r.tax,
  shippingCost: r.shipping_cost, shippingMethod: r.shipping_method, total: r.total,
  status: r.status, paymentStatus: r.payment_status, paymentMethod: r.payment_method,
  transactionId: r.transaction_id, createdAt: r.created_at, trackingNumber: r.tracking_number,
  noTracking: !!r.no_tracking, updatedAt: r.updated_at,
  items: items.map(i => ({ productId: i.product_id, quantity: i.quantity, price: i.price, name: i.name })),
});

const rowToUser = (r: any) => ({
  id: r.id, email: r.email, name: r.name, role: r.role, orders: [], updatedAt: r.updated_at,
});

const rowToPost = (r: any) => ({
  id: r.id, platform: r.platform, content: r.content, imageUrl: r.image_url,
  scheduledTime: r.scheduled_time, status: r.status,
  hashtags: JSON.parse(r.hashtags || '[]'), imagePrompt: r.image_prompt,
  reasoning: r.reasoning, pillar: r.pillar, topic: r.topic,
  publishError: r.publish_error, publishAttempts: r.publish_attempts, updatedAt: r.updated_at,
});

const rowToMessage = (r: any) => ({
  id: r.id, name: r.name, email: r.email, message: r.message,
  read: !!r.read, createdAt: r.created_at, updatedAt: r.updated_at,
});

const getOrderItems = async (db: D1Database, orderId: string) =>
  (await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all()).results;

const getOrdersWithItems = async (db: D1Database, rows: any[]) =>
  Promise.all(rows.map(async r => rowToOrder(r, await getOrderItems(db, r.id))));

// ── Product Handlers ──────────────────────────────────────────────────────────

async function handleProducts(request: Request, env: Env, path: string): Promise<Response> {
  const id = path.replace('/api/products', '').replace(/^\//, '') || null;

  if (request.method === 'GET') {
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
      return row ? jsonResponse(rowToProduct(row)) : jsonError('Not found', 404);
    }
    const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all();
    return jsonResponse(results.map(rowToProduct));
  }

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const body: any = await request.json();

  if (request.method === 'POST') {
    const p = stamp(body);
    await env.DB.prepare(
      'INSERT INTO products (id,name,description,price,stock,image,category,featured,weight,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).bind(p.id || uid(), p.name, p.description || '', p.price, p.stock || 0, p.image || '', p.category || '', p.featured ? 1 : 0, p.weight ?? null, p.updated_at).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'PUT' && id) {
    const p = stamp(body);
    await env.DB.prepare(
      'INSERT OR REPLACE INTO products (id,name,description,price,stock,image,category,featured,weight,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).bind(id, p.name, p.description || '', p.price, p.stock || 0, p.image || '', p.category || '', p.featured ? 1 : 0, p.weight ?? null, p.updated_at).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Category Handlers ─────────────────────────────────────────────────────────

async function handleCategories(request: Request, env: Env, path: string): Promise<Response> {
  const id = path.replace('/api/categories', '').replace(/^\//, '') || null;

  if (request.method === 'GET') {
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
      return row ? jsonResponse(rowToCategory(row)) : jsonError('Not found', 404);
    }
    const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return jsonResponse(results.map(rowToCategory));
  }

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const body: any = await request.json();

  if (request.method === 'POST') {
    const c = stamp(body);
    await env.DB.prepare(
      'INSERT INTO categories (id,name,image,description,updated_at) VALUES (?,?,?,?,?)'
    ).bind(c.id || uid(), c.name, c.image || '', c.description || '', c.updated_at).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'PUT' && id) {
    const c = stamp(body);
    await env.DB.prepare(
      'INSERT OR REPLACE INTO categories (id,name,image,description,updated_at) VALUES (?,?,?,?,?)'
    ).bind(id, c.name, c.image || '', c.description || '', c.updated_at).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Order Handlers ────────────────────────────────────────────────────────────

async function handleOrders(request: Request, env: Env, path: string): Promise<Response> {
  const subPath = path.replace('/api/orders', '');
  const id = subPath.replace(/^\//, '') || null;

  // GET /api/orders/mine — customer's own orders
  if (request.method === 'GET' && subPath === '/mine') {
    const userId = await optionalAuth(request, env);
    if (!userId) return jsonError('Unauthorized', 401);
    const { results } = await env.DB.prepare(
      'SELECT o.* FROM orders o JOIN user_orders uo ON o.id = uo.order_id WHERE uo.user_id = ? ORDER BY o.created_at DESC'
    ).bind(userId).all();
    return jsonResponse(await getOrdersWithItems(env.DB, results));
  }

  if (request.method === 'GET') {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;
    if (id && id !== 'mine') {
      const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
      if (!row) return jsonError('Not found', 404);
      return jsonResponse(rowToOrder(row, await getOrderItems(env.DB, id)));
    }
    const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    return jsonResponse(await getOrdersWithItems(env.DB, results));
  }

  // POST /api/orders — place order (public, guest or user)
  if (request.method === 'POST') {
    const userId = await optionalAuth(request, env);
    const body: any = await request.json();
    const order = { ...body, id: body.id || uid(), userId: userId || body.userId || 'guest' };
    const now = Date.now();

    const stmts: D1PreparedStatement[] = [
      env.DB.prepare(
        'INSERT INTO orders (id,user_id,customer_name,customer_email,shipping_address,subtotal,tax,shipping_cost,shipping_method,total,status,payment_status,payment_method,transaction_id,created_at,tracking_number,no_tracking,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
      ).bind(
        order.id, order.userId, order.customerName, order.customerEmail, order.shippingAddress,
        order.subtotal, order.tax || 0, order.shippingCost || 0, order.shippingMethod ?? null,
        order.total, order.status || 'pending', order.paymentStatus || 'unpaid',
        order.paymentMethod ?? null, order.transactionId ?? null,
        order.createdAt || new Date().toISOString(), order.trackingNumber ?? null,
        order.noTracking ? 1 : 0, now
      ),
      ...((order.items || []) as any[]).map((item: any) =>
        env.DB.prepare('INSERT INTO order_items (order_id,product_id,quantity,price,name) VALUES (?,?,?,?,?)')
          .bind(order.id, item.productId, item.quantity, item.price, item.name)
      ),
      ...((order.items || []) as any[]).map((item: any) =>
        env.DB.prepare('UPDATE products SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?')
          .bind(item.quantity, now, item.productId)
      ),
    ];

    if (userId && userId !== 'guest') {
      stmts.push(
        env.DB.prepare('INSERT OR IGNORE INTO users (id,email,name,role,updated_at) VALUES (?,?,?,?,?)')
          .bind(userId, order.customerEmail, order.customerName, 'customer', now),
        env.DB.prepare('INSERT OR IGNORE INTO user_orders (user_id,order_id) VALUES (?,?)')
          .bind(userId, order.id)
      );
    }

    await env.DB.batch(stmts);
    return jsonResponse({ success: true, id: order.id });
  }

  // PUT /api/orders/:id — admin update
  if (request.method === 'PUT' && id) {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;
    const body: any = await request.json();
    await env.DB.prepare(
      'UPDATE orders SET status=?,payment_status=?,payment_method=?,transaction_id=?,tracking_number=?,no_tracking=?,shipping_method=?,updated_at=? WHERE id=?'
    ).bind(
      body.status, body.paymentStatus, body.paymentMethod ?? null, body.transactionId ?? null,
      body.trackingNumber ?? null, body.noTracking ? 1 : 0, body.shippingMethod ?? null, Date.now(), id
    ).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── User Handlers ─────────────────────────────────────────────────────────────

async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
  const id = path.replace('/api/users', '').replace(/^\//, '') || null;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method === 'GET') {
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
      return row ? jsonResponse(rowToUser(row)) : jsonError('Not found', 404);
    }
    const { results } = await env.DB.prepare('SELECT * FROM users ORDER BY updated_at DESC').all();
    return jsonResponse(results.map(rowToUser));
  }

  if (request.method === 'PUT' && id) {
    const body: any = await request.json();
    await env.DB.prepare(
      'INSERT OR REPLACE INTO users (id,email,name,role,updated_at) VALUES (?,?,?,?,?)'
    ).bind(id, body.email, body.name, body.role || 'customer', Date.now()).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Post Handlers ─────────────────────────────────────────────────────────────

async function handlePosts(request: Request, env: Env, path: string): Promise<Response> {
  const id = path.replace('/api/posts', '').replace(/^\//, '') || null;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM posts ORDER BY scheduled_time ASC').all();
    return jsonResponse(results.map(rowToPost));
  }

  if (request.method === 'POST') {
    const body: any = await request.json();
    const p = stamp(body);
    await env.DB.prepare(
      'INSERT OR REPLACE INTO posts (id,platform,content,image_url,scheduled_time,status,hashtags,image_prompt,reasoning,pillar,topic,publish_error,publish_attempts,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(
      p.id || uid(), p.platform, p.content || '', p.imageUrl ?? null, p.scheduledTime,
      p.status || 'draft', JSON.stringify(p.hashtags || []), p.imagePrompt ?? null,
      p.reasoning ?? null, p.pillar ?? null, p.topic ?? null, p.publishError ?? null,
      p.publishAttempts || 0, p.updated_at
    ).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Message Handlers ──────────────────────────────────────────────────────────

async function handleMessages(request: Request, env: Env, path: string): Promise<Response> {
  const id = path.replace('/api/messages', '').replace(/^\//, '') || null;

  // POST /api/messages — public contact form submission
  if (request.method === 'POST') {
    const body: any = await request.json();
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO messages (id,name,email,message,read,created_at,updated_at) VALUES (?,?,?,?,0,?,?)'
    ).bind(body.id || uid(), body.name, body.email, body.message, now, Date.now()).run();
    return jsonResponse({ success: true });
  }

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    return jsonResponse(results.map(rowToMessage));
  }

  if (request.method === 'PUT' && id) {
    const body: any = await request.json();
    await env.DB.prepare('UPDATE messages SET read=?,updated_at=? WHERE id=?')
      .bind(body.read ? 1 : 0, Date.now(), id).run();
    return jsonResponse({ success: true });
  }

  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Content Handler ───────────────────────────────────────────────────────────

async function handleContent(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const row = await env.DB.prepare("SELECT data FROM site_content WHERE key='main'").first<{ data: string }>();
    return jsonResponse(row ? JSON.parse(row.data) : {});
  }

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method === 'PUT') {
    const body = await request.json();
    await env.DB.prepare(
      "INSERT OR REPLACE INTO site_content (key,data,updated_at) VALUES ('main',?,?)"
    ).bind(JSON.stringify(body), Date.now()).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Settings Handler ──────────────────────────────────────────────────────────

async function handleSettings(request: Request, env: Env, path: string): Promise<Response> {
  // Public subset — safe for any visitor (no secrets exposed)
  if (request.method === 'GET' && path === '/api/settings/public') {
    const row = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
    const full = row ? JSON.parse(row.data) : {};
    return jsonResponse({
      gstEnabled: full.gstEnabled ?? false,
      gstRate: full.gstRate ?? 10,
      shippingConfig: full.shippingConfig ?? null,
      squareApplicationId: full.squareApplicationId ?? '',
      squareLocationId: full.squareLocationId ?? '',
    });
  }

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method === 'GET') {
    const row = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
    return jsonResponse(row ? JSON.parse(row.data) : {});
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    await env.DB.prepare(
      "INSERT OR REPLACE INTO app_settings (key,data,updated_at) VALUES ('main',?,?)"
    ).bind(JSON.stringify(body), Date.now()).run();
    return jsonResponse({ success: true });
  }

  return jsonError('Method not allowed', 405);
}

// ── Email Handler ─────────────────────────────────────────────────────────────

async function handleSendEmail(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const body: any = await request.json();
  const { to, subject, html, fromName, fromEmail, bcc, resendApiKey } = body;
  const apiKey = resendApiKey || env.RESEND_API_KEY;

  const payload: any = {
    from: `${fromName || 'Pickle Nick'} <${fromEmail || 'noreply@picklenick.au'}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data: any = await res.json();
  if (!res.ok) return jsonError(data.message || 'Email failed', res.status);
  return jsonResponse({ success: true, id: data.id });
}

// ── AI Handler ────────────────────────────────────────────────────────────────

async function handleAI(request: Request, env: Env, path: string): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const body: any = await request.json();

  // Text generation via OpenRouter
  if (path.endsWith('/text')) {
    const { prompt, model = 'google/gemini-2.5-flash', jsonMode = false } = body;

    const payload: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };
    if (jsonMode) payload.response_format = { type: 'json_object' };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://picklenick.au',
        'X-Title': 'Pickle Nick',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();
    if (!res.ok) return jsonError(data.error?.message || 'AI request failed', res.status);
    return jsonResponse({ text: data.choices?.[0]?.message?.content ?? '' });
  }

  // Image generation via Cloudflare Workers AI → R2
  if (path.endsWith('/image')) {
    const { prompt } = body;
    const imagePrompt = `Professional food photography of artisan pickles, ${prompt}, highly detailed, cinematic lighting, appetizing, elegant styling, dark green branding tones.`;

    try {
      const response = await (env.AI as any).run('@cf/bytedance/stable-diffusion-xl-lightning', {
        prompt: imagePrompt,
      });

      const buffer = response instanceof ReadableStream
        ? await new Response(response).arrayBuffer()
        : response;

      const key = `ai-images/${uid()}.png`;
      await env.STORAGE.put(key, buffer, { httpMetadata: { contentType: 'image/png' } });
      return jsonResponse({ url: `${env.R2_PUBLIC_URL}/${key}` });
    } catch (e: any) {
      return jsonError(`Image generation failed: ${e.message}`, 500);
    }
  }

  return jsonError('Unknown AI endpoint', 404);
}

// ── R2 Upload Handler ─────────────────────────────────────────────────────────

async function handleR2Upload(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const formData = await request.formData();
  const file = formData.get('file') as unknown as File | null;
  const prefix = (formData.get('prefix') as string) || 'uploads';

  if (!file) return jsonError('No file provided', 400);

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${prefix}/${uid()}.${ext}`;

  await env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  return jsonResponse({ url: `${env.R2_PUBLIC_URL}/${key}`, key });
}

// ── Publish Handler ───────────────────────────────────────────────────────────

async function runPublisher(env: Env): Promise<{ published: number; failed: number }> {
  let published = 0;
  let failed = 0;

  const settingsRow = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
  const settings = settingsRow ? JSON.parse(settingsRow.data) : {};

  const fbPageId = settings.fbPageId || env.FB_PAGE_ID;
  const fbAccessToken = settings.fbPageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  const adminEmail = settings.emailConfig?.adminEmail || env.ADMIN_EMAIL;
  const resendKey = settings.emailConfig?.resendApiKey || env.RESEND_API_KEY;

  if (!fbPageId || !fbAccessToken) {
    console.log('Publisher: No Facebook credentials configured, skipping.');
    return { published, failed };
  }

  const now = new Date().toISOString();
  const { results: duePosts } = await env.DB.prepare(
    "SELECT * FROM posts WHERE status='scheduled' AND scheduled_time <= ?"
  ).bind(now).all();

  const failedIds: string[] = [];

  for (const postRow of duePosts) {
    const post = rowToPost(postRow);
    try {
      let imageUrl = post.imageUrl;
      if (!imageUrl && post.imagePrompt) {
        try {
          const imgRes = await (env.AI as any).run('@cf/bytedance/stable-diffusion-xl-lightning', {
            prompt: `Professional food photography: ${post.imagePrompt}. Artisan food brand style, no text.`,
          });
          const buffer = imgRes instanceof ReadableStream ? await new Response(imgRes).arrayBuffer() : imgRes;
          const key = `social-images/${uid()}.png`;
          await env.STORAGE.put(key, buffer, { httpMetadata: { contentType: 'image/png' } });
          imageUrl = `${env.R2_PUBLIC_URL}/${key}`;
        } catch (e) {
          console.warn('Image generation failed for post', post.id, e);
        }
      }

      const message = post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.join(' ') : '');
      const fbBase = `https://graph.facebook.com/v21.0/${fbPageId}`;
      let fbOk = false;

      if (imageUrl) {
        const fd = new FormData();
        fd.append('url', imageUrl);
        fd.append('caption', message);
        fd.append('access_token', fbAccessToken);
        const fbRes = await fetch(`${fbBase}/photos`, { method: 'POST', body: fd });
        fbOk = fbRes.ok;
      } else {
        const fbRes = await fetch(`${fbBase}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, access_token: fbAccessToken }),
        });
        fbOk = fbRes.ok;
      }

      if (fbOk) {
        await env.DB.prepare("UPDATE posts SET status='published',image_url=?,publish_error=NULL,updated_at=? WHERE id=?")
          .bind(imageUrl ?? null, Date.now(), post.id).run();
        published++;
      } else {
        throw new Error('Facebook API returned error');
      }
    } catch (e: any) {
      failed++;
      failedIds.push(post.id);
      await env.DB.prepare(
        'UPDATE posts SET publish_attempts=publish_attempts+1,publish_error=?,updated_at=? WHERE id=?'
      ).bind(e.message || 'Unknown error', Date.now(), post.id).run();
    }
  }

  if (failedIds.length > 0 && adminEmail && resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pickle Nick <noreply@picklenick.au>',
        to: [adminEmail],
        subject: `\u26a0\ufe0f ${failedIds.length} post(s) failed to publish`,
        html: `<p>${failedIds.length} scheduled post(s) failed: ${failedIds.join(', ')}</p>`,
      }),
    });
  }

  console.log(`Publisher: published=${published}, failed=${failed}`);
  return { published, failed };
}

async function handlePublish(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const result = await runPublisher(env);
  return jsonResponse(result);
}

// ── Square Payments ────────────────────────────────────────────────────────────

async function handlePayment(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  const body: { sourceId: string; amount: number; currency?: string; idempotencyKey: string } = await request.json();
  if (!body.sourceId || !body.amount || !body.idempotencyKey) {
    return jsonError('sourceId, amount, and idempotencyKey are required', 400);
  }

  // Read Square credentials from D1 app_settings
  const settingsRow = await env.DB.prepare('SELECT data FROM app_settings WHERE key=?').bind('main').first<{ data: string }>();
  const appSettings = settingsRow ? JSON.parse(settingsRow.data) : {};
  const accessToken: string = appSettings.squareAccessToken || '';
  const locationId: string = appSettings.squareLocationId || '';

  if (!accessToken || !locationId) {
    return jsonError('Square is not configured. Set access token and location ID in Settings.', 503);
  }

  const isSandbox = accessToken.startsWith('EAAAl') === false && accessToken.startsWith('EAAA') && accessToken.length < 60;
  const squareBase = (accessToken.startsWith('sandbox') || accessToken.startsWith('EAAAl'))
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const amountCents = Math.round(body.amount * 100);
  const currency = body.currency || 'AUD';

  const res = await fetch(`${squareBase}/v2/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      source_id: body.sourceId,
      idempotency_key: body.idempotencyKey,
      amount_money: { amount: amountCents, currency },
      location_id: locationId,
      autocomplete: true,
    }),
  });

  const data: any = await res.json();

  if (!res.ok || data.errors) {
    const msg = data.errors?.[0]?.detail || data.errors?.[0]?.code || 'Payment failed';
    return jsonError(msg, 402);
  }

  return jsonResponse({
    success: true,
    transactionId: data.payment?.id,
    status: data.payment?.status,
  });
}

// ── Main Router ───────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/products'))  return handleProducts(request, env, path);
      if (path.startsWith('/api/categories')) return handleCategories(request, env, path);
      if (path.startsWith('/api/orders'))    return handleOrders(request, env, path);
      if (path.startsWith('/api/users'))     return handleUsers(request, env, path);
      if (path.startsWith('/api/posts'))     return handlePosts(request, env, path);
      if (path.startsWith('/api/messages'))  return handleMessages(request, env, path);
      if (path.startsWith('/api/content'))   return handleContent(request, env);
      if (path.startsWith('/api/settings'))  return handleSettings(request, env, path);
      if (path.startsWith('/api/email/send')) return handleSendEmail(request, env);
      if (path.startsWith('/api/ai/'))       return handleAI(request, env, path);
      if (path.startsWith('/api/r2/upload')) return handleR2Upload(request, env);
      if (path.startsWith('/api/publish'))   return handlePublish(request, env);
      if (path.startsWith('/api/payments'))  return handlePayment(request, env);
      return jsonError('Not found', 404);
    } catch (err: any) {
      console.error('Worker error:', err);
      return jsonError(err.message || 'Internal server error', 500);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await runPublisher(env);
  },
};
