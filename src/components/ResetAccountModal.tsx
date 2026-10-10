import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface ResetAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (newBalance: number) => void;
  currentBalance: number;
}

export const ResetAccountModal: React.FC<ResetAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [selectedBalance, setSelectedBalance] = useState<number>(100000);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white border border-[#D8DCE1] rounded max-w-sm w-full p-5 space-y-4 text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E0E3E7] pb-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#FFA000]" />
            <h2 className="text-sm font-bold text-[#263238]">Konto zurücksetzen</h2>
          </div>
          <button onClick={onClose} className="text-[#90A4AE] hover:text-[#263238] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[#546E7A] text-[11px] leading-relaxed">
          Wähle dein Startkapital für die Paper-Trading-Simulation. Alle Positionen werden glattgestellt.
        </p>

        <div className="space-y-2">
          {[10000, 25000, 100000].map((amt) => (
            <button
              key={amt}
              onClick={() => setSelectedBalance(amt)}
              className={`w-full p-2.5 rounded border text-left flex justify-between font-mono cursor-pointer transition-colors ${
                selectedBalance === amt
                  ? 'bg-[#F1F8E9] border-[#7CB342] text-[#2E7D32] font-bold'
                  : 'bg-white border-[#CFD8DC] text-[#37474F] hover:bg-[#F5F7F8]'
              }`}
            >
              <span>USD {amt.toLocaleString()}</span>
              {selectedBalance === amt && <span>✓</span>}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E3E7]">
          <button onClick={onClose} className="px-3 py-1.5 text-[#78909C] hover:text-[#263238]">
            Abbrechen
          </button>
          <button
            onClick={() => {
              onConfirmReset(selectedBalance);
              onClose();
            }}
            className="px-4 py-1.5 bg-[#7CB342] hover:bg-[#689F38] text-white font-bold rounded cursor-pointer"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
};
