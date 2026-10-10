import { EventEmitter } from 'events';
import { MarketDataMode, ProviderStatus, RawTrade } from '../types';

export interface MarketDataProvider extends EventEmitter {
  readonly name: 'FINNHUB' | 'INTERNAL SIMULATOR';
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  getStatus(): ProviderStatus;
  getMode(): MarketDataMode;
  getSubscribedSymbols(): string[];
  getLastError(): string | null;
}
