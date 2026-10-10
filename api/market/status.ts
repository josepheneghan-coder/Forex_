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

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(marketDataService.getStatus()));
}
