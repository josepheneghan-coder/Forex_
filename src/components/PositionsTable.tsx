import React, { useState } from 'react';
import { Position, Order, Execution } from '../types/trading';
import { ChevronDown, X } from 'lucide-react';

interface PositionsTableProps {
  positions: Position[];
  orders: Order[];
  executions: Execution[];
  onClosePosition: (symbol: string, quantity: number) => void;
  onCancelOrder: (orderId: string) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  orders,
  executions,
  onClosePosition,
  onCancelOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'open' | 'pending' | 'history' | 'trades'>('summary');

  // Sample static rows to populate the table with the exact look from the screenshot if user has no active trades yet
  const displayPositions = positions.length > 0 ? positions : [
    {
      id: 'demo_1',
      accountId: 'acc_1',
      symbol: '#LKOH',
      quantity: 1,
      averageEntryPrice: 3013.00,
      currentPrice: 3013.18,
      marketValue: 3013.18,
      unrealizedPnL: 0.18,
      unrealizedPnLPercent: 0.006,
      realizedPnL: 0,
      openedAt: Date.now() - 3600000,
      updatedAt: Date.now(),
      demoSide: 'Sold',
      demoExposure: '0 / 1 (0/1)',
    },
    {
      id: 'demo_2',
      accountId: 'acc_1',
      symbol: 'USX',
      quantity: 1,
      averageEntryPrice: 98.7550,
      currentPrice: 97.8350,
      marketValue: 97.8350,
      unrealizedPnL: -0.92,
      unrealizedPnLPercent: -0.93,
      realizedPnL: 0,
      openedAt: Date.now() - 7200000,
      updatedAt: Date.now(),
      demoSide: 'Bought',
      demoExposure: '2 / 1 (2/1)',
      showCloseBtn: true,
    },
    {
      id: 'demo_3',
      accountId: 'acc_1',
      symbol: 'GBPUSD',
      quantity: 12000,
      averageEntryPrice: 1.27442,
      currentPrice: 1.27800,
      marketValue: 15336,
      unrealizedPnL: 424.31,
      unrealizedPnLPercent: 0.28,
      realizedPnL: 0,
      openedAt: Date.now() - 10800000,
      updatedAt: Date.now(),
      demoSide: 'Sold',
      demoExposure: '4000 / 16000 (4/7)',
    },
    {
      id: 'demo_4',
      accountId: 'acc_1',
      symbol: 'EURUSD',
      quantity: 13200,
      averageEntryPrice: 1.11586,
      currentPrice: 1.12760,
      marketValue: 14884,
      unrealizedPnL: 1558.20,
      unrealizedPnLPercent: 1.05,
      realizedPnL: 0,
      openedAt: Date.now() - 14400000,
      updatedAt: Date.now(),
      demoSide: 'Sold',
      demoExposure: '303000 / 435000',
    },
    {
      id: 'demo_5',
      accountId: 'acc_1',
      symbol: 'AUDUSD',
      quantity: 10000,
      averageEntryPrice: 0.76268,
      currentPrice: 0.77600,
      marketValue: 7760,
      unrealizedPnL: 1334.90,
      unrealizedPnLPercent: 1.74,
      realizedPnL: 0,
      openedAt: Date.now() - 18000000,
      updatedAt: Date.now(),
      demoSide: 'Bought',
      demoExposure: '(15/12)',
    },
    {
      id: 'demo_6',
      accountId: 'acc_1',
      symbol: 'EURJPY',
      quantity: 20500,
      averageEntryPrice: 117.630,
      currentPrice: 117.340,
      marketValue: 24054,
      unrealizedPnL: -578.80,
      unrealizedPnLPercent: -0.24,
      realizedPnL: 0,
      openedAt: Date.now() - 21600000,
      updatedAt: Date.now(),
      demoSide: 'Bought',
      demoExposure: '208000 / 3000 (4/3)',
    },
    {
      id: 'demo_7',
      accountId: 'acc_1',
      symbol: 'Copper',
      quantity: 10000,
      averageEntryPrice: 2.13235,
      currentPrice: 2.58235,
      marketValue: 25823,
      unrealizedPnL: 4500.20,
      unrealizedPnLPercent: 21.1,
      realizedPnL: 0,
      openedAt: Date.now() - 25200000,
      updatedAt: Date.now(),
      demoSide: 'Bought',
      demoExposure: '244000 / 220988 (10/8)',
    },
  ];

  const pendingOrders = orders.filter((o) => o.status === 'OPEN');

  const formatProfit = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const parts = absVal.toFixed(2).split('.');
    const integerWithApostrophes = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${isNegative ? '-' : ''}${integerWithApostrophes}.${parts[1]}`;
  };

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#D8DCE1] select-none text-xs">
      {/* Sub-Tabs: Summary / Open orders / Pending orders / History / Trades */}
      <div className="flex items-center justify-between border-b border-[#E0E3E7] bg-[#FAFAFA] px-2">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
              activeTab === 'summary'
                ? 'text-[#263238] bg-white'
                : 'text-[#78909C] hover:text-[#37474F]'
            }`}
          >
            Summary
            {activeTab === 'summary' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
              activeTab === 'open'
                ? 'text-[#263238] bg-white'
                : 'text-[#78909C] hover:text-[#37474F]'
            }`}
          >
            Open orders
            {activeTab === 'open' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
              activeTab === 'pending'
                ? 'text-[#263238] bg-white'
                : 'text-[#78909C] hover:text-[#37474F]'
            }`}
          >
            Pending orders
            {activeTab === 'pending' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
              activeTab === 'history'
                ? 'text-[#263238] bg-white'
                : 'text-[#78909C] hover:text-[#37474F]'
            }`}
          >
            History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
              activeTab === 'trades'
                ? 'text-[#263238] bg-white'
                : 'text-[#78909C] hover:text-[#37474F]'
            }`}
          >
            Trades
            {activeTab === 'trades' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
            )}
          </button>
        </div>

        <button className="p-1 text-[#78909C] hover:text-[#263238] cursor-pointer">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Content: Summary (Matching Screenshot Table) */}
      {activeTab === 'summary' && (
        <div className="overflow-x-auto min-h-[170px] max-h-[220px]">
          <table className="w-full text-left font-mono tabular-nums text-[11px]">
            <thead>
              <tr className="border-b border-[#ECEFF1] bg-[#FAFAFA] text-[#78909C] text-[10px] uppercase font-bold">
                <th className="py-2 px-3 font-sans">INSTRUMENT</th>
                <th className="py-2 px-3 font-sans">SIDE</th>
                <th className="py-2 px-3 font-sans">EXPOSURE</th>
                <th className="py-2 px-3 font-sans">AMOUNT</th>
                <th className="py-2 px-3 font-sans">PRICE</th>
                <th className="py-2 px-3 font-sans">PROFIT</th>
                <th className="py-2 px-3 text-center font-sans"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] text-[#263238]">
              {displayPositions.map((pos, idx) => {
                const isBought = (pos as any).demoSide === 'Bought' || pos.quantity > 0;
                const isPositive = pos.unrealizedPnL >= 0;
                const showClose = (pos as any).showCloseBtn || positions.length > 0;

                return (
                  <tr key={pos.id || idx} className="hover:bg-[#F5F7F8] transition-colors">
                    <td className="py-1.5 px-3 font-bold font-sans text-[#263238]">
                      {pos.symbol}
                    </td>

                    <td className="py-1.5 px-3 font-sans font-semibold">
                      <span className={isBought ? 'text-[#7CB342]' : 'text-[#E53935]'}>
                        {isBought ? 'Bought' : 'Sold'}
                      </span>
                    </td>

                    <td className="py-1.5 px-3 text-[#546E7A]">
                      {(pos as any).demoExposure || '1 / 1'}
                    </td>

                    <td className="py-1.5 px-3 text-[#263238]">
                      {pos.quantity}
                    </td>

                    <td className="py-1.5 px-3 text-[#263238]">
                      {pos.averageEntryPrice.toFixed(pos.averageEntryPrice < 10 ? 5 : 2)}
                    </td>

                    <td className="py-1.5 px-3 font-bold">
                      <span className={isPositive ? 'text-[#7CB342]' : 'text-[#E53935]'}>
                        USD {formatProfit(pos.unrealizedPnL)}
                      </span>
                    </td>

                    <td className="py-1.5 px-3 text-center">
                      {showClose ? (
                        <button
                          onClick={() => onClosePosition(pos.symbol, pos.quantity)}
                          className="px-2.5 py-0.5 border border-[#7CB342] text-[#558B2F] hover:bg-[#F1F8E9] rounded text-[10px] font-bold tracking-tight transition-colors cursor-pointer uppercase"
                        >
                          CLOSE
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Open Orders / Pending */}
      {(activeTab === 'open' || activeTab === 'pending') && (
        <div className="overflow-x-auto min-h-[170px] p-4 text-center text-[#78909C]">
          {pendingOrders.length === 0 ? (
            <p className="mt-8 text-xs">Keine wartenden Orders im Auftragsbuch.</p>
          ) : (
            <table className="w-full text-left font-mono tabular-nums text-[11px]">
              <thead>
                <tr className="border-b border-[#ECEFF1] bg-[#FAFAFA] text-[#78909C] text-[10px] uppercase font-bold">
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Typ</th>
                  <th className="py-2 px-3">Seite</th>
                  <th className="py-2 px-3">Menge</th>
                  <th className="py-2 px-3">Preis</th>
                  <th className="py-2 px-3 text-center">Stornieren</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {pendingOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F5F7F8]">
                    <td className="py-2 px-3 font-bold">{ord.symbol}</td>
                    <td className="py-2 px-3">{ord.orderType}</td>
                    <td className={`py-2 px-3 font-bold ${ord.side === 'BUY' ? 'text-[#7CB342]' : 'text-[#E53935]'}`}>{ord.side}</td>
                    <td className="py-2 px-3">{ord.quantity}</td>
                    <td className="py-2 px-3">{ord.limitPrice}</td>
                    <td className="py-2 px-3 text-center">
                      <button onClick={() => onCancelOrder(ord.id)} className="text-[#E53935] hover:underline cursor-pointer">
                        Abbrechen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: History / Trades */}
      {(activeTab === 'history' || activeTab === 'trades') && (
        <div className="overflow-x-auto min-h-[170px] max-h-[220px]">
          {executions.length === 0 ? (
            <p className="mt-8 text-center text-xs text-[#78909C]">Bisher keine ausgeführten Trades.</p>
          ) : (
            <table className="w-full text-left font-mono tabular-nums text-[11px]">
              <thead>
                <tr className="border-b border-[#ECEFF1] bg-[#FAFAFA] text-[#78909C] text-[10px] uppercase font-bold">
                  <th className="py-2 px-3">Zeit</th>
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Seite</th>
                  <th className="py-2 px-3">Menge</th>
                  <th className="py-2 px-3">Preis</th>
                  <th className="py-2 px-3">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {executions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-[#F5F7F8]">
                    <td className="py-1.5 px-3 text-[#90A4AE]">{new Date(exec.executedAt).toLocaleTimeString()}</td>
                    <td className="py-1.5 px-3 font-bold">{exec.symbol}</td>
                    <td className={`py-1.5 px-3 font-bold ${exec.side === 'BUY' ? 'text-[#7CB342]' : 'text-[#E53935]'}`}>{exec.side}</td>
                    <td className="py-1.5 px-3">{exec.quantity}</td>
                    <td className="py-1.5 px-3">{exec.price.toFixed(4)}</td>
                    <td className="py-1.5 px-3 font-bold">{exec.realizedPnL !== undefined ? `USD ${exec.realizedPnL.toFixed(2)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
