import React from 'react';
import { Account, Position, Order, Execution, Asset, Quote } from '../types/trading';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Layers, Clock, History, Star, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { NewsTicker } from './NewsTicker';

interface DashboardViewProps {
  account: Account;
  positions: Position[];
  orders: Order[];
  executions: Execution[];
  assets: Asset[];
  quotes: Record<string, Quote>;
  onNavigateToTrade: (symbol: string) => void;
  onNavigate: (tab: any) => void;
  selectedSymbol?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  account,
  positions,
  orders,
  executions,
  assets,
  quotes,
  onNavigateToTrade,
  onNavigate,
  selectedSymbol,
}) => {
  const pendingOrders = orders.filter((o) => o.status === 'OPEN');
  const recentTrades = executions.slice(0, 5);

  const formatCurrency = (val: number) => {
    const parts = Math.abs(val).toFixed(2).split('.');
    const integerWithApostrophes = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${val < 0 ? '-' : ''}€${integerWithApostrophes}.${parts[1]}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Top Stat Cards (Spec Section 4) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Portfolio Value</span>
          <span className="text-lg font-bold text-[#263238] font-mono block mt-0.5">
            {formatCurrency(account.equity)}
          </span>
          <span className="text-[10px] text-[#558B2F] font-mono mt-0.5 block">Equity</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Today&apos;s P&amp;L</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${account.dailyPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {account.dailyPnL >= 0 ? '+' : ''}{formatCurrency(account.dailyPnL)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            {account.returnPercent >= 0 ? '+' : ''}{account.returnPercent.toFixed(2)}%
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Total P&amp;L</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${account.totalPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {account.totalPnL >= 0 ? '+' : ''}{formatCurrency(account.totalPnL)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">Gesamtertrag</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Cash</span>
          <span className="text-lg font-bold text-[#263238] font-mono block mt-0.5">
            {formatCurrency(account.cashBalance)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">Verfügbar</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Buying Power</span>
          <span className="text-lg font-bold text-[#263238] font-mono block mt-0.5">
            {formatCurrency(account.buyingPower)}
          </span>
          <span className="text-[10px] text-[#558B2F] font-mono mt-0.5 block">100% Deckung</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Invested (Marktwert)</span>
          <span className="text-lg font-bold text-[#263238] font-mono block mt-0.5">
            {formatCurrency(account.invested)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">{positions.length} Positionen</span>
        </div>
      </div>

      {/* 2. Live Financial News Ticker (Simulated News API) */}
      <NewsTicker
        selectedSymbol={selectedSymbol}
        onSelectAssetAndTrade={onNavigateToTrade}
      />

      {/* 3. Main Dashboard Grid: Watchlist & Market Overview (Left) + Open Positions & Recent Trades (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Watchlist & Markets (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Watchlist & Market Overview */}
          <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E0E3E7] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7CB342]" />
                <span className="font-bold text-[#263238] text-xs">Watchlist &amp; Markt-Übersicht</span>
              </div>
              <button
                onClick={() => onNavigate('markets')}
                className="text-[11px] font-bold text-[#558B2F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Alle Märkte ansehen</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono tabular-nums text-xs">
                <thead>
                  <tr className="border-b border-[#ECEFF1] bg-[#F5F7F8] text-[#78909C] text-[10px] uppercase font-bold">
                    <th className="py-2 px-3">Markt</th>
                    <th className="py-2 px-3 text-right">Letzter Kurs</th>
                    <th className="py-2 px-3 text-right">24h %</th>
                    <th className="py-2 px-3 text-right">Bid / Ask</th>
                    <th className="py-2 px-3 text-right">Spread</th>
                    <th className="py-2 px-3 text-center">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {assets.slice(0, 7).map((asset) => {
                    const q = quotes[asset.symbol] || {
                      lastPrice: 100,
                      change24h: 0,
                      bid: 99.9,
                      ask: 100.1,
                    };
                    const isUp = q.change24h >= 0;

                    return (
                      <tr key={asset.symbol} className="hover:bg-[#F5F7F8] transition-colors">
                        <td className="py-2 px-3 font-sans">
                          <div className="font-bold text-[#263238]">{asset.symbol}</div>
                          <div className="text-[10px] text-[#78909C]">{asset.name}</div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#263238]">
                          {q.lastPrice.toFixed(asset.pricePrecision)}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${isUp ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                          {isUp ? '+' : ''}{q.change24h.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-right text-[#546E7A] text-[11px]">
                          {q.bid.toFixed(asset.pricePrecision)} / {q.ask.toFixed(asset.pricePrecision)}
                        </td>
                        <td className="py-2 px-3 text-right text-[#546E7A] text-[11px]">
                          {Math.round((q.ask - q.bid) * (q.lastPrice < 10 ? 10000 : 100))} pts
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => onNavigateToTrade(asset.symbol)}
                            className="px-2.5 py-1 bg-[#7CB342] hover:bg-[#689F38] text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Open Positions & Active Orders (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Open Positions Card */}
          <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E0E3E7] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7CB342]" />
                <span className="font-bold text-[#263238] text-xs">Offene Positionen ({positions.length})</span>
              </div>
              <button
                onClick={() => onNavigate('positions')}
                className="text-[11px] font-bold text-[#558B2F] hover:underline cursor-pointer"
              >
                Alle ansehen
              </button>
            </div>

            <div className="p-2 space-y-1.5">
              {positions.length === 0 ? (
                <div className="py-6 text-center text-[#78909C] text-xs">
                  <p>Keine offenen Positionen im Depot.</p>
                  <button
                    onClick={() => onNavigate('trade')}
                    className="mt-2 px-3 py-1 bg-[#7CB342] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    Jetzt Trade eröffnen
                  </button>
                </div>
              ) : (
                positions.map((pos) => {
                  const isPos = pos.unrealizedPnL >= 0;
                  return (
                    <div
                      key={pos.id}
                      className="p-2 rounded border border-[#E0E3E7] hover:bg-[#F5F7F8] flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-[#263238] font-sans flex items-center gap-1.5">
                          <span>{pos.symbol}</span>
                          <span className="text-[10px] text-[#7CB342] font-mono">({pos.quantity} units)</span>
                        </div>
                        <div className="text-[10px] text-[#78909C]">
                          Entry: €{pos.averageEntryPrice.toFixed(2)} · Jetzt: €{pos.currentPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold ${isPos ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                          {isPos ? '+' : ''}€{pos.unrealizedPnL.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isPos ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                          {isPos ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Orders & Recent Trades */}
          <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E0E3E7] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#7CB342]" />
                <span className="font-bold text-[#263238] text-xs">Letzte Trades &amp; Orders</span>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-[11px] font-bold text-[#558B2F] hover:underline cursor-pointer"
              >
                Historie
              </button>
            </div>

            <div className="p-2 space-y-1.5 text-xs font-mono">
              {recentTrades.length === 0 ? (
                <p className="py-4 text-center text-[#78909C]">Noch keine ausgeführten Trades.</p>
              ) : (
                recentTrades.map((exec) => (
                  <div key={exec.id} className="p-2 rounded border border-[#E0E3E7] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#263238] font-sans flex items-center gap-1">
                        <span className={exec.side === 'BUY' ? 'text-[#558B2F]' : 'text-[#E53935]'}>
                          {exec.side}
                        </span>
                        <span>{exec.quantity} {exec.symbol}</span>
                      </div>
                      <div className="text-[10px] text-[#78909C]">
                        {new Date(exec.executedAt).toLocaleTimeString()} @ €{exec.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      {exec.realizedPnL !== undefined ? (
                        <span className={`font-bold ${exec.realizedPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                          {exec.realizedPnL >= 0 ? '+' : ''}€{exec.realizedPnL.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[#78909C] text-[10px]">Position offen</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
