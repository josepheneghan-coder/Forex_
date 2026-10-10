type PriceCallback = (symbol: string, price: number, change24h: number, high24h?: number, low24h?: number, volume24h?: number) => void;
type RawFrameCallback = (frame: string, isLive: boolean) => void;

class BinanceSocketManager {
  private socket: WebSocket | null = null;
  private subscribers: Set<PriceCallback> = new Set();
  private rawSubscribers: Set<RawFrameCallback> = new Set();
  private isConnecting = false;
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private messageCount = 0;
  private lastPingTime = 0;
  private latency = 24;

  constructor() {
    this.connect();
    this.startSimulationForNonCrypto();
  }

  public subscribe(cb: PriceCallback): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  public subscribeRawFrames(cb: RawFrameCallback): () => void {
    this.rawSubscribers.add(cb);
    return () => this.rawSubscribers.delete(cb);
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      messageCount: this.messageCount,
      latency: this.latency,
    };
  }

  public connect() {
    if (typeof window === 'undefined' || this.isConnecting || this.isConnected) return;
    this.isConnecting = true;

    try {
      // Connect to public ticker stream for BTC, ETH, SOL
      const streamUrl = 'wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker';
      const ws = new WebSocket(streamUrl);
      this.lastPingTime = Date.now();

      ws.onopen = () => {
        this.isConnecting = false;
        this.isConnected = true;
        this.latency = Math.max(12, Math.floor(Date.now() - this.lastPingTime));
        const connectMsg = JSON.stringify({ event: 'CONNECTED', stream: 'binance-public-ticker', timestamp: new Date().toISOString() });
        this.notifyRaw(connectMsg, true);
      };

      ws.onmessage = (event) => {
        try {
          this.messageCount++;
          const data = JSON.parse(event.data);
          this.notifyRaw(JSON.stringify(data, null, 2), true);

          if (data && data.s && data.c) {
            const rawSymbol = data.s.toUpperCase(); // e.g. "BTCUSDT"
            let mappedSymbol = '';
            if (rawSymbol === 'BTCUSDT') mappedSymbol = 'BTC/USDT';
            else if (rawSymbol === 'ETHUSDT') mappedSymbol = 'ETH/USDT';
            else if (rawSymbol === 'SOLUSDT') mappedSymbol = 'SOL/USDT';

            if (mappedSymbol) {
              const price = parseFloat(data.c);
              const change24h = parseFloat(data.P);
              const high24h = parseFloat(data.h);
              const low24h = parseFloat(data.l);
              const volume24h = parseFloat(data.v);

              this.subscribers.forEach((cb) => cb(mappedSymbol, price, change24h, high24h, low24h, volume24h));
            }
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

  private handleDisconnect() {
    this.isConnected = false;
    this.isConnecting = false;
    this.socket = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  private notifyRaw(frame: string, isLive: boolean) {
    this.rawSubscribers.forEach((cb) => cb(frame, isLive));
  }

  /**
   * Ensures non-crypto assets (NVDA, AAPL, TSLA, SPY, Gold) also tick smoothly,
   * and acts as fallback if public websocket is blocked in environment.
   */
  private startSimulationForNonCrypto() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      // Small random ticks
      const stocks = [
        { symbol: 'NVDA', baseVol: 0.0008 },
        { symbol: 'AAPL', baseVol: 0.0005 },
        { symbol: 'TSLA', baseVol: 0.0012 },
        { symbol: 'SPY', baseVol: 0.0003 },
        { symbol: 'XAU/USD', baseVol: 0.0004 },
      ];

      stocks.forEach((item) => {
        const deltaPct = (Math.random() - 0.495) * item.baseVol;
        // Broadcast simulated tick
        this.subscribers.forEach((cb) => cb(item.symbol, deltaPct, 0));
      });
    }, 1500);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const binanceSocket = new BinanceSocketManager();
