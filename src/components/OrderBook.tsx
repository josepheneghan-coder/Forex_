import React, { useMemo } from 'react';
import { OrderBookEntry } from '../types/trading';

interface OrderBookProps {
  currentPrice: number;
  decimals: number;
  symbol: string;
  onSelectPrice: (price: number) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  currentPrice,
  decimals,
  symbol,
  onSelectPrice,
}) => {
  // Generate realistic L2 depth levels centered around current price
  const { asks, bids, spread, spreadPercent, maxTotal } = useMemo(() => {
    const rows = 6;
    const tick = currentPrice > 1000 ? 0.5 : currentPrice > 100 ? 0.05 : 0.01;
    const baseQty = currentPrice > 1000 ? 0.15 : currentPrice > 100 ? 5 : 20;

    const askList: OrderBookEntry[] = [];
    let cumAskTotal = 0;
    for (let i = rows; i >= 1; i--) {
      const price = currentPrice + (i * tick);
      const quantity = Number((baseQty * (1 + Math.sin(i * 1.5) * 0.4 + (i * 0.1))).toFixed(3));
      cumAskTotal += quantity;
      askList.push({
        price: Number(price.toFixed(decimals)),
        quantity,
        total: Number(cumAskTotal.toFixed(3)),
      });
    }

    const bidList: OrderBookEntry[] = [];
    let cumBidTotal = 0;
    for (let i = 1; i <= rows; i++) {
      const price = currentPrice - (i * tick);
      const quantity = Number((baseQty * (1 + Math.cos(i * 1.2) * 0.4 + (i * 0.1))).toFixed(3));
      cumBidTotal += quantity;
      bidList.push({
        price: Number(price.toFixed(decimals)),
        quantity,
        total: Number(cumBidTotal.toFixed(3)),
      });
    }

    const spreadVal = (askList[askList.length - 1]?.price || currentPrice) - (bidList[0]?.price || currentPrice);
    const spreadPct = (spreadVal / currentPrice) * 100;
    const max = Math.max(cumAskTotal, cumBidTotal);

    return {
      asks: askList,
      bids: bidList,
      spread: Math.max(0, spreadVal),
      spreadPercent: Math.max(0, spreadPct),
      maxTotal: max || 1,
    };
  }, [currentPrice, decimals]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
        <span className="font-semibold text-slate-200">Orderbuch</span>
        <span className="text-[11px] text-slate-400 font-mono">L2 Depth</span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[11px] text-slate-400 border-b border-slate-800/60 font-mono">
        <span className="text-left">Preis (USD)</span>
        <span className="text-right">Menge</span>
        <span className="text-right">Summe</span>
      </div>

      {/* Asks (Sell Orders - Red) */}
      <div className="flex flex-col divide-y divide-slate-800/30">
        {asks.map((ask, idx) => {
          const depthRatio = Math.min(1, ask.total / maxTotal);
          return (
            <button
              key={`ask-${idx}`}
              onClick={() => onSelectPrice(ask.price)}
              className="relative grid grid-cols-3 px-3 py-1 text-left font-mono tabular-nums hover:bg-rose-950/20 transition-colors cursor-pointer group"
            >
              {/* Depth fill bar */}
              <div
                className="absolute inset-y-0 right-0 bg-rose-500/10 pointer-events-none transition-all"
                style={{ width: `${depthRatio * 100}%` }}
              />
              <span className="text-rose-400 font-medium group-hover:underline">
                {ask.price.toFixed(decimals)}
              </span>
              <span className="text-right text-slate-300">
                {ask.quantity.toLocaleString()}
              </span>
              <span className="text-right text-slate-400">
                {ask.total.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spread Bar */}
      <div className="px-3 py-1.5 my-1 bg-slate-800/40 border-y border-slate-800 flex items-center justify-between font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Spread:</span>
          <span className="text-slate-200 font-semibold">${spread.toFixed(decimals)}</span>
        </div>
        <span className="text-indigo-400">({spreadPercent.toFixed(3)}%)</span>
      </div>

      {/* Bids (Buy Orders - Green) */}
      <div className="flex flex-col divide-y divide-slate-800/30">
        {bids.map((bid, idx) => {
          const depthRatio = Math.min(1, bid.total / maxTotal);
          return (
            <button
              key={`bid-${idx}`}
              onClick={() => onSelectPrice(bid.price)}
              className="relative grid grid-cols-3 px-3 py-1 text-left font-mono tabular-nums hover:bg-emerald-950/20 transition-colors cursor-pointer group"
            >
              {/* Depth fill bar */}
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none transition-all"
                style={{ width: `${depthRatio * 100}%` }}
              />
              <span className="text-emerald-400 font-medium group-hover:underline">
                {bid.price.toFixed(decimals)}
              </span>
              <span className="text-right text-slate-300">
                {bid.quantity.toLocaleString()}
              </span>
              <span className="text-right text-slate-400">
                {bid.total.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
