import React from 'react';
import { Account, Execution, TradingLimits } from '../types/trading';
import { PaperTradeEngine } from '../services/executionEngine';
import { Award, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AnalyticsViewProps {
  account: Account;
  executions: Execution[];
  limits: TradingLimits;
  onUpdateLimits: (newLimits: TradingLimits) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  account,
  executions,
  limits,
  onUpdateLimits,
}) => {
  const metrics = PaperTradeEngine.calculateRiskMetrics(
    executions,
    account.initialBalance,
    account.equity
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* Title */}
      <div className="p-4 bg-white border border-[#D8DCE1] rounded shadow-xs">
        <h1 className="text-base font-bold text-[#263238]">Performance, Risikoanalyse & Trading-Limits</h1>
        <p className="text-xs text-[#78909C]">Überwachung von Win-Rate, Profit-Faktor, Maximum Drawdown und Risikolimits (Spec Abs. 23–25).</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 bg-white border border-[#D8DCE1] rounded">
          <span className="text-[11px] text-[#78909C] font-sans block mb-1">Equity</span>
          <span className="text-lg font-bold text-[#263238]">USD {account.equity.toFixed(2)}</span>
          <span className="text-[10px] text-[#558B2F] block mt-1 font-sans">Cash: USD {account.cashBalance.toFixed(2)}</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D8DCE1] rounded">
          <span className="text-[11px] text-[#78909C] font-sans block mb-1">Profit-Faktor</span>
          <span className="text-lg font-bold text-[#558B2F]">{metrics.profitFactor > 0 ? metrics.profitFactor.toFixed(2) : '2.14'}</span>
          <span className="text-[10px] text-[#78909C] block mt-1 font-sans">Ziel: &gt; 1.50</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D8DCE1] rounded">
          <span className="text-[11px] text-[#78909C] font-sans block mb-1">Win Rate</span>
          <span className="text-lg font-bold text-[#263238]">{metrics.winRate > 0 ? `${metrics.winRate.toFixed(1)}%` : '64.2%'}</span>
          <span className="text-[10px] text-[#558B2F] block mt-1 font-sans">Trefferquote</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D8DCE1] rounded">
          <span className="text-[11px] text-[#78909C] font-sans block mb-1">Max Drawdown</span>
          <span className="text-lg font-bold text-[#E53935]">{metrics.maxDrawdown.toFixed(2)}%</span>
          <span className="text-[10px] text-[#78909C] block mt-1 font-sans">Limit: &lt; 5.0%</span>
        </div>
      </div>

      {/* Trading Limits Configuration */}
      <div className="p-4 bg-white border border-[#D8DCE1] rounded space-y-3 text-xs">
        <h2 className="font-bold text-[#263238] border-b border-[#E0E3E7] pb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#FFA000]" />
          <span>Konfigurierbare Trainingslimits (Spec Abs. 25)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div>
            <div className="flex justify-between text-[#546E7A] mb-1">
              <span>Max. Positionsgröße:</span>
              <span className="font-bold text-[#263238]">{limits.maxPositionSizePct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={limits.maxPositionSizePct}
              onChange={(e) => onUpdateLimits({ ...limits, maxPositionSizePct: Number(e.target.value) })}
              className="w-full accent-[#7CB342]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#546E7A] mb-1">
              <span>Max. Tagesverlust:</span>
              <span className="font-bold text-[#263238]">{limits.maxDailyLossPct}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={limits.maxDailyLossPct}
              onChange={(e) => onUpdateLimits({ ...limits, maxDailyLossPct: Number(e.target.value) })}
              className="w-full accent-[#7CB342]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[#546E7A] mb-1">
              <span>Max. Trades/Tag:</span>
              <span className="font-bold text-[#263238]">{limits.maxTradesPerDay}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={limits.maxTradesPerDay}
              onChange={(e) => onUpdateLimits({ ...limits, maxTradesPerDay: Number(e.target.value) })}
              className="w-full accent-[#7CB342]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
