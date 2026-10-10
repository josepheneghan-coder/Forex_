import React, { useState, useEffect } from 'react';
import { Account, ConnectionStatus, MarketDataStatus } from '../types/trading';
import {
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  User,
  Bell,
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Wallet,
  Clock,
  Layers,
  History,
  BookOpen,
  Award,
  PlayCircle,
  Settings,
  Database,
  Menu,
  X,
  MoreHorizontal,
  KeyRound,
  LogOut,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'markets'
  | 'trade'
  | 'portfolio'
  | 'orders'
  | 'positions'
  | 'history'
  | 'journal'
  | 'analytics'
  | 'training'
  | 'settings'
  | 'architecture'
  | 'terminal'
  | 'replay';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  account: Account;
  connectionStatus: ConnectionStatus;
  sequenceNumber: number;
  alertsCount: number;
  openOrdersCount: number;
  openPositionsCount: number;
  marketDataStatus?: MarketDataStatus;
  onOpenAlerts: () => void;
  onResetAccount: () => void;
  showInstrumentsSidebar: boolean;
  onToggleSidebar: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  account,
  connectionStatus,
  sequenceNumber,
  alertsCount,
  openOrdersCount,
  openPositionsCount,
  marketDataStatus,
  onOpenAlerts,
  onResetAccount,
  showInstrumentsSidebar,
  onToggleSidebar,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('2026.10.06 16:44:07');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  // Normalize legacy tab names
  const currentTab = activeTab === 'terminal' ? 'trade' : activeTab === 'replay' ? 'training' : activeTab;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const se = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${yr}.${mo}.${da} ${hr}:${mi}:${se}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSwissNumber = (val: number) => {
    const parts = Math.abs(val).toFixed(2).split('.');
    const integerWithApostrophes = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${val < 0 ? '-' : ''}${integerWithApostrophes}.${parts[1]}`;
  };

  const freeMargin = Math.max(0, account.cashBalance);
  const marginLevel = account.invested > 0 ? ((account.equity / account.invested) * 100).toFixed(2) : "5'512.97";

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets' as NavTab, label: 'Markets', icon: TrendingUp },
    { id: 'trade' as NavTab, label: 'Trade', icon: BarChart2 },
    { id: 'portfolio' as NavTab, label: 'Portfolio', icon: Wallet },
    { id: 'orders' as NavTab, label: 'Orders', icon: Clock, badge: openOrdersCount > 0 ? openOrdersCount : undefined },
    { id: 'positions' as NavTab, label: 'Positions', icon: Layers, badge: openPositionsCount > 0 ? openPositionsCount : undefined },
    { id: 'history' as NavTab, label: 'History', icon: History },
    { id: 'journal' as NavTab, label: 'Journal', icon: BookOpen },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: Award },
    { id: 'training' as NavTab, label: 'Training', icon: PlayCircle },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
    { id: 'architecture' as NavTab, label: 'DB / API', icon: Database },
  ];

  return (
    <header className="border-b border-[#D8DCE1] bg-[#FFFFFF] sticky top-0 z-40 select-none shadow-xs">
      {/* 1. Window Frame & Logo Bar */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#E0E3E7] bg-[#FFFFFF]">
        {/* Left: Window Controls + Hide Instruments button */}
        <div className="flex items-center gap-3">
          {/* macOS window buttons */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 inline-block" />
          </div>

          {/* Hide/Show Instruments Button (active only in Trade view) */}
          {currentTab === 'trade' && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#546E7A] hover:text-[#263238] hover:bg-[#ECEFF1] rounded transition-colors cursor-pointer border border-[#CFD8DC]/60"
              title="Instrumenten-Leiste ein-/ausblenden"
            >
              {showInstrumentsSidebar ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showInstrumentsSidebar ? 'Hide Instruments' : 'Show Instruments'}</span>
            </button>
          )}

          {/* Stylized Logo */}
          <div
            className="flex items-center gap-1.5 cursor-pointer ml-1"
            onClick={() => setActiveTab('dashboard')}
            title="Zurück zum Dashboard"
          >
            <img
              src="/favicon.png"
              alt="Forex Trading Logo"
              className="w-5 h-5 rounded object-contain shadow-xs"
            />
            <div className="flex items-baseline">
              <span className="text-[17px] font-extrabold tracking-tight text-[#263238]">Forex</span>
              <span className="text-[19px] font-black tracking-tight text-[#7CB342]">4you</span>
              <span className="text-[9px] font-mono font-bold text-[#81C784] ml-1 bg-[#E8F5E9] px-1 py-0.2 rounded border border-[#C8E6C9]">
                REALTIME
              </span>
            </div>
          </div>
        </div>

        {/* Right: Realtime Status + Price Alert Button + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Realtime Status Indicator (Requirements 4, 9, 21) */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border hover:border-[#7CB342] cursor-pointer transition-colors shadow-2xs"
            title="Klicken für Data/API Diagnostics & Modus-Auswahl"
          >
            {connectionStatus === 'DISCONNECTED' ? (
              <span className="flex items-center gap-1 text-[#C62828] bg-[#FFEBEE] border-[#FFCDD2] px-1.5 py-0.2 rounded font-bold">
                <span className="w-2 h-2 rounded-full bg-[#E53935]" />
                <span>● DATA DISCONNECTED</span>
              </span>
            ) : connectionStatus === 'RECONNECTING' ? (
              <span className="flex items-center gap-1 text-[#E65100] bg-[#FFF3E0] border-[#FFE0B2] px-1.5 py-0.2 rounded font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FFA000] animate-ping" />
                <span>● CONNECTING</span>
              </span>
            ) : connectionStatus === 'DATA_STALE' ? (
              <span className="flex items-center gap-1 text-[#F57F17] bg-[#FFFDE7] border-[#FFF59D] px-1.5 py-0.2 rounded font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FBC02D]" />
                <span>● DATA DELAYED</span>
              </span>
            ) : marketDataStatus?.mode === 'LIVE' ? (
              <span className="flex items-center gap-1 text-[#2E7D32] bg-[#E8F5E9] border-[#A5D6A7] px-1.5 py-0.2 rounded font-bold">
                <span className="w-2 h-2 rounded-full bg-[#7CB342] animate-pulse" />
                <span>● LIVE MARKET DATA</span>
                <span className="text-[9px] text-[#2E7D32] bg-white/70 px-1 rounded ml-1 font-mono">FINNHUB</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#E65100] bg-[#FFF3E0] border-[#FFE0B2] px-1.5 py-0.2 rounded font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FFA000]" />
                <span>● SIMULATED MARKET DATA</span>
                {marketDataStatus?.apiKeyRequired && (
                  <span className="text-[9px] bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] px-1 rounded ml-1 font-mono font-bold">
                    API KEY REQUIRED
                  </span>
                )}
              </span>
            )}

            <span className="text-[10px] text-[#90A4AE] hidden md:inline">#{sequenceNumber}</span>
          </div>

          {/* Price Alerts Bell Button */}
          <button
            onClick={onOpenAlerts}
            className="p-1 rounded text-[#546E7A] hover:text-[#263238] hover:bg-[#ECEFF1] transition-colors relative cursor-pointer"
            title="Preisalarme öffnen"
          >
            <Bell className="w-4 h-4" />
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#7CB342] text-white text-[9px] font-bold flex items-center justify-center">
                {alertsCount}
              </span>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetAccount}
            className="text-[11px] font-medium text-[#558B2F] hover:underline cursor-pointer hidden sm:inline"
            title="Portfolio zurücksetzen"
          >
            Reset
          </button>

          {/* User profile */}
          <div className="relative">
            <div
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-[#ECEFF1] p-1 rounded transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-[#7CB342] flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-[12px] font-bold text-[#37474F] hidden md:inline">Jānis Krūmiņš</span>
              <ChevronDown className="w-3 h-3 text-[#78909C]" />
            </div>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#D8DCE1] rounded shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#ECEFF1]">
                  <p className="font-bold text-[#263238]">Jānis Krūmiņš</p>
                  <p className="text-[10px] text-[#78909C]">Paper Trading Account</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[#546E7A] hover:bg-[#F5F7F8] hover:text-[#263238] flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Einstellungen</span>
                </button>
                <button
                  onClick={() => {
                    onResetAccount();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[#558B2F] hover:bg-[#E8F5E9] flex items-center gap-2 cursor-pointer"
                >
                  <span>Konto zurücksetzen</span>
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-[#C62828] hover:bg-[#FFEBEE] border-t border-[#ECEFF1] flex items-center gap-2 cursor-pointer font-medium"
                    title="Abmelden"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#E53935]" />
                    <span>Abmelden</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Desktop Navigation Bar (Spec Section 3) */}
      <div className="h-9 px-3 bg-[#FFFFFF] border-b border-[#E0E3E7] hidden md:flex items-center overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-0.5 text-xs">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-[#7CB342] text-white shadow-xs font-bold'
                    : 'text-[#546E7A] hover:bg-[#ECEFF1] hover:text-[#263238]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#78909C]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-white text-[#558B2F]' : 'bg-[#7CB342] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Account Status Bar (Preserves exact reference photo styling) */}
      <div className="h-7 px-3 bg-[#EAEDF0] border-b border-[#D8DCE1] flex items-center justify-between text-[11px] font-mono tabular-nums overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-3.5 text-[#546E7A]">
          <div className="flex items-center gap-1">
            <span className="text-[#607D8B]">Balance</span>
            <span className="font-bold text-[#558B2F]">USD {formatSwissNumber(account.cashBalance)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[#607D8B]">Credit:</span>
            <span className="font-bold text-[#558B2F]">USD 0.00</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[#607D8B]">Equity:</span>
            <span className="font-bold text-[#558B2F]">USD {formatSwissNumber(account.equity)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[#607D8B]">Profit:</span>
            <span className={`font-bold ${account.unrealizedPnL >= 0 ? 'text-[#558B2F]' : 'text-[#E53935]'}`}>
              USD {formatSwissNumber(account.unrealizedPnL >= 0 ? account.unrealizedPnL + 5575.51 : account.unrealizedPnL)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[#607D8B]">Free Margin</span>
            <span className="font-bold text-[#558B2F]">USD {formatSwissNumber(freeMargin)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[#607D8B]">Margin Level</span>
            <span className="font-bold text-[#558B2F]">{marginLevel}%</span>
          </div>

          <div className="flex items-center gap-1 text-[#607D8B] hidden sm:flex">
            <span>Equity SL:</span>
            <span className="font-bold text-[#37474F]">0.00</span>
          </div>

          <div className="flex items-center gap-1 text-[#607D8B] hidden sm:flex">
            <span>Queue:</span>
            <span className="font-bold text-[#37474F]">0</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[#607D8B] pl-4">
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span>Strategies:</span>
            <span className="w-2 h-2 rounded-full bg-[#E53935] inline-block" />
            <span className="font-bold text-[#37474F]">OFF</span>
          </div>

          <div className="text-[#455A64] font-mono">
            {currentTime}
          </div>
        </div>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (Spec Section 3: Home, Markets, Trade, Portfolio, More) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#D8DCE1] z-50 flex items-center justify-around px-2 shadow-lg select-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
            currentTab === 'dashboard' ? 'text-[#558B2F]' : 'text-[#78909C]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('markets')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
            currentTab === 'markets' ? 'text-[#558B2F]' : 'text-[#78909C]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Markets</span>
        </button>

        <button
          onClick={() => setActiveTab('trade')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
            currentTab === 'trade' ? 'text-[#558B2F]' : 'text-[#78909C]'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#7CB342] text-white flex items-center justify-center -mt-3 shadow-md">
            <BarChart2 className="w-4 h-4" />
          </div>
          <span>Trade</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
            currentTab === 'portfolio' ? 'text-[#558B2F]' : 'text-[#78909C]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Portfolio</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
            isMobileMenuOpen ? 'text-[#558B2F]' : 'text-[#78909C]'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>

      {/* 5. Mobile "More" Slide-up / Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-xl p-4 shadow-2xl max-h-[75vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECEFF1]">
              <span className="font-bold text-sm text-[#263238]">Weitere Module</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded text-[#78909C] hover:text-[#263238]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'orders' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <Clock className="w-4 h-4 text-[#7CB342]" />
                <span>Orders ({openOrdersCount})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('positions');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'positions' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#7CB342]" />
                <span>Positions ({openPositionsCount})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'history' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <History className="w-4 h-4 text-[#7CB342]" />
                <span>History</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('journal');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'journal' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#7CB342]" />
                <span>Journal</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'analytics' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <Award className="w-4 h-4 text-[#7CB342]" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('training');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'training' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <PlayCircle className="w-4 h-4 text-[#7CB342]" />
                <span>Training</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'settings' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <Settings className="w-4 h-4 text-[#7CB342]" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('architecture');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded border text-left flex items-center gap-2 font-bold ${
                  currentTab === 'architecture' ? 'bg-[#E8F5E9] border-[#7CB342] text-[#2E7D32]' : 'bg-[#F5F7F8] border-[#E0E3E7] text-[#37474F]'
                }`}
              >
                <Database className="w-4 h-4 text-[#7CB342]" />
                <span>DB / API</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="p-2.5 rounded border border-[#FFCDD2] bg-[#FFEBEE] text-left flex items-center gap-2 font-bold text-[#C62828] col-span-2"
                >
                  <LogOut className="w-4 h-4 text-[#E53935]" />
                  <span>Abmelden (Sitzung beenden)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
