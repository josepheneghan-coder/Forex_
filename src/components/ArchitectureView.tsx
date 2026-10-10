import React, { useState, useEffect } from 'react';
import { PAPERTRADE_POSTGRES_SCHEMA, FASTAPI_BACKEND_CODE } from '../data/marketData';
import { realtimeTracker } from '../services/realtimeTracker';
import { FinnhubPipelineStats } from '../types/trading';
import {
  Database,
  Server,
  Radio,
  Copy,
  Check,
  Activity,
  ArrowDown,
  Layers,
  Cpu,
  RefreshCw,
  Zap,
  Globe,
  Share2,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finnhub' | 'sql' | 'fastapi' | 'realtime'>('finnhub');
  const [copied, setCopied] = useState(false);
  const [pipelineStats, setPipelineStats] = useState<FinnhubPipelineStats>(realtimeTracker.getPipelineStats());

  useEffect(() => {
    // Poll live pipeline stats from realtimeTracker and backend REST
    const interval = setInterval(() => {
      setPipelineStats({ ...realtimeTracker.getPipelineStats() });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const realtimeSpecDoc = `# =====================================================================
# ECHTZEIT-TRACKER EVENT SPECIFICATION (PaperTrade v1.0)
# WebSocket Endpoint: /ws (Abs. 6 & 7)
# =====================================================================

# 1. SUBSCRIPTION REQUEST (Client -> Server)
{
  "type": "subscribe",
  "channels": [
    "market:AUDUSD",
    "market:BTC/USDT",
    "portfolio",
    "orders",
    "positions"
  ]
}

# 2. FINNHUB NORMALIZED QUOTE UPDATE EVENT (Server -> Client, Abs. 4)
{
  "event": "quote.update",
  "source": "finnhub-pipeline",
  "sequence": 184723,
  "timestamp": "2026-10-06T15:20:32.412Z",
  "pipeline": {
    "rawTicksReceived": 4820,
    "normalizedCount": 4820,
    "spreadsCalculated": 4820,
    "broadcastsSent": 1420
  },
  "data": {
    "symbol": "BTC/USDT",
    "last_price": 68420.50,
    "bid": 68419.80,
    "ask": 68421.20,
    "spread": 1.40,
    "volume": 32800,
    "day_change": 1250.40,
    "day_change_percent": 1.86
  }
}

# 3. POSITION REVALUATION EVENT (Server -> Client, Abs. 10)
{
  "event": "position.updated",
  "sequence": 184724,
  "timestamp": "2026-10-06T15:20:32.415Z",
  "data": {
    "symbol": "AUDUSD",
    "quantity": 10000,
    "average_entry_price": 1.6050,
    "current_price": 1.6100,
    "market_value": 16100.00,
    "unrealized_pnl": 50.00,
    "unrealized_pnl_percent": 0.31
  }
}

# 4. PORTFOLIO REVALUATION EVENT (Server -> Client, Abs. 8 & 19)
{
  "event": "portfolio.updated",
  "sequence": 184725,
  "timestamp": "2026-10-06T15:20:32.420Z",
  "data": {
    "cash_balance": 102253.14,
    "equity": 107828.65,
    "invested": 5575.51,
    "realized_pnl": 0.00,
    "unrealized_pnl": 5575.51,
    "free_margin": 102253.14,
    "margin_level": "5512.97%"
  }
}
`;

  const finnhubPipelineCode = `/**
 * Finnhub Pipeline Backend Implementation (server.ts)
 * 
 * Finnhub
 *    │
 *    │ WebSocket (wss://ws.finnhub.io?token=...)
 *    ▼
 * AI-Studio Backend
 *    │
 *    ├── 1. normalisieren: Finnhub-Symbole (z.B. BINANCE:BTCUSDT -> BTC/USDT)
 *    ├── 2. speichern/cache: In-Memory Map mit Hoch/Tief/Volumen/Open
 *    ├── 3. Spread berechnen: Dynamischer Geld-/Briefkurs (Bid/Ask)
 *    └── 4. an Clients verteilen: WebSocket Broadcast über /ws
 *           │
 *           ▼
 *        WebSocket (/ws)
 *           │
 *           ▼
 *     deine Trading-App
 */
`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveCode = () => {
    if (activeTab === 'finnhub') return finnhubPipelineCode + '\n' + realtimeSpecDoc;
    if (activeTab === 'sql') return PAPERTRADE_POSTGRES_SCHEMA;
    if (activeTab === 'fastapi') return FASTAPI_BACKEND_CODE;
    return realtimeSpecDoc;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#D8DCE1] rounded shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#7CB342]" />
            <h1 className="text-base font-bold text-[#263238]">Architektur &amp; Finnhub-Pipeline</h1>
            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-2 py-0.5 rounded">
              Echtzeit-Stream
            </span>
          </div>
          <p className="text-xs text-[#78909C] mt-0.5">
            Finnhub WebSocket ➔ AI-Studio Backend (Normalisieren / Cache / Spread) ➔ WebSocket (/ws) ➔ Trading-App
          </p>
        </div>
        <button
          onClick={() => handleCopy(getActiveCode())}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white text-xs font-bold rounded cursor-pointer transition-colors self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Kopiert!' : 'Code kopieren'}</span>
        </button>
      </div>

      {/* 2. Interactive Pipeline Visualization Block */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECEFF1] pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7CB342]" />
            <h2 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
              Aktive Daten-Pipeline in Echtzeit
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#7CB342] animate-pulse" />
            <span className="text-[#558B2F] font-bold">
              Status: {pipelineStats.finnhubStatus}
            </span>
          </div>
        </div>

        {/* Pipeline Diagram Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Box 1: Finnhub */}
          <div className="bg-[#F8F9FA] border border-[#CFD8DC] rounded p-3 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#263238] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#1976D2]" />
                  Finnhub
                </span>
                <span className="text-[9px] bg-[#E3F2FD] text-[#1976D2] px-1.5 py-0.2 rounded font-mono font-bold">
                  External WS
                </span>
              </div>
              <p className="text-[10px] text-[#78909C]">
                wss://ws.finnhub.io
              </p>
              <div className="mt-2 text-[11px] font-mono">
                <span className="text-[#546E7A]">Raw Ticks: </span>
                <strong className="text-[#263238]">{pipelineStats.rawTicksReceived.toLocaleString()}</strong>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E0E3E7] text-[10px] text-[#90A4AE]">
              BINANCE:BTCUSDT, AAPL, EUR_USD...
            </div>
          </div>

          {/* Box 2: Backend Processing */}
          <div className="bg-[#F8F9FA] border border-[#7CB342] rounded p-3 relative flex flex-col justify-between md:col-span-2 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#263238] flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-[#558B2F]" />
                  AI-Studio Backend Server
                </span>
                <span className="text-[9px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.2 rounded font-mono font-bold">
                  Core Processing
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[11px]">
                <div className="bg-white p-2 rounded border border-[#E0E3E7]">
                  <span className="text-[10px] text-[#78909C] block">1. Normalisieren</span>
                  <strong className="text-[#2E7D32]">{pipelineStats.normalizedCount.toLocaleString()}</strong>
                  <span className="text-[9px] text-[#90A4AE] block">Symbol-Mapping</span>
                </div>

                <div className="bg-white p-2 rounded border border-[#E0E3E7]">
                  <span className="text-[10px] text-[#78909C] block">2. Speichern / Cache</span>
                  <strong className="text-[#1976D2]">{pipelineStats.cacheUpdates.toLocaleString()}</strong>
                  <span className="text-[9px] text-[#90A4AE] block">In-Memory Store</span>
                </div>

                <div className="bg-white p-2 rounded border border-[#E0E3E7]">
                  <span className="text-[10px] text-[#78909C] block">3. Spread berechnen</span>
                  <strong className="text-[#E65100]">{pipelineStats.spreadsCalculated.toLocaleString()}</strong>
                  <span className="text-[9px] text-[#90A4AE] block">Bid / Ask Engine</span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[#E0E3E7] flex items-center justify-between text-[10px]">
              <span className="text-[#546E7A] font-bold">4. an Clients verteilen:</span>
              <span className="font-mono text-[#558B2F] font-bold">
                {pipelineStats.broadcastsSent.toLocaleString()} Broadcasts
              </span>
            </div>
          </div>

          {/* Box 3: Trading-App Frontend */}
          <div className="bg-[#F8F9FA] border border-[#CFD8DC] rounded p-3 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#263238] flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-[#7CB342]" />
                  deine Trading-App
                </span>
                <span className="text-[9px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.2 rounded font-mono font-bold">
                  Client UI
                </span>
              </div>
              <p className="text-[10px] text-[#78909C]">
                WebSocket (/ws) Client
              </p>
              <div className="mt-2 text-[11px] font-mono space-y-0.5">
                <div>
                  <span className="text-[#546E7A]">Verbundene Tabs: </span>
                  <strong className="text-[#263238]">{pipelineStats.connectedClientsCount}</strong>
                </div>
                <div>
                  <span className="text-[#546E7A]">Latenz: </span>
                  <strong className="text-[#558B2F]">&lt; 15ms</strong>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E0E3E7] text-[10px] text-[#90A4AE]">
              Terminal, Chart, Portfolio, Orderbook
            </div>
          </div>
        </div>
      </div>

      {/* 3. Specification & Code Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8DCE1]">
        <button
          onClick={() => setActiveTab('finnhub')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'finnhub' ? 'border-[#7CB342] text-[#263238]' : 'border-transparent text-[#78909C]'
          }`}
        >
          Finnhub-Pipeline (Architektur)
        </button>
        <button
          onClick={() => setActiveTab('realtime')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'realtime' ? 'border-[#7CB342] text-[#263238]' : 'border-transparent text-[#78909C]'
          }`}
        >
          Echtzeit-Tracker Events (Abs. 4–16)
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'sql' ? 'border-[#7CB342] text-[#263238]' : 'border-transparent text-[#78909C]'
          }`}
        >
          PostgreSQL DDL (Abs. 38)
        </button>
        <button
          onClick={() => setActiveTab('fastapi')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'fastapi' ? 'border-[#7CB342] text-[#263238]' : 'border-transparent text-[#78909C]'
          }`}
        >
          FastAPI Server (Abs. 39)
        </button>
      </div>

      {/* 4. Code Block */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 font-mono text-xs text-[#263238] overflow-x-auto max-h-[500px]">
        <pre>{getActiveCode()}</pre>
      </div>
    </div>
  );
};
