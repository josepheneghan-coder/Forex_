import { EventEmitter } from 'events';
import { WebSocket as WsClient } from 'ws';
import { MarketDataProvider } from './MarketDataProvider';
import { MarketDataMode, ProviderStatus, RawTrade, StandardMarketQuote } from '../types';

interface FinnhubRawTradeItem {
  p: number; // Price
  s: string; // Symbol
  t: number; // Timestamp (Unix ms)
  v: number; // Volume
}

interface FinnhubMessage {
  type: string;
  data?: FinnhubRawTradeItem[];
  msg?: string;
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

export class FinnhubMarketDataProvider extends EventEmitter implements MarketDataProvider {
  public readonly name = 'FINNHUB';
  private socket: WsClient | null = null;
  private status: ProviderStatus = 'DISCONNECTED';
  private subscribedSymbols = new Set<string>();
  private apiKey: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly initialReconnectDelay = 1000;
  private readonly maxReconnectDelay = 15000;
  private lastError: string | null = null;
  private isExplicitDisconnect = false;
  private pingInterval: NodeJS.Timeout | null = null;

  // Track initial prices for 24h day change calculations
  private dayOpenPrices = new Map<string, number>();
  private lastKnownPrices = new Map<string, number>();
  private totalTicksReceived = 0;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.FINNHUB_API_KEY || null;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
    this.lastError = null;
  }

  public getStatus(): ProviderStatus {
    return this.status;
  }

  public getMode(): MarketDataMode {
    return 'LIVE';
  }

  public getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getTicksCount(): number {
    return this.totalTicksReceived;
  }

  /**
   * Maps internal application symbols to Finnhub WebSocket symbol format
   */
  public toFinnhubSymbol(symbol: string): string {
    const s = symbol.trim().toUpperCase();
    if (s === 'BTC/USDT' || s === 'BTC/EUR' || s === 'BTC') return 'BINANCE:BTCUSDT';
    if (s === 'ETH/USDT' || s === 'ETH/EUR' || s === 'ETH') return 'BINANCE:ETHUSDT';
    if (s === 'SOL/USDT' || s === 'SOL') return 'BINANCE:SOLUSDT';
    if (s === 'EUR/USD' || s === 'EURUSD') return 'OANDA:EUR_USD';
    if (s === 'GBP/USD' || s === 'GBPUSD') return 'OANDA:GBP_USD';
    if (s === 'USD/JPY' || s === 'USDJPY') return 'OANDA:USD_JPY';
    if (s === 'AUD/USD' || s === 'AUDUSD') return 'OANDA:AUD_USD';
    if (s === 'EUR/AUD' || s === 'EURAUD') return 'OANDA:EUR_AUD';
    if (s === 'GOLD' || s === 'XAU/USD') return 'OANDA:XAU_USD';
    if (s === 'BRENT' || s === 'BRENT/USD') return 'OANDA:BCO_USD';
    // Equities pass through (AAPL, MSFT, NVDA, TSLA, AMZN, GOOGL, META, NFLX, AMD, INTC, SPY, etc.)
    return s;
  }

  /**
   * Maps Finnhub symbol back to standard application symbol
   */
  public fromFinnhubSymbol(finnhubSymbol: string): string {
    const s = finnhubSymbol.trim();
    if (s === 'BINANCE:BTCUSDT') return 'BTC/USDT';
    if (s === 'BINANCE:ETHUSDT') return 'ETH/USDT';
    if (s === 'BINANCE:SOLUSDT') return 'SOL/USDT';
    if (s === 'OANDA:EUR_USD') return 'EUR/USD';
    if (s === 'OANDA:GBP_USD') return 'GBP/USD';
    if (s === 'OANDA:USD_JPY') return 'USD/JPY';
    if (s === 'OANDA:AUD_USD') return 'AUDUSD';
    if (s === 'OANDA:EUR_AUD') return 'EURAUD';
    if (s === 'OANDA:XAU_USD') return 'Gold';
    if (s === 'OANDA:BCO_USD') return 'BRENT';
    return s;
  }

  /**
   * Connect to Finnhub WebSocket (wss://ws.finnhub.io)
   */
  public async connect(): Promise<void> {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') {
      return;
    }

    const currentKey = this.apiKey || process.env.FINNHUB_API_KEY;
    if (!currentKey || currentKey.trim() === '' || currentKey === 'YOUR_FINNHUB_API_KEY') {
      this.updateStatus('DISCONNECTED');
      this.lastError = 'FINNHUB_API_KEY is not configured in Google AI Studio Secrets.';
      this.emit('error', new Error(this.lastError));
      return;
    }

    this.apiKey = currentKey;
    this.isExplicitDisconnect = false;
    this.updateStatus('CONNECTING');
    this.emit('connecting');

    try {
      const endpoint = `wss://ws.finnhub.io?token=${encodeURIComponent(this.apiKey)}`;
      this.socket = new WsClient(endpoint);

      this.socket.on('open', () => {
        this.updateStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.lastError = null;
        console.log(`[FinnhubMarketDataProvider] Successfully connected to wss://ws.finnhub.io`);
        this.emit('connected');

        // Setup ping/pong heartbeat to keep connection alive
        this.startHeartbeat();

        // Resubscribe all tracked symbols
        this.resubscribeAll();
      });

      this.socket.on('message', (data: Buffer | string) => {
        this.handleSocketMessage(data);
      });

      this.socket.on('error', (err: Error) => {
        this.lastError = err.message;
        console.warn(`[FinnhubMarketDataProvider] Socket error: ${err.message}`);
        this.emit('error', err);
      });

      this.socket.on('close', (code: number, reason: Buffer) => {
        this.stopHeartbeat();
        const reasonStr = reason ? reason.toString() : '';
        console.log(`[FinnhubMarketDataProvider] Socket closed (code: ${code}, reason: ${reasonStr || 'none'})`);
        this.updateStatus('DISCONNECTED');
        this.emit('disconnected');

        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      });
    } catch (err: any) {
      this.updateStatus('ERROR');
      this.lastError = err.message || 'Failed to establish WebSocket connection';
      this.emit('error', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Gracefully disconnect from WebSocket
   */
  public async disconnect(): Promise<void> {
    this.isExplicitDisconnect = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        if (this.socket.readyState === WsClient.OPEN || this.socket.readyState === WsClient.CONNECTING) {
          this.socket.close();
        }
      } catch (err) {
        // Ignore close errors
      }
      this.socket = null;
    }

    this.updateStatus('DISCONNECTED');
    this.emit('disconnected');
  }

  /**
   * Subscribe to market data for symbols
   */
  public subscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.add(sym);
      if (this.status === 'CONNECTED' && this.socket && this.socket.readyState === WsClient.OPEN) {
        const finnhubSym = this.toFinnhubSymbol(sym);
        try {
          this.socket.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSym }));
        } catch (e: any) {
          console.warn(`[FinnhubMarketDataProvider] Failed to send subscribe for ${finnhubSym}:`, e.message);
        }
      }
    });
  }

  /**
   * Unsubscribe from market data for symbols
   */
  public unsubscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.delete(sym);
      if (this.status === 'CONNECTED' && this.socket && this.socket.readyState === WsClient.OPEN) {
        const finnhubSym = this.toFinnhubSymbol(sym);
        try {
          this.socket.send(JSON.stringify({ type: 'unsubscribe', symbol: finnhubSym }));
        } catch (e: any) {
          console.warn(`[FinnhubMarketDataProvider] Failed to send unsubscribe for ${finnhubSym}:`, e.message);
        }
      }
    });
  }

  /**
   * Process and normalize incoming WebSocket messages from Finnhub
   */
  private handleSocketMessage(data: Buffer | string): void {
    try {
      const message: FinnhubMessage = JSON.parse(data.toString());

      if (message.type === 'trade' && Array.isArray(message.data)) {
        for (const item of message.data) {
          if (!item.s || typeof item.p !== 'number') continue;

          this.totalTicksReceived++;
          const appSymbol = this.fromFinnhubSymbol(item.s);
          const price = item.p;
          const volume = item.v || 1;
          const timestamp = item.t || Date.now();

          // Store last known price
          this.lastKnownPrices.set(appSymbol, price);

          // Track day open price
          if (!this.dayOpenPrices.has(appSymbol)) {
            this.dayOpenPrices.set(appSymbol, price);
          }

          // Emit RawTrade for backward compatibility
          const rawTrade: RawTrade = {
            symbol: appSymbol,
            price,
            volume,
            timestamp,
            source: 'FINNHUB',
          };
          this.emit('trade', rawTrade);

          // Normalize incoming event into the standard 'market.quote' format
          const normalizedQuote = this.normalizeToMarketQuote(appSymbol, price, volume, timestamp);

          // Emit standard 'market.quote' event
          this.emit('market.quote', normalizedQuote);

          // Also emit 'quote' event for compatibility
          this.emit('quote', normalizedQuote);
        }
      } else if (message.type === 'ping') {
        if (this.socket && this.socket.readyState === WsClient.OPEN) {
          this.socket.send(JSON.stringify({ type: 'pong' }));
        }
      } else if (message.type === 'error') {
        this.lastError = message.msg || 'Finnhub API error message received';
        console.warn(`[FinnhubMarketDataProvider] Server returned error: ${this.lastError}`);
        this.emit('error', new Error(this.lastError));
      }
    } catch (parseError: any) {
      // Discard malformed JSON frames gracefully without crashing
    }
  }

  /**
   * Normalizes incoming raw trade data into standard market.quote format
   */
  private normalizeToMarketQuote(
    symbol: string,
    price: number,
    volume: number,
    timestamp: number
  ): StandardMarketQuote {
    const isForex = isForexSymbol(symbol);
    const isJPY = symbol.toUpperCase().includes('JPY');
    const decimals = isForex ? (isJPY ? 2 : 4) : 2;

    // Realistic spread calculation
    let baseSpread = 0.03;
    if (isForex) {
      baseSpread = isJPY ? 0.018 : 0.00018; // ~1.8 pips
    } else if (symbol === 'BTC/USDT' || symbol === 'BTC/EUR' || symbol.includes('BTC')) {
      baseSpread = 1.40;
    } else if (symbol.includes('ETH')) {
      baseSpread = 0.35;
    } else if (symbol.includes('SOL')) {
      baseSpread = 0.08;
    } else if (symbol === 'Gold') {
      baseSpread = 0.35;
    } else if (symbol === 'BRENT') {
      baseSpread = 0.04;
    } else if (symbol === 'High Grade Copper') {
      baseSpread = 0.0004;
    }

    const spreadNum = Number(baseSpread.toFixed(decimals));
    const halfSpread = spreadNum / 2;
    const bidNum = Number((price - halfSpread).toFixed(decimals));
    const askNum = Number((price + halfSpread).toFixed(decimals));

    const dayOpen = this.dayOpenPrices.get(symbol) || price;
    const dayChangeNum = Number((price - dayOpen).toFixed(decimals));
    const dayChangePctNum = dayOpen !== 0 ? Number((((price - dayOpen) / dayOpen) * 100).toFixed(2)) : 0.0;

    const isoTimestamp = new Date(timestamp).toISOString();

    const quote: StandardMarketQuote = {
      symbol,
      timestamp: isoTimestamp,
      last_price: price.toFixed(decimals),
      bid: bidNum.toFixed(decimals),
      ask: askNum.toFixed(decimals),
      spread: spreadNum.toFixed(decimals),
      volume: Math.round(volume),
      day_change: (dayChangeNum >= 0 ? '+' : '') + dayChangeNum.toFixed(decimals),
      day_change_percent: (dayChangePctNum >= 0 ? '+' : '') + dayChangePctNum.toFixed(2),
      lastPrice: Number(price.toFixed(decimals)),
      bidPrice: bidNum,
      askPrice: askNum,
      spreadValue: spreadNum,
      source: 'FINNHUB',
    };

    return quote;
  }

  /**
   * Resubscribe all registered symbols after reconnection
   */
  private resubscribeAll(): void {
    if (this.status !== 'CONNECTED' || !this.socket || this.socket.readyState !== WsClient.OPEN) return;
    this.subscribedSymbols.forEach((sym) => {
      const finnhubSym = this.toFinnhubSymbol(sym);
      try {
        this.socket?.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSym }));
      } catch (err) {
        // Ignore
      }
    });
  }

  /**
   * Updates provider status and emits status event
   */
  private updateStatus(newStatus: ProviderStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit('status', newStatus);
    }
  }

  /**
   * Schedule automatic reconnect with exponential backoff & jitter
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isExplicitDisconnect) return;

    // Exponential backoff with small random jitter
    const exponential = this.initialReconnectDelay * Math.pow(1.5, this.reconnectAttempts);
    const jitter = Math.random() * 500;
    const delay = Math.min(exponential + jitter, this.maxReconnectDelay);

    this.reconnectAttempts++;
    console.log(`[FinnhubMarketDataProvider] Reconnecting in ${Math.round(delay / 1000)}s (Attempt #${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Keep-alive WebSocket heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WsClient.OPEN) {
        try {
          this.socket.ping();
        } catch (e) {
          // Ignore
        }
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
