import React, { useState, useEffect } from 'react';
import { OrderSide, OrderType, Account, Asset, Quote, Position, TradingLimits } from '../types/trading';
import { PaperTradeEngine } from '../services/executionEngine';
import { Info, Minus, Plus, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrderFormProps {
  asset: Asset;
  quote: Quote;
  account: Account;
  positions: Position[];
  limits: TradingLimits;
  todayTradesCount: number;
  selectedPrice?: number;
  onExecuteOrder: (
    side: OrderSide,
    type: OrderType,
    quantity: number,
    limitPrice?: number,
    stopPrice?: number
  ) => void;
  lastFeedback?: { success: boolean; message: string } | null;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  asset,
  quote,
  account,
  positions,
  limits,
  todayTradesCount,
  selectedPrice,
  onExecuteOrder,
  lastFeedback,
}) => {
  const [quantity, setQuantity] = useState<number>(10000);
  const [slippage, setSlippage] = useState<string>('5.0');
  const [slEnabled, setSlEnabled] = useState<boolean>(false);
  const [tpEnabled, setTpEnabled] = useState<boolean>(false);
  const [slPips, setSlPips] = useState<string>('10');
  const [tpPips, setTpPips] = useState<string>('10');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>(quote.ask.toString());

  // Formatting Forex Pip Display: e.g. 1.6102 -> prefix: "1.61", pips: "02", sub: ""
  const formatPips = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return { prefix: '0.', pips: '00', sub: '' };
    }
    const str = price.toFixed(asset.pricePrecision);
    const parts = str.split('.');
    const intPart = parts[0] || '0';
    const decPart = parts[1] || '';

    if (asset.pricePrecision >= 4) {
      // 4 or 5 decimal places (Forex major/cross pairs, Copper, etc.)
      // E.g. 1.6102 -> prefix: "1.61", pips: "02", sub: ""
      // E.g. 1.61025 -> prefix: "1.61", pips: "02", sub: "5"
      const prefix = `${intPart}.${decPart.slice(0, 2)}`;
      const pips = decPart.slice(2, 4) || '00';
      const sub = decPart.slice(4);
      return { prefix, pips, sub };
    } else if (asset.pricePrecision === 3) {
      // 3 decimal places (e.g. USDJPY with fractional pipette: 149.254)
      const prefix = `${intPart}.${decPart.slice(0, 1)}`;
      const pips = decPart.slice(1, 3) || '00';
      const sub = decPart.slice(3);
      return { prefix, pips, sub };
    } else {
      // 2 decimal places (Stocks 228.45, USDJPY 149.20, Gold 2658.40)
      const prefix = `${intPart}.`;
      const pips = (decPart.slice(0, 2) || '00').padEnd(2, '0');
      const sub = '';
      return { prefix, pips, sub };
    }
  };

  const bidPips = formatPips(quote.bid);
  const askPips = formatPips(quote.ask);

  // Spread calculation in pips/points (e.g. 1.8 pips for Forex, $0.03 for stocks)
  const isForex = asset.pricePrecision >= 4 || asset.symbol.includes('JPY') || asset.exchange.toLowerCase().includes('forex');
  const rawSpread = Math.max(0, quote.ask - quote.bid);
  const spreadPoints = isForex
    ? Number((rawSpread * (asset.symbol.includes('JPY') ? 100 : 10000)).toFixed(1))
    : Number(rawSpread.toFixed(asset.pricePrecision));

  const quoteTimeStr = new Date(quote.timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleStepAmount = (delta: number) => {
    setQuantity((prev) => Math.max(100, prev + delta));
  };

  const handleExecute = (side: OrderSide) => {
    onExecuteOrder(
      side,
      orderType,
      quantity,
      orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined
    );
  };

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#D8DCE1] select-none text-xs">
      {/* Header: Instrument Name with Info Icon (Matching Screenshot: "High Grade Copper ⓘ") */}
      <div className="px-3 py-2 border-b border-[#E0E3E7] flex items-center justify-between bg-[#FFFFFF]">
        <div className="flex items-center gap-1.5 font-bold text-[#263238] text-[13px]">
          <span>{asset.symbol}</span>
          <Info className="w-3.5 h-3.5 text-[#90A4AE] hover:text-[#546E7A] cursor-pointer" />
        </div>
        <span className="text-[11px] text-[#78909C] font-mono">1.0M Depth</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Amount Input & Stepper Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#546E7A]">Amount</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-24 bg-[#FFFFFF] border border-[#CFD8DC] rounded px-2 py-0.5 text-right font-mono font-bold text-[#263238] focus:border-[#7CB342] focus:outline-none"
              />
              <span className="text-[11px] text-[#78909C]">units</span>
            </div>
          </div>

          {/* Stepper with minus, green slider, plus, 1K to 600K range */}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => handleStepAmount(-1000)}
              className="w-4 h-4 rounded-full border border-[#90A4AE] text-[#546E7A] flex items-center justify-center hover:bg-[#ECEFF1] cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>

            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="flex-1 accent-[#7CB342] h-1.5 bg-[#E0E3E7] rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleStepAmount(1000)}
              className="w-4 h-4 rounded-full border border-[#90A4AE] text-[#546E7A] flex items-center justify-center hover:bg-[#ECEFF1] cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-[#90A4AE] px-5 mt-0.5">
            <span>1K</span>
            <span>100K</span>
          </div>
        </div>

        {/* Slippage Input Box */}
        <div className="flex items-center justify-end gap-2 text-[11px]">
          <span className="text-[#546E7A]">Slippage</span>
          <div className="flex items-center border border-[#CFD8DC] rounded bg-white px-2 py-0.5">
            <input
              type="text"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="w-10 text-right font-mono text-[#263238] focus:outline-none"
            />
          </div>
        </div>

        {/* Large Forex Deal Ticket (Sell Red & Buy Green Buttons) */}
        <div className="grid grid-cols-11 gap-1 items-center pt-1">
          {/* SELL TICKET (Cols 1-5) */}
          <div className="col-span-5 flex flex-col items-center">
            <span className="text-[10px] text-[#78909C] mb-0.5">Bid 1.0M</span>
            
            {/* Big Digits Display */}
            <div className="flex items-baseline font-mono text-[#263238] my-0.5">
              <span className="text-xs text-[#546E7A]">{bidPips.prefix}</span>
              <span className="text-2xl font-bold tracking-tight text-[#263238]">{bidPips.pips}</span>
              {bidPips.sub && <span className="text-xs text-[#546E7A]">{bidPips.sub}</span>}
            </div>

            <span className="text-[9px] font-mono text-[#90A4AE] mb-1.5">{quoteTimeStr}</span>

            <button
              type="button"
              onClick={() => handleExecute('SELL')}
              className="w-full py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span>▼</span>
              <span>SELL</span>
            </button>
          </div>

          {/* SPREAD INDICATOR (Col 6) */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-[#546E7A] bg-[#ECEFF1] px-1 py-0.5 rounded">
              {spreadPoints}
            </span>
          </div>

          {/* BUY TICKET (Cols 7-11) */}
          <div className="col-span-5 flex flex-col items-center">
            <span className="text-[10px] text-[#78909C] mb-0.5">Ask 1.0M</span>

            {/* Big Digits Display */}
            <div className="flex items-baseline font-mono text-[#263238] my-0.5">
              <span className="text-xs text-[#546E7A]">{askPips.prefix}</span>
              <span className="text-2xl font-bold tracking-tight text-[#263238]">{askPips.pips}</span>
              {askPips.sub && <span className="text-xs text-[#546E7A]">{askPips.sub}</span>}
            </div>

            <span className="text-[9px] font-mono text-[#90A4AE] mb-1.5">{quoteTimeStr}</span>

            <button
              type="button"
              onClick={() => handleExecute('BUY')}
              className="w-full py-2 bg-[#7CB342] hover:bg-[#689F38] text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span>▲</span>
              <span>BUY</span>
            </button>
          </div>
        </div>

        {/* SL and TP Checkboxes */}
        <div className="flex items-center justify-between text-[11px] text-[#546E7A] pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={slEnabled}
              onChange={(e) => setSlEnabled(e.target.checked)}
              className="accent-[#7CB342] rounded"
            />
            <span>SL</span>
            <input
              type="text"
              value={slPips}
              onChange={(e) => setSlPips(e.target.value)}
              className="w-8 border border-[#CFD8DC] rounded px-1 py-0.2 text-center font-mono"
            />
            <span className="text-[#90A4AE]">Pips ▾</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={tpEnabled}
              onChange={(e) => setTpEnabled(e.target.checked)}
              className="accent-[#7CB342] rounded"
            />
            <span>TP</span>
            <input
              type="text"
              value={tpPips}
              onChange={(e) => setTpPips(e.target.value)}
              className="w-8 border border-[#CFD8DC] rounded px-1 py-0.2 text-center font-mono"
            />
            <span className="text-[#90A4AE]">Pips ▾</span>
          </label>
        </div>

        {/* Feedback message banner */}
        {lastFeedback && (
          <div className={`p-1.5 rounded text-[10px] font-medium flex items-center gap-1.5 ${
            lastFeedback.success
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]'
              : 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
          }`}>
            {lastFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{lastFeedback.message}</span>
          </div>
        )}

        {/* Advanced Options Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1.5 border border-[#CFD8DC] hover:border-[#B0BEC5] text-[#558B2F] font-bold text-[11px] rounded transition-colors cursor-pointer flex items-center justify-center gap-1 bg-[#FAFAFA]"
          >
            <span>ADVANCED OPTIONS</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Expandable Advanced Options (Limit / Stop order toggle) */}
        {showAdvanced && (
          <div className="p-2.5 bg-[#F5F7F8] rounded border border-[#E0E3E7] space-y-2 text-[11px]">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`flex-1 py-1 rounded font-bold cursor-pointer ${
                  orderType === 'MARKET' ? 'bg-[#7CB342] text-white' : 'bg-white text-[#546E7A] border border-[#CFD8DC]'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`flex-1 py-1 rounded font-bold cursor-pointer ${
                  orderType === 'LIMIT' ? 'bg-[#7CB342] text-white' : 'bg-white text-[#546E7A] border border-[#CFD8DC]'
                }`}
              >
                Limit
              </button>
            </div>

            {orderType === 'LIMIT' && (
              <div>
                <label className="block text-[#546E7A] mb-0.5">Limit-Preis:</label>
                <input
                  type="number"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-white border border-[#CFD8DC] rounded px-2 py-1 font-mono text-[#263238]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liquidity Pool / Depth of Market (Lower half of the right column in screenshot) */}
      <div className="border-t border-[#E0E3E7] bg-[#FFFFFF] mt-auto">
        <div className="px-3 py-1.5 bg-[#EAEDF0] border-b border-[#D8DCE1] flex items-center justify-between text-[11px] font-mono text-[#546E7A]">
          <span className="font-bold">12.8 M</span>
          <span className="text-[10px] text-[#78909C]">Liquidity pool</span>
          <span className="font-bold">11.2 M</span>
        </div>

        {/* Depth Grid Header */}
        <div className="grid grid-cols-4 px-3 py-1 text-[9px] font-mono text-[#90A4AE] border-b border-[#ECEFF1] uppercase">
          <span>AMOUNT</span>
          <span className="text-right">BID</span>
          <span className="text-right">ASK</span>
          <span className="text-right">AMOUNT</span>
        </div>

        {/* Depth Rows matching screenshot */}
        <div className="divide-y divide-[#F0F2F5] text-[10px] font-mono tabular-nums">
          <div className="grid grid-cols-4 px-3 py-1 hover:bg-[#F5F7F8]">
            <span className="text-[#E53935]">1.0 M</span>
            <span className="text-right font-bold text-[#263238]">{quote.bid.toFixed(asset.pricePrecision)}</span>
            <span className="text-right font-bold text-[#263238]">{quote.ask.toFixed(asset.pricePrecision)}</span>
            <span className="text-right text-[#7CB342]">1.05 M</span>
          </div>
          <div className="grid grid-cols-4 px-3 py-1 hover:bg-[#F5F7F8]">
            <span className="text-[#546E7A]">3.6 M</span>
            <span className="text-right font-bold text-[#263238]">{(quote.bid - 0.0005).toFixed(asset.pricePrecision)}</span>
            <span className="text-right font-bold text-[#263238]">{(quote.ask + 0.0005).toFixed(asset.pricePrecision)}</span>
            <span className="text-right text-[#546E7A]">2.95 M</span>
          </div>
          <div className="grid grid-cols-4 px-3 py-1 hover:bg-[#F5F7F8]">
            <span className="text-[#546E7A]">3.1 M</span>
            <span className="text-right font-bold text-[#263238]">{(quote.bid - 0.0010).toFixed(asset.pricePrecision)}</span>
            <span className="text-right font-bold text-[#263238]">{(quote.ask + 0.0010).toFixed(asset.pricePrecision)}</span>
            <span className="text-right text-[#546E7A]">2.05 M</span>
          </div>
          <div className="grid grid-cols-4 px-3 py-1 hover:bg-[#F5F7F8]">
            <span className="text-[#546E7A]">2.7 M</span>
            <span className="text-right font-bold text-[#263238]">{(quote.bid - 0.0015).toFixed(asset.pricePrecision)}</span>
            <span className="text-right font-bold text-[#263238]">{(quote.ask + 0.0015).toFixed(asset.pricePrecision)}</span>
            <span className="text-right text-[#546E7A]">2.65 M</span>
          </div>
          <div className="grid grid-cols-4 px-3 py-1 hover:bg-[#F5F7F8]">
            <span className="text-[#546E7A]">2.4 M</span>
            <span className="text-right font-bold text-[#263238]">{(quote.bid - 0.0020).toFixed(asset.pricePrecision)}</span>
            <span className="text-right font-bold text-[#263238]">{(quote.ask + 0.0020).toFixed(asset.pricePrecision)}</span>
            <span className="text-right text-[#546E7A]">2.5 M</span>
          </div>
        </div>
      </div>
    </div>
  );
};
