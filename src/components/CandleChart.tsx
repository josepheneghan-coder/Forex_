import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Candle } from '../types/trading';
import { Clock, BarChart2, Cpu, Crosshair, Edit3, ArrowLeftRight, TrendingUp } from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  currentPrice: number;
  symbol: string;
  decimals: number;
  timeframe: string;
  setTimeframe: (tf: string) => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  currentPrice,
  symbol,
  decimals,
  timeframe,
  setTimeframe,
}) => {
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 380 });

  // Responsive resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(320, containerRef.current.clientHeight),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute scale boundaries
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (!candles.length) return { minPrice: 0, maxPrice: 1, priceRange: 1 };

    let min = Infinity;
    let max = -Infinity;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    if (currentPrice < min) min = currentPrice;
    if (currentPrice > max) max = currentPrice;

    const padding = (max - min) * 0.12 || 0.005;
    const finalMin = min - padding;
    const finalMax = max + padding;

    return {
      minPrice: finalMin,
      maxPrice: finalMax,
      priceRange: finalMax - finalMin,
    };
  }, [candles, currentPrice]);

  const chartPadding = { top: 25, right: 65, bottom: 30, left: 10 };
  const plotWidth = Math.max(100, dimensions.width - chartPadding.left - chartPadding.right);
  const plotHeight = Math.max(100, dimensions.height - chartPadding.top - chartPadding.bottom);

  const getYForPrice = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return chartPadding.top + plotHeight * (1 - ratio);
  };

  const currentPriceY = getYForPrice(currentPrice);

  // Upper guide price (e.g., 1.6160) and lower guide price (1.6100) from screenshot
  const upperGuidePrice = currentPrice * 1.0035;
  const lowerGuidePrice = currentPrice * 0.998;
  const upperY = getYForPrice(upperGuidePrice);
  const lowerY = getYForPrice(lowerGuidePrice);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !candles.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= chartPadding.left && x <= chartPadding.left + plotWidth && y >= chartPadding.top && y <= chartPadding.top + plotHeight) {
      setMousePos({ x, y });
      const candleWidth = plotWidth / candles.length;
      const index = Math.min(candles.length - 1, Math.max(0, Math.floor((x - chartPadding.left) / candleWidth)));
      setHoveredCandle(candles[index]);
    } else {
      setMousePos(null);
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  // 6 Horizontal grid intervals
  const gridSteps = 5;
  const priceGridPoints = useMemo(() => {
    const points: number[] = [];
    const stepVal = priceRange / gridSteps;
    for (let i = 0; i <= gridSteps; i++) {
      points.push(minPrice + i * stepVal);
    }
    return points;
  }, [minPrice, priceRange]);

  const candleWidth = candles.length > 0 ? plotWidth / candles.length : 8;
  const barWidth = Math.max(2.5, candleWidth * 0.65);

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] border border-[#D8DCE1] select-none">
      {/* Top Chart Toolbar (Matches screenshot layout with symbol, price, red change, tools) */}
      <div className="px-4 py-2 border-b border-[#E0E3E7] bg-[#FFFFFF] flex flex-wrap items-center justify-between text-xs">
        {/* Left: Symbol Name + Price + Red Change */}
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold tracking-tight text-[#263238] font-sans">
            {symbol}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="font-semibold text-[#546E7A]">
              {currentPrice.toFixed(decimals)}
            </span>
            <span className="text-[#E53935] font-semibold text-[11px]">
              -0.0003 (~0.02%)
            </span>
          </div>
        </div>

        {/* Right: Chart Tools (1M clock, Charts, Function, Target, Edit, Swap) */}
        <div className="flex items-center gap-2 sm:gap-4 text-[#546E7A] text-[11px]">
          {/* Timeframe Selector with Clock */}
          <div className="flex items-center gap-1 bg-[#F5F7F8] px-2 py-1 rounded border border-[#E0E3E7] cursor-pointer hover:border-[#CFD8DC]">
            <Clock className="w-3.5 h-3.5 text-[#78909C]" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent font-bold text-[#37474F] focus:outline-none cursor-pointer"
            >
              <option value="1m">1M</option>
              <option value="5m">5M</option>
              <option value="15m">15M</option>
              <option value="1h">1H</option>
              <option value="1D">1D</option>
            </select>
          </div>

          <button
            onClick={() => setChartType(chartType === 'candle' ? 'line' : 'candle')}
            className="flex items-center gap-1 hover:text-[#263238] transition-colors cursor-pointer"
            title="Charttyp umschalten"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Charts</span>
          </button>

          <button className="flex items-center gap-1 hover:text-[#263238] transition-colors cursor-pointer">
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Function</span>
          </button>

          <button className="flex items-center gap-1 hover:text-[#263238] transition-colors cursor-pointer">
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Target</span>
          </button>

          <button className="flex items-center gap-1 hover:text-[#263238] transition-colors cursor-pointer">
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button className="flex items-center gap-1 hover:text-[#263238] transition-colors cursor-pointer">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Swap</span>
          </button>
        </div>
      </div>

      {/* Main White Chart Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 w-full h-[320px] select-none cursor-crosshair overflow-hidden bg-[#FFFFFF]"
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block w-full h-full pointer-events-none"
        >
          {/* Subtle horizontal grid lines */}
          {priceGridPoints.map((price, idx) => {
            const y = getYForPrice(price);
            return (
              <g key={idx}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartPadding.left + plotWidth}
                  y2={y}
                  stroke="#F0F2F5"
                  strokeWidth="1"
                />
                <text
                  x={chartPadding.left + plotWidth + 6}
                  y={y + 3.5}
                  fill="#90A4AE"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="start"
                >
                  {price.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {/* Green Horizontal Price Guide Line with Badge (Upper Target in screenshot) */}
          <line
            x1={chartPadding.left}
            y1={upperY}
            x2={chartPadding.left + plotWidth}
            y2={upperY}
            stroke="#8BC34A"
            strokeWidth="1.2"
          />
          <g transform={`translate(${chartPadding.left + plotWidth}, ${upperY})`}>
            <rect x="0" y="-8" width="55" height="16" fill="#8BC34A" rx="2" />
            <text x="27" y="3.5" fill="#FFFFFF" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="bold" textAnchor="middle">
              {upperGuidePrice.toFixed(decimals)}
            </text>
          </g>

          {/* Red Horizontal Price Guide Line with Badge (Lower Level in screenshot) */}
          <line
            x1={chartPadding.left}
            y1={lowerY}
            x2={chartPadding.left + plotWidth}
            y2={lowerY}
            stroke="#E53935"
            strokeWidth="1.2"
          />
          <g transform={`translate(${chartPadding.left + plotWidth}, ${lowerY})`}>
            <rect x="0" y="-8" width="55" height="16" fill="#E53935" rx="2" />
            <text x="27" y="3.5" fill="#FFFFFF" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="bold" textAnchor="middle">
              {lowerGuidePrice.toFixed(decimals)}
            </text>
          </g>

          {/* Candlesticks: Light-green/white hollow bullish, pink/red filled bearish */}
          {chartType === 'candle' &&
            candles.map((candle, idx) => {
              const xCenter = chartPadding.left + idx * candleWidth + candleWidth / 2;
              const xLeft = xCenter - barWidth / 2;
              const isBullish = candle.close >= candle.open;

              const openY = getYForPrice(candle.open);
              const closeY = getYForPrice(candle.close);
              const highY = getYForPrice(candle.high);
              const lowY = getYForPrice(candle.low);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

              // Colors from screenshot:
              // Bullish: Fresh light-green wick & border, hollow or very soft light green fill
              // Bearish: Pink/red `#E57373` / `#E53935`
              const strokeColor = isBullish ? '#7CB342' : '#E53935';
              const fillColor = isBullish ? '#FFFFFF' : '#FFCDD2';

              return (
                <g key={`c-${idx}`}>
                  {/* Wicks */}
                  <line
                    x1={xCenter}
                    y1={highY}
                    x2={xCenter}
                    y2={lowY}
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                  {/* Body */}
                  <rect
                    x={xLeft}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyHeight}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                </g>
              );
            })}

          {/* Line Chart alternative */}
          {chartType === 'line' && (
            <path
              d={candles
                .map((c, i) => {
                  const x = chartPadding.left + i * candleWidth + candleWidth / 2;
                  const y = getYForPrice(c.close);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#7CB342"
              strokeWidth="1.5"
            />
          )}

          {/* Crosshair */}
          {mousePos && (
            <g>
              <line
                x1={chartPadding.left}
                y1={mousePos.y}
                x2={chartPadding.left + plotWidth}
                y2={mousePos.y}
                stroke="#B0BEC5"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <line
                x1={mousePos.x}
                y1={chartPadding.top}
                x2={mousePos.x}
                y2={chartPadding.top + plotHeight}
                stroke="#B0BEC5"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* X-axis time marks matching screenshot */}
        <div
          className="absolute bottom-1 flex justify-between text-[10px] font-mono text-[#90A4AE] pointer-events-none"
          style={{ left: chartPadding.left, width: plotWidth }}
        >
          <span>19:45</span>
          <span>21:45</span>
          <span>23:45</span>
          <span>01:45</span>
          <span>02:45</span>
          <span>04:45</span>
          <span>06:45</span>
        </div>
      </div>
    </div>
  );
};
