import { getSessionFromRequest } from '../../server/auth';
import { marketDataService } from '../../server/MarketDataService';

export default function handler(req: any, res: any) {
  const session = getSessionFromRequest(req);
  if (!session.authenticated) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Nicht authentifiziert' }));
    return;
  }

  // Parse query params (URLSearchParams from req.url)
  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const symbol = url.searchParams.get('symbol') || 'AAPL';
  const timeframe = url.searchParams.get('timeframe') || '1m';
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const candles = marketDataService.getCandles(symbol, timeframe, limit);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      symbol,
      timeframe,
      count: candles.length,
      candles,
    })
  );
}
