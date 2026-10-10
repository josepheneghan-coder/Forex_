import React, { useState } from 'react';
import { Asset, Quote } from '../types/trading';
import { Star, ChevronDown, ChevronRight, Search, Settings } from 'lucide-react';

interface InstrumentsSidebarProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (asset: Asset) => void;
  quotes: Record<string, Quote>;
}

export const InstrumentsSidebar: React.FC<InstrumentsSidebarProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  quotes,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [filterText, setFilterText] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['AUDJPY', 'CADJPY', 'AUDCAD']));
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    COMOD: true,
    FX: true,
    INDICES: false,
    STOCK: false,
  });

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const fxAssets = [
    { symbol: 'AUDCAD', bid: '84.955', spread: '2', ask: '0.7695', time: '16:44:06', isUp: false },
    { symbol: 'AUDCHF', bid: '1.0299', spread: '2', ask: '0.76936', time: '16:44:06', isUp: false },
    { symbol: 'AUDJPY', bid: '0.7514', spread: '2', ask: '45.480', time: '16:44:07', isUp: true },
    { symbol: 'AUDNZD', bid: '0.75199', spread: '2', ask: '0.72936', time: '16:44:07', isUp: false },
    { symbol: 'AUDUSD', bid: '80.36', spread: '2', ask: '0.7303', time: '16:44:07', isUp: true },
    { symbol: 'BRENT', bid: '80.39', spread: '3', ask: '78.00', time: '16:44:06', isUp: false },
    { symbol: 'CADCHF', bid: '1.05018', spread: '3', ask: '78.032', time: '16:44:06', isUp: false },
    { symbol: 'CADJPY', bid: '0.7692', spread: '9', ask: '106.93', time: '16:44:07', isUp: false },
    { symbol: 'CHFJPY', bid: '0.76935', spread: '5', ask: '106.908', time: '16:44:06', isUp: false },
    { symbol: 'High Grade Copper', bid: '45.450', spread: '9', ask: '2.2946', time: '16:44:01', isUp: false },
    { symbol: 'EURAUD', bid: '0.72955', spread: '8', ask: '1.4348', time: '16:44:06', isUp: false },
    { symbol: 'EURCAD', bid: '0.7298', spread: '5', ask: '1.4342', time: '16:44:07', isUp: false },
    { symbol: 'EURCHF', bid: '78.00', spread: '9', ask: '1.4774', time: '16:44:07', isUp: false },
  ];

  const filteredFx = fxAssets.filter((item) =>
    activeTab === 'favorites' ? favorites.has(item.symbol) : true
  ).filter((item) =>
    item.symbol.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="w-full lg:w-64 bg-[#FFFFFF] border border-[#D8DCE1] flex flex-col select-none text-xs h-full">
      {/* Top Tabs: "All instruments" and "My Favorites" */}
      <div className="flex border-b border-[#E0E3E7] bg-[#FAFAFA]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
            activeTab === 'all'
              ? 'text-[#263238] bg-white'
              : 'text-[#78909C] hover:text-[#37474F]'
          }`}
        >
          All instruments
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2 text-center font-bold text-[12px] transition-colors cursor-pointer relative ${
            activeTab === 'favorites'
              ? 'text-[#263238] bg-white'
              : 'text-[#78909C] hover:text-[#37474F]'
          }`}
        >
          My Favorites
          {activeTab === 'favorites' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7CB342]" />
          )}
        </button>
      </div>

      {/* Table Headers: INSTRUMENT | BID | SPREAD | ASK | TIME */}
      <div className="grid grid-cols-12 px-2 py-1.5 bg-[#ECEFF1] border-b border-[#CFD8DC] text-[9px] font-mono text-[#78909C] uppercase tracking-tight">
        <span className="col-span-4">INSTRUMENT</span>
        <span className="col-span-2 text-right">BID</span>
        <span className="col-span-1 text-center">SP</span>
        <span className="col-span-2 text-right">ASK</span>
        <span className="col-span-3 text-right">TIME</span>
      </div>

      {/* Instruments List with Collapsible Categories */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F0F2F5] text-[11px] font-mono tabular-nums">
        {/* Category: COMOD */}
        <div className="bg-[#FFFFFF]">
          <button
            onClick={() => toggleCategory('COMOD')}
            className="w-full flex items-center gap-1 px-2 py-1 text-left font-bold text-[#455A64] hover:bg-[#F5F7F8] cursor-pointer"
          >
            {expandedCategories.COMOD ? <ChevronDown className="w-3 h-3 text-[#90A4AE]" /> : <ChevronRight className="w-3 h-3 text-[#90A4AE]" />}
            <span>COMOD</span>
          </button>

          {expandedCategories.COMOD && (
            <div className="pl-4 text-[10px] text-[#78909C] space-y-1 pb-1">
              <div className="flex items-center gap-1 hover:text-[#263238] cursor-pointer py-0.5">
                <ChevronRight className="w-2.5 h-2.5" />
                <span>Energy Futures</span>
              </div>
              <div className="flex items-center gap-1 hover:text-[#263238] cursor-pointer py-0.5">
                <ChevronRight className="w-2.5 h-2.5" />
                <span>Energy Spot</span>
              </div>
              <div className="flex items-center gap-1 hover:text-[#263238] cursor-pointer py-0.5">
                <ChevronRight className="w-2.5 h-2.5" />
                <span>Metals Futures</span>
              </div>
              <div className="flex items-center gap-1 hover:text-[#263238] cursor-pointer py-0.5">
                <ChevronRight className="w-2.5 h-2.5" />
                <span>Metals Spot</span>
              </div>
              <div className="flex items-center gap-1 hover:text-[#263238] cursor-pointer py-0.5">
                <ChevronRight className="w-2.5 h-2.5" />
                <span>Metals V</span>
              </div>
            </div>
          )}
        </div>

        {/* Category: FX */}
        <div className="bg-[#FFFFFF]">
          <button
            onClick={() => toggleCategory('FX')}
            className="w-full flex items-center gap-1 px-2 py-1 text-left font-bold text-[#455A64] hover:bg-[#F5F7F8] cursor-pointer"
          >
            {expandedCategories.FX ? <ChevronDown className="w-3 h-3 text-[#90A4AE]" /> : <ChevronRight className="w-3 h-3 text-[#90A4AE]" />}
            <span>FX</span>
          </button>

          {expandedCategories.FX && (
            <div className="divide-y divide-[#F5F7F8]">
              {filteredFx.map((item) => {
                const isSelected = selectedAsset.symbol === item.symbol;
                const isFav = favorites.has(item.symbol);
                const liveQuote = quotes[item.symbol];
                const displayBid = liveQuote ? liveQuote.bid.toFixed(liveQuote.lastPrice < 10 ? 4 : 2) : item.bid;
                const displayAsk = liveQuote ? liveQuote.ask.toFixed(liveQuote.lastPrice < 10 ? 4 : 2) : item.ask;
                const liveSpread = liveQuote
                  ? Math.max(1, Math.round((liveQuote.ask - liveQuote.bid) * (liveQuote.lastPrice < 10 ? 10000 : 100)))
                  : item.spread;
                const liveTime = liveQuote
                  ? new Date(liveQuote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : item.time;
                const isPriceUp = liveQuote ? liveQuote.change24h >= 0 : item.isUp;

                return (
                  <div
                    key={item.symbol}
                    onClick={() => {
                      const found = assets.find((a) => a.symbol === item.symbol);
                      if (found) onSelectAsset(found);
                    }}
                    className={`grid grid-cols-12 items-center px-1.5 py-1 text-[10px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#7CB342] text-white font-bold'
                        : 'hover:bg-[#F5F7F8] text-[#263238]'
                    }`}
                  >
                    {/* Star & Instrument Name */}
                    <div className="col-span-4 flex items-center gap-1 truncate">
                      <Star
                        onClick={(e) => toggleFavorite(item.symbol, e)}
                        className={`w-3 h-3 shrink-0 cursor-pointer ${
                          isFav
                            ? isSelected ? 'text-yellow-200 fill-yellow-200' : 'text-amber-500 fill-amber-500'
                            : isSelected ? 'text-white/60' : 'text-[#CFD8DC] hover:text-[#90A4AE]'
                        }`}
                      />
                      <span className="truncate">{item.symbol}</span>
                    </div>

                    {/* BID */}
                    <span className={`col-span-2 text-right truncate font-medium ${
                      isSelected ? 'text-white' : isPriceUp ? 'text-[#558B2F]' : 'text-[#E53935]'
                    }`}>
                      {displayBid}
                    </span>

                    {/* SPREAD */}
                    <span className={`col-span-1 text-center font-bold ${
                      isSelected ? 'text-white' : 'text-[#546E7A]'
                    }`}>
                      {liveSpread}
                    </span>

                    {/* ASK */}
                    <span className={`col-span-2 text-right truncate font-medium ${
                      isSelected ? 'text-white' : isPriceUp ? 'text-[#558B2F]' : 'text-[#E53935]'
                    }`}>
                      {displayAsk}
                    </span>

                    {/* TIME */}
                    <span className={`col-span-3 text-right text-[9px] ${
                      isSelected ? 'text-white/80' : 'text-[#90A4AE]'
                    }`}>
                      {liveTime}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category: INDICES */}
        <div>
          <button
            onClick={() => toggleCategory('INDICES')}
            className="w-full flex items-center gap-1 px-2 py-1 text-left font-bold text-[#455A64] hover:bg-[#F5F7F8] cursor-pointer"
          >
            {expandedCategories.INDICES ? <ChevronDown className="w-3 h-3 text-[#90A4AE]" /> : <ChevronRight className="w-3 h-3 text-[#90A4AE]" />}
            <span>INDICES</span>
          </button>
        </div>

        {/* Category: STOCK */}
        <div>
          <button
            onClick={() => toggleCategory('STOCK')}
            className="w-full flex items-center gap-1 px-2 py-1 text-left font-bold text-[#455A64] hover:bg-[#F5F7F8] cursor-pointer"
          >
            {expandedCategories.STOCK ? <ChevronDown className="w-3 h-3 text-[#90A4AE]" /> : <ChevronRight className="w-3 h-3 text-[#90A4AE]" />}
            <span>STOCK</span>
          </button>
        </div>
      </div>

      {/* Bottom Search & Settings Bar */}
      <div className="p-1.5 border-t border-[#E0E3E7] bg-[#FAFAFA] flex items-center gap-1.5">
        <div className="flex-1 relative flex items-center bg-white border border-[#CFD8DC] rounded px-1.5 py-0.5">
          <Search className="w-3 h-3 text-[#90A4AE] mr-1" />
          <input
            type="text"
            placeholder="Filter instruments"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full text-[11px] bg-transparent text-[#263238] focus:outline-none"
          />
        </div>
        <button className="p-1 text-[#78909C] hover:text-[#37474F] hover:bg-[#ECEFF1] rounded cursor-pointer" title="Einstellungen">
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
