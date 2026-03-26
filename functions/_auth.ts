// functions/_auth.ts

export const COOKIE_NAME = 'pgb_session';
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function validateSession(cookie: string, secret: string): Promise<string | null> {
  const parts = cookie.split(':');
  if (parts.length < 3) return null;
  const hmac = parts.pop()!;
  const timestamp = parts.pop()!;
  const name = parts.join(':'); // name could contain colons
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return null;
  const age = (Date.now() - ts) / 1000;
  if (age > COOKIE_MAX_AGE || age < 0) return null;
  const expected = await hmacSign(`${name}:${timestamp}`, secret);
  return expected === hmac ? name : null;
}

export async function createSessionCookie(name: string, secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const hmac = await hmacSign(`${name}:${timestamp}`, secret);
  const value = encodeURIComponent(`${name}:${timestamp}:${hmac}`);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}
