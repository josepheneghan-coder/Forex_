import React, { useState } from 'react';
import { Asset, Quote } from '../types/trading';
import { Search, TrendingUp, TrendingDown, ArrowRight, Star } from 'lucide-react';

interface MarketsViewProps {
  assets: Asset[];
  quotes: Record<string, Quote>;
  onSelectAssetAndTrade: (symbol: string) => void;
}

export const MarketsView: React.FC<MarketsViewProps> = ({
  assets,
  quotes,
  onSelectAssetAndTrade,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'crypto' | 'fx' | 'stock' | 'comod'>('all');
  const [search, setSearch] = useState('');

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
      asset.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'all') return true;
    if (activeCategory === 'crypto') return asset.assetType === 'crypto';
    if (activeCategory === 'fx') return asset.exchange.includes('Forex') || asset.symbol.length === 6;
    if (activeCategory === 'stock') return asset.assetType === 'stock' || asset.assetType === 'etf';
    if (activeCategory === 'comod') return asset.symbol === 'Gold' || asset.symbol.includes('Copper') || asset.symbol === 'BRENT';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* Title & Search Bar */}
      <div className="p-4 bg-white border border-[#D8DCE1] rounded shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#263238]">Finanzmärkte &amp; Kurse (Spec Abs. 7)</h1>
          <p className="text-xs text-[#78909C]">Wähle ein Asset, um den Live-Chart und das Trading-Terminal zu öffnen.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Tabs */}
          <div className="flex items-center bg-[#F5F7F8] p-1 rounded border border-[#E0E3E7] text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                activeCategory === 'all' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setActiveCategory('crypto')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                activeCategory === 'crypto' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Krypto
            </button>
            <button
              onClick={() => setActiveCategory('fx')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                activeCategory === 'fx' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Forex
            </button>
            <button
              onClick={() => setActiveCategory('stock')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                activeCategory === 'stock' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Aktien &amp; ETFs
            </button>
            <button
              onClick={() => setActiveCategory('comod')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                activeCategory === 'comod' ? 'bg-[#7CB342] text-white' : 'text-[#546E7A] hover:text-[#263238]'
              }`}
            >
              Rohstoffe
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#90A4AE] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Markt suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-[#CFD8DC] rounded pl-8 pr-3 py-1.5 text-xs text-[#263238] focus:border-[#7CB342] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Markets Table (Spec Section 7) */}
      <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono tabular-nums text-xs">
            <thead>
              <tr className="border-b border-[#ECEFF1] bg-[#FAFAFA] text-[#78909C] text-[10px] uppercase font-bold">
                <th className="py-2.5 px-4 font-sans">Symbol &amp; Name</th>
                <th className="py-2.5 px-4 text-right">Letzter Kurs</th>
                <th className="py-2.5 px-4 text-right">24h Veränderung</th>
                <th className="py-2.5 px-4 text-right">24h %</th>
                <th className="py-2.5 px-4 text-right">Volumen</th>
                <th className="py-2.5 px-4 text-right">Bid</th>
                <th className="py-2.5 px-4 text-right">Ask</th>
                <th className="py-2.5 px-4 text-right">Spread</th>
                <th className="py-2.5 px-4 text-center font-sans">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] text-[#263238]">
              {filteredAssets.map((asset) => {
                const q = quotes[asset.symbol] || {
                  lastPrice: 100,
                  change24h: 0,
                  volume: 12000,
                  bid: 99.9,
                  ask: 100.1,
                };
                const isUp = q.change24h >= 0;
                const spreadPoints = Math.round((q.ask - q.bid) * (q.lastPrice < 10 ? 10000 : 100));

                return (
                  <tr key={asset.symbol} className="hover:bg-[#F5F7F8] transition-colors">
                    <td className="py-2.5 px-4 font-sans">
                      <div className="font-bold text-[#263238] text-[13px]">{asset.symbol}</div>
                      <div className="text-[11px] text-[#78909C]">{asset.name} · {asset.exchange}</div>
                    </td>

                    <td className="py-2.5 px-4 text-right font-bold text-[#263238] text-[13px]">
                      {q.lastPrice.toFixed(asset.pricePrecision)}
                    </td>

                    <td className={`py-2.5 px-4 text-right font-bold ${isUp ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                      {isUp ? '+' : ''}{(q.lastPrice * (q.change24h / 100)).toFixed(asset.pricePrecision)}
                    </td>

                    <td className={`py-2.5 px-4 text-right font-bold ${isUp ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
                      {isUp ? '+' : ''}{q.change24h.toFixed(2)}%
                    </td>

                    <td className="py-2.5 px-4 text-right text-[#546E7A]">
                      {q.volume.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-4 text-right text-[#558B2F] font-bold">
                      {q.bid.toFixed(asset.pricePrecision)}
                    </td>

                    <td className="py-2.5 px-4 text-right text-[#E53935] font-bold">
                      {q.ask.toFixed(asset.pricePrecision)}
                    </td>

                    <td className="py-2.5 px-4 text-right text-[#546E7A]">
                      {spreadPoints} pts
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onSelectAssetAndTrade(asset.symbol)}
                        className="px-3 py-1 bg-[#7CB342] hover:bg-[#689F38] text-white rounded font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
