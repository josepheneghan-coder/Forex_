import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setErrorMessage('Bitte geben Sie das Passwort ein.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cleanPassword = password.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: cleanPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        onLoginSuccess(data.token);
      } else {
        // Neutrale Fehlermeldung wie gewünscht: "Falsches Passwort"
        setErrorMessage(data.message || 'Falsches Passwort');
      }
    } catch {
      setErrorMessage('Verbindungsfehler zum Autorisierungsserver. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 selection:bg-[#7CB342]/20 selection:text-[#2E7D32]">
      {/* Background Decorative subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#CFD8DC_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* Main Login Card with macOS window header */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#D8DCE1] shadow-2xl overflow-hidden relative z-10 transition-all">
        {/* Window title bar */}
        <div className="h-10 px-4 bg-[#FFFFFF] border-b border-[#E0E3E7] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#78909C]">
            <Lock className="w-3 h-3 text-[#7CB342]" />
            <span>TERMINAL_ACCESS // PROTECTED</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/favicon.png"
                alt="Forex Trading Logo"
                className="w-8 h-8 rounded-lg object-contain shadow-xs"
              />
              <div className="flex items-baseline">
                <span className="text-[24px] font-extrabold tracking-tight text-[#263238]">Forex</span>
                <span className="text-[26px] font-black tracking-tight text-[#7CB342]">4you</span>
                <span className="text-[10px] font-mono font-bold text-[#81C784] ml-1.5 bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#C8E6C9]">
                  REALTIME
                </span>
              </div>
            </div>
            <h1 className="text-lg font-bold text-[#263238] mt-1">Trading Terminal Autorisierung</h1>
            <p className="text-xs text-[#546E7A] mt-1 max-w-xs">
              Geben Sie das Zugangspasswort ein, um das Live-Trading-Terminal zu entsperren.
            </p>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] flex items-center gap-2.5 text-xs text-[#C62828] font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E53935]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="site-password-input"
                className="block text-xs font-bold text-[#37474F] mb-1.5 uppercase tracking-wider"
              >
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#90A4AE]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="site-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben..."
                  autoComplete="current-password"
                  autoFocus
                  disabled={isLoading}
                  className="w-full pl-10 pr-11 py-2.5 bg-[#F8FAFC] border border-[#CFD8DC] rounded-xl text-sm font-mono text-[#263238] placeholder-[#90A4AE] focus:bg-white focus:outline-none focus:border-[#7CB342] focus:ring-2 focus:ring-[#7CB342]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#90A4AE] hover:text-[#546E7A] transition-colors cursor-pointer"
                  title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#7CB342] hover:bg-[#689F38] active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Überprüfe Autorisierung...</span>
                </>
              ) : (
                <>
                  <span>Terminal entsperren</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Features Info Box */}
          <div className="mt-6 pt-5 border-t border-[#ECEFF1] space-y-2 text-[11px] text-[#78909C]">
            <div className="flex items-center justify-center gap-1.5 font-medium text-[#546E7A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7CB342]" />
              <span>Sichere HttpOnly Cookie Session (SameSite & Secure)</span>
            </div>
            <div className="text-center font-mono text-[10px] text-[#90A4AE]">
              Serverseitige Passwort-Validierung • Kein Benutzerkonto erforderlich
            </div>
          </div>
        </div>

        {/* Card Footer Strip */}
        <div className="px-4 py-2 bg-[#F5F7F8] border-t border-[#E0E3E7] flex items-center justify-between text-[10px] font-mono text-[#78909C]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7CB342]" />
            <span>PROTECTED GATEWAY</span>
          </div>
          <span>v1.0.0-PROD</span>
        </div>
      </div>

      {/* Outer subtle copyright */}
      <div className="mt-4 text-center text-xs text-[#90A4AE]">
        Forex4you Realtime Terminal • Vollständige Simulations- & Analyseplattform
      </div>
    </div>
  );
};
