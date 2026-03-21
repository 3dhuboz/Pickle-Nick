import { verifyToken } from '@clerk/backend';

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  AI: Ai;
  CLERK_SECRET_KEY: string;
  RESEND_API_KEY: string;
  OPENROUTER_API_KEY: string;
  R2_PUBLIC_URL: string;
  ADMIN_EMAIL: string;
  FB_PAGE_ID?: string;
  FB_PAGE_ACCESS_TOKEN?: string;
}

const getBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
};

export const requireAdmin = async (request: Request, env: Env): Promise<string | Response> => {
  const token = getBearerToken(request);
  if (!token) return jsonError('Unauthorized', 401);

  try {
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    const role = (payload.publicMetadata as any)?.role;
    if (role !== 'admin') return jsonError('Forbidden', 403);
    return payload.sub;
  } catch {
    return jsonError('Invalid token', 401);
  }
};

export const optionalAuth = async (request: Request, env: Env): Promise<string | null> => {
  const token = getBearerToken(request);
  if (!token) return null;
  try {
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    return payload.sub;
  } catch {
    return null;
  }
};

export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });

export const jsonError = (message: string, status = 400): Response =>
  jsonResponse({ error: message }, status);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
