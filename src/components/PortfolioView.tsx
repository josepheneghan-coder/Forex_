import React, { useState } from 'react';
import { Account, Position, Asset, Quote, Execution } from '../types/trading';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Layers,
  Percent,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface PortfolioViewProps {
  account: Account;
  positions: Position[];
  assets: Asset[];
  quotes: Record<string, Quote>;
  executions: Execution[];
  onNavigateToTrade: (symbol: string) => void;
  onClosePosition: (symbol: string, quantity: number) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  account,
  positions,
  assets,
  quotes,
  executions,
  onNavigateToTrade,
  onClosePosition,
}) => {
  const [selectedAssetClass, setSelectedAssetClass] = useState<'ALL' | 'crypto' | 'stock' | 'forex'>('ALL');

  const formatCurrency = (val: number) => {
    const parts = Math.abs(val).toFixed(2).split('.');
    const integerWithApostrophes = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${val < 0 ? '-' : ''}€${integerWithApostrophes}.${parts[1]}`;
  };

  // Group positions by asset type
  const positionDetails = positions.map((pos) => {
    const asset = assets.find((a) => a.symbol === pos.symbol);
    const quote = quotes[pos.symbol] || {
      lastPrice: pos.currentPrice,
      bid: pos.currentPrice,
      ask: pos.currentPrice,
      change24h: 0,
    };
    const assetType = asset?.assetType || 'crypto';
    const weight = account.equity > 0 ? (pos.marketValue / account.equity) * 100 : 0;
    return {
      ...pos,
      asset,
      quote,
      assetType,
      weight,
    };
  });

  const filteredPositions = positionDetails.filter((p) => {
    if (selectedAssetClass === 'ALL') return true;
    if (selectedAssetClass === 'crypto') return p.assetType === 'crypto';
    if (selectedAssetClass === 'stock') return p.assetType === 'stock' || p.assetType === 'etf';
    if (selectedAssetClass === 'forex') return p.asset?.exchange.includes('Forex') || p.symbol.length === 6;
    return true;
  });

  // Calculate allocation breakdown
  const cashWeight = account.equity > 0 ? Math.max(0, (account.cashBalance / account.equity) * 100) : 100;
  const investedWeight = account.equity > 0 ? Math.min(100, (account.invested / account.equity) * 100) : 0;

  // Realized vs unrealized stats
  const totalFeesPaid = executions.reduce((sum, e) => sum + e.fee, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#7CB342]" />
            <h1 className="text-base font-bold text-[#263238]">Portfolio &amp; Vermögensübersicht</h1>
            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-2 py-0.5 rounded">
              PaperTrade v1.0
            </span>
          </div>
          <p className="text-xs text-[#78909C] mt-0.5">
            Detaillierte Analyse aller offenen Bestände, Allokation nach Anlageklassen und Rendite-Entwicklung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[11px] text-[#78909C] block">Gesamtkapital (Equity)</span>
            <span className="text-xl font-bold font-mono text-[#558B2F]">
              {formatCurrency(account.equity)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Barguthaben (Cash)</span>
          <span className="text-lg font-bold font-mono text-[#263238] block mt-0.5">
            {formatCurrency(account.cashBalance)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            {cashWeight.toFixed(1)}% des Portfolios
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Investiert (Marktwert)</span>
          <span className="text-lg font-bold font-mono text-[#263238] block mt-0.5">
            {formatCurrency(account.invested)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            {investedWeight.toFixed(1)}% des Portfolios
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Unrealisierter P&amp;L</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${account.unrealizedPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {account.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(account.unrealizedPnL)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            Offene Positionen
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Realisierter P&amp;L</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${account.realizedPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {account.realizedPnL >= 0 ? '+' : ''}{formatCurrency(account.realizedPnL)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            Geschlossene Trades
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Gesamtrendite</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${account.returnPercent >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {account.returnPercent >= 0 ? '+' : ''}{account.returnPercent.toFixed(2)}%
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            Start: {formatCurrency(account.initialBalance)}
          </span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Bezahlte Gebühren</span>
          <span className="text-lg font-bold font-mono text-[#D32F2F] block mt-0.5">
            {formatCurrency(totalFeesPaid)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">
            {executions.length} Ausführungen
          </span>
        </div>
      </div>

      {/* 3. Portfolio Allocation Bar & Risk Bar */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#263238] flex items-center gap-1.5 uppercase tracking-wider">
            <PieChart className="w-3.5 h-3.5 text-[#7CB342]" />
            Kapitalallokation &amp; Exposure
          </h2>
          <span className="text-xs text-[#78909C] font-mono">
            Investiert: {investedWeight.toFixed(1)}% | Cash: {cashWeight.toFixed(1)}%
          </span>
        </div>

        {/* Visual Progress / Distribution Bar */}
        <div className="w-full h-4 bg-[#ECEFF1] rounded overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${cashWeight}%` }}
            className="bg-[#7CB342] h-full transition-all duration-300 relative group cursor-pointer"
            title={`Barguthaben: ${cashWeight.toFixed(1)}%`}
          />
          {positionDetails.map((pos, idx) => (
            <div
              key={pos.id}
              style={{ width: `${pos.weight}%` }}
              className={`h-full transition-all duration-300 ${
                idx % 2 === 0 ? 'bg-[#1E88E5]' : 'bg-[#FB8C00]'
              }`}
              title={`${pos.symbol}: ${pos.weight.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-[#546E7A]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7CB342]" />
            <span>Cash ({cashWeight.toFixed(1)}%)</span>
          </div>
          {positionDetails.map((pos, idx) => (
            <div key={pos.id} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${idx % 2 === 0 ? 'bg-[#1E88E5]' : 'bg-[#FB8C00]'}`} />
              <span>{pos.symbol} ({pos.weight.toFixed(1)}%)</span>
            </div>
          ))}
          {positions.length === 0 && (
            <span className="text-[11px] text-[#90A4AE]">100% Cash – Noch keine Positionen geöffnet.</span>
          )}
        </div>
      </div>

      {/* 4. Open Holdings Table */}
      <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E0E3E7] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#7CB342]" />
            <h2 className="font-bold text-[#263238] text-xs">Aktuelle Positionen ({positions.length})</h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[#F5F7F8] p-0.5 rounded border border-[#E0E3E7] text-xs font-bold">
            <button
              onClick={() => setSelectedAssetClass('ALL')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                selectedAssetClass === 'ALL' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Alle ({positions.length})
            </button>
            <button
              onClick={() => setSelectedAssetClass('crypto')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                selectedAssetClass === 'crypto' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Krypto
            </button>
            <button
              onClick={() => setSelectedAssetClass('stock')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                selectedAssetClass === 'stock' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Aktien
            </button>
            <button
              onClick={() => setSelectedAssetClass('forex')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                selectedAssetClass === 'forex' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Forex
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono tabular-nums text-xs">
            <thead>
              <tr className="border-b border-[#ECEFF1] bg-[#F5F7F8] text-[#78909C] text-[10px] uppercase font-bold">
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-3 text-right">Menge</th>
                <th className="py-2.5 px-3 text-right">Ø Einstiegspreis</th>
                <th className="py-2.5 px-3 text-right">Aktueller Kurs (Bid)</th>
                <th className="py-2.5 px-3 text-right">Marktwert</th>
                <th className="py-2.5 px-3 text-right">Gewichtung</th>
                <th className="py-2.5 px-3 text-right">Unrealisierter P&amp;L</th>
                <th className="py-2.5 px-4 text-center">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#78909C]">
                    <p className="font-sans font-medium">Keine Positionen in dieser Kategorie vorhanden.</p>
                    <button
                      onClick={() => onNavigateToTrade('BTC/USDT')}
                      className="mt-2 px-3 py-1 bg-[#7CB342] text-white rounded text-xs font-bold font-sans hover:bg-[#689F38] cursor-pointer"
                    >
                      Trade eröffnen
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos) => {
                  const isUp = pos.unrealizedPnL >= 0;
                  const prec = pos.asset?.pricePrecision ?? 2;

                  return (
                    <tr key={pos.id} className="hover:bg-[#F5F7F8] transition-colors">
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#263238] text-sm">{pos.symbol}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.2 bg-[#ECEFF1] text-[#546E7A] rounded font-bold">
                            {pos.assetType}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#78909C] mt-0.5">
                          Eröffnet vor {Math.round((Date.now() - pos.openedAt) / 60000)} Min.
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#263238]">
                        {pos.quantity}
                      </td>

                      <td className="py-3 px-3 text-right text-[#546E7A]">
                        {pos.averageEntryPrice.toFixed(prec)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#263238]">
                        {pos.currentPrice.toFixed(prec)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#263238]">
                        {formatCurrency(pos.marketValue)}
                      </td>

                      <td className="py-3 px-3 text-right text-[#546E7A]">
                        {pos.weight.toFixed(1)}%
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className={`font-bold ${isUp ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                          {isUp ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
                        </div>
                        <div className={`text-[10px] ${isUp ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                          {isUp ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onNavigateToTrade(pos.symbol)}
                            className="p-1 text-[#546E7A] hover:text-[#263238] hover:bg-[#ECEFF1] rounded cursor-pointer"
                            title="Im Terminal anzeigen"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onClosePosition(pos.symbol, pos.quantity)}
                            className="px-2 py-1 bg-[#FFEBEE] text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            title="Position zum Marktpreis schließen"
                          >
                            Schließen
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
