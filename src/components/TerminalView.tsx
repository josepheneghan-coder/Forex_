import React, { useState } from 'react';
import { Asset, Quote, Candle, Account, Position, Order, Execution, OrderSide, OrderType, TradingLimits } from '../types/trading';
import { InstrumentsSidebar } from './InstrumentsSidebar';
import { CandleChart } from './CandleChart';
import { OrderForm } from './OrderForm';
import { PositionsTable } from './PositionsTable';
import { NewsTicker } from './NewsTicker';
import { X, ChevronRight } from 'lucide-react';

interface TerminalViewProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (asset: Asset) => void;
  quotes: Record<string, Quote>;
  candles: Candle[];
  timeframe: string;
  setTimeframe: (tf: string) => void;
  account: Account;
  positions: Position[];
  orders: Order[];
  executions: Execution[];
  limits: TradingLimits;
  todayTradesCount: number;
  showSidebar: boolean;
  onExecuteOrder: (
    side: OrderSide,
    type: OrderType,
    quantity: number,
    limitPrice?: number,
    stopPrice?: number
  ) => void;
  onClosePosition: (symbol: string, quantity: number) => void;
  onCancelOrder: (orderId: string) => void;
  lastFeedback: { success: boolean; message: string } | null;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  quotes,
  candles,
  timeframe,
  setTimeframe,
  account,
  positions,
  orders,
  executions,
  limits,
  todayTradesCount,
  showSidebar,
  onExecuteOrder,
  onClosePosition,
  onCancelOrder,
  lastFeedback,
}) => {
  // Chart Instrument Tabs matching screenshot: AUDUSD, Gold, EURAUD, BRENT
  const [openTabs, setOpenTabs] = useState<string[]>(['AUDUSD', 'Gold', 'EURAUD', 'BRENT']);

  const currentQuote = quotes[selectedAsset.symbol] || {
    symbol: selectedAsset.symbol,
    timestamp: Date.now(),
    lastPrice: 1.6100,
    bid: 1.6098,
    ask: 1.6102,
    volume: 12000,
    dayOpen: 1.6080,
    dayHigh: 1.6180,
    dayLow: 1.6040,
    previousClose: 1.6103,
    change24h: -0.02,
  };

  const handleCloseTab = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openTabs.length <= 1) return;
    const remaining = openTabs.filter((t) => t !== sym);
    setOpenTabs(remaining);
    if (selectedAsset.symbol === sym) {
      const nextAsset = assets.find((a) => a.symbol === remaining[0]);
      if (nextAsset) onSelectAsset(nextAsset);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#F0F2F5] select-none p-1.5 sm:p-2 gap-1.5 overflow-hidden">
      {/* 3-Column Grid Matching Reference Photo:
          Column 1: Instruments Market Watch (left)
          Column 2: Center (Chart Tabs + White Chart + Summary Table)
          Column 3: Deal Ticket & Liquidity Pool (right)
      */}
      <div className="flex-1 flex flex-col lg:flex-row gap-1.5 min-h-[700px]">
        {/* COLUMN 1: LEFT INSTRUMENTS SIDEBAR */}
        {showSidebar && (
          <div className="w-full lg:w-64 shrink-0 flex flex-col">
            <InstrumentsSidebar
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={(a) => {
                onSelectAsset(a);
                if (!openTabs.includes(a.symbol)) {
                  setOpenTabs((prev) => [...prev, a.symbol]);
                }
              }}
              quotes={quotes}
            />
          </div>
        )}

        {/* COLUMN 2: CENTER (CHART + SUMMARY POSITIONS TABLE) */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Top Chart Symbol Tabs: AUDUSD, Gold, EURAUD, BRENT */}
          <div className="flex items-center justify-between bg-[#FAFAFA] border border-[#D8DCE1] border-b-0 px-1 pt-1">
            <div className="flex items-center overflow-x-auto scrollbar-none gap-0.5">
              {openTabs.map((sym) => {
                const isActive = selectedAsset.symbol === sym;
                return (
                  <div
                    key={sym}
                    onClick={() => {
                      const found = assets.find((a) => a.symbol === sym);
                      if (found) onSelectAsset(found);
                    }}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer border-t border-x rounded-t relative ${
                      isActive
                        ? 'bg-[#FFFFFF] text-[#263238] border-[#D8DCE1]'
                        : 'bg-[#ECEFF1]/60 text-[#78909C] border-transparent hover:bg-[#ECEFF1] hover:text-[#37474F]'
                    }`}
                  >
                    <span>{sym}</span>
                    {openTabs.length > 1 && sym === 'EURAUD' && (
                      <X
                        onClick={(e) => handleCloseTab(sym, e)}
                        className="w-3 h-3 text-[#90A4AE] hover:text-[#E53935]"
                      />
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
                    )}
                  </div>
                );
              })}
            </div>

            <button className="p-1 text-[#90A4AE] hover:text-[#263238] cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Asset News Marquee Tape for Selected Instrument */}
          <div className="shrink-0">
            <NewsTicker
              selectedSymbol={selectedAsset.symbol}
              defaultFormat="scrolling"
              compact
            />
          </div>

          {/* Candle Chart */}
          <div className="flex-1 min-h-[350px]">
            <CandleChart
              candles={candles}
              currentPrice={currentQuote.lastPrice}
              symbol={selectedAsset.symbol}
              decimals={selectedAsset.pricePrecision}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
            />
          </div>

          {/* Summary / Positions Table */}
          <div className="shrink-0">
            <PositionsTable
              positions={positions}
              orders={orders}
              executions={executions}
              onClosePosition={onClosePosition}
              onCancelOrder={onCancelOrder}
            />
          </div>
        </div>

        {/* COLUMN 3: RIGHT ORDER TICKET & LIQUIDITY POOL */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col">
          <OrderForm
            asset={selectedAsset}
            quote={currentQuote}
            account={account}
            positions={positions}
            limits={limits}
            todayTradesCount={todayTradesCount}
            onExecuteOrder={onExecuteOrder}
            lastFeedback={lastFeedback}
          />
        </div>
      </div>
    </div>
  );
};
