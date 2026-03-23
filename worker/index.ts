import { Env, requireAdmin, optionalAuth, jsonResponse, jsonError, corsHeaders } from './auth';

export type { Env };

// ── Helpers ──────────────────────────────────────────────────────────────────

const stamp = (data: any) => ({ ...data, updated_at: Date.now() });

const uid = () => crypto.randomUUID();

// Fire-and-forget Resend email helper (never throws, just logs)
const sendTransactionalEmail = async (
  env: Env,
  to: string,
  subject: string,
  html: string,
  extra?: { bcc?: string }
): Promise<void> => {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const settingsRow = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
    const s = settingsRow ? JSON.parse(settingsRow.data) : {};
    const fromName = s.emailConfig?.fromName || 'Pickle Nick';
    const fromEmail = s.emailConfig?.fromEmail || 'noreply@picklenick.au';
    const payload: any = { from: `${fromName} <${fromEmail}>`, to: [to], subject, html };
    if (extra?.bcc) payload.bcc = [extra.bcc];
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('sendTransactionalEmail failed:', e);
  }
};

const buildOrderConfirmationHTML = (order: any, items: any[]): string => {
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f0ebe2;">${i.name} × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f0ebe2;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:12px;">
    <h2 style="color:#1a1a1a;">Order Confirmed — ${order.id}</h2>
    <p>Hi ${order.customerName}, thanks for your order!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${itemRows}</table>
    <p><strong>Subtotal:</strong> $${Number(order.subtotal).toFixed(2)}</p>
    ${order.tax > 0 ? `<p><strong>GST:</strong> $${Number(order.tax).toFixed(2)}</p>` : ''}
    <p><strong>Shipping (${order.shippingMethod || 'standard'}):</strong> ${order.shippingCost > 0 ? '$' + Number(order.shippingCost).toFixed(2) : 'FREE'}</p>
    <p style="font-size:18px;"><strong>Total: $${Number(order.total).toFixed(2)}</strong></p>
    <p style="color:#666;">Shipping to: ${order.shippingAddress}</p>
    <p style="color:#999;font-size:12px;">You'll receive a tracking number once your order ships.</p>
  </div>`;
};

const buildTrackingHTML = (order: any): string => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:12px;">
    <h2 style="color:#1a1a1a;">Your Order Has Shipped — ${order.id}</h2>
    <p>Hi ${order.customerName}, your order is on its way!</p>
    ${order.trackingNumber
      ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#666;font-size:13px;">Tracking Number</p><p style="margin:4px 0 0;font-size:18px;font-weight:700;">${order.trackingNumber}</p></div>`
      : '<p>Your parcel is being prepared for dispatch.</p>'
    }
    <p style="color:#666;">Shipping to: ${order.shippingAddress}</p>
  </div>`;

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

    // Fire-and-forget order confirmation email
    if (order.customerEmail) {
      const settingsRow2 = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
      const s2 = settingsRow2 ? JSON.parse(settingsRow2.data) : {};
      if (s2.emailConfig?.enabled) {
        const html = buildOrderConfirmationHTML(order, order.items || []);
        const bcc = s2.emailConfig?.adminEmail;
        sendTransactionalEmail(env, order.customerEmail, `Order Confirmed — ${order.id}`, html, bcc ? { bcc } : undefined);
      }
    }

    return jsonResponse({ success: true, id: order.id });
  }

  // PUT /api/orders/:id — admin update
  if (request.method === 'PUT' && id) {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;
    const body: any = await request.json();

    // Fetch existing order to detect status transition and get customer email
    const existing = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<any>();

    await env.DB.prepare(
      'UPDATE orders SET status=?,payment_status=?,payment_method=?,transaction_id=?,tracking_number=?,no_tracking=?,shipping_method=?,updated_at=? WHERE id=?'
    ).bind(
      body.status, body.paymentStatus, body.paymentMethod ?? null, body.transactionId ?? null,
      body.trackingNumber ?? null, body.noTracking ? 1 : 0, body.shippingMethod ?? null, Date.now(), id
    ).run();

    // Send tracking email when status transitions to 'shipped'
    if (existing && existing.status !== 'shipped' && body.status === 'shipped' && existing.customer_email) {
      const settingsRow = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
      const s = settingsRow ? JSON.parse(settingsRow.data) : {};
      if (s.emailConfig?.enabled) {
        const updated = { ...body, id, customerName: existing.customer_name, customerEmail: existing.customer_email, shippingAddress: existing.shipping_address };
        sendTransactionalEmail(env, existing.customer_email, `Your Order Has Shipped — ${id}`, buildTrackingHTML(updated));
      }
    }

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
    const imagePrompt = prompt;

    try {
      const response = await (env.AI as any).run('@cf/bytedance/stable-diffusion-xl-lightning', {
        prompt: imagePrompt,
      });

      // Workers AI returns Uint8Array, ReadableStream, or ArrayBuffer depending on version
      let buffer: ArrayBuffer;
      if (response instanceof ArrayBuffer) {
        buffer = response;
      } else if (response instanceof ReadableStream) {
        buffer = await new Response(response).arrayBuffer();
      } else if (response instanceof Uint8Array) {
        buffer = response.buffer;
      } else if (typeof response === 'object' && response !== null) {
        // Some models return { image: base64string }
        const b64 = response.image || response.data;
        if (typeof b64 === 'string') {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          buffer = bytes.buffer;
        } else {
          throw new Error('Unexpected AI response format');
        }
      } else {
        buffer = response;
      }

      const key = `ai-images/${uid()}.png`;
      await env.STORAGE.put(key, buffer, { httpMetadata: { contentType: 'image/png' } });
      return jsonResponse({ url: `${env.R2_PUBLIC_URL}/${key}` });
    } catch (e: any) {
      console.error('AI image error:', e?.message, e?.stack, JSON.stringify(e));
      return jsonError(`Image generation failed: ${e?.message || 'Unknown error'}`, 500);
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

async function handlePayment(request: Request, env: Env, path: string): Promise<Response> {
  // GET /api/payments/test — admin-only Square connection test
  if (request.method === 'GET' && path.endsWith('/test')) {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;
    const settingsRow = await env.DB.prepare("SELECT data FROM app_settings WHERE key='main'").first<{ data: string }>();
    const s = settingsRow ? JSON.parse(settingsRow.data) : {};
    const token = s.squareAccessToken;
    if (!token) return jsonResponse({ ok: false, msg: 'No Square Access Token configured' });
    const tryBase = async (base: string) => {
      const res = await fetch(`${base}/v2/locations`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Square-Version': '2024-01-18', 'Content-Type': 'application/json' },
      });
      return { res, data: await res.json() as any, base };
    };
    try {
      let result = await tryBase('https://connect.squareup.com');
      if (!result.res.ok) result = await tryBase('https://connect.squareupsandbox.com');
      if (result.res.ok && result.data.locations?.length > 0) {
        const mode = result.base.includes('sandbox') ? 'Sandbox' : 'Production';
        const loc = s.squareLocationId
          ? result.data.locations.find((l: any) => l.id === s.squareLocationId) || result.data.locations[0]
          : result.data.locations[0];
        return jsonResponse({ ok: true, msg: `Connected (${mode}) — ${loc.name || loc.id}` });
      }
      return jsonResponse({ ok: false, msg: result.data.errors?.[0]?.detail || 'Auth failed' });
    } catch (e: any) {
      return jsonResponse({ ok: false, msg: e.message || 'Network error' });
    }
  }

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
      // Public R2 file serving: /api/r2/file/<key>
      if (path.startsWith('/api/r2/file/') && request.method === 'GET') {
        const key = path.replace('/api/r2/file/', '');
        const obj = await env.STORAGE.get(key);
        if (!obj) return jsonError('Not found', 404);
        const headers = new Headers();
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(obj.body, { headers });
      }
      if (path.startsWith('/api/publish'))   return handlePublish(request, env);
      if (path.startsWith('/api/payments'))  return handlePayment(request, env, path);
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
