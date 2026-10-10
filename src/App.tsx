/**
 * PaperTrade v1.0 - Main Application Component
 * Ausgestattet mit dem zentralen Echtzeit-Tracker (Spec Abs. 1–31)
 * Vollständige Navigation: Dashboard, Markets, Trade, Portfolio, Orders, Positions, History, Journal, Analytics, Training, Settings
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Account,
  Asset,
  Candle,
  ConnectionStatus,
  Execution,
  JournalEntry,
  Order,
  OrderSide,
  OrderType,
  Position,
  PriceAlert,
  Quote,
  RealtimeEvent,
  TradingLimits,
} from './types/trading';
import {
  ASSET_CATALOG,
  INITIAL_ACCOUNT,
  INITIAL_QUOTES,
  INITIAL_TRADING_LIMITS,
  generateCandles,
} from './data/marketData';
import { Header, NavTab } from './components/Header';
import { TerminalView } from './components/TerminalView';
import { DashboardView } from './components/DashboardView';
import { MarketsView } from './components/MarketsView';
import { PortfolioView } from './components/PortfolioView';
import { OrdersView } from './components/OrdersView';
import { PositionsView } from './components/PositionsView';
import { HistoryView } from './components/HistoryView';
import { HistoricalReplayView } from './components/HistoricalReplayView';
import { JournalView } from './components/JournalView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { ArchitectureView } from './components/ArchitectureView';
import { ResetAccountModal } from './components/ResetAccountModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { LoginView } from './components/LoginView';
import { PaperTradeEngine } from './services/executionEngine';
import { realtimeTracker } from './services/realtimeTracker';
import { Bell } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('trade');
  const [account, setAccount] = useState<Account>(INITIAL_ACCOUNT);
  const [assets] = useState<Asset[]>(ASSET_CATALOG);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSET_CATALOG[0]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>(INITIAL_QUOTES);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1m');

  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: 'jrn_1',
      accountId: 'acc_demo_paper_1',
      symbol: 'AUDUSD',
      side: 'BUY',
      strategy: 'Breakout-Momentum',
      setup: 'Ausbruch über 1.6100 mit Volumenbestätigung',
      reason: 'Starker Kaufdruck im Orderbuch, Higher Lows.',
      marketContext: 'Forex-Markt stabil.',
      emotion: 'Diszipliniert',
      notes: 'Stop strikt bei 1.6050 gesetzt, Teilverkauf bei 1.6180 geplant.',
      plannedEntry: 1.6100,
      plannedStop: 1.6050,
      plannedTarget: 1.6180,
      plannedRiskReward: 1.6,
      createdAt: Date.now() - 3600000 * 2,
    },
  ]);

  const [limits, setLimits] = useState<TradingLimits>(INITIAL_TRADING_LIMITS);
  const [todayTradesCount, setTodayTradesCount] = useState<number>(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(realtimeTracker.getStatus());
  const [sequenceNumber, setSequenceNumber] = useState<number>(realtimeTracker.getSequence());
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(realtimeTracker.getAlerts());
  const [alertToast, setAlertToast] = useState<string | null>(null);

  const [lastFeedback, setLastFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthenticated' | 'authenticated'>('checking');

  // Active refs to maintain persistent quote subscriptions without dependency thrashing
  const selectedAssetRef = useRef<Asset>(selectedAsset);
  selectedAssetRef.current = selectedAsset;

  const timeframeRef = useRef<string>(timeframe);
  timeframeRef.current = timeframe;

  const accountRef = useRef<Account>(account);
  accountRef.current = account;

  const positionsRef = useRef<Position[]>(positions);
  positionsRef.current = positions;

  // Helper function to resolve timeframe in minutes
  const getTimeframeMinutes = (tf: string): number => {
    switch (tf) {
      case '1m': return 1;
      case '5m': return 5;
      case '15m': return 15;
      case '1h': return 60;
      case '4h': return 240;
      case '1D': return 1440;
      default: return 1;
    }
  };

  // Verify active session on mount via HttpOnly cookie endpoint (with persistent token fallback)
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const storedToken = localStorage.getItem('forex_session_token');
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const res = await fetch('/api/auth/session', {
          credentials: 'include',
          headers,
        });
        const data = await res.json().catch(() => ({ authenticated: false }));
        if (isMounted) {
          if (data.authenticated) {
            setAuthStatus('authenticated');
          } else {
            localStorage.removeItem('forex_session_token');
            setAuthStatus('unauthenticated');
          }
        }
      } catch {
        if (isMounted) {
          setAuthStatus('unauthenticated');
        }
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (token?: string) => {
    if (token) {
      try {
        localStorage.setItem('forex_session_token', token);
      } catch {
        // ignore storage quota errors in private browsing
      }
    }
    setAuthStatus('authenticated');
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('forex_session_token');
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setAuthStatus('unauthenticated');
  };

  // Initialize Candles when selected asset or timeframe changes (only if authenticated)
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    realtimeTracker.subscribeSymbol(selectedAsset.symbol);
    const quote = quotes[selectedAsset.symbol] || INITIAL_QUOTES[selectedAsset.symbol];
    const initialPrice = quote ? quote.lastPrice : 1.6100;
    const intervalMins = getTimeframeMinutes(timeframe);
    const decimals = selectedAsset.pricePrecision ?? (selectedAsset.symbol.includes('JPY') ? 3 : 4);
    setCandles(generateCandles(initialPrice, 70, intervalMins, decimals));
  }, [selectedAsset.symbol, timeframe, authStatus]);

  // Subscribe to Central Realtime Tracker Event Bus (only if authenticated)
  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    // 1. Status listener
    const unsubStatus = realtimeTracker.subscribe('status', (evt) => {
      setConnectionStatus(evt.data as ConnectionStatus);
    });

    // 2. Quote updates listener (Throttled at 16 updates/sec)
    const unsubQuotes = realtimeTracker.subscribe('quote.update', (evt: RealtimeEvent<Quote>) => {
      const q = evt.data;
      setSequenceNumber(evt.sequence);

      setQuotes((prev) => ({
        ...prev,
        [q.symbol]: q,
      }));

      // Update active candle if this is the selected asset (Abs. 13 & Req. 2)
      if (q.symbol === selectedAssetRef.current.symbol) {
        const intervalMins = getTimeframeMinutes(timeframeRef.current);
        const intervalMs = intervalMins * 60 * 1000;
        const tickTime = q.timestamp || Date.now();
        const currentBucketTime = Math.floor(tickTime / intervalMs) * intervalMs;

        setCandles((prevCandles) => {
          if (!prevCandles || prevCandles.length === 0) {
            return [{
              time: currentBucketTime,
              open: q.lastPrice,
              high: q.lastPrice,
              low: q.lastPrice,
              close: q.lastPrice,
              volume: 1,
            }];
          }

          const lastCandle = prevCandles[prevCandles.length - 1];

          // Fall 1: Laufende Kerze im aktuellen Intervall aktualisieren
          if (lastCandle.time === currentBucketTime) {
            // Open bleibt fix. High, Low, Close und Volume werden angepasst.
            const updatedLast: Candle = {
              ...lastCandle,
              high: Math.max(lastCandle.high, q.lastPrice),
              low: Math.min(lastCandle.low, q.lastPrice),
              close: q.lastPrice,
              volume: (lastCandle.volume || 0) + 1,
            };
            return [...prevCandles.slice(0, -1), updatedLast];
          } else if (currentBucketTime > lastCandle.time) {
            // Fall 2: Intervall abgelaufen -> Vorherige Kerze bleibt stabil in der Historie, neue Kerze beginnt
            const newCandle: Candle = {
              time: currentBucketTime,
              open: lastCandle.close,
              high: Math.max(lastCandle.close, q.lastPrice),
              low: Math.min(lastCandle.close, q.lastPrice),
              close: q.lastPrice,
              volume: 1,
            };
            const nextList = [...prevCandles, newCandle];
            if (nextList.length > 100) {
              return nextList.slice(nextList.length - 100);
            }
            return nextList;
          } else {
            // Fall 3: Out-of-Order Quote älter als letzte Kerze
            const updatedLast: Candle = {
              ...lastCandle,
              high: Math.max(lastCandle.high, q.lastPrice),
              low: Math.min(lastCandle.low, q.lastPrice),
              close: q.lastPrice,
            };
            return [...prevCandles.slice(0, -1), updatedLast];
          }
        });
      }

      // Check open orders against new live quote (Abs. 11 & 12)
      setOrders((prevOrders) => {
        const openOrders = prevOrders.filter((o) => o.status === 'OPEN' && o.symbol === q.symbol);
        if (openOrders.length > 0) {
          const checkRes = PaperTradeEngine.checkPendingOrders(
            openOrders,
            q,
            selectedAssetRef.current,
            accountRef.current,
            positionsRef.current
          );

          if (checkRes.executedOrders.length > 0) {
            setAccount(checkRes.updatedAccount);
            setPositions(checkRes.updatedPositions);
            setExecutions((ex) => [...checkRes.newExecutions, ...ex]);
            setLastFeedback({
              success: true,
              message: `Limit-Order für ${q.symbol} atomar ausgeführt!`,
            });
            realtimeTracker.playAlertSound();
            return prevOrders.map((o) => {
              const filled = checkRes.executedOrders.find((x) => x.id === o.id);
              return filled || o;
            });
          }
        }
        return prevOrders;
      });

      // Position revaluation (Abs. 8 & 10)
      setPositions((prevPositions) => {
        const hasPos = prevPositions.some((p) => p.symbol === q.symbol);
        if (!hasPos) return prevPositions;

        const updated = prevPositions.map((pos) => {
          if (pos.symbol !== q.symbol) return pos;
          const currentBid = q.bid;
          const unPnL = (currentBid - pos.averageEntryPrice) * pos.quantity;
          const unPnLPct = ((currentBid - pos.averageEntryPrice) / pos.averageEntryPrice) * 100;
          return {
            ...pos,
            currentPrice: currentBid,
            marketValue: pos.quantity * currentBid,
            unrealizedPnL: unPnL,
            unrealizedPnLPercent: unPnLPct,
            updatedAt: Date.now(),
          };
        });

        // Portfolio revaluation (Abs. 8 & 9)
        const totalInvested = updated.reduce((sum, p) => sum + p.marketValue, 0);
        const totalUnrealized = updated.reduce((sum, p) => sum + p.unrealizedPnL, 0);
        const currentAcc = accountRef.current;
        const newEquity = currentAcc.cashBalance + totalInvested;
        setAccount((prevAcc) => ({
          ...prevAcc,
          invested: totalInvested,
          unrealizedPnL: totalUnrealized,
          equity: newEquity,
          totalPnL: newEquity - prevAcc.initialBalance,
          returnPercent: ((newEquity - prevAcc.initialBalance) / prevAcc.initialBalance) * 100,
        }));

        return updated;
      });
    });

    // 3. Price Alert trigger listener (Abs. 24)
    const unsubAlerts = realtimeTracker.subscribe('price_alert.triggered', (evt) => {
      setAlertToast(evt.data.message);
      setPriceAlerts(realtimeTracker.getAlerts());
      setTimeout(() => setAlertToast(null), 5000);
    });

    return () => {
      unsubStatus();
      unsubQuotes();
      unsubAlerts();
    };
  }, [authStatus]);

  // Execute Order Handler (Abs. 12)
  const handleExecuteOrder = useCallback((
    side: OrderSide,
    orderType: OrderType,
    quantity: number,
    limitPrice?: number,
    stopPrice?: number
  ) => {
    const quote = quotes[selectedAsset.symbol] || INITIAL_QUOTES[selectedAsset.symbol];
    const result = PaperTradeEngine.executeOrder(
      account,
      selectedAsset,
      quote,
      side,
      orderType,
      quantity,
      positions,
      limitPrice,
      stopPrice,
      limits,
      todayTradesCount
    );

    setOrders((prev) => [result.order, ...prev]);

    if (result.order.status === 'FILLED') {
      setAccount(result.updatedAccount);
      setPositions(result.updatedPositions);
      if (result.execution) {
        setExecutions((prev) => [result.execution!, ...prev]);
      }
      setTodayTradesCount((prev) => prev + 1);
      realtimeTracker.emitEvent('order.filled', result.order);
      realtimeTracker.playAlertSound();
      setLastFeedback({
        success: true,
        message: `${side} ${quantity} ${selectedAsset.symbol} ausgeführt @ ${result.order.averageFillPrice?.toFixed(selectedAsset.pricePrecision)}`,
      });
    } else if (result.order.status === 'OPEN') {
      realtimeTracker.emitEvent('order.created', result.order);
      setLastFeedback({
        success: true,
        message: `Limit-Order platziert @ ${limitPrice?.toFixed(selectedAsset.pricePrecision)}`,
      });
    } else {
      setLastFeedback({
        success: false,
        message: result.order.rejectionReason || 'Order abgewiesen.',
      });
    }

    setTimeout(() => setLastFeedback(null), 4000);
  }, [account, selectedAsset, quotes, positions, limits, todayTradesCount]);

  // Close Position Handler
  const handleClosePosition = useCallback((symbol: string, quantity: number) => {
    const asset = assets.find((a) => a.symbol === symbol) || selectedAsset;
    const quote = quotes[symbol] || INITIAL_QUOTES[symbol];

    const result = PaperTradeEngine.executeOrder(
      account,
      asset,
      quote,
      'SELL',
      'MARKET',
      quantity,
      positions,
      undefined,
      undefined,
      limits,
      todayTradesCount
    );

    setOrders((prev) => [result.order, ...prev]);
    if (result.order.status === 'FILLED') {
      setAccount(result.updatedAccount);
      setPositions(result.updatedPositions);
      if (result.execution) {
        setExecutions((prev) => [result.execution!, ...prev]);
      }
      realtimeTracker.emitEvent('order.filled', result.order);
      realtimeTracker.playAlertSound();
      setLastFeedback({
        success: true,
        message: `Position ${symbol} geschlossen. Realisierter P&L: €${result.realizedPnLThisTrade.toFixed(2)}`,
      });
    }
  }, [account, assets, selectedAsset, quotes, positions, limits, todayTradesCount]);

  // Cancel Order Handler
  const handleCancelOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED', updatedAt: Date.now() } : o))
    );
    realtimeTracker.emitEvent('order.cancelled', { orderId });
    setLastFeedback({ success: true, message: 'Order storniert.' });
    setTimeout(() => setLastFeedback(null), 3000);
  }, []);

  // Reset Account Handler
  const handleResetAccount = useCallback((newBalance: number = 100000) => {
    setAccount({
      id: 'acc_demo_paper_1',
      name: 'Paper Trading Account',
      currency: 'EUR',
      initialBalance: newBalance,
      cashBalance: newBalance,
      equity: newBalance,
      buyingPower: newBalance,
      invested: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      dailyPnL: 0,
      returnPercent: 0,
    });
    setPositions([]);
    setOrders([]);
    setTodayTradesCount(0);
    setLastFeedback({
      success: true,
      message: `Konto auf €${newBalance.toLocaleString()} zurückgesetzt.`,
    });
    setTimeout(() => setLastFeedback(null), 3000);
  }, []);

  const handleAddJournalEntry = useCallback((entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: 'jrn_' + Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    setLastFeedback({ success: true, message: 'Journal-Eintrag gespeichert.' });
    setTimeout(() => setLastFeedback(null), 3000);
  }, []);

  const handleDeleteJournalEntry = useCallback((id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleAddAlert = (symbol: string, targetPrice: number, condition: 'ABOVE_OR_EQUAL' | 'BELOW_OR_EQUAL') => {
    realtimeTracker.addAlert(symbol, targetPrice, condition);
    setPriceAlerts(realtimeTracker.getAlerts());
    setLastFeedback({ success: true, message: `Preisalarm für ${symbol} aktiviert.` });
    setTimeout(() => setLastFeedback(null), 3000);
  };

  const handleRemoveAlert = (id: string) => {
    realtimeTracker.removeAlert(id);
    setPriceAlerts(realtimeTracker.getAlerts());
  };

  const handleNavigateToTrade = useCallback((symbol: string) => {
    const found = assets.find((a) => a.symbol === symbol);
    if (found) {
      setSelectedAsset(found);
    }
    setActiveTab('trade');
  }, [assets]);

  // Loading Screen while verifying active HttpOnly session
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Forex Trading Logo" className="w-8 h-8 rounded-lg shadow-xs" />
            <div className="flex items-baseline">
              <span className="text-2xl font-extrabold tracking-tight text-[#263238]">Forex</span>
              <span className="text-2xl font-black tracking-tight text-[#7CB342]">4you</span>
              <span className="text-[10px] font-mono font-bold text-[#81C784] ml-1.5 bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#C8E6C9]">
                REALTIME
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#546E7A] mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7CB342] animate-ping" />
            <span>Sitzung wird verifiziert...</span>
          </div>
        </div>
      </div>
    );
  }

  // Elegant Login Screen when unauthenticated (No protected trading content is rendered)
  if (authStatus === 'unauthenticated') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#263238] flex flex-col selection:bg-lime-500/20 selection:text-lime-900 font-sans">
      {/* Forex4you Top Window Frame & Metrics Strip */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        account={account}
        connectionStatus={connectionStatus}
        sequenceNumber={sequenceNumber}
        alertsCount={priceAlerts.filter((a) => !a.isTriggered).length}
        openOrdersCount={orders.filter((o) => o.status === 'OPEN').length}
        openPositionsCount={positions.length}
        marketDataStatus={realtimeTracker.getMarketDataStatus()}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onResetAccount={() => setIsResetModalOpen(true)}
        showInstrumentsSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onLogout={handleLogout}
      />

      {/* Floating Price Alert Notification Banner (Spec Abs. 24) */}
      {alertToast && (
        <div className="fixed top-12 right-4 z-50 bg-[#E8F5E9] border border-[#7CB342] text-[#2E7D32] px-4 py-2.5 rounded shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
          <Bell className="w-4 h-4 text-[#7CB342]" />
          <span>{alertToast}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-x-hidden pb-16 md:pb-0">
        {(activeTab === 'trade' || activeTab === 'terminal') && (
          <TerminalView
            assets={assets}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            quotes={quotes}
            candles={candles}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            account={account}
            positions={positions}
            orders={orders}
            executions={executions}
            limits={limits}
            todayTradesCount={todayTradesCount}
            showSidebar={showSidebar}
            onExecuteOrder={handleExecuteOrder}
            onClosePosition={handleClosePosition}
            onCancelOrder={handleCancelOrder}
            lastFeedback={lastFeedback}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            account={account}
            positions={positions}
            orders={orders}
            executions={executions}
            assets={assets}
            quotes={quotes}
            selectedSymbol={selectedAsset.symbol}
            onNavigateToTrade={handleNavigateToTrade}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsView
            assets={assets}
            quotes={quotes}
            onSelectAssetAndTrade={handleNavigateToTrade}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            account={account}
            positions={positions}
            assets={assets}
            quotes={quotes}
            executions={executions}
            onNavigateToTrade={handleNavigateToTrade}
            onClosePosition={handleClosePosition}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            assets={assets}
            onCancelOrder={handleCancelOrder}
            onNavigateToTrade={handleNavigateToTrade}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsView
            positions={positions}
            assets={assets}
            quotes={quotes}
            onClosePosition={handleClosePosition}
            onNavigateToTrade={handleNavigateToTrade}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            executions={executions}
            assets={assets}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView
            entries={journalEntries}
            onAddEntry={handleAddJournalEntry}
            onDeleteEntry={handleDeleteJournalEntry}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            account={account}
            executions={executions}
            limits={limits}
            onUpdateLimits={setLimits}
          />
        )}

        {(activeTab === 'training' || activeTab === 'replay') && (
          <HistoricalReplayView />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            account={account}
            limits={limits}
            onUpdateLimits={setLimits}
            onResetAccount={handleResetAccount}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Reset Account Modal */}
      <ResetAccountModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleResetAccount}
        currentBalance={account.cashBalance}
      />

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={priceAlerts}
        assets={assets}
        onAddAlert={handleAddAlert}
        onRemoveAlert={handleRemoveAlert}
      />
    </div>
  );
}
