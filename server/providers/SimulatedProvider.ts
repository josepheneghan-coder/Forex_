import { EventEmitter } from 'events';
import { MarketDataProvider } from './MarketDataProvider';
import { MarketDataMode, ProviderStatus, RawTrade, StandardMarketQuote } from '../types';

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

export class SimulatedMarketDataProvider extends EventEmitter implements MarketDataProvider {
  public readonly name = 'INTERNAL SIMULATOR';
  private status: ProviderStatus = 'DISCONNECTED';
  private subscribedSymbols = new Set<string>();
  private tickInterval: NodeJS.Timeout | null = null;

  // Baseline prices for simulated assets
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

  constructor() {
    super();
    Object.entries(this.basePrices).forEach(([sym, price]) => {
      this.currentPrices.set(sym, price);
    });
  }

  public getStatus(): ProviderStatus {
    return this.status;
  }

  public getMode(): MarketDataMode {
    return 'SIMULATED';
  }

  public getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  public getLastError(): string | null {
    return null;
  }

  public async connect(): Promise<void> {
    if (this.status === 'CONNECTED') return;

    this.status = 'CONNECTED';
    this.emit('connected');

    if (!this.tickInterval) {
      this.tickInterval = setInterval(() => {
        this.generateTicks();
      }, 100); // 10 ticks per second across subscribed symbols
    }
  }

  public async disconnect(): Promise<void> {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.status = 'DISCONNECTED';
    this.emit('disconnected');
  }

  public subscribe(symbols: string[]): void {
    symbols.forEach((sym) => {
      this.subscribedSymbols.add(sym);
      if (!this.currentPrices.has(sym)) {
        this.currentPrices.set(sym, this.basePrices[sym] || 100.0);
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
    // Select 1 to 2 random symbols per tick pulse
    const count = Math.min(symbols.length, Math.floor(Math.random() * 2) + 1);

    for (let i = 0; i < count; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const prevPrice = this.currentPrices.get(sym) || 100.0;

      // Volatility based on asset type
      const isForex = isForexSymbol(sym);
      const isJPY = sym.toUpperCase().includes('JPY');
      const isCrypto = sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL');
      const vol = isCrypto ? 0.0003 : isForex ? 0.00008 : 0.0002;

      const delta = (Math.random() - 0.499) * 2 * vol * prevPrice;
      const decimals = isForex ? (isJPY ? 2 : 4) : 2;
      const newPrice = Number(Math.max(0.0001, prevPrice + delta).toFixed(decimals));

      this.currentPrices.set(sym, newPrice);

      const rawTrade: RawTrade = {
        symbol: sym,
        price: newPrice,
        volume: Number((Math.random() * 2 + 0.1).toFixed(2)),
        timestamp: Date.now(),
        source: 'INTERNAL SIMULATOR',
      };

      this.emit('trade', rawTrade);

      // Standard market.quote event
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
      const spread = Number(baseSpread.toFixed(decimals));
      const halfSpread = spread / 2;
      const quote: StandardMarketQuote = {
        symbol: sym,
        timestamp: new Date().toISOString(),
        last_price: newPrice.toFixed(decimals),
        bid: (newPrice - halfSpread).toFixed(decimals),
        ask: (newPrice + halfSpread).toFixed(decimals),
        spread: spread.toFixed(decimals),
        volume: Math.round(rawTrade.volume * 10),
        day_change: '+0.00',
        day_change_percent: '+0.00',
        lastPrice: newPrice,
        bidPrice: Number((newPrice - halfSpread).toFixed(decimals)),
        askPrice: Number((newPrice + halfSpread).toFixed(decimals)),
        spreadValue: spread,
        source: 'INTERNAL SIMULATOR',
      };
      this.emit('market.quote', quote);
      this.emit('quote', quote);
    }
  }
}
