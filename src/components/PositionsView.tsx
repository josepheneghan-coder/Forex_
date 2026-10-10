import React, { useState } from 'react';
import { Position, Asset, Quote } from '../types/trading';
import { Layers, ArrowUpRight, ArrowDownRight, ExternalLink, ShieldAlert, TrendingUp, X } from 'lucide-react';

interface PositionsViewProps {
  positions: Position[];
  assets: Asset[];
  quotes: Record<string, Quote>;
  onClosePosition: (symbol: string, quantity: number) => void;
  onNavigateToTrade: (symbol: string) => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions,
  assets,
  quotes,
  onClosePosition,
  onNavigateToTrade,
}) => {
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    const parts = Math.abs(val).toFixed(2).split('.');
    const integerWithApostrophes = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${val < 0 ? '-' : ''}€${integerWithApostrophes}.${parts[1]}`;
  };

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const winningPositions = positions.filter((p) => p.unrealizedPnL > 0).length;
  const losingPositions = positions.filter((p) => p.unrealizedPnL < 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#7CB342]" />
            <h1 className="text-base font-bold text-[#263238]">Offene Positionen &amp; Markt-Bewertung</h1>
            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-2 py-0.5 rounded">
              {positions.length} Aktiv
            </span>
          </div>
          <p className="text-xs text-[#78909C] mt-0.5">
            Echtzeit-Bewertung auf Basis des aktuellen Geldkurses (Bid Price). Jede Position kann atomar glattgestellt werden.
          </p>
        </div>

        <button
          onClick={() => onNavigateToTrade('BTC/USDT')}
          className="px-3 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white rounded text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          + Neue Position eröffnen
        </button>
      </div>

      {/* 2. Key Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Gesamtexposure (Marktwert)</span>
          <span className="text-lg font-bold font-mono text-[#263238] block mt-0.5">
            {formatCurrency(totalMarketValue)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">{positions.length} Positionen</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Unrealisierter P&amp;L</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${totalUnrealizedPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnL)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">Summe aller offenen Buchgewinne</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Gewinn-Positionen</span>
          <span className="text-lg font-bold font-mono text-[#558B2F] block mt-0.5">
            {winningPositions}
          </span>
          <span className="text-[10px] text-[#558B2F] font-mono mt-0.5 block">
            {positions.length > 0 ? ((winningPositions / positions.length) * 100).toFixed(0) : 0}% der Positionen
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Verlust-Positionen</span>
          <span className="text-lg font-bold font-mono text-[#E53935] block mt-0.5">
            {losingPositions}
          </span>
          <span className="text-[10px] text-[#E53935] font-mono mt-0.5 block">
            {positions.length > 0 ? ((losingPositions / positions.length) * 100).toFixed(0) : 0}% im Minus
          </span>
        </div>
      </div>

      {/* 3. Positions List Table */}
      <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono tabular-nums text-xs">
            <thead>
              <tr className="border-b border-[#ECEFF1] bg-[#F5F7F8] text-[#78909C] text-[10px] uppercase font-bold">
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-3 text-right">Menge</th>
                <th className="py-2.5 px-3 text-right">Ø Einstiegspreis</th>
                <th className="py-2.5 px-3 text-right">Aktueller Kurs (Bid)</th>
                <th className="py-2.5 px-3 text-right">Marktwert</th>
                <th className="py-2.5 px-3 text-right">Unrealisierter P&amp;L</th>
                <th className="py-2.5 px-3 text-right">Rendite %</th>
                <th className="py-2.5 px-4 text-center">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#78909C]">
                    <Layers className="w-8 h-8 text-[#B0BEC5] mx-auto mb-2" />
                    <p className="font-sans font-medium text-sm text-[#37474F]">Keine offenen Positionen</p>
                    <p className="text-xs text-[#90A4AE] mt-0.5">
                      Eröffne einen neuen Trade im Terminal, um hier Live-P&amp;L und Kurse zu tracken.
                    </p>
                    <button
                      onClick={() => onNavigateToTrade('BTC/USDT')}
                      className="mt-3 px-4 py-1.5 bg-[#7CB342] text-white rounded text-xs font-bold font-sans hover:bg-[#689F38] cursor-pointer"
                    >
                      Jetzt Trade platzieren
                    </button>
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const asset = assets.find((a) => a.symbol === pos.symbol);
                  const isUp = pos.unrealizedPnL >= 0;
                  const prec = asset?.pricePrecision ?? 2;

                  return (
                    <tr key={pos.id} className="hover:bg-[#F5F7F8] transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#263238] text-sm">{pos.symbol}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#E8F5E9] text-[#2E7D32] rounded">
                            LONG
                          </span>
                        </div>
                        <div className="text-[10px] text-[#78909C] mt-0.5 font-mono">
                          ID: {pos.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-[#263238]">
                        {pos.quantity}
                      </td>

                      <td className="py-3.5 px-3 text-right text-[#546E7A]">
                        €{pos.averageEntryPrice.toFixed(prec)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-[#263238]">
                        €{pos.currentPrice.toFixed(prec)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-[#263238]">
                        {formatCurrency(pos.marketValue)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold">
                        <span className={isUp ? 'text-[#558B2F]' : 'text-[#E53935]'}>
                          {isUp ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                          isUp ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                        }`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isUp ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onNavigateToTrade(pos.symbol)}
                            className="p-1.5 text-[#546E7A] hover:text-[#263238] hover:bg-[#ECEFF1] rounded cursor-pointer"
                            title="Im Trading-Terminal öffnen"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onClosePosition(pos.symbol, pos.quantity)}
                            className="px-3 py-1 bg-[#FFEBEE] hover:bg-[#D32F2F] text-[#D32F2F] hover:text-white rounded text-xs font-bold transition-colors cursor-pointer"
                            title="Position sofort zum besten Geldkurs (Bid) schließen"
                          >
                            Glattstellen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
