const COOKIE_NAME = 'site_session';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const isHttps =
    Boolean(req.secure) ||
    req.headers?.['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  const cookieHeader = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${
    isHttps ? '; Secure' : ''
  }`;

  res.setHeader('Set-Cookie', cookieHeader);
  if (typeof res.clearCookie === 'function') {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true, message: 'Erfolgreich abgemeldet' }));
}
