import crypto from 'crypto';

export const DEFAULT_SITE_PASSWORD = 'Demo123456!';
const COOKIE_NAME = 'site_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

export function getExpectedPassword(): string {
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

export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse body if string, buffer, or stream
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  } else if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString('utf-8'));
    } catch {
      body = {};
    }
  } else if (!body && typeof req.on === 'function') {
    try {
      const buffers: Buffer[] = [];
      for await (const chunk of req) {
        buffers.push(Buffer.from(chunk));
      }
      const raw = Buffer.concat(buffers).toString('utf-8');
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  const providedPassword = typeof body?.password === 'string' ? body.password : '';
  const expectedPassword = getExpectedPassword();

  // Timing-safe password comparison (supports exact and trimmed match to prevent whitespace issues)
  let isMatch = false;
  if (providedPassword.trim().length > 0) {
    const rawHash = crypto.createHash('sha256').update(providedPassword).digest();
    const trimmedHash = crypto.createHash('sha256').update(providedPassword.trim()).digest();
    const expectedHash = crypto.createHash('sha256').update(expectedPassword).digest();
    isMatch = crypto.timingSafeEqual(rawHash, expectedHash) || crypto.timingSafeEqual(trimmedHash, expectedHash);
  }

  if (!isMatch) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: 'Falsches Passwort',
      })
    );
    return;
  }

  // Create HMAC session token
  const payload = {
    sid: crypto.randomBytes(16).toString('hex'),
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecretKey())
    .update(payloadBase64)
    .digest('base64url');
  const sessionToken = `${payloadBase64}.${signature}`;

  // Cookie setup
  const isHttps =
    Boolean(req.secure) ||
    req.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
  const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    isHttps ? '; Secure' : ''
  }`;

  res.setHeader('Set-Cookie', cookieHeader);
  if (typeof res.cookie === 'function') {
    res.cookie(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
      path: '/',
    });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      success: true,
      message: 'Erfolgreich angemeldet',
      token: sessionToken,
    })
  );
}
