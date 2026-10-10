import React, { useState } from 'react';
import { Execution, Asset } from '../types/trading';
import { History, Download, Search, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Filter } from 'lucide-react';

interface HistoryViewProps {
  executions: Execution[];
  assets: Asset[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  executions,
  assets,
}) => {
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const filteredExecutions = executions.filter((e) => {
    const matchesSearch = e.symbol.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.orderId.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (sideFilter === 'ALL') return true;
    return e.side === sideFilter;
  });

  const totalVolume = executions.reduce((sum, e) => sum + e.quantity * e.price, 0);
  const totalFees = executions.reduce((sum, e) => sum + e.fee, 0);
  const closedTradesWithPnL = executions.filter((e) => e.realizedPnL !== undefined);
  const totalRealizedPnL = closedTradesWithPnL.reduce((sum, e) => sum + (e.realizedPnL || 0), 0);

  const formatCurrency = (val: number) => {
    const parts = Math.abs(val).toFixed(2).split('.');
    const integerWithApostrophes = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${val < 0 ? '-' : ''}€${integerWithApostrophes}.${parts[1]}`;
  };

  const handleExportCSV = () => {
    if (executions.length === 0) return;
    const headers = ['ID', 'OrderID', 'Symbol', 'Side', 'Quantity', 'Price', 'Fee', 'Slippage', 'RealizedPnL', 'Timestamp'];
    const rows = executions.map((e) => [
      e.id,
      e.orderId,
      e.symbol,
      e.side,
      e.quantity,
      e.price,
      e.fee,
      e.slippage,
      e.realizedPnL ?? 0,
      new Date(e.executedAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `papertrade_executions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#7CB342]" />
            <h1 className="text-base font-bold text-[#263238]">Trade-Historie &amp; Ausführungsjournal</h1>
            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-2 py-0.5 rounded">
              {executions.length} Trades
            </span>
          </div>
          <p className="text-xs text-[#78909C] mt-0.5">
            Lückenloses Audit-Protokoll sämtlicher ausgeführter Käufe und Verkäufe mit Kursen, Gebühren und Realisiertem P&amp;L.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={executions.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7F8] hover:bg-[#ECEFF1] text-[#263238] border border-[#CFD8DC] rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#546E7A]" />
          <span>CSV Exportieren</span>
        </button>
      </div>

      {/* 2. Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Ausgeführte Trades</span>
          <span className="text-lg font-bold font-mono text-[#263238] block mt-0.5">
            {executions.length}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">Gesamtanzahl Fills</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Gehandeltes Volumen</span>
          <span className="text-lg font-bold font-mono text-[#263238] block mt-0.5">
            {formatCurrency(totalVolume)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">Kumulierter Nennwert</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Realisierter Gesamt-P&amp;L</span>
          <span className={`text-lg font-bold font-mono block mt-0.5 ${totalRealizedPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnL)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">Aus Glattstellungen</span>
        </div>

        <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs">
          <span className="text-[11px] text-[#78909C] block font-medium">Gezahlte Gebühren</span>
          <span className="text-lg font-bold font-mono text-[#D32F2F] block mt-0.5">
            {formatCurrency(totalFees)}
          </span>
          <span className="text-[10px] text-[#78909C] font-mono mt-0.5 block">0.10% Taker / Spread</span>
        </div>
      </div>

      {/* 3. Filter & Search */}
      <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Side filter pills */}
        <div className="flex items-center bg-[#F5F7F8] p-0.5 rounded border border-[#E0E3E7] text-xs font-bold">
          <button
            onClick={() => setSideFilter('ALL')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              sideFilter === 'ALL' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Alle ({executions.length})
          </button>
          <button
            onClick={() => setSideFilter('BUY')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              sideFilter === 'BUY' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Käufe ({executions.filter((e) => e.side === 'BUY').length})
          </button>
          <button
            onClick={() => setSideFilter('SELL')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              sideFilter === 'SELL' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Verkäufe ({executions.filter((e) => e.side === 'SELL').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#90A4AE] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Symbol oder Ausführungs-ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#F5F7F8] border border-[#CFD8DC] rounded text-xs text-[#263238] focus:outline-hidden focus:border-[#7CB342] w-full sm:w-60"
          />
        </div>
      </div>

      {/* 4. Executions List */}
      <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono tabular-nums text-xs">
            <thead>
              <tr className="border-b border-[#ECEFF1] bg-[#F5F7F8] text-[#78909C] text-[10px] uppercase font-bold">
                <th className="py-2.5 px-4">Ausführungs-ID &amp; Zeit</th>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Richtung</th>
                <th className="py-2.5 px-3 text-right">Menge</th>
                <th className="py-2.5 px-3 text-right">Ausführungspreis</th>
                <th className="py-2.5 px-3 text-right">Volumen</th>
                <th className="py-2.5 px-3 text-right">Gebühr</th>
                <th className="py-2.5 px-3 text-right">Slippage</th>
                <th className="py-2.5 px-4 text-right">Realisierter P&amp;L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {filteredExecutions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#78909C]">
                    <History className="w-8 h-8 text-[#B0BEC5] mx-auto mb-2" />
                    <p className="font-sans font-medium text-sm text-[#37474F]">Keine ausgeführten Trades vorhanden</p>
                    <p className="text-xs text-[#90A4AE] mt-0.5">
                      Sobald du im Terminal oder Replay Orders platzierst, werden sie hier erfasst.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((exec) => {
                  const isBuy = exec.side === 'BUY';
                  const dateStr = new Date(exec.executedAt).toLocaleString();
                  const vol = exec.quantity * exec.price;

                  return (
                    <tr key={exec.id} className="hover:bg-[#F5F7F8] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#263238] block">{exec.id}</span>
                        <span className="text-[10px] text-[#78909C] block">{dateStr}</span>
                      </td>

                      <td className="py-3 px-3 font-sans font-bold text-[#263238]">
                        {exec.symbol}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {exec.side}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#263238]">
                        {exec.quantity}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#263238]">
                        €{exec.price.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-[#263238]">
                        {formatCurrency(vol)}
                      </td>

                      <td className="py-3 px-3 text-right text-[#D32F2F]">
                        €{exec.fee.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-[#546E7A]">
                        {exec.slippage > 0 ? `€${exec.slippage.toFixed(4)}` : '0.00'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {exec.realizedPnL !== undefined ? (
                          <span
                            className={`font-bold inline-block px-1.5 py-0.5 rounded ${
                              exec.realizedPnL >= 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                            }`}
                          >
                            {exec.realizedPnL >= 0 ? '+' : ''}{formatCurrency(exec.realizedPnL)}
                          </span>
                        ) : (
                          <span className="text-[#90A4AE] text-[10px]">Position eröffnet</span>
                        )}
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
