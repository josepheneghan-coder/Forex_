import React, { useState } from 'react';
import { Order, OrderStatus, Asset } from '../types/trading';
import { Clock, CheckCircle2, XCircle, AlertCircle, Search, Filter, Ban, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  assets: Asset[];
  onCancelOrder: (orderId: string) => void;
  onNavigateToTrade: (symbol: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  assets,
  onCancelOrder,
  onNavigateToTrade,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'FILLED' | 'CANCELLED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.symbol.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OPEN') return o.status === 'OPEN';
    if (statusFilter === 'FILLED') return o.status === 'FILLED';
    if (statusFilter === 'CANCELLED') return o.status === 'CANCELLED' || o.status === 'REJECTED';
    return true;
  });

  const openCount = orders.filter((o) => o.status === 'OPEN').length;
  const filledCount = orders.filter((o) => o.status === 'FILLED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#7CB342]" />
            <h1 className="text-base font-bold text-[#263238]">Order-Verwaltung &amp; Ausführungsstatus</h1>
            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-2 py-0.5 rounded">
              {openCount} Offen
            </span>
          </div>
          <p className="text-xs text-[#78909C] mt-0.5">
            Übersicht aller Markt-, Limit- und Stop-Orders. Unausgeführte Pending-Orders können jederzeit storniert werden.
          </p>
        </div>

        <button
          onClick={() => onNavigateToTrade('BTC/USDT')}
          className="px-3 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white rounded text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          + Neue Order aufgeben
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-[#D8DCE1] rounded p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center bg-[#F5F7F8] p-0.5 rounded border border-[#E0E3E7] text-xs font-bold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              statusFilter === 'ALL' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Alle ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              statusFilter === 'OPEN' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Offen ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('FILLED')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              statusFilter === 'FILLED' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Ausgeführt ({filledCount})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1 rounded cursor-pointer transition-colors ${
              statusFilter === 'CANCELLED' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Storniert ({cancelledCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#90A4AE] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Symbol oder ID suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#F5F7F8] border border-[#CFD8DC] rounded text-xs text-[#263238] focus:outline-hidden focus:border-[#7CB342] w-full sm:w-56"
          />
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono tabular-nums text-xs">
            <thead>
              <tr className="border-b border-[#ECEFF1] bg-[#F5F7F8] text-[#78909C] text-[10px] uppercase font-bold">
                <th className="py-2.5 px-4">Order ID &amp; Datum</th>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Richtung</th>
                <th className="py-2.5 px-3">Typ</th>
                <th className="py-2.5 px-3 text-right">Menge</th>
                <th className="py-2.5 px-3 text-right">Limit / Ausführungskurs</th>
                <th className="py-2.5 px-3 text-right">Gebühr</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#78909C]">
                    <p className="font-sans font-medium">Keine Orders für diesen Filter vorhanden.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isBuy = order.side === 'BUY';
                  const dateStr = new Date(order.createdAt).toLocaleString();

                  return (
                    <tr key={order.id} className="hover:bg-[#F5F7F8] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#263238] block">{order.id}</span>
                        <span className="text-[10px] text-[#78909C] block">{dateStr}</span>
                      </td>

                      <td className="py-3 px-3 font-sans font-bold text-[#263238]">
                        {order.symbol}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {order.side}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 bg-[#ECEFF1] text-[#37474F] rounded text-[10px] font-bold">
                          {order.orderType}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#263238]">
                        {order.filledQuantity > 0 && order.filledQuantity !== order.quantity ? (
                          <span>{order.filledQuantity} / {order.quantity}</span>
                        ) : (
                          <span>{order.quantity}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-[#263238] font-bold">
                        {order.averageFillPrice !== undefined ? (
                          <span>€{order.averageFillPrice.toFixed(2)}</span>
                        ) : order.limitPrice !== undefined ? (
                          <span>€{order.limitPrice.toFixed(2)} (Limit)</span>
                        ) : (
                          <span>Marktpreis</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-[#546E7A]">
                        €{order.totalFee > 0 ? order.totalFee.toFixed(2) : order.estimatedFee.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {order.status === 'OPEN' && (
                          <span className="inline-flex items-center gap-1 text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFA000] animate-pulse" />
                            OFFEN
                          </span>
                        )}
                        {order.status === 'FILLED' && (
                          <span className="inline-flex items-center gap-1 text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-[#7CB342]" />
                            AUSGEFÜHRT
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 text-[#78909C] bg-[#ECEFF1] px-2 py-0.5 rounded text-[10px] font-bold">
                            <Ban className="w-3 h-3" />
                            STORNIERT
                          </span>
                        )}
                        {order.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[#C62828] bg-[#FFEBEE] px-2 py-0.5 rounded text-[10px] font-bold" title={order.rejectionReason}>
                            <XCircle className="w-3 h-3" />
                            ABGELEHNT
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onNavigateToTrade(order.symbol)}
                            className="p-1 text-[#546E7A] hover:text-[#263238] hover:bg-[#ECEFF1] rounded cursor-pointer"
                            title="Im Terminal anzeigen"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {order.status === 'OPEN' && (
                            <button
                              onClick={() => onCancelOrder(order.id)}
                              className="px-2 py-1 bg-[#FFEBEE] text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                              title="Pending Order abbrechen"
                            >
                              Stornieren
                            </button>
                          )}
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
