import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle } from '../types/trading';
import { newsService } from '../services/newsService';
import {
  Radio,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  LayoutList,
  SlidersHorizontal,
  Play,
  Pause,
  ArrowRight,
} from 'lucide-react';

export interface NewsTickerProps {
  /** The currently selected asset symbol e.g. 'BTC/USDT', 'AUDUSD', 'Gold', etc. */
  selectedSymbol?: string;
  /** Callback when user clicks on an asset tag to trade */
  onSelectAssetAndTrade?: (symbol: string) => void;
  /** Initial format display: 'scrolling' or 'list' */
  defaultFormat?: 'scrolling' | 'list';
  /** Compact presentation mode */
  compact?: boolean;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  selectedSymbol = 'BTC/USDT',
  onSelectAssetAndTrade,
  defaultFormat = 'scrolling',
  compact = false,
}) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [displayFormat, setDisplayFormat] = useState<'scrolling' | 'list'>(defaultFormat);
  const [category, setCategory] = useState<string>('ALL');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [manualSymbol, setManualSymbol] = useState<string>(selectedSymbol);

  // Sync internal manualSymbol when parent selectedSymbol changes
  useEffect(() => {
    if (selectedSymbol) {
      setManualSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  // CRITICAL REQUIREMENT: Effect Hook to fetch/refresh headlines whenever selectedSymbol or manualSymbol changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const targetSymbol = manualSymbol || selectedSymbol || 'BTC/USDT';

    // Simulated API call with latency
    newsService
      .fetchNews(targetSymbol, category !== 'ALL' ? category : undefined)
      .then((articles) => {
        if (isMounted) {
          setNews(articles);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching simulated news headlines for', targetSymbol, err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, manualSymbol, category]);

  // Manual refresh trigger
  const handleRefresh = useCallback(() => {
    setLoading(true);
    const targetSymbol = manualSymbol || selectedSymbol || 'BTC/USDT';
    newsService
      .fetchNews(targetSymbol, category !== 'ALL' ? category : undefined)
      .then((articles) => {
        setNews(articles);
        setLoading(false);
      });
  }, [manualSymbol, selectedSymbol, category]);

  // Simulate breaking news for current asset
  const handleSimulateBreakingNews = useCallback(() => {
    const targetSymbol = manualSymbol || selectedSymbol || 'BTC/USDT';
    const dynamicArticle = newsService.generateDynamicNews(targetSymbol);
    setNews((prev) => [dynamicArticle, ...prev]);
  }, [manualSymbol, selectedSymbol]);

  const formatRelativeTime = (timestamp: number) => {
    const diffMins = Math.round((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return 'gerade eben';
    if (diffMins === 1) return 'vor 1 Min';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours === 1) return 'vor 1 Std';
    return `vor ${diffHours} Std`;
  };

  const activeSymbolLabel = manualSymbol || selectedSymbol || 'BTC/USDT';

  return (
    <div className="bg-white border border-[#D8DCE1] rounded shadow-xs overflow-hidden select-none transition-all">
      {/* 1. Header Control Bar */}
      <div className="bg-[#1A2327] text-white px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2C3840]">
        {/* Left: Live Indicator & Asset Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#E53935] text-white px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
            <Flame className="w-3 h-3 animate-pulse text-amber-200" />
            <span>NEWS TICKER</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#2C3840] text-white px-2 py-0.5 rounded text-[11px] font-mono border border-[#37474F]">
            <span className="text-[#90A4AE]">Asset:</span>
            <span className="font-bold text-[#AEEA00]">{activeSymbolLabel}</span>
          </div>

          {/* Quick Symbol Switcher to test Effect Hook */}
          <select
            value={manualSymbol}
            onChange={(e) => setManualSymbol(e.target.value)}
            className="bg-[#243038] text-white text-[11px] font-mono px-2 py-0.5 rounded border border-[#37474F] focus:outline-hidden focus:border-[#7CB342] cursor-pointer"
            title="Schlagzeilen für ein anderes Asset abrufen"
          >
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="SOL/USDT">SOL/USDT</option>
            <option value="AUDUSD">AUDUSD</option>
            <option value="EUR/USD">EUR/USD</option>
            <option value="GBP/USD">GBP/USD</option>
            <option value="EURAUD">EURAUD</option>
            <option value="Gold">Gold</option>
            <option value="BRENT">BRENT</option>
            <option value="NVDA">NVDA</option>
            <option value="AAPL">AAPL</option>
            <option value="TSLA">TSLA</option>
            <option value="SPY">SPY</option>
          </select>
        </div>

        {/* Right: Format Toggle (Scrolling vs List) & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {/* Format Toggle Buttons */}
          <div className="flex items-center bg-[#243038] p-0.5 rounded border border-[#37474F] text-[11px]">
            <button
              onClick={() => setDisplayFormat('scrolling')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold cursor-pointer transition-colors ${
                displayFormat === 'scrolling'
                  ? 'bg-[#7CB342] text-white font-bold'
                  : 'text-[#90A4AE] hover:text-white'
              }`}
              title="Laufband-Format aktivieren"
            >
              <Radio className="w-3 h-3" />
              <span>Laufband</span>
            </button>
            <button
              onClick={() => setDisplayFormat('list')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold cursor-pointer transition-colors ${
                displayFormat === 'list'
                  ? 'bg-[#7CB342] text-white font-bold'
                  : 'text-[#90A4AE] hover:text-white'
              }`}
              title="Listen-Format aktivieren"
            >
              <LayoutList className="w-3 h-3" />
              <span>Liste</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`p-1 text-[#90A4AE] hover:text-[#7CB342] rounded hover:bg-[#2C3840] cursor-pointer transition-colors ${
              loading ? 'animate-spin text-[#7CB342]' : ''
            }`}
            title="Schlagzeilen neu laden"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Simulate Breaking News */}
          <button
            onClick={handleSimulateBreakingNews}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#7CB342] hover:bg-[#689F38] text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
            title="Neue Eilmeldung für dieses Asset simulieren"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span className="hidden md:inline">+ Eilmeldung</span>
          </button>
        </div>
      </div>

      {/* 2. FORMAT A: CONTINUOUS SCROLLING TICKER TAPE (LAUFBAND) */}
      {displayFormat === 'scrolling' && (
        <div className="relative bg-[#0F1418] border-b border-[#2C3840] py-2 overflow-hidden">
          {/* Pause/Play indicator */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 bg-[#1A2327]/90 px-1.5 py-0.5 rounded border border-[#37474F] text-[10px] text-[#90A4AE]">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="hover:text-white cursor-pointer"
              title={isPaused ? 'Fortsetzen' : 'Pausieren'}
            >
              {isPaused ? <Play className="w-3 h-3 text-[#7CB342]" /> : <Pause className="w-3 h-3" />}
            </button>
          </div>

          {loading && news.length === 0 ? (
            <div className="py-1 px-8 text-xs text-[#90A4AE] font-mono flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7CB342]" />
              <span>Lade aktuelle Schlagzeilen für {activeSymbolLabel}...</span>
            </div>
          ) : news.length === 0 ? (
            <div className="py-1 px-8 text-xs text-[#90A4AE]">
              Keine Schlagzeilen für {activeSymbolLabel} gefunden.
            </div>
          ) : (
            <div
              className="overflow-hidden pl-10"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Infinite scrolling marquee track */}
              <div
                className={`animate-ticker-tape flex items-center gap-8 ${
                  isPaused ? '[animation-play-state:paused]' : ''
                }`}
              >
                {/* Duplicated list for seamless infinite loop */}
                {[...news, ...news].map((item, index) => {
                  const isBullish = item.sentiment === 'BULLISH';
                  const isBearish = item.sentiment === 'BEARISH';

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() => {
                        setDisplayFormat('list');
                        setExpandedArticleId(item.id);
                      }}
                      className="flex items-center gap-2.5 text-xs whitespace-nowrap cursor-pointer hover:opacity-90 group shrink-0"
                    >
                      <span className="font-mono text-[10px] font-bold text-[#AEEA00] bg-[#1A2327] px-1.5 py-0.5 rounded border border-[#2C3840]">
                        {item.symbols[0] || activeSymbolLabel}
                      </span>

                      <span className="text-[10px] text-[#90A4AE] font-mono">
                        [{item.source}]
                      </span>

                      <span className="font-semibold text-white group-hover:text-lime-300 transition-colors">
                        {item.headline}
                      </span>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          isBullish
                            ? 'bg-[#2E7D32] text-white'
                            : isBearish
                            ? 'bg-[#C62828] text-white'
                            : 'bg-[#546E7A] text-white'
                        }`}
                      >
                        {item.sentiment}
                      </span>

                      <span className="text-[10px] text-[#78909C]">
                        {formatRelativeTime(item.publishedAt)}
                      </span>

                      <span className="text-[#37474F] font-bold">///</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. FORMAT B: INTERACTIVE ARTICLE LIST (LISTENFORMAT) */}
      {displayFormat === 'list' && (
        <div className="bg-[#FFFFFF]">
          {/* Category filter tabs */}
          <div className="p-2.5 bg-[#FAFAFA] border-b border-[#E0E3E7] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'Alle' },
                { id: 'crypto', label: 'Krypto' },
                { id: 'forex', label: 'Forex' },
                { id: 'stock', label: 'Aktien' },
                { id: 'macro', label: 'Makro' },
                { id: 'commodities', label: 'Rohstoffe' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                    category === cat.id
                      ? 'bg-[#7CB342] text-white shadow-xs'
                      : 'bg-white border border-[#CFD8DC] text-[#546E7A] hover:bg-[#ECEFF1] hover:text-[#263238]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-[#78909C] font-mono">
              {news.length} Artikel für <strong className="text-[#263238]">{activeSymbolLabel}</strong>
            </span>
          </div>

          {/* List of articles */}
          <div className={`divide-y divide-[#ECEFF1] ${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
            {loading && news.length === 0 ? (
              <div className="py-8 text-center text-[#78909C] text-xs">
                <RefreshCw className="w-5 h-5 text-[#7CB342] animate-spin mx-auto mb-1.5" />
                <span>Synchronisiere Schlagzeilen für {activeSymbolLabel}...</span>
              </div>
            ) : news.length === 0 ? (
              <div className="py-8 text-center text-[#78909C] text-xs">
                <p className="font-semibold text-[#37474F]">Keine Schlagzeilen für {activeSymbolLabel} gefunden.</p>
                <button
                  onClick={() => setCategory('ALL')}
                  className="mt-2 text-[#558B2F] hover:underline font-bold"
                >
                  Kategorie zurücksetzen
                </button>
              </div>
            ) : (
              news.map((item) => {
                const isExpanded = expandedArticleId === item.id;
                const isBullish = item.sentiment === 'BULLISH';
                const isBearish = item.sentiment === 'BEARISH';

                return (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                    onClick={() => setExpandedArticleId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Meta header */}
                        <div className="flex items-center gap-2 mb-1 text-[11px] font-mono">
                          <span className="font-bold text-[#546E7A] bg-[#ECEFF1] px-1.5 py-0.2 rounded">
                            {item.source}
                          </span>
                          <span className="text-[#90A4AE] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(item.publishedAt)}
                          </span>
                          {item.impact === 'HIGH' && (
                            <span className="bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] text-[9px] font-bold px-1 rounded">
                              HIGH IMPACT
                            </span>
                          )}
                        </div>

                        {/* Headline */}
                        <h3 className="text-xs sm:text-sm font-bold text-[#263238] group-hover:text-[#558B2F] transition-colors leading-snug">
                          {item.headline}
                        </h3>

                        {/* Summary */}
                        <p className={`text-xs text-[#546E7A] mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {item.summary}
                        </p>

                        {/* Symbol tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {item.symbols.map((sym) => (
                            <button
                              key={sym}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectAssetAndTrade) {
                                  onSelectAssetAndTrade(sym);
                                }
                              }}
                              className="px-2 py-0.5 bg-[#F0F4F8] hover:bg-[#E8F5E9] hover:text-[#2E7D32] hover:border-[#7CB342] text-[#263238] border border-[#CFD8DC] rounded text-[10px] font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title={`${sym} im Terminal handeln`}
                            >
                              <span>{sym}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ))}
                          <span className="text-[10px] text-[#90A4AE] font-mono capitalize ml-1">
                            #{item.category}
                          </span>
                        </div>
                      </div>

                      {/* Sentiment Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBullish
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                              : isBearish
                              ? 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
                              : 'bg-[#ECEFF1] text-[#455A64] border border-[#CFD8DC]'
                          }`}
                        >
                          {isBullish ? (
                            <TrendingUp className="w-3 h-3 text-[#2E7D32]" />
                          ) : isBearish ? (
                            <TrendingDown className="w-3 h-3 text-[#C62828]" />
                          ) : (
                            <Minus className="w-3 h-3 text-[#455A64]" />
                          )}
                          <span>{item.sentiment}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. Footer Note */}
      <div className="px-3 py-1.5 bg-[#F5F7F8] border-t border-[#E0E3E7] flex items-center justify-between text-[10px] text-[#78909C]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7CB342] animate-pulse" />
          <span>Automatischer Refresh bei Symbolwechsel ({activeSymbolLabel})</span>
        </div>
        <button
          onClick={() => setDisplayFormat(displayFormat === 'scrolling' ? 'list' : 'scrolling')}
          className="font-bold text-[#558B2F] hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>{displayFormat === 'scrolling' ? 'Zur Listenansicht wechseln' : 'Zum Laufband wechseln'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
