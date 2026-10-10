import React, { useState, useEffect } from 'react';
import { Asset, Candle, OrderSide, Position, Order, Execution } from '../types/trading';
import { ASSET_CATALOG, generateCandles } from '../data/marketData';
import { CandleChart } from './CandleChart';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { PaperTradeEngine } from '../services/executionEngine';

export const HistoricalReplayView: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSET_CATALOG[0]);
  const [timeframe, setTimeframe] = useState<string>('5m');
  const [replayInitialCapital, setReplayInitialCapital] = useState<number>(25000);
  const [replayCash, setReplayCash] = useState<number>(25000);

  // Replay State
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  // Replay Trading State
  const [replayPositions, setReplayPositions] = useState<Position[]>([]);
  const [orderQty, setOrderQty] = useState<string>('1000');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const candles = generateCandles(selectedAsset.symbol.includes('AUD') ? 1.6100 : 80.0, 160, 5);
    setAllCandles(candles);
    setCurrentIndex(35);
    setIsPlaying(false);
    setReplayPositions([]);
    setReplayCash(replayInitialCapital);
  }, [selectedAsset.symbol, replayInitialCapital]);

  useEffect(() => {
    if (!isPlaying) return;
    const baseDelay = 1200 / speedMultiplier;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= allCandles.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, baseDelay);
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, allCandles.length]);

  const visibleCandles = allCandles.slice(0, currentIndex + 1);
  const currentCandle = visibleCandles[visibleCandles.length - 1] || { close: 1.6100, time: Date.now() };
  const currentPrice = currentCandle.close;

  const simulationTime = new Date(currentCandle.time).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const invested = replayPositions.reduce((acc, p) => acc + (p.quantity * currentPrice), 0);
  const equity = replayCash + invested;
  const replayPnL = equity - replayInitialCapital;
  const returnPct = ((equity - replayInitialCapital) / replayInitialCapital) * 100;

  const handleReplayTrade = (side: OrderSide) => {
    const qty = parseFloat(orderQty) || 0;
    if (qty <= 0) return;

    const fillPrice = side === 'BUY' ? (currentPrice * 1.0003) : (currentPrice * 0.9997);
    const tradeValue = qty * fillPrice;
    const fee = tradeValue * PaperTradeEngine.DEFAULT_FEE_RATE;

    if (side === 'BUY') {
      if (tradeValue + fee > replayCash) {
        setFeedback(`Unzureichendes Replay-Cash! Benötigt: USD ${(tradeValue + fee).toFixed(2)}`);
        return;
      }
      setReplayCash((prev) => prev - (tradeValue + fee));

      const existingPos = replayPositions.find((p) => p.symbol === selectedAsset.symbol);
      if (existingPos) {
        const newTotal = existingPos.quantity + qty;
        const newAvg = ((existingPos.quantity * existingPos.averageEntryPrice) + tradeValue) / newTotal;
        setReplayPositions([{
          ...existingPos,
          quantity: newTotal,
          averageEntryPrice: newAvg,
          currentPrice,
          marketValue: newTotal * currentPrice,
          unrealizedPnL: (currentPrice - newAvg) * newTotal,
          unrealizedPnLPercent: ((currentPrice - newAvg) / newAvg) * 100,
          updatedAt: currentCandle.time,
        }]);
      } else {
        setReplayPositions([{
          id: 'rpos_' + Math.random().toString(36).substring(2, 7),
          accountId: 'replay_acc',
          symbol: selectedAsset.symbol,
          quantity: qty,
          averageEntryPrice: fillPrice,
          currentPrice,
          marketValue: qty * currentPrice,
          unrealizedPnL: (currentPrice - fillPrice) * qty,
          unrealizedPnLPercent: 0,
          realizedPnL: 0,
          openedAt: currentCandle.time,
          updatedAt: currentCandle.time,
        }]);
      }
      setFeedback(`Kauf ausgeführt: ${qty} ${selectedAsset.symbol} @ ${fillPrice.toFixed(4)}.`);
    } else {
      const existingPos = replayPositions.find((p) => p.symbol === selectedAsset.symbol);
      if (!existingPos || existingPos.quantity < qty) {
        setFeedback(`Kein ausreichender Bestand vorhanden.`);
        return;
      }

      const pnl = (fillPrice - existingPos.averageEntryPrice) * qty - fee;
      setReplayCash((prev) => prev + tradeValue - fee);

      if (existingPos.quantity <= qty + 0.000001) {
        setReplayPositions([]);
      } else {
        const remaining = existingPos.quantity - qty;
        setReplayPositions([{
          ...existingPos,
          quantity: remaining,
          marketValue: remaining * currentPrice,
          unrealizedPnL: (currentPrice - existingPos.averageEntryPrice) * remaining,
          unrealizedPnLPercent: ((currentPrice - existingPos.averageEntryPrice) / existingPos.averageEntryPrice) * 100,
          realizedPnL: existingPos.realizedPnL + pnl,
          updatedAt: currentCandle.time,
        }]);
      }
      setFeedback(`Verkauf ausgeführt @ ${fillPrice.toFixed(4)} | P&L: USD ${pnl.toFixed(2)}`);
    }

    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-3 select-none">
      {/* Title & Virtual Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#D8DCE1] rounded shadow-xs">
        <div>
          <h1 className="text-base font-bold text-[#263238]">Historical Replay / Training Engine</h1>
          <p className="text-xs text-[#78909C]">Handel auf Basis historischer Marktdaten ohne Zukunftsblick.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#EAEDF0] px-3 py-1.5 rounded font-mono text-xs">
          <span className="text-[#546E7A]">Clock:</span>
          <span className="font-bold text-[#558B2F]">{simulationTime}</span>
        </div>
      </div>

      {/* Replay Controls Toolbar */}
      <div className="p-3 bg-white border border-[#D8DCE1] rounded flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#546E7A] font-medium">Asset:</span>
          <select
            value={selectedAsset.symbol}
            onChange={(e) => {
              const a = ASSET_CATALOG.find((x) => x.symbol === e.target.value);
              if (a) setSelectedAsset(a);
            }}
            className="bg-white border border-[#CFD8DC] text-[#263238] rounded px-2 py-1 font-bold"
          >
            {ASSET_CATALOG.map((a) => (
              <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-white cursor-pointer ${
              isPlaying ? 'bg-[#FFA000]' : 'bg-[#7CB342] hover:bg-[#689F38]'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentIndex((prev) => Math.min(allCandles.length - 1, prev + 1));
            }}
            className="flex items-center gap-1 px-3 py-1.5 border border-[#CFD8DC] rounded hover:bg-[#ECEFF1] text-[#37474F] cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Next Candle</span>
          </button>

          <button
            onClick={() => {
              setCurrentIndex(35);
              setIsPlaying(false);
              setReplayPositions([]);
              setReplayCash(replayInitialCapital);
            }}
            className="flex items-center gap-1 px-3 py-1.5 border border-[#CFD8DC] rounded hover:bg-[#ECEFF1] text-[#78909C] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 bg-[#ECEFF1] p-0.5 rounded font-mono">
          {[0.5, 1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                speedMultiplier === s ? 'bg-[#7CB342] text-white font-bold' : 'text-[#546E7A]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        <div className="lg:col-span-3 h-[420px]">
          <CandleChart
            candles={visibleCandles}
            currentPrice={currentPrice}
            symbol={selectedAsset.symbol}
            decimals={selectedAsset.pricePrecision}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
          />
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-4 text-xs space-y-4">
          <h2 className="font-bold text-[#263238] border-b border-[#E0E3E7] pb-2">Replay Deal Ticket</h2>

          <div className="p-2.5 bg-[#EAEDF0] rounded font-mono space-y-1 text-[11px]">
            <div className="flex justify-between text-[#546E7A]">
              <span>Replay Cash:</span>
              <span className="font-bold text-[#263238]">USD {replayCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#546E7A]">
              <span>Equity:</span>
              <span className="font-bold text-[#558B2F]">USD {equity.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#546E7A]">
              <span>P&L:</span>
              <span className={`font-bold ${replayPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                USD {replayPnL.toFixed(2)} ({returnPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[#546E7A] mb-1 font-medium">Menge:</label>
            <input
              type="number"
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
              className="w-full border border-[#CFD8DC] rounded p-1.5 font-mono text-[#263238]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleReplayTrade('BUY')}
              className="py-2 bg-[#7CB342] hover:bg-[#689F38] text-white font-bold rounded cursor-pointer"
            >
              BUY
            </button>
            <button
              onClick={() => handleReplayTrade('SELL')}
              className="py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold rounded cursor-pointer"
            >
              SELL
            </button>
          </div>

          {feedback && (
            <div className="p-2 rounded bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[11px]">
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
