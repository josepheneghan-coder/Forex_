/**
 * PaperTrade - Client-Side Market Data Provider
 *
 * Implements the MarketDataProvider interface and FinnhubMarketDataProvider class.
 * Handles client-side WebSocket connections to 'wss://ws.finnhub.io',
 * retrieves the API key via import.meta.env.VITE_FINNHUB_API_KEY,
 * performs dynamic symbol subscriptions, and normalizes trade events
 * into the standard 'market.quote' format.
 */

export type ProviderConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export interface FinnhubTradeItem {
  p: number; // Price
  s: string; // Symbol
  t: number; // Timestamp (Unix ms)
  v: number; // Volume
}

export interface FinnhubSocketMessage {
  type: string;
  data?: FinnhubTradeItem[];
  msg?: string;
}

export interface MarketQuotePayload {
  symbol: string;
  timestamp: string;
  last_price: string;
  bid: string;
  ask: string;
  spread: string;
  volume: number;
  day_change: string;
  day_change_percent: string;
  // Numeric aliases for trading calculation convenience
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  spreadValue: number;
  dayChange?: number;
  dayChangePercent?: number;
  source: 'FINNHUB';
}

export interface MarketQuoteEvent {
  type: 'market.quote';
  event: 'quote.update';
  symbol: string;
  data: MarketQuotePayload;
  timestamp: number;
}

export type MarketDataEventHandler<T = any> = (data: T) => void;

export function isForexSymbol(symbol: string): boolean {
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

/**
 * Interface definition for Market Data Providers
 */
export interface MarketDataProvider {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  getStatus(): ProviderConnectionStatus;
  getSubscribedSymbols(): string[];
  getLastError(): string | null;
  on(event: string, handler: MarketDataEventHandler): void;
  off(event: string, handler: MarketDataEventHandler): void;
}

/**
 * Finnhub Market Data Provider Implementation
 * Connects directly to Finnhub WebSocket (wss://ws.finnhub.io)
 */
export class FinnhubMarketDataProvider implements MarketDataProvider {
  public readonly name = 'FINNHUB';
  private socket: WebSocket | null = null;
  private status: ProviderConnectionStatus = 'DISCONNECTED';
  private subscribedSymbols = new Set<string>();
  private apiKey: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly initialReconnectDelay = 1000;
  private readonly maxReconnectDelay = 15000;
  private lastError: string | null = null;
  private isExplicitDisconnect = false;
  private listeners: Map<string, Set<MarketDataEventHandler>> = new Map();

  // Price tracking for day change calculation
  private dayOpenPrices = new Map<string, number>();
  private lastKnownPrices = new Map<string, number>();
  private totalTicksReceived = 0;

  constructor(apiKeyOverride?: string) {
    // Read from VITE_FINNHUB_API_KEY or optional constructor override
    this.apiKey = apiKeyOverride || (import.meta.env.VITE_FINNHUB_API_KEY as string) || null;
  }

  /**
   * Set or update API Key dynamically
   */
  public setApiKey(key: string): void {
    this.apiKey = key;
    this.lastError = null;
    this.logStatusChange(`API Key updated. Current key length: ${key?.length || 0}`);
  }

  public getStatus(): ProviderConnectionStatus {
    return this.status;
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
   * Register event listener
   */
  public on(event: string, handler: MarketDataEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unregister event listener
   */
  public off(event: string, handler: MarketDataEventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Internal event emitter
   */
  private emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[FinnhubMarketDataProvider] Error in event listener for '${event}':`, err);
        }
      });
    }
  }

  /**
   * Map standard internal symbol to Finnhub symbol syntax
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
    // Equities: AAPL, MSFT, NVDA, TSLA, AMZN, GOOGL, META, NFLX, AMD, INTC, SPY
    return s;
  }

  /**
   * Map Finnhub symbol back to standard internal symbol
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
      this.logStatusChange(`Already ${this.status}. Skipping redundant connection attempt.`);
      return;
    }

    const key = this.apiKey || (import.meta.env.VITE_FINNHUB_API_KEY as string);
    if (!key || key.trim() === '' || key === 'YOUR_FINNHUB_API_KEY') {
      this.updateStatus('DISCONNECTED');
      this.lastError = 'VITE_FINNHUB_API_KEY is missing or invalid in environment variables.';
      this.logStatusChange(`Connection aborted: ${this.lastError}`);
      this.emit('error', new Error(this.lastError));
      return;
    }

    this.apiKey = key;
    this.isExplicitDisconnect = false;
    this.updateStatus('CONNECTING');
    this.logStatusChange(`Connecting to wss://ws.finnhub.io...`);
    this.emit('connecting');

    try {
      const endpoint = `wss://ws.finnhub.io?token=${encodeURIComponent(this.apiKey)}`;
      this.socket = new WebSocket(endpoint);

      this.socket.onopen = () => {
        this.updateStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.lastError = null;
        this.logStatusChange(`Successfully connected to wss://ws.finnhub.io`);
        this.emit('connected');

        // Automatically resubscribe all tracked symbols
        this.resubscribeAll();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.handleSocketMessage(event.data);
      };

      this.socket.onerror = (event: Event) => {
        const errorMsg = 'Finnhub WebSocket error encountered';
        this.lastError = errorMsg;
        this.logStatusChange(`Socket error: ${errorMsg}`);
        this.emit('error', new Error(errorMsg));
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.logStatusChange(`Socket closed (code: ${event.code}, reason: ${event.reason || 'none'}, clean: ${event.wasClean})`);
        this.updateStatus('DISCONNECTED');
        this.emit('disconnected', { code: event.code, reason: event.reason });

        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err: any) {
      this.updateStatus('ERROR');
      this.lastError = err?.message || 'Failed to instantiate WebSocket';
      this.logStatusChange(`Connection error: ${this.lastError}`);
      this.emit('error', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from Finnhub WebSocket
   */
  public async disconnect(): Promise<void> {
    this.isExplicitDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close(1000, 'Client disconnected');
        }
      } catch (err) {
        // Discard close errors
      }
      this.socket = null;
    }

    this.updateStatus('DISCONNECTED');
    this.logStatusChange(`Explicitly disconnected by client`);
    this.emit('disconnected', { code: 1000, reason: 'Client disconnected' });
  }

  /**
   * Subscribe to real-time quotes for symbols
   */
  public subscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.add(sym);
      if (this.status === 'CONNECTED' && this.socket && this.socket.readyState === WebSocket.OPEN) {
        const finnhubSym = this.toFinnhubSymbol(sym);
        try {
          this.socket.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSym }));
          this.logStatusChange(`Sent subscription for ${sym} (${finnhubSym})`);
        } catch (e: any) {
          console.warn(`[FinnhubMarketDataProvider] Failed to send subscription for ${finnhubSym}:`, e.message);
        }
      }
    });
  }

  /**
   * Unsubscribe from symbols
   */
  public unsubscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.delete(sym);
      if (this.status === 'CONNECTED' && this.socket && this.socket.readyState === WebSocket.OPEN) {
        const finnhubSym = this.toFinnhubSymbol(sym);
        try {
          this.socket.send(JSON.stringify({ type: 'unsubscribe', symbol: finnhubSym }));
          this.logStatusChange(`Sent unsubscription for ${sym} (${finnhubSym})`);
        } catch (e: any) {
          console.warn(`[FinnhubMarketDataProvider] Failed to send unsubscription for ${finnhubSym}:`, e.message);
        }
      }
    });
  }

  /**
   * Parse and normalize incoming messages
   */
  private handleSocketMessage(rawData: any): void {
    try {
      const message: FinnhubSocketMessage = typeof rawData === 'string' ? JSON.parse(rawData) : JSON.parse(rawData.toString());

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

          // Track baseline day open price
          if (!this.dayOpenPrices.has(appSymbol)) {
            this.dayOpenPrices.set(appSymbol, price);
          }

          // Normalize trade event into standard 'market.quote' format
          const normalizedQuote = this.normalizeToMarketQuote(appSymbol, price, volume, timestamp);

          // Emit 'market.quote' event
          this.emit('market.quote', normalizedQuote);

          // Emit 'quote' event
          this.emit('quote', normalizedQuote);

          // Emit raw trade for low-level listeners
          this.emit('trade', {
            symbol: appSymbol,
            price,
            volume,
            timestamp,
            source: 'FINNHUB',
          });
        }
      } else if (message.type === 'ping') {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'pong' }));
        }
      } else if (message.type === 'error') {
        this.lastError = message.msg || 'Finnhub returned an error frame';
        console.warn(`[FinnhubMarketDataProvider] Finnhub error message: ${this.lastError}`);
        this.emit('error', new Error(this.lastError));
      }
    } catch (parseError: any) {
      // Gracefully discard invalid frames without crashing
    }
  }

  /**
   * Normalizes incoming trade data into standard market.quote format
   */
  public normalizeToMarketQuote(
    symbol: string,
    price: number,
    volume: number,
    timestamp: number
  ): MarketQuotePayload {
    const isForex = isForexSymbol(symbol);
    const isJPY = symbol.toUpperCase().includes('JPY');
    const decimals = isForex ? (isJPY ? 2 : 4) : 2;

    // Realistic spread calculation (tight institutional spreads: 1.6-1.8 pips for Forex)
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

    return {
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
  }

  /**
   * Automatically re-subscribes all symbols after reconnecting
   */
  private resubscribeAll(): void {
    if (this.status !== 'CONNECTED' || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
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
   * Helper to update status, notify listeners, and log
   */
  private updateStatus(newStatus: ProviderConnectionStatus): void {
    if (this.status !== newStatus) {
      const prevStatus = this.status;
      this.status = newStatus;
      this.logStatusChange(`Status changed: ${prevStatus} -> ${newStatus}`);
      this.emit('status', newStatus);
    }
  }

  /**
   * Logs status changes with timestamp and provider prefix
   */
  private logStatusChange(message: string): void {
    const timestamp = new Date().toISOString().substring(11, 23);
    console.log(`[FinnhubMarketDataProvider ${timestamp}] ${message}`);
  }

  /**
   * Schedules reconnect with exponential backoff and jitter
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isExplicitDisconnect) return;

    const exponential = this.initialReconnectDelay * Math.pow(1.5, this.reconnectAttempts);
    const jitter = Math.random() * 500;
    const delay = Math.min(exponential + jitter, this.maxReconnectDelay);

    this.reconnectAttempts++;
    this.logStatusChange(`Scheduling reconnect in ${(delay / 1000).toFixed(1)}s (Attempt #${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

/**
 * Simulated Market Data Provider Implementation
 * Generates realistic real-time price updates for paper trading simulations
 */
export class SimulatedMarketDataProvider implements MarketDataProvider {
  public readonly name = 'INTERNAL SIMULATOR';
  private status: ProviderConnectionStatus = 'DISCONNECTED';
  private subscribedSymbols = new Set<string>();
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<MarketDataEventHandler>> = new Map();
  private lastError: string | null = null;

  private basePrices: Record<string, number> = {
    'AAPL': 228.45,
    'MSFT': 428.10,
    'NVDA': 134.80,
    'TSLA': 254.30,
    'AMZN': 186.50,
    'GOOGL': 168.20,
    'META': 585.00,
    'NFLX': 710.20,
    'AMD': 162.40,
    'INTC': 22.80,
    'SPY': 574.10,
    'BTC/USDT': 68420.50,
    'ETH/USDT': 3450.25,
    'SOL/USDT': 178.60,
    'EUR/USD': 1.0875,
    'AUDUSD': 1.6100,
    'GBP/USD': 1.3050,
    'USD/JPY': 149.20,
    'EURAUD': 1.6250,
    'Gold': 2658.40,
    'BRENT': 78.30,
  };

  private currentPrices: Map<string, number> = new Map();
  private dayOpenPrices: Map<string, number> = new Map();

  constructor() {
    Object.entries(this.basePrices).forEach(([sym, price]) => {
      this.currentPrices.set(sym, price);
      this.dayOpenPrices.set(sym, price);
    });
  }

  public getStatus(): ProviderConnectionStatus {
    return this.status;
  }

  public getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public on(event: string, handler: MarketDataEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  public off(event: string, handler: MarketDataEventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (err) {
          console.error(`[SimulatedMarketDataProvider] Error in '${event}' listener:`, err);
        }
      });
    }
  }

  public async connect(): Promise<void> {
    if (this.status === 'CONNECTED') return;

    this.status = 'CONNECTED';
    this.emit('status', 'CONNECTED');
    this.emit('connected');
    console.log('[SimulatedMarketDataProvider] Simulator connected and streaming ticks.');

    if (!this.tickInterval) {
      this.tickInterval = setInterval(() => {
        this.generateTicks();
      }, 100); // 10 pulses per second
    }
  }

  public async disconnect(): Promise<void> {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.status = 'DISCONNECTED';
    this.emit('status', 'DISCONNECTED');
    this.emit('disconnected');
    console.log('[SimulatedMarketDataProvider] Simulator disconnected.');
  }

  public subscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.add(sym);
      if (!this.currentPrices.has(sym)) {
        const base = this.basePrices[sym] || 100.0;
        this.currentPrices.set(sym, base);
        this.dayOpenPrices.set(sym, base);
      }
    });
  }

  public unsubscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.delete(sym);
    });
  }

  private generateTicks(): void {
    if (this.subscribedSymbols.size === 0) return;

    const symbols = Array.from(this.subscribedSymbols);
    const count = Math.min(symbols.length, Math.floor(Math.random() * 2) + 1);

    for (let i = 0; i < count; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const prevPrice = this.currentPrices.get(sym) || 100.0;

      const isForex = isForexSymbol(sym);
      const isJPY = sym.toUpperCase().includes('JPY');
      const isCrypto = sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL');
      const vol = isCrypto ? 0.0003 : isForex ? 0.00008 : 0.0002;

      const delta = (Math.random() - 0.499) * 2 * vol * prevPrice;
      const decimals = isForex ? (isJPY ? 2 : 4) : 2;
      const newPrice = Number(Math.max(0.0001, prevPrice + delta).toFixed(decimals));

      this.currentPrices.set(sym, newPrice);

      let baseSpread = 0.03;
      if (isForex) {
        baseSpread = isJPY ? 0.018 : 0.00018; // ~1.8 pips
      } else if (sym.includes('BTC')) {
        baseSpread = 1.40;
      } else if (sym.includes('ETH')) {
        baseSpread = 0.35;
      } else if (sym.includes('SOL')) {
        baseSpread = 0.08;
      } else if (sym === 'Gold') {
        baseSpread = 0.35;
      } else if (sym === 'BRENT') {
        baseSpread = 0.04;
      } else if (sym === 'High Grade Copper') {
        baseSpread = 0.0004;
      }

      const spreadNum = Number(baseSpread.toFixed(decimals));
      const halfSpread = spreadNum / 2;
      const bidNum = Number((newPrice - halfSpread).toFixed(decimals));
      const askNum = Number((newPrice + halfSpread).toFixed(decimals));

      const dayOpen = this.dayOpenPrices.get(sym) || newPrice;
      const dayChangeNum = Number((newPrice - dayOpen).toFixed(decimals));
      const dayChangePctNum = dayOpen !== 0 ? Number((((newPrice - dayOpen) / dayOpen) * 100).toFixed(2)) : 0.0;
      const volume = Number((Math.random() * 2 + 0.1).toFixed(2));

      const quote: MarketQuotePayload = {
        symbol: sym,
        timestamp: new Date().toISOString(),
        last_price: newPrice.toFixed(decimals),
        bid: bidNum.toFixed(decimals),
        ask: askNum.toFixed(decimals),
        spread: spreadNum.toFixed(decimals),
        volume: Math.round(volume * 10),
        day_change: (dayChangeNum >= 0 ? '+' : '') + dayChangeNum.toFixed(decimals),
        day_change_percent: (dayChangePctNum >= 0 ? '+' : '') + dayChangePctNum.toFixed(2),
        lastPrice: newPrice,
        bidPrice: bidNum,
        askPrice: askNum,
        spreadValue: spreadNum,
        source: 'FINNHUB', // Or SIMULATED
      };

      this.emit('market.quote', quote);
      this.emit('quote', quote);
      this.emit('trade', {
        symbol: sym,
        price: newPrice,
        volume,
        timestamp: Date.now(),
        source: 'INTERNAL SIMULATOR',
      });
    }
  }
}

/**
 * Configuration Options for Market Data Provider
 */
export interface MarketDataProviderConfig {
  mode?: 'LIVE' | 'SIMULATED';
  apiKey?: string;
}

/**
 * Factory for creating MarketDataProvider instances based on configuration and API key availability
 */
export class MarketDataProviderFactory {
  /**
   * Checks whether a valid Finnhub API Key is present in environment or parameters
   */
  public static hasValidApiKey(apiKeyOverride?: string): boolean {
    const key = apiKeyOverride || (import.meta.env.VITE_FINNHUB_API_KEY as string);
    return !!(key && key.trim().length > 5 && key !== 'YOUR_FINNHUB_API_KEY');
  }

  /**
   * Factory method to create appropriate MarketDataProvider
   * Enables 'LIVE' mode when the API key is present, ensuring fallback to simulation otherwise.
   */
  public static createProvider(config: MarketDataProviderConfig = {}): MarketDataProvider {
    const hasKey = MarketDataProviderFactory.hasValidApiKey(config.apiKey);
    const targetMode = config.mode || (hasKey ? 'LIVE' : 'SIMULATED');

    if (targetMode === 'LIVE') {
      if (hasKey) {
        console.log('[MarketDataProviderFactory] Instantiating FinnhubMarketDataProvider in LIVE mode.');
        return new FinnhubMarketDataProvider(config.apiKey);
      } else {
        console.warn('[MarketDataProviderFactory] LIVE mode requested but VITE_FINNHUB_API_KEY is missing. Falling back to SimulatedMarketDataProvider.');
        return new SimulatedMarketDataProvider();
      }
    }

    console.log('[MarketDataProviderFactory] Instantiating SimulatedMarketDataProvider in SIMULATED mode.');
    return new SimulatedMarketDataProvider();
  }
}

