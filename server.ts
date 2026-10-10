/**
 * AI-Studio Full-Stack Backend Server
 * 
 * Externe Marktdaten-Pipeline:
 * Finnhub WebSocket (wss://ws.finnhub.io)
 *        ↓
 * MarketDataService
 *        ↓
 * Market Data Normalizer & Candle Aggregator
 *        ↓
 * Realtime Event Bus
 *        ↓
 * Application WebSocket (/ws/market & /ws)
 *        ↓
 * Frontend Trading-App
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { marketDataService } from './server/MarketDataService';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
} from './server/auth';

dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);

app.use(express.json());

// Application WebSocket Server mounted on HTTP server
// Handles both /ws/market (Spec Requirement 8) and /ws (compat)
const wss = new WebSocketServer({ server });

// Attach market data service
marketDataService.attachWebSocketServer(wss);

// Start market data service
marketDataService.start().catch((err) => {
  console.error('[Server] Failed to start MarketDataService:', err);
});

// ==========================================
// Authentication Endpoints (Single Password)
// ==========================================

// Login endpoint: checks SITE_PASSWORD securely on server
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body || {};

  if (!password || !verifyPassword(password)) {
    // Neutrale Fehlermeldung wie gefordert: "Falsches Passwort"
    res.status(401).json({
      success: false,
      message: 'Falsches Passwort',
    });
    return;
  }

  // Session Token generieren und HttpOnly, Secure, SameSite Cookie setzen
  const sessionToken = createSessionToken();
  setSessionCookie(req, res, sessionToken);

  res.json({
    success: true,
    message: 'Erfolgreich angemeldet',
    token: sessionToken,
  });
});

// Session check endpoint: verifies active HttpOnly cookie
app.get('/api/auth/session', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  res.json({
    authenticated: session.authenticated,
  });
});

// Logout endpoint: clears session cookie
app.post('/api/auth/logout', (req: Request, res: Response) => {
  clearSessionCookie(req, res);
  res.json({
    success: true,
    message: 'Erfolgreich abgemeldet',
  });
});

// ==========================================
// Protected Routes Middleware
// ==========================================

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = getSessionFromRequest(req);
  if (!session.authenticated) {
    res.status(401).json({
      error: 'Nicht authentifiziert',
      message: 'Bitte melden Sie sich an, um auf diese Daten zuzugreifen.',
    });
    return;
  }
  next();
};

// Health check remains public for uptime checks
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PaperTrade Market Data Service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Protect all market and trading endpoints
app.use('/api/market', requireAuth);
app.use('/api/finnhub', requireAuth);

app.get('/api/market/status', (req: Request, res: Response) => {
  res.json(marketDataService.getStatus());
});

app.post('/api/market/mode', async (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode === 'LIVE' || mode === 'SIMULATED') {
    await marketDataService.setMode(mode);
    res.json({ success: true, mode: marketDataService.getStatus().mode });
  } else {
    res.status(400).json({ error: 'Invalid mode. Must be LIVE or SIMULATED.' });
  }
});

app.get('/api/market/quotes', (req: Request, res: Response) => {
  res.json({
    count: marketDataService.getAllQuotes().length,
    quotes: marketDataService.getAllQuotes(),
  });
});

app.get('/api/market/candles', (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'AAPL';
  const timeframe = (req.query.timeframe as string) || '1m';
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

  const candles = marketDataService.getCandles(symbol, timeframe, limit);
  res.json({
    symbol,
    timeframe,
    count: candles.length,
    candles,
  });
});

// Backward compatibility pipeline endpoint
app.get('/api/finnhub/pipeline', (req: Request, res: Response) => {
  const status = marketDataService.getStatus();
  res.json({
    pipeline: {
      stages: [
        { name: 'Finnhub Ingestion', type: 'WebSocket', status: status.status, count: status.totalTicksReceived },
        { name: 'Normalisieren', type: 'Transform', status: 'ACTIVE', count: status.totalTicksReceived },
        { name: 'Speichern/Cache', type: 'InMemory', status: 'ACTIVE', entries: marketDataService.getAllQuotes().length },
        { name: 'Candle Aggregator', type: 'TimeframeBars', status: 'ACTIVE', timeframes: ['1m', '5m', '15m', '1h', '4h', '1D'] },
        { name: 'an Clients verteilen', type: 'WebSocket (/ws/market)', status: 'ACTIVE', clients: status.connectedClients },
      ],
      stats: status,
    },
  });
});

// Vite Middleware (Dev) or Static Serv (Prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] Fullstack Trading Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Backend] Market WebSocket running on ws://0.0.0.0:${PORT}/ws/market`);
  });
}

startServer();
