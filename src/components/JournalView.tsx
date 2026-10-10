import React, { useState } from 'react';
import { JournalEntry, OrderSide } from '../types/trading';
import { BookOpen, Plus, Trash2, Calendar } from 'lucide-react';

interface JournalViewProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (id: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [symbol, setSymbol] = useState('AUDUSD');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [strategy, setStrategy] = useState('Trend-Following Breakout');
  const [setup, setSetup] = useState('Pullback an MA20 Support');
  const [reason, setReason] = useState('Starker Kaufdruck im Orderbuch, Higher Lows im 1h Chart.');
  const [marketContext, setMarketContext] = useState('Gesamtmarkt bullisch, niedrige Volatilität.');
  const [emotion, setEmotion] = useState<JournalEntry['emotion']>('Diszipliniert');
  const [notes, setNotes] = useState('Stop-Loss strikt unter Swings-Tief platziert.');
  const [plannedEntry, setPlannedEntry] = useState('1.6100');
  const [plannedStop, setPlannedStop] = useState('1.6050');
  const [plannedTarget, setPlannedTarget] = useState('1.6220');

  const pEntry = parseFloat(plannedEntry) || 0;
  const pStop = parseFloat(plannedStop) || 0;
  const pTarget = parseFloat(plannedTarget) || 0;
  const risk = Math.abs(pEntry - pStop);
  const reward = Math.abs(pTarget - pEntry);
  const riskRewardRatio = risk > 0 ? (reward / risk) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({
      accountId: 'acc_demo_paper_1',
      symbol,
      side,
      strategy,
      setup,
      reason,
      marketContext,
      emotion,
      notes,
      plannedEntry: pEntry || undefined,
      plannedStop: pStop || undefined,
      plannedTarget: pTarget || undefined,
      plannedRiskReward: Number(riskRewardRatio.toFixed(2)) || undefined,
    });
    setIsCreating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 select-none">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#D8DCE1] rounded shadow-xs">
        <div>
          <h1 className="text-base font-bold text-[#263238]">Trading Journal (Spec Abs. 22)</h1>
          <p className="text-xs text-[#78909C]">Dokumentiere Setups, Emotionen, Marktkontext und Chance-Risiko-Verhältnisse.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white text-xs font-bold rounded cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Schließen' : 'Neuen Eintrag anlegen'}</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="p-4 bg-white border border-[#D8DCE1] rounded text-xs space-y-3">
          <h2 className="font-bold text-[#263238] border-b border-[#E0E3E7] pb-2">Trade dokumentieren</h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[#546E7A] mb-1">Symbol:</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 font-bold text-[#263238]"
                required
              />
            </div>
            <div>
              <label className="block text-[#546E7A] mb-1">Richtung:</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as OrderSide)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 text-[#263238]"
              >
                <option value="BUY">BUY (Long)</option>
                <option value="SELL">SELL (Short / Glattstellen)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#546E7A] mb-1">Strategie:</label>
              <input
                type="text"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 text-[#263238]"
                required
              />
            </div>
            <div>
              <label className="block text-[#546E7A] mb-1">Setup:</label>
              <input
                type="text"
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 text-[#263238]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#546E7A] mb-1">Einstieg:</label>
              <input
                type="number"
                step="any"
                value={plannedEntry}
                onChange={(e) => setPlannedEntry(e.target.value)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 font-mono text-[#263238]"
              />
            </div>
            <div>
              <label className="block text-[#546E7A] mb-1">Stop-Loss:</label>
              <input
                type="number"
                step="any"
                value={plannedStop}
                onChange={(e) => setPlannedStop(e.target.value)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 font-mono text-[#263238]"
              />
            </div>
            <div>
              <label className="block text-[#546E7A] mb-1">Take-Profit:</label>
              <input
                type="number"
                step="any"
                value={plannedTarget}
                onChange={(e) => setPlannedTarget(e.target.value)}
                className="w-full border border-[#CFD8DC] rounded p-1.5 font-mono text-[#263238]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E3E7]">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-[#78909C] hover:text-[#263238]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white font-bold rounded"
            >
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 bg-white border border-[#D8DCE1] rounded text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#263238] text-sm">{entry.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  entry.side === 'BUY' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                }`}>
                  {entry.side}
                </span>
                <span className="text-[#546E7A]">· {entry.strategy}</span>
              </div>
              <button onClick={() => onDeleteEntry(entry.id)} className="text-[#90A4AE] hover:text-[#E53935]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F5F7F8] p-2.5 rounded font-mono text-[11px]">
              <div><span className="text-[#78909C]">Setup:</span> {entry.setup}</div>
              <div><span className="text-[#78909C]">CRV:</span> 1 : {entry.plannedRiskReward || '2.69'}</div>
              <div><span className="text-[#78909C]">Emotion:</span> {entry.emotion}</div>
            </div>

            <p className="text-[#37474F]"><strong className="text-[#546E7A]">Grund:</strong> {entry.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
