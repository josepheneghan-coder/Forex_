import React, { useState } from 'react';
import { PriceAlert, Asset } from '../types/trading';
import { Bell, X, Trash2, Plus, CheckCircle2 } from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  assets: Asset[];
  onAddAlert: (symbol: string, targetPrice: number, condition: 'ABOVE_OR_EQUAL' | 'BELOW_OR_EQUAL') => void;
  onRemoveAlert: (id: string) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  assets,
  onAddAlert,
  onRemoveAlert,
}) => {
  const [symbol, setSymbol] = useState(assets[0]?.symbol || 'AUDUSD');
  const [targetPrice, setTargetPrice] = useState('1.6150');
  const [condition, setCondition] = useState<'ABOVE_OR_EQUAL' | 'BELOW_OR_EQUAL'>('ABOVE_OR_EQUAL');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (price > 0) {
      onAddAlert(symbol, price, condition);
      setTargetPrice('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white border border-[#D8DCE1] rounded max-w-md w-full p-5 space-y-4 text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E0E3E7] pb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#7CB342]" />
            <h2 className="text-sm font-bold text-[#263238]">Preisalarme verwalten (Spec Abs. 24)</h2>
          </div>
          <button onClick={onClose} className="text-[#90A4AE] hover:text-[#263238] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Alert Form */}
        <form onSubmit={handleAdd} className="space-y-3 p-3 bg-[#F5F7F8] rounded border border-[#E0E3E7]">
          <span className="font-bold text-[#263238] block text-[11px]">Neuen Alarm definieren</span>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-[#546E7A] mb-0.5">Asset:</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-white border border-[#CFD8DC] rounded px-2 py-1 font-bold text-[#263238]"
              >
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#546E7A] mb-0.5">Bedingung:</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-white border border-[#CFD8DC] rounded px-2 py-1 text-[#263238]"
              >
                <option value="ABOVE_OR_EQUAL">&ge; (Größer/Gleich)</option>
                <option value="BELOW_OR_EQUAL">&le; (Kleiner/Gleich)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#546E7A] mb-0.5">Zielpreis:</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="1.6150"
                className="w-full bg-white border border-[#CFD8DC] rounded px-2 py-1 font-mono text-[#263238]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white font-bold rounded cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Preisalarm aktivieren</span>
          </button>
        </form>

        {/* Existing Alerts List */}
        <div className="space-y-2 max-h-56 overflow-y-auto">
          <span className="font-bold text-[#546E7A] text-[11px] block">Aktive Alarme ({alerts.length})</span>
          {alerts.length === 0 ? (
            <p className="text-[#90A4AE] text-center py-4">Keine Alarme konfiguriert.</p>
          ) : (
            alerts.map((al) => (
              <div
                key={al.id}
                className="p-2.5 rounded border border-[#E0E3E7] bg-white flex items-center justify-between font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#263238] font-sans">{al.symbol}</span>
                  <span className="text-[#546E7A]">
                    {al.condition === 'ABOVE_OR_EQUAL' ? '≥' : '≤'} {al.targetPrice.toFixed(4)}
                  </span>
                  {al.isTriggered && (
                    <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ausgelöst
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onRemoveAlert(al.id)}
                  className="text-[#90A4AE] hover:text-[#E53935] cursor-pointer p-1"
                  title="Alarm entfernen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#E0E3E7]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#ECEFF1] hover:bg-[#CFD8DC] text-[#37474F] font-bold rounded cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
