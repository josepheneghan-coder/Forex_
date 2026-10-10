import React, { useState, useEffect } from 'react';
import { Account, TradingLimits, MarketDataStatus } from '../types/trading';
import { realtimeTracker } from '../services/realtimeTracker';
import {
  Settings,
  Shield,
  RotateCcw,
  Sliders,
  DollarSign,
  Zap,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
  Activity,
  Globe,
  RefreshCw,
  KeyRound,
  Server,
  Lock,
  LogOut,
} from 'lucide-react';

interface SettingsViewProps {
  account: Account;
  limits: TradingLimits;
  onUpdateLimits: (limits: TradingLimits) => void;
  onResetAccount: (newBalance: number) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  account,
  limits,
  onUpdateLimits,
  onResetAccount,
  onLogout,
}) => {
  const [balanceInput, setBalanceInput] = useState<number>(account.initialBalance);
  const [localLimits, setLocalLimits] = useState<TradingLimits>(limits);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [slippageBps, setSlippageBps] = useState<number>(3); // 3 basis points
  const [makerFeePct, setMakerFeePct] = useState<number>(0.05);
  const [takerFeePct, setTakerFeePct] = useState<number>(0.10);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [marketStatus, setMarketStatus] = useState<MarketDataStatus>(realtimeTracker.getMarketDataStatus());
  const [modeSwitching, setModeSwitching] = useState<boolean>(false);

  // Poll real-time market data status for diagnostics panel
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus({ ...realtimeTracker.getMarketDataStatus() });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveRiskLimits = () => {
    onUpdateLimits(localLimits);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePresetReset = (amount: number) => {
    onResetAccount(amount);
  };

  const handleToggleMode = async (targetMode: 'LIVE' | 'SIMULATED') => {
    setModeSwitching(true);
    try {
      await realtimeTracker.setMarketDataMode(targetMode);
      setMarketStatus({ ...realtimeTracker.getMarketDataStatus() });
    } finally {
      setTimeout(() => setModeSwitching(false), 500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#7CB342]" />
            <h1 className="text-base font-bold text-[#263238]">Simulations-Einstellungen &amp; Parameter</h1>
            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] px-2 py-0.5 rounded">
              Virtuelles Konto
            </span>
          </div>
          <p className="text-xs text-[#78909C] mt-0.5">
            Konfiguriere Marktdaten-Provider, Kontokapital, Risikogrenzen, Ordergebühren und Diagnostics.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] border border-[#A5D6A7] px-3 py-1.5 rounded">
            <CheckCircle2 className="w-4 h-4 text-[#7CB342]" />
            <span>Einstellungen gespeichert!</span>
          </div>
        )}
      </div>

      {/* 2. REQUIREMENT 24: MARKET DATA DIAGNOSTICS BEREICH */}
      <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ECEFF1]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#7CB342]" />
            <h2 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
              Market Data Diagnostics (Entwicklung / Admin)
            </h2>
            <span className="text-[9px] bg-[#ECEFF1] text-[#546E7A] font-mono px-1.5 py-0.2 rounded font-bold">
              Abs. 24
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#78909C] font-mono">Modus wechseln:</span>
            <div className="flex items-center bg-[#F5F7F8] p-0.5 rounded border border-[#CFD8DC] text-[11px] font-bold">
              <button
                onClick={() => handleToggleMode('LIVE')}
                disabled={modeSwitching}
                className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                  marketStatus.mode === 'LIVE'
                    ? 'bg-[#7CB342] text-white shadow-2xs'
                    : 'text-[#546E7A] hover:text-[#263238]'
                }`}
              >
                LIVE
              </button>
              <button
                onClick={() => handleToggleMode('SIMULATED')}
                disabled={modeSwitching}
                className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                  marketStatus.mode === 'SIMULATED'
                    ? 'bg-[#FFA000] text-white shadow-2xs'
                    : 'text-[#546E7A] hover:text-[#263238]'
                }`}
              >
                SIMULATED
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E0E3E7]">
            <span className="text-[10px] text-[#78909C] block uppercase font-bold">Provider</span>
            <strong className="text-sm text-[#263238] block mt-0.5">{marketStatus.provider}</strong>
            <span className="text-[10px] text-[#546E7A] block">
              {marketStatus.provider === 'FINNHUB' ? 'wss://ws.finnhub.io' : 'Interne Tick-Engine'}
            </span>
          </div>

          <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E0E3E7]">
            <span className="text-[10px] text-[#78909C] block uppercase font-bold">Connection</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  marketStatus.status === 'CONNECTED' ? 'bg-[#7CB342] animate-pulse' : 'bg-[#E53935]'
                }`}
              />
              <strong className="text-sm text-[#263238]">{marketStatus.status}</strong>
            </div>
            <span className="text-[10px] text-[#546E7A] block">
              Clients: {marketStatus.connectedClients}
            </span>
          </div>

          <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E0E3E7]">
            <span className="text-[10px] text-[#78909C] block uppercase font-bold">Mode</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong
                className={`text-sm ${
                  marketStatus.mode === 'LIVE' ? 'text-[#2E7D32]' : 'text-[#E65100]'
                }`}
              >
                {marketStatus.mode}
              </strong>
            </div>
            <span className="text-[10px] text-[#78909C] block">
              {marketStatus.hasApiKey ? 'Key konfiguriert' : 'API Key fehlt (Secrets)'}
            </span>
          </div>

          <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#E0E3E7]">
            <span className="text-[10px] text-[#78909C] block uppercase font-bold">Last Symbol &amp; Price</span>
            <strong className="text-sm text-[#263238] block mt-0.5">
              {marketStatus.lastSymbol}: ${marketStatus.lastPrice.toFixed(2)}
            </strong>
            <span className="text-[10px] text-[#78909C] block">
              vor {Math.max(0, Math.round((Date.now() - marketStatus.lastEventTime) / 1000))}s
            </span>
          </div>
        </div>

        {/* Subscribed Symbols & Error Section */}
        <div className="space-y-2 pt-1 text-xs">
          <div>
            <span className="text-[11px] font-bold text-[#546E7A] block mb-1">
              Subscribed Symbols (Dynamische Abonnements):
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {marketStatus.subscribedSymbols.map((sym) => (
                <span
                  key={sym}
                  className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded font-bold"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>

          {/* Error / Key Guidance */}
          <div className="p-2.5 rounded border bg-[#F5F7F8] border-[#E0E3E7] text-xs">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#546E7A] mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold text-[#263238] block">
                  API Key Sicherheit (Abs. 23):
                </span>
                <p className="text-[11px] text-[#546E7A] leading-relaxed">
                  Der Finnhub WebSocket Key (<code className="font-mono bg-white px-1 py-0.2 rounded border">FINNHUB_API_KEY</code>) wird ausschließlich auf dem AI-Studio Backend verwendet und niemals an den Client oder Browser übertragen. Konfiguration erfolgt über Google AI Studio Secrets / Environment Variables.
                </p>
                {marketStatus.apiKeyRequired && (
                  <p className="text-[11px] text-[#E65100] font-bold mt-1">
                    Aktueller Status: Kein Finnhub-Key in Secrets hinterlegt. Die App nutzt automatisch den resilienten Simulator als Fallback.
                  </p>
                )}
                {marketStatus.lastError && (
                  <p className="text-[11px] text-[#C62828] font-bold mt-1">
                    Letzter Provider-Fehler: {marketStatus.lastError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3. Account Capital & Reset */}
        <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ECEFF1]">
            <RotateCcw className="w-4 h-4 text-[#7CB342]" />
            <h2 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
              Kontostand zurücksetzen
            </h2>
          </div>

          <div className="text-xs text-[#546E7A] space-y-1">
            <p>Aktuelles Barguthaben: <strong className="text-[#263238] font-mono">€{account.cashBalance.toLocaleString()}</strong></p>
            <p>Aktuelles Gesamtkapital: <strong className="text-[#263238] font-mono">€{account.equity.toLocaleString()}</strong></p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#546E7A] block mb-1">
              Schnellauswahl Startkapital:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10000, 25000, 50000, 100000, 250000, 500000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handlePresetReset(amt)}
                  className="px-2.5 py-1.5 bg-[#F5F7F8] hover:bg-[#E8F5E9] border border-[#CFD8DC] hover:border-[#7CB342] rounded text-xs font-mono font-bold text-[#263238] hover:text-[#2E7D32] transition-colors cursor-pointer"
                >
                  €{(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-bold text-[#546E7A] block mb-1">
              Benutzerdefinierter Betrag (€):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={balanceInput}
                onChange={(e) => setBalanceInput(Number(e.target.value))}
                step="5000"
                min="1000"
                className="flex-1 px-3 py-1.5 bg-[#F5F7F8] border border-[#CFD8DC] rounded text-xs font-mono font-bold text-[#263238] focus:outline-hidden focus:border-[#7CB342]"
              />
              <button
                onClick={() => handlePresetReset(balanceInput)}
                className="px-4 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Setzen
              </button>
            </div>
            <span className="text-[10px] text-[#90A4AE] mt-1 block">
              Setzt offene Positionen und Orders zurück auf das gewählte Startguthaben.
            </span>
          </div>
        </div>

        {/* 4. Execution & Fee Simulation */}
        <div className="bg-white border border-[#D8DCE1] rounded p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ECEFF1]">
            <Zap className="w-4 h-4 text-[#7CB342]" />
            <h2 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
              Order-Execution &amp; Slippage
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[#546E7A]">Taker-Gebühr (Market Orders)</span>
                <span className="font-mono font-bold text-[#263238]">{(takerFeePct * 100).toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={takerFeePct}
                onChange={(e) => setTakerFeePct(parseFloat(e.target.value))}
                className="w-full accent-[#7CB342]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[#546E7A]">Maker-Gebühr (Limit Orders)</span>
                <span className="font-mono font-bold text-[#263238]">{(makerFeePct * 100).toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={makerFeePct}
                onChange={(e) => setMakerFeePct(parseFloat(e.target.value))}
                className="w-full accent-[#7CB342]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[#546E7A]">Slippage-Modell</span>
                <span className="font-mono font-bold text-[#263238]">{slippageBps} bps</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={slippageBps}
                onChange={(e) => setSlippageBps(parseInt(e.target.value))}
                className="w-full accent-[#7CB342]"
              />
              <span className="text-[10px] text-[#90A4AE] mt-0.5 block">
                Simuliert reale Marktausführung bei Market-Orders über den Geld-/Briefkurs hinaus.
              </span>
            </div>

            <div className="pt-2 border-t border-[#ECEFF1] flex items-center justify-between">
              <span className="font-medium text-[#546E7A]">Sound-Effekte bei Trades</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded cursor-pointer border ${
                  soundEnabled ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : 'bg-[#ECEFF1] border-[#CFD8DC] text-[#78909C]'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 5. Risk Management Rules (Spec Section 23-25) */}
        <div className="md:col-span-2 bg-white border border-[#D8DCE1] rounded p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECEFF1]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7CB342]" />
              <h2 className="text-xs font-bold text-[#263238] uppercase tracking-wider">
                Risikomanagement &amp; Prop-Trading Limits
              </h2>
            </div>
            <button
              onClick={handleSaveRiskLimits}
              className="px-4 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white rounded text-xs font-bold transition-colors cursor-pointer"
            >
              Regeln speichern
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#F5F7F8] border border-[#E0E3E7] rounded">
              <span className="text-[11px] font-bold text-[#546E7A] block mb-1">
                Max. Positionsgröße
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localLimits.maxPositionSizePct}
                  onChange={(e) => setLocalLimits({ ...localLimits, maxPositionSizePct: Number(e.target.value) })}
                  className="w-20 px-2 py-1 bg-white border border-[#CFD8DC] rounded font-mono font-bold text-[#263238]"
                />
                <span className="font-bold text-[#546E7A]">% des Kontos</span>
              </div>
              <span className="text-[10px] text-[#90A4AE] mt-1 block">
                Verhindert zu hohe Konzentration auf ein Einzelasset.
              </span>
            </div>

            <div className="p-3 bg-[#F5F7F8] border border-[#E0E3E7] rounded">
              <span className="text-[11px] font-bold text-[#546E7A] block mb-1">
                Max. Tagesverlust (Daily Loss)
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localLimits.maxDailyLossPct}
                  onChange={(e) => setLocalLimits({ ...localLimits, maxDailyLossPct: Number(e.target.value) })}
                  className="w-20 px-2 py-1 bg-white border border-[#CFD8DC] rounded font-mono font-bold text-[#263238]"
                />
                <span className="font-bold text-[#546E7A]">% des Kontos</span>
              </div>
              <span className="text-[10px] text-[#90A4AE] mt-1 block">
                Stoppt Trading bei Erreichen des maximalen Tagesverlustes.
              </span>
            </div>

            <div className="p-3 bg-[#F5F7F8] border border-[#E0E3E7] rounded">
              <span className="text-[11px] font-bold text-[#546E7A] block mb-1">
                Max. Risiko pro Trade
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localLimits.maxRiskPerTradePct}
                  onChange={(e) => setLocalLimits({ ...localLimits, maxRiskPerTradePct: Number(e.target.value) })}
                  className="w-20 px-2 py-1 bg-white border border-[#CFD8DC] rounded font-mono font-bold text-[#263238]"
                />
                <span className="font-bold text-[#546E7A]">% Stop Loss</span>
              </div>
              <span className="text-[10px] text-[#90A4AE] mt-1 block">
                Empfohlen: 1% bis maximal 2% pro Setup.
              </span>
            </div>

            <div className="p-3 bg-[#F5F7F8] border border-[#E0E3E7] rounded">
              <span className="text-[11px] font-bold text-[#546E7A] block mb-1">
                Durchsetzung
              </span>
              <select
                value={localLimits.enforcementMode}
                onChange={(e) => setLocalLimits({ ...localLimits, enforcementMode: e.target.value as any })}
                className="w-full px-2 py-1 bg-white border border-[#CFD8DC] rounded font-bold text-[#263238]"
              >
                <option value="WARNING">Nur Warnung (Gelb)</option>
                <option value="REJECT">Order ablehnen (Strikt)</option>
              </select>
              <span className="text-[10px] text-[#90A4AE] mt-1 block">
                Im Prop-Modus führt Verletzung zur Ablehnung.
              </span>
            </div>
          </div>
        </div>

        {/* 5. Sitzung & Autorisierung (Passwort-Schutz) */}
        {onLogout && (
          <div className="bg-white border border-[#D8DCE1] rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ECEFF1]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#7CB342]" />
                <h2 className="text-sm font-bold text-[#263238]">Sitzung & Autorisierung</h2>
              </div>
              <span className="text-[11px] font-mono text-[#558B2F] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded font-bold">
                AKTIVE SITZUNG
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#F5F7F8] border border-[#E0E3E7] rounded-lg">
              <div>
                <p className="text-xs font-bold text-[#263238]">Gesichertes Trading-Terminal</p>
                <p className="text-[11px] text-[#546E7A] mt-0.5">
                  Sie sind über eine sichere HttpOnly-, SameSite- und Secure-Cookie-Session autorisiert.
                </p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-[#FFEBEE] hover:bg-[#FFCDD2] border border-[#FFCDD2] text-[#C62828] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                title="Sitzung beenden und abmelden"
              >
                <LogOut className="w-4 h-4 text-[#E53935]" />
                <span>Sitzung beenden (Abmelden)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
