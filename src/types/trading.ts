/**
 * PaperTrade v1.0 - Core Domain Models & Types
 * Basiert exakt auf der technischen Spezifikation v1.0
 */

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export type AssetType = 'crypto' | 'stock' | 'etf';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  baseCurrency: string;
  quoteCurrency: string;
  exchange: string;
  tickSize: number;
  quantityPrecision: number;
  pricePrecision: number;
  minOrderSize: number;
  isActive: boolean;
  binanceSymbol?: string;
}

export interface Quote {
  symbol: string;
  timestamp: number;
  lastPrice: number;
  bid: number;
  ask: number;
  spread?: number;
  volume: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  change24h: number;
  isCalculatedSpread?: boolean;
  spreadSource?: 'FINNHUB_L1' | 'CALCULATED_SPREAD' | 'INTERNAL';
  source?: string;
  mode?: 'LIVE' | 'SIMULATED';
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface Position {
  id: string;
  accountId: string;
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  openedAt: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  accountId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  filledQuantity: number;
  averageFillPrice?: number;
  estimatedFee: number;
  totalFee: number;
  slippage: number;
  rejectionReason?: string;
  idempotencyKey?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Execution {
  id: string;
  orderId: string;
  accountId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  fee: number;
  slippage: number;
  realizedPnL?: number;
  executedAt: number;
}

export interface PortfolioSnapshot {
  id: string;
  timestamp: number;
  cash: number;
  marketValue: number;
  equity: number;
  realizedPnL: number;
  unrealizedPnL: number;
  drawdown: number;
}

export interface Account {
  id: string;
  name: string;
  currency: string; // z.B. EUR
  initialBalance: number;
  cashBalance: number;
  equity: number;
  buyingPower: number;
  invested: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  dailyPnL: number;
  returnPercent: number;
}

export interface JournalEntry {
  id: string;
  accountId: string;
  tradeId?: string;
  symbol: string;
  side: OrderSide;
  strategy: string;
  setup: string;
  reason: string;
  marketContext: string;
  emotion: 'Diszipliniert' | 'Geduldig' | 'FOMO' | 'Gierig' | 'Ängstlich' | 'Neutral';
  notes: string;
  plannedEntry?: number;
  plannedStop?: number;
  plannedTarget?: number;
  plannedRiskReward?: number;
  createdAt: number;
}

export interface TradingLimits {
  maxPositionSizePct: number; // e.g. 25%
  maxDailyLossPct: number; // e.g. 5%
  maxRiskPerTradePct: number; // e.g. 2%
  maxTradesPerDay: number; // e.g. 50
  enforcementMode: 'WARNING' | 'REJECT';
}

export interface RiskMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  lossRate: number; // %
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number; // %
  peakEquity: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
}

export interface ReplayState {
  assetSymbol: string;
  startDate: string;
  endDate: string;
  timeframe: string;
  initialCapital: number;
  isPlaying: boolean;
  speed: number; // 0.5, 1, 2, 5, 10
  currentCandleIndex: number;
  allCandles: Candle[];
}

export type ConnectionStatus = 'LIVE' | 'CONNECTING' | 'RECONNECTING' | 'DATA_STALE' | 'DISCONNECTED';
export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS' | 'HALTED';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE_OR_EQUAL' | 'BELOW_OR_EQUAL';
  isTriggered: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export type RealtimeEventType =
  | 'quote.update'
  | 'candle.update'
  | 'order.created'
  | 'order.updated'
  | 'order.filled'
  | 'order.cancelled'
  | 'position.updated'
  | 'portfolio.updated'
  | 'pnl.updated'
  | 'price_alert.triggered'
  | 'replay.tick';

export interface RealtimeEvent<T = any> {
  event: RealtimeEventType;
  sequence: number;
  timestamp: string;
  data: T;
}

export interface RealtimeSnapshot {
  timestamp: string;
  sequence: number;
  account: Account;
  positions: Position[];
  orders: Order[];
  quotes: Record<string, Quote>;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: number;
  symbols: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'crypto' | 'forex' | 'stock' | 'macro' | 'commodities';
}

export interface FinnhubPipelineStats {
  rawTicksReceived: number;
  normalizedCount: number;
  cacheUpdates: number;
  spreadsCalculated: number;
  broadcastsSent: number;
  finnhubStatus: 'CONNECTED' | 'SIMULATED' | 'CONNECTING' | 'INITIALIZING';
  finnhubWsUrl: string;
  connectedClientsCount: number;
  lastTickTimestamp: number;
}

export interface MarketDataStatus {
  provider: 'FINNHUB' | 'INTERNAL SIMULATOR';
  mode: 'LIVE' | 'SIMULATED';
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
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
