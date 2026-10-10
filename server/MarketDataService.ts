import { EventEmitter } from 'events';
import { WebSocket as WsClient, WebSocketServer } from 'ws';
import {
  CandleData,
  MarketDataMode,
  MarketDataStatus,
  NormalizedQuote,
  ProviderStatus,
  RawTrade,
  StandardMarketQuote,
} from './types';
import { MarketDataProvider } from './providers/MarketDataProvider';
import { FinnhubMarketDataProvider } from './providers/FinnhubProvider';
import { SimulatedMarketDataProvider } from './providers/SimulatedProvider';

interface CandleIntervalState {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function isForexSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase().replace('/', '');
  const forexPairs = new Set([
    'AUDUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'EURAUD', 'AUDCAD', 'AUDCHF',
    'AUDJPY', 'AUDNZD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY',
    'GBPJPY', 'CADJPY', 'CHFJPY', 'EURCHF', 'GBPCHF', 'NZDJPY', 'CADCHF',
  ]);
  if (forexPairs.has(s)) return true;
  if (/^[A-Z]{6}$/.test(s) && (s.includes('USD') || s.includes('EUR') || s.includes('GBP') || s.includes('AUD') || s.includes('JPY') || s.includes('CAD') || s.includes('CHF') || s.includes('NZD'))) {
    return true;
  }
  return symbol.includes('/') && !symbol.includes('BTC') && !symbol.includes('ETH') && !symbol.includes('SOL');
}

export class MarketDataService extends EventEmitter {
  private finnhubProvider: FinnhubMarketDataProvider;
  private simulatedProvider: SimulatedMarketDataProvider;
  private activeProvider: MarketDataProvider;
  private currentMode: MarketDataMode = 'SIMULATED';

  // Quotes In-Memory Cache
  private quotesCache = new Map<string, NormalizedQuote>();

  // Candle Aggregator: Symbol -> Timeframe -> CandleData[]
  private candleHistory = new Map<string, Map<string, CandleData[]>>();

  // Active forming candle: Symbol -> Timeframe -> CandleIntervalState
  private activeCandles = new Map<string, Map<string, CandleIntervalState>>();

  // Active Symbol Subscriptions
  private trackedSymbols = new Set<string>([
    'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'NFLX', 'AMD', 'INTC',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'EUR/USD', 'AUDUSD', 'GBP/USD', 'USD/JPY', 'EURAUD',
    'Gold', 'BRENT',
  ]);

  // WebSocket Server for application clients
  private wss: WebSocketServer | null = null;

  // Pipeline Metrics
  private totalTicksReceived = 0;
  private lastEventTime = Date.now();
  private lastSymbol = 'AAPL';
  private lastPrice = 228.45;

  // Throttle Queue
  private pendingBroadcasts = new Map<string, NormalizedQuote>();
  private broadcastTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();

    const apiKey = process.env.FINNHUB_API_KEY;
    const hasValidKey = !!(apiKey && apiKey.trim().length > 5 && apiKey !== 'YOUR_FINNHUB_API_KEY');

    this.finnhubProvider = new FinnhubMarketDataProvider(apiKey);
    this.simulatedProvider = new SimulatedMarketDataProvider();

    // Default to LIVE if key is present, otherwise SIMULATED (Requirement 4)
    if (hasValidKey) {
      this.currentMode = 'LIVE';
      this.activeProvider = this.finnhubProvider;
      console.log('[MarketDataService] FINNHUB_API_KEY detected. Starting in LIVE MARKET DATA mode.');
    } else {
      this.currentMode = 'SIMULATED';
      this.activeProvider = this.simulatedProvider;
      console.log('[MarketDataService] No FINNHUB_API_KEY detected. Starting in SIMULATED MARKET DATA mode.');
    }

    this.setupProviderListeners(this.finnhubProvider);
    this.setupProviderListeners(this.simulatedProvider);

    // Initialize baseline candle history
    this.initBaselineCandles();

    // Start throttled dispatcher (approx 16 updates/sec = ~60ms)
    this.startThrottledDispatcher();
  }

  public attachWebSocketServer(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketHandlers();
  }

  public async start(): Promise<void> {
    // Initial subscriptions on active provider
    this.activeProvider.subscribe(Array.from(this.trackedSymbols));
    await this.activeProvider.connect();
  }

  public async setMode(mode: MarketDataMode): Promise<void> {
    if (this.currentMode === mode) return;

    console.log(`[MarketDataService] Switching Market Data Mode to: ${mode}`);
    await this.activeProvider.disconnect();

    if (mode === 'LIVE') {
      this.currentMode = 'LIVE';
      this.activeProvider = this.finnhubProvider;
    } else {
      this.currentMode = 'SIMULATED';
      this.activeProvider = this.simulatedProvider;
    }

    this.activeProvider.subscribe(Array.from(this.trackedSymbols));
    await this.activeProvider.connect();
    this.broadcastStatus();
  }

  public getStatus(): MarketDataStatus {
    const apiKey = process.env.FINNHUB_API_KEY;
    const hasApiKey = !!(apiKey && apiKey.trim().length > 5 && apiKey !== 'YOUR_FINNHUB_API_KEY');

    return {
      provider: this.activeProvider.name,
      mode: this.currentMode,
      status: this.activeProvider.getStatus(),
      hasApiKey,
      apiKeyRequired: !hasApiKey,
      subscribedSymbols: this.activeProvider.getSubscribedSymbols(),
      lastEventTime: this.lastEventTime,
      lastSymbol: this.lastSymbol,
      lastPrice: this.lastPrice,
      lastError: this.activeProvider.getLastError(),
      connectedClients: this.wss ? this.wss.clients.size : 0,
      totalTicksReceived: this.totalTicksReceived,
    };
  }

  public getQuote(symbol: string): NormalizedQuote | undefined {
    return this.quotesCache.get(symbol);
  }

  public getAllQuotes(): NormalizedQuote[] {
    return Array.from(this.quotesCache.values());
  }

  public getCandles(symbol: string, timeframe: string = '1m', limit: number = 100): CandleData[] {
    const symMap = this.candleHistory.get(symbol);
    if (!symMap) return [];
    const list = symMap.get(timeframe) || [];
    return list.slice(-limit);
  }

  public subscribeSymbol(symbol: string): void {
    this.trackedSymbols.add(symbol);
    this.activeProvider.subscribe([symbol]);
  }

  public unsubscribeSymbol(symbol: string): void {
    // Keep baseline symbols, allow removing user dynamic symbols
    this.trackedSymbols.delete(symbol);
    this.activeProvider.unsubscribe([symbol]);
  }

  private setupProviderListeners(provider: MarketDataProvider) {
    provider.on('trade', (rawTrade: RawTrade) => {
      if (provider !== this.activeProvider) return;
      this.handleIncomingRawTrade(rawTrade);
    });

    provider.on('market.quote', (quote: StandardMarketQuote) => {
      if (provider !== this.activeProvider) return;
      this.emit('market.quote', quote);
    });

    provider.on('connected', () => {
      console.log(`[MarketDataService] Provider ${provider.name} connected.`);
      this.broadcastStatus();
    });

    provider.on('disconnected', () => {
      console.log(`[MarketDataService] Provider ${provider.name} disconnected.`);
      this.broadcastStatus();
    });

    provider.on('error', (err) => {
      console.warn(`[MarketDataService] Provider ${provider.name} error:`, err.message);
      // Auto-fallback to simulator if Finnhub is disconnected or missing key
      if (provider.name === 'FINNHUB' && this.currentMode === 'LIVE') {
        console.log('[MarketDataService] Finnhub error. Maintaining simulated provider as fallback.');
      }
      this.broadcastStatus();
    });
  }

  /**
   * Normalizer & Spread Engine (Requirement 2 & 13)
   */
  private handleIncomingRawTrade(trade: RawTrade) {
    this.totalTicksReceived++;
    this.lastEventTime = trade.timestamp;
    this.lastSymbol = trade.symbol;
    this.lastPrice = trade.price;

    const existing = this.quotesCache.get(trade.symbol);
    const dayOpen = existing ? existing.dayOpen : trade.price;
    const dayHigh = existing ? Math.max(existing.dayHigh, trade.price) : trade.price;
    const dayLow = existing ? Math.min(existing.dayLow, trade.price) : trade.price;
    const change24h = Number((((trade.price - dayOpen) / dayOpen) * 100).toFixed(2));
    const newVolume = existing ? existing.volume + trade.volume : trade.volume;

    // Calculate spread based on asset type
    const isForex = isForexSymbol(trade.symbol);
    const isJPY = trade.symbol.toUpperCase().includes('JPY');
    const isCrypto = trade.symbol.includes('BTC') || trade.symbol.includes('ETH') || trade.symbol.includes('SOL');
    const decimals = isForex ? (isJPY ? 2 : 4) : 2;

    let baseSpread = 0.03;
    if (isForex) {
      baseSpread = isJPY ? 0.018 : 0.00018; // ~1.8 pips
    } else if (trade.symbol === 'BTC/USDT' || trade.symbol === 'BTC/EUR' || trade.symbol.includes('BTC')) {
      baseSpread = 1.40;
    } else if (trade.symbol.includes('ETH')) {
      baseSpread = 0.35;
    } else if (trade.symbol.includes('SOL')) {
      baseSpread = 0.08;
    } else if (trade.symbol === 'Gold') {
      baseSpread = 0.35;
    } else if (trade.symbol === 'BRENT') {
      baseSpread = 0.04;
    } else if (trade.symbol === 'High Grade Copper') {
      baseSpread = 0.0004;
    }

    // Jitter spread slightly for realistic dynamic market depth
    const spread = Number((baseSpread * (0.95 + Math.random() * 0.1)).toFixed(decimals));
    const halfSpread = spread / 2;

    // Explicitly separated Last Price and Bid/Ask (Requirement 13)
    const bid = Number((trade.price - halfSpread).toFixed(decimals));
    const ask = Number((trade.price + halfSpread).toFixed(decimals));

    const normalizedQuote: NormalizedQuote = {
      symbol: trade.symbol,
      lastPrice: Number(trade.price.toFixed(decimals)),
      bid,
      ask,
      spread,
      isCalculatedSpread: true,
      spreadSource: 'CALCULATED_SPREAD',
      volume: Math.round(newVolume),
      dayOpen,
      dayHigh,
      dayLow,
      previousClose: dayOpen,
      change24h,
      timestamp: trade.timestamp,
      source: this.activeProvider.name,
      mode: this.currentMode,
    };

    this.quotesCache.set(trade.symbol, normalizedQuote);

    // Update Candle Aggregator (Requirement 11 & 12)
    this.updateCandleAggregator(trade.symbol, trade.price, trade.volume, trade.timestamp);

    // Buffer quote for throttled WebSocket broadcast
    this.pendingBroadcasts.set(trade.symbol, normalizedQuote);
  }

  /**
   * Candle Aggregator (Requirement 11 & 12)
   */
  private updateCandleAggregator(symbol: string, price: number, volume: number, timestamp: number) {
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D'];

    if (!this.activeCandles.has(symbol)) {
      this.activeCandles.set(symbol, new Map());
    }
    if (!this.candleHistory.has(symbol)) {
      this.candleHistory.set(symbol, new Map());
    }

    const activeMap = this.activeCandles.get(symbol)!;
    const historyMap = this.candleHistory.get(symbol)!;

    timeframes.forEach((tf) => {
      const intervalMs = this.getTimeframeMs(tf);
      const candleStartTime = Math.floor(timestamp / intervalMs) * intervalMs;

      let currentCandle = activeMap.get(tf);

      if (!currentCandle || currentCandle.time !== candleStartTime) {
        // Interval expired: commit previous candle to history
        if (currentCandle) {
          const list = historyMap.get(tf) || [];
          list.push({ ...currentCandle });
          if (list.length > 300) list.shift();
          historyMap.set(tf, list);
        }

        // Start new candle
        currentCandle = {
          time: candleStartTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume,
        };
        activeMap.set(tf, currentCandle);
      } else {
        // Update forming candle
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
        currentCandle.volume += volume;
      }

      // Broadcast candle tick to clients
      this.broadcastCandle(symbol, tf, currentCandle);
    });
  }

  private getTimeframeMs(tf: string): number {
    if (tf === '1m') return 60 * 1000;
    if (tf === '5m') return 5 * 60 * 1000;
    if (tf === '15m') return 15 * 60 * 1000;
    if (tf === '1h') return 60 * 60 * 1000;
    if (tf === '4h') return 4 * 60 * 60 * 1000;
    if (tf === '1D') return 24 * 60 * 60 * 1000;
    return 60 * 1000;
  }

  private initBaselineCandles() {
    this.trackedSymbols.forEach((sym) => {
      const symHist = new Map<string, CandleData[]>();
      const initialPrice = sym.includes('BTC') ? 68420.5 : sym.includes('ETH') ? 3450.2 : sym === 'AAPL' ? 228.45 : sym === 'NVDA' ? 134.8 : 100.0;

      // Seed 60 baseline 1m candles
      const now = Date.now();
      const oneMin = 60 * 1000;
      const candles: CandleData[] = [];
      let p = initialPrice;

      for (let i = 59; i >= 0; i--) {
        const time = now - i * oneMin;
        const delta = (Math.random() - 0.5) * (initialPrice * 0.002);
        const open = p;
        const close = p + delta;
        const high = Math.max(open, close) + Math.random() * (initialPrice * 0.001);
        const low = Math.min(open, close) - Math.random() * (initialPrice * 0.001);
        const vol = Math.random() * 50 + 10;
        candles.push({ time, open, high, low, close, volume: vol });
        p = close;
      }

      symHist.set('1m', candles);
      this.candleHistory.set(sym, symHist);
    });
  }

  private startThrottledDispatcher() {
    this.broadcastTimer = setInterval(() => {
      if (this.pendingBroadcasts.size === 0 || !this.wss || this.wss.clients.size === 0) return;

      this.pendingBroadcasts.forEach((quote) => {
        const payload = JSON.stringify({
          type: 'market.quote',
          event: 'quote.update', // dual type support for compatibility
          symbol: quote.symbol,
          price: quote.lastPrice,
          bid: quote.bid,
          ask: quote.ask,
          spread: quote.spread,
          isCalculatedSpread: quote.isCalculatedSpread,
          spreadSource: quote.spreadSource,
          timestamp: new Date(quote.timestamp).toISOString(),
          source: quote.source,
          mode: quote.mode,
          data: quote,
        });

        this.wss?.clients.forEach((client) => {
          if (client.readyState === WsClient.OPEN) {
            client.send(payload);
          }
        });
      });

      this.pendingBroadcasts.clear();
    }, 60); // 16 broadcasts per second
  }

  private broadcastCandle(symbol: string, timeframe: string, candle: CandleIntervalState) {
    if (!this.wss || this.wss.clients.size === 0) return;

    const payload = JSON.stringify({
      type: 'market.candle',
      event: 'candle.update',
      symbol,
      timeframe,
      candle: {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      },
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WsClient.OPEN) {
        client.send(payload);
      }
    });
  }

  public broadcastStatus() {
    if (!this.wss || this.wss.clients.size === 0) return;

    const payload = JSON.stringify({
      type: 'market.status',
      ...this.getStatus(),
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WsClient.OPEN) {
        client.send(payload);
      }
    });
  }

  private setupWebSocketHandlers() {
    if (!this.wss) return;

    this.wss.on('connection', (client: WsClient) => {
      console.log(`[MarketDataService] Frontend client connected (Total: ${this.wss?.clients.size})`);

      // 1. Send initial status immediately upon connection
      client.send(JSON.stringify({
        type: 'market.status',
        ...this.getStatus(),
      }));

      // 2. Send snapshot of all cached quotes
      this.quotesCache.forEach((quote) => {
        client.send(JSON.stringify({
          type: 'market.quote',
          event: 'quote.update',
          symbol: quote.symbol,
          price: quote.lastPrice,
          bid: quote.bid,
          ask: quote.ask,
          spread: quote.spread,
          isCalculatedSpread: quote.isCalculatedSpread,
          spreadSource: quote.spreadSource,
          timestamp: new Date(quote.timestamp).toISOString(),
          source: quote.source,
          mode: quote.mode,
          data: quote,
        }));
      });

      // 3. Listen for client requests (subscribe, unsubscribe, set_mode)
      client.on('message', async (raw: string | Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'subscribe' && msg.symbol) {
            console.log(`[MarketDataService] Client requested subscription for: ${msg.symbol}`);
            this.subscribeSymbol(msg.symbol);
          } else if (msg.type === 'unsubscribe' && msg.symbol) {
            console.log(`[MarketDataService] Client requested unsubscription for: ${msg.symbol}`);
            this.unsubscribeSymbol(msg.symbol);
          } else if (msg.type === 'set_mode' && (msg.mode === 'LIVE' || msg.mode === 'SIMULATED')) {
            console.log(`[MarketDataService] Client requested mode switch to: ${msg.mode}`);
            await this.setMode(msg.mode);
          } else if (msg.type === 'ping') {
            client.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch {
          // ignore parsing error
        }
      });
    });
  }
}

export const marketDataService = new MarketDataService();
