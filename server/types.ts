/**
 * Market Data Server Types
 */

export type MarketDataMode = 'LIVE' | 'SIMULATED';
export type ProviderStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export interface RawTrade {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  source: string;
}

export interface NormalizedQuote {
  symbol: string;
  lastPrice: number;
  bid: number;
  ask: number;
  spread: number;
  isCalculatedSpread: boolean;
  spreadSource: 'FINNHUB_L1' | 'CALCULATED_SPREAD';
  volume: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  change24h: number;
  timestamp: number;
  source: 'FINNHUB' | 'INTERNAL SIMULATOR';
  mode: MarketDataMode;
}

export interface StandardMarketQuote {
  symbol: string;
  timestamp: string | number;
  last_price: string;
  bid: string;
  ask: string;
  spread: string;
  volume: number;
  day_change: string;
  day_change_percent: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  spreadValue: number;
  source: 'FINNHUB' | 'INTERNAL SIMULATOR';
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataStatus {
  provider: 'FINNHUB' | 'INTERNAL SIMULATOR';
  mode: MarketDataMode;
  status: ProviderStatus;
  hasApiKey: boolean;
  apiKeyRequired: boolean;
  subscribedSymbols: string[];
  lastEventTime: number;
  lastSymbol: string;
  lastPrice: number;
  lastError: string | null;
  connectedClients: number;
  totalTicksReceived: number;
}
