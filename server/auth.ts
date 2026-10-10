import crypto from 'crypto';
import type { Request, Response } from 'express';

export const COOKIE_NAME = 'site_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage
export const DEFAULT_SITE_PASSWORD = 'Demo123456!';

/**
 * Holt das konfigurierte Seiten-Passwort.
 * Standardwert: 'Demo123456!'
 * Bereinigt unbeabsichtigte Anführungszeichen oder Leerzeichen (z. B. aus Vercel Copy-Paste).
 */
export function getSitePassword(): string {
  const envPassword = process.env.SITE_PASSWORD;
  if (!envPassword) {
    return DEFAULT_SITE_PASSWORD;
  }
  const cleaned = envPassword.trim().replace(/^["']|["']$/g, '').trim();
  return cleaned || DEFAULT_SITE_PASSWORD;
}

/**
 * Erzeugt einen stabilen Session-Secret-Schlüssel für HMAC-Token.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || (getSitePassword() + '_forex4you_secure_session_salt_2026');
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export interface SessionPayload {
  sid: string;
  iat: number;
  exp: number;
}

/**
 * Timing-sicherer Vergleich des eingegebenen Passworts.
 * Schützt vor Timing-Attacks und loggt niemals das Passwort.
 * Berücksichtigt versehentliche Leerzeichen beim Kopieren/Einfügen.
 */
export function verifyPassword(providedPassword: unknown): boolean {
  if (typeof providedPassword !== 'string' || !providedPassword.trim()) {
    return false;
  }

  const expected = getSitePassword();
  const rawHash = crypto.createHash('sha256').update(providedPassword).digest();
  const trimmedHash = crypto.createHash('sha256').update(providedPassword.trim()).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();

  return crypto.timingSafeEqual(rawHash, expectedHash) || crypto.timingSafeEqual(trimmedHash, expectedHash);
}

/**
 * Erstellt einen kryptographisch signierten HMAC-Session-Token.
 */
export function createSessionToken(): string {
  const payload: SessionPayload = {
    sid: crypto.randomBytes(16).toString('hex'),
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifiziert die kryptographische Gültigkeit und das Ablaufdatum des Tokens.
 */
export function verifySessionToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, signature] = parts;
  if (!data || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');

  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);

  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return false;
  }

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Parst Cookies aus den HTTP-Headers universell (Express & Serverless).
 */
export function parseCookies(req: { headers?: Record<string, string | string[] | undefined> }): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });

  return list;
}

/**
 * Ermittelt den Authentifizierungsstatus einer eingehenden Anfrage.
 * Unterstützt HttpOnly-Cookie und optional Bearer Header als Fallback.
 */
export function getSessionFromRequest(req: Request | any): { authenticated: boolean } {
  const cookies = parseCookies(req);
  const cookieToken = cookies[COOKIE_NAME];

  const authHeader = req.headers?.authorization;
  const headerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

  const token = cookieToken || headerToken;
  if (token && verifySessionToken(token)) {
    return { authenticated: true };
  }

  return { authenticated: false };
}

/**
 * Setzt den sicheren, HttpOnly-, SameSite- und Secure-Cookie.
 */
export function setSessionCookie(req: Request | any, res: Response | any, token: string) {
  const isHttps =
    Boolean(req.secure) ||
    req.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
  const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    isHttps ? '; Secure' : ''
  }`;

  if (typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', cookieHeader);
  }
  if (typeof res.cookie === 'function') {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
      path: '/',
    });
  }
}

/**
 * Entfernt den Session-Cookie beim Abmelden.
 */
export function clearSessionCookie(req: Request | any, res: Response | any) {
  const isHttps =
    Boolean(req.secure) ||
    req.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  const cookieHeader = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${
    isHttps ? '; Secure' : ''
  }`;

  if (typeof res.setHeader === 'function') {
    res.setHeader('Set-Cookie', cookieHeader);
  }
  if (typeof res.clearCookie === 'function') {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    });
  }
}
