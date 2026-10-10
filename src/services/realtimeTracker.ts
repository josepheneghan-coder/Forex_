/**
 * PaperTrade v1.0 - Realtime Tracker & Market Data Client Service
 *
 * Supports switching between SimulatedMarketDataProvider and FinnhubMarketDataProvider.
 * Uses a Factory Pattern & Configuration-based Injection to enable LIVE mode when
 * the API key is present, ensuring automatic fallback to simulation otherwise.
 */

import {
  Account,
  ConnectionStatus,
  MarketStatus,
  PriceAlert,
  Quote,
  RealtimeEvent,
  RealtimeEventType,
  RealtimeSnapshot,
  FinnhubPipelineStats,
  MarketDataStatus,
} from '../types/trading';

import {
  type MarketDataProvider,
  FinnhubMarketDataProvider,
  SimulatedMarketDataProvider,
  MarketDataProviderFactory,
  type MarketDataProviderConfig,
  type MarketQuotePayload,
  type ProviderConnectionStatus,
  isForexSymbol,
} from './marketDataProvider';

export type EventHandler<T = any> = (event: RealtimeEvent<T>) => void;

export class RealtimeTrackerService {
  private activeProvider: MarketDataProvider;
  private currentMode: 'LIVE' | 'SIMULATED' = 'SIMULATED';
  private socket: WebSocket | null = null;
  private sequence = 1000;
  private status: ConnectionStatus = 'LIVE';
  private marketStatus: MarketStatus = 'OPEN';
  private lastTickTime = Date.now();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private staleCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Tracked active subscriptions
  private subscribedSymbols = new Set<string>([
    'AAPL', 'NVDA', 'TSLA', 'MSFT', 'BTC/USDT', 'EUR/USD', 'Gold',
  ]);

  // Market Data Status State
  private marketDataStatus: MarketDataStatus = {
    provider: 'INTERNAL SIMULATOR',
    mode: 'SIMULATED',
    status: 'CONNECTING',
    hasApiKey: false,
    apiKeyRequired: true,
    subscribedSymbols: ['AAPL', 'NVDA', 'TSLA', 'MSFT'],
    lastEventTime: Date.now(),
    lastSymbol: 'AAPL',
    lastPrice: 228.45,
    lastError: null,
    connectedClients: 1,
    totalTicksReceived: 0,
  };

  // Finnhub Pipeline Stats
  private pipelineStats: FinnhubPipelineStats = {
    rawTicksReceived: 0,
    normalizedCount: 0,
    cacheUpdates: 0,
    spreadsCalculated: 0,
    broadcastsSent: 0,
    finnhubStatus: 'INITIALIZING',
    finnhubWsUrl: 'wss://ws.finnhub.io',
    connectedClientsCount: 1,
    lastTickTimestamp: Date.now(),
  };

  // Event Listeners Map
  private listeners: Map<
    RealtimeEventType | 'all' | 'status' | 'market.status' | 'candle.update',
    Set<EventHandler>
  > = new Map();

  // Price Alerts
  private priceAlerts: PriceAlert[] = [
    {
      id: 'alert_1',
      symbol: 'AAPL',
      targetPrice: 235.0,
      condition: 'ABOVE_OR_EQUAL',
      isTriggered: false,
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'alert_2',
      symbol: 'BTC/USDT',
      targetPrice: 70000.0,
      condition: 'ABOVE_OR_EQUAL',
      isTriggered: false,
      createdAt: Date.now() - 3600000,
    },
  ];

  // Throttle Queue for UI updates (approx 16-20 fps)
  private pendingQuoteEvents: Map<string, RealtimeEvent<Quote>> = new Map();
  private dispatchTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Constructor with Dependency Injection or Factory Configuration
   */
  constructor(providerOrConfig?: MarketDataProvider | MarketDataProviderConfig) {
    const hasKey = MarketDataProviderFactory.hasValidApiKey();

    if (providerOrConfig && typeof (providerOrConfig as any).connect === 'function') {
      // Direct provider instance injection
      this.activeProvider = providerOrConfig as MarketDataProvider;
      this.currentMode = this.activeProvider.name === 'FINNHUB' ? 'LIVE' : 'SIMULATED';
    } else {
      // Configuration-based or default factory creation
      const config = (providerOrConfig as MarketDataProviderConfig) || {};
      const targetMode = config.mode || (hasKey ? 'LIVE' : 'SIMULATED');
      this.currentMode = targetMode;

      // Factory pattern to create Finnhub provider if key is present, fallback to simulation otherwise
      this.activeProvider = MarketDataProviderFactory.createProvider({
        mode: targetMode,
        apiKey: config.apiKey,
      });
    }

    this.updateMarketDataStatusSnapshot();
    this.setupProviderListeners(this.activeProvider);

    // Initial symbol subscriptions on active provider
    this.activeProvider.subscribe(Array.from(this.subscribedSymbols));
    this.activeProvider.connect().catch((err) => {
      console.warn('[RealtimeTracker] Provider initial connect warning:', err);
    });

    // Also connect to Application WebSocket stream (/ws/market)
    this.initWebSocket();
    this.startHeartbeatAndStaleCheck();
    this.startThrottledDispatcher();
  }

  /**
   * Returns current active MarketDataProvider
   */
  public getActiveProvider(): MarketDataProvider {
    return this.activeProvider;
  }

  /**
   * Allows direct provider replacement (Dependency Injection)
   */
  public async setProvider(newProvider: MarketDataProvider): Promise<void> {
    if (this.activeProvider === newProvider) return;

    await this.activeProvider.disconnect();
    this.activeProvider = newProvider;
    this.currentMode = newProvider.name === 'FINNHUB' ? 'LIVE' : 'SIMULATED';

    this.setupProviderListeners(this.activeProvider);
    this.activeProvider.subscribe(Array.from(this.subscribedSymbols));
    await this.activeProvider.connect();

    this.updateMarketDataStatusSnapshot();
    this.notifyStatusListeners();
  }

  /**
   * Switches Market Data Mode between LIVE and SIMULATED using Factory pattern
   * Falls back to simulation if API key is not present when switching to LIVE.
   */
  public async setMarketDataMode(mode: 'LIVE' | 'SIMULATED', apiKeyOverride?: string): Promise<void> {
    await this.switchProvider(mode, apiKeyOverride);
  }

  public async switchProvider(mode: 'LIVE' | 'SIMULATED', apiKeyOverride?: string): Promise<void> {
    const hasKey = MarketDataProviderFactory.hasValidApiKey(apiKeyOverride);

    console.log(`[RealtimeTracker] Switching market data mode to: ${mode} (hasKey: ${hasKey})`);

    // Gracefully disconnect current provider
    await this.activeProvider.disconnect();

    // Factory creates Finnhub provider if LIVE requested and key is present, else falls back to simulation
    const newProvider = MarketDataProviderFactory.createProvider({
      mode,
      apiKey: apiKeyOverride,
    });

    this.activeProvider = newProvider;
    this.currentMode = mode;

    this.setupProviderListeners(this.activeProvider);
    this.activeProvider.subscribe(Array.from(this.subscribedSymbols));
    await this.activeProvider.connect();

    this.updateMarketDataStatusSnapshot();
    this.notifyStatusListeners();

    // Synchronize backend server
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'set_mode', mode }));
    }

    try {
      await fetch('/api/market/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
    } catch {
      // ignore server sync fetch error
    }
  }

  /**
   * Setup event listeners on the active provider
   */
  private setupProviderListeners(provider: MarketDataProvider): void {
    // 1. Quote event from provider
    const handleQuote = (payload: MarketQuotePayload) => {
      if (provider !== this.activeProvider) return;

      const isForex = isForexSymbol(payload.symbol);
      const isJPY = payload.symbol.toUpperCase().includes('JPY');
      const decimals = isForex ? (isJPY ? 2 : 4) : 2;
      const lastPrice = payload.lastPrice ?? parseFloat(String(payload.last_price));
      const bid = payload.bidPrice ?? parseFloat(String(payload.bid));
      const ask = payload.askPrice ?? parseFloat(String(payload.ask));
      const spread = payload.spreadValue ?? parseFloat(String(payload.spread));

      const quoteData: Quote = {
        symbol: payload.symbol,
        lastPrice: Number(lastPrice.toFixed(decimals)),
        bid: Number(bid.toFixed(decimals)),
        ask: Number(ask.toFixed(decimals)),
        spread: Number(spread.toFixed(decimals)),
        volume: payload.volume || 15000,
        dayOpen: lastPrice,
        dayHigh: lastPrice,
        dayLow: lastPrice,
        previousClose: lastPrice,
        change24h: payload.dayChangePercent ?? parseFloat(String(payload.day_change_percent || '0').replace('+', '')),
        timestamp: Date.now(),
        isCalculatedSpread: true,
        spreadSource: payload.source === 'FINNHUB' ? 'FINNHUB_L1' : 'CALCULATED_SPREAD',
        source: payload.source || provider.name,
        mode: this.currentMode,
      };

      this.lastTickTime = Date.now();
      this.marketDataStatus.lastEventTime = Date.now();
      this.marketDataStatus.lastSymbol = quoteData.symbol;
      this.marketDataStatus.lastPrice = quoteData.lastPrice;
      this.marketDataStatus.totalTicksReceived++;

      this.pipelineStats.rawTicksReceived++;
      this.pipelineStats.normalizedCount++;
      this.pipelineStats.lastTickTimestamp = Date.now();

      this.emitEvent('quote.update', quoteData);
    };

    provider.on('market.quote', handleQuote);
    provider.on('quote', handleQuote);

    // 2. Status event from provider
    provider.on('status', (newStatus: ProviderConnectionStatus) => {
      if (provider !== this.activeProvider) return;
      this.marketDataStatus.status = newStatus;
      if (newStatus === 'CONNECTED') {
        this.setStatus('LIVE');
      } else if (newStatus === 'CONNECTING') {
        this.setStatus('CONNECTING');
      } else if (newStatus === 'DISCONNECTED') {
        this.setStatus('DISCONNECTED');
      }
      this.notifyStatusListeners();
    });

    // 3. Error event from provider
    provider.on('error', (err: Error) => {
      if (provider !== this.activeProvider) return;
      this.marketDataStatus.lastError = err?.message || 'Provider error';
      console.warn(`[RealtimeTracker] Active provider error:`, err?.message);
      this.notifyStatusListeners();
    });
  }

  private updateMarketDataStatusSnapshot(): void {
    const hasKey = MarketDataProviderFactory.hasValidApiKey();
    this.marketDataStatus = {
      provider: this.activeProvider.name as 'FINNHUB' | 'INTERNAL SIMULATOR',
      mode: this.currentMode,
      status: this.activeProvider.getStatus(),
      hasApiKey: hasKey,
      apiKeyRequired: !hasKey && this.currentMode === 'LIVE',
      subscribedSymbols: this.activeProvider.getSubscribedSymbols(),
      lastEventTime: Date.now(),
      lastSymbol: this.marketDataStatus.lastSymbol || 'AAPL',
      lastPrice: this.marketDataStatus.lastPrice || 228.45,
      lastError: this.activeProvider.getLastError(),
      connectedClients: 1,
      totalTicksReceived: this.marketDataStatus.totalTicksReceived,
    };
  }

  private notifyStatusListeners(): void {
    this.updateMarketDataStatusSnapshot();
    const statusEvent: RealtimeEvent<MarketDataStatus> = {
      event: 'quote.update',
      sequence: this.sequence,
      timestamp: new Date().toISOString(),
      data: this.marketDataStatus,
    };
    this.listeners.get('market.status' as any)?.forEach((h) => h(statusEvent));
  }

  public subscribe(
    eventType: RealtimeEventType | 'all' | 'status' | 'market.status' | 'candle.update',
    handler: EventHandler
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getMarketStatus(): MarketStatus {
    return this.marketStatus;
  }

  public getSequence(): number {
    return this.sequence;
  }

  public getAlerts(): PriceAlert[] {
    return this.priceAlerts;
  }

  public getPipelineStats(): FinnhubPipelineStats {
    return this.pipelineStats;
  }

  public getMarketDataStatus(): MarketDataStatus {
    this.updateMarketDataStatusSnapshot();
    return this.marketDataStatus;
  }

  /**
   * Dynamically subscribes symbol on active provider & server
   */
  public subscribeSymbol(symbol: string): void {
    this.subscribedSymbols.add(symbol);
    this.activeProvider.subscribe([symbol]);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'subscribe', symbol }));
    }
  }

  /**
   * Unsubscribes symbol on active provider & server
   */
  public unsubscribeSymbol(symbol: string): void {
    this.subscribedSymbols.delete(symbol);
    this.activeProvider.unsubscribe([symbol]);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  }

  public addAlert(symbol: string, targetPrice: number, condition: 'ABOVE_OR_EQUAL' | 'BELOW_OR_EQUAL'): PriceAlert {
    const newAlert: PriceAlert = {
      id: 'alert_' + Math.random().toString(36).substring(2, 9),
      symbol,
      targetPrice,
      condition,
      isTriggered: false,
      createdAt: Date.now(),
    };
    this.priceAlerts = [newAlert, ...this.priceAlerts];
    return newAlert;
  }

  public removeAlert(id: string): void {
    this.priceAlerts = this.priceAlerts.filter((a) => a.id !== id);
  }

  public emitEvent<T = any>(eventType: RealtimeEventType, data: T): void {
    this.sequence++;
    const event: RealtimeEvent<T> = {
      event: eventType,
      sequence: this.sequence,
      timestamp: new Date().toISOString(),
      data,
    };

    if (eventType === 'quote.update') {
      const quote = data as unknown as Quote;
      this.lastTickTime = Date.now();
      this.pendingQuoteEvents.set(quote.symbol, event as unknown as RealtimeEvent<Quote>);
      this.checkPriceAlerts(quote);
    } else {
      this.dispatchImmediate(event);
    }
  }

  private dispatchImmediate(event: RealtimeEvent): void {
    this.listeners.get(event.event)?.forEach((h) => h(event));
    this.listeners.get('all')?.forEach((h) => h(event));
  }

  private startThrottledDispatcher(): void {
    // 16-20 visual updates per sec
    this.dispatchTimer = setInterval(() => {
      if (this.pendingQuoteEvents.size > 0) {
        this.pendingQuoteEvents.forEach((event) => {
          this.dispatchImmediate(event);
        });
        this.pendingQuoteEvents.clear();
      }
    }, 60);
  }

  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      const statusEvent: RealtimeEvent<ConnectionStatus> = {
        event: 'quote.update',
        sequence: this.sequence,
        timestamp: new Date().toISOString(),
        data: newStatus,
      };
      this.listeners.get('status')?.forEach((h) => h(statusEvent));
    }
  }

  private initWebSocket(): void {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const streamUrl = `${protocol}//${window.location.host}/ws/market`;
      const ws = new WebSocket(streamUrl);

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('LIVE');
        this.lastTickTime = Date.now();
        console.log('[RealtimeTracker] Connected to Application WebSocket at /ws/market');

        // Resubscribe all active symbols
        this.subscribedSymbols.forEach((sym) => {
          ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
        });
      };

      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data);

          // 1. Market Status update from server
          if (parsed.type === 'market.status') {
            this.marketDataStatus = {
              provider: parsed.provider,
              mode: parsed.mode,
              status: parsed.status,
              hasApiKey: parsed.hasApiKey,
              apiKeyRequired: parsed.apiKeyRequired,
              subscribedSymbols: parsed.subscribedSymbols || [],
              lastEventTime: parsed.lastEventTime || Date.now(),
              lastSymbol: parsed.lastSymbol || 'AAPL',
              lastPrice: parsed.lastPrice || 0,
              lastError: parsed.lastError || null,
              connectedClients: parsed.connectedClients || 1,
              totalTicksReceived: parsed.totalTicksReceived || 0,
            };

            const statusEvent: RealtimeEvent<MarketDataStatus> = {
              event: 'quote.update',
              sequence: this.sequence,
              timestamp: new Date().toISOString(),
              data: this.marketDataStatus,
            };
            this.listeners.get('market.status' as any)?.forEach((h) => h(statusEvent));
          }

          // 2. Real-time Market Quote Event from server
          if ((parsed.type === 'market.quote' || parsed.event === 'quote.update') && (parsed.data || parsed.symbol)) {
            const quoteData: Quote = parsed.data || {
              symbol: parsed.symbol,
              lastPrice: parsed.price,
              bid: parsed.bid,
              ask: parsed.ask,
              spread: parsed.spread,
              volume: 15000,
              dayOpen: parsed.price,
              dayHigh: parsed.price,
              dayLow: parsed.price,
              previousClose: parsed.price,
              change24h: 0,
              timestamp: Date.now(),
              isCalculatedSpread: parsed.isCalculatedSpread ?? true,
              spreadSource: parsed.spreadSource ?? 'CALCULATED_SPREAD',
              source: parsed.source,
              mode: parsed.mode,
            };

            this.lastTickTime = Date.now();
            this.marketDataStatus.lastEventTime = Date.now();
            this.marketDataStatus.lastSymbol = quoteData.symbol;
            this.marketDataStatus.lastPrice = quoteData.lastPrice;

            this.emitEvent('quote.update', quoteData);
          }

          // 3. Candle update event
          if (parsed.type === 'market.candle' && parsed.candle) {
            const candleEvent: RealtimeEvent = {
              event: 'candle.update',
              sequence: this.sequence,
              timestamp: new Date().toISOString(),
              data: {
                symbol: parsed.symbol,
                timeframe: parsed.timeframe,
                candle: parsed.candle,
              },
            };
            this.listeners.get('candle.update' as any)?.forEach((h) => h(candleEvent));
          }
        } catch {
          // ignore parsing error
        }
      };

      ws.onerror = () => {
        this.handleDisconnect();
      };

      ws.onclose = () => {
        this.handleDisconnect();
      };

      this.socket = ws;
    } catch {
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.initWebSocket();
    }, delay);
  }

  private startHeartbeatAndStaleCheck(): void {
    this.staleCheckInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSinceLastTick = now - this.lastTickTime;

      // Mark DATA_STALE if no ticks for > 15s
      if (elapsedSinceLastTick > 15000 && this.status === 'LIVE') {
        this.setStatus('DATA_STALE');
      } else if (elapsedSinceLastTick <= 15000 && this.status === 'DATA_STALE') {
        this.setStatus('LIVE');
      }

      // Keepalive ping to server
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 5000);
  }

  private checkPriceAlerts(quote: Quote): void {
    this.priceAlerts.forEach((alert) => {
      if (alert.isTriggered || alert.symbol !== quote.symbol) return;

      let triggered = false;
      if (alert.condition === 'ABOVE_OR_EQUAL' && quote.lastPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'BELOW_OR_EQUAL' && quote.lastPrice <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        alert.isTriggered = true;
        alert.triggeredAt = Date.now();
        this.emitEvent('price_alert.triggered', {
          alert,
          currentPrice: quote.lastPrice,
          message: `Preisalarm für ${alert.symbol}: Kurs ${quote.lastPrice} hat Ziel ${alert.targetPrice} erreicht!`,
        });
        this.playAlertSound();
      }
    });
  }

  public playAlertSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // ignore audio restriction
    }
  }
}

// Export default singleton instance
export const realtimeTracker = new RealtimeTrackerService();

// Re-export providers and factory for easy access
export {
  FinnhubMarketDataProvider,
  SimulatedMarketDataProvider,
  MarketDataProviderFactory,
};
export type { MarketDataProvider, MarketDataProviderConfig };
