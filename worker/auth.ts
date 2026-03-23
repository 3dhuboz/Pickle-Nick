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

// Fetch user metadata from Clerk API (JWT doesn't include publicMetadata by default)
const getUserRole = async (userId: string, secretKey: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) return null;
    const user: any = await res.json();
    return user.public_metadata?.role || null;
  } catch {
    return null;
  }
};

export const requireAdmin = async (request: Request, env: Env): Promise<string | Response> => {
  const token = getBearerToken(request);
  if (!token) return jsonError('Unauthorized', 401);

  try {
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    const userId = payload.sub;

    // Check publicMetadata in JWT first, fall back to API call
    let role = (payload as any).publicMetadata?.role || (payload as any).public_metadata?.role;
    if (!role) {
      role = await getUserRole(userId, env.CLERK_SECRET_KEY);
    }
    if (role !== 'admin') return jsonError('Forbidden', 403);
    return userId;
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
