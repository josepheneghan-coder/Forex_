import crypto from 'crypto';

const COOKIE_NAME = 'site_session';
const DEFAULT_SITE_PASSWORD = 'Demo123456!';

function getExpectedPassword(): string {
  const envPassword = process.env.SITE_PASSWORD;
  if (!envPassword) {
    return DEFAULT_SITE_PASSWORD;
  }
  const cleaned = envPassword.trim().replace(/^["']|["']$/g, '').trim();
  return cleaned || DEFAULT_SITE_PASSWORD;
}

function getSessionSecretKey(): string {
  const password = getExpectedPassword();
  const secret = process.env.SESSION_SECRET || (password + '_forex4you_secure_session_salt_2026');
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function verifyToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, signature] = parts;
  if (!data || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', getSessionSecretKey())
    .update(data)
    .digest('base64url');

  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);

  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parseCookies(req: any): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return list;

  cookieHeader.split(';').forEach((cookie: string) => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });

  return list;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const cookies = parseCookies(req);
  const cookieToken = cookies[COOKIE_NAME];
  const authHeader = req.headers?.authorization;
  const headerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

  const token = cookieToken || headerToken;
  const isValid = verifyToken(token);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ authenticated: isValid }));
}
