/**
 * PaperTrade v1.0 - Core Execution Engine
 * Deterministische Handelslogik gemäß Spezifikation v1.0:
 * - Streng getrennter Ask-Kauf und Bid-Verkauf (Spread-Handling)
 * - Konfigurierbare Slippage (Market Orders)
 * - Transaktionsgebühren (0.10% Standard)
 * - Gewichteter Average Entry Price
 * - Exakte Realized & Unrealized P&L
 * - Validierung von Cash, Buying Power und Risikolimits
 */

import {
  Account,
  Asset,
  Execution,
  Order,
  OrderSide,
  OrderType,
  Position,
  Quote,
  TradingLimits,
} from '../types/trading';

export class PaperTradeEngine {
  public static readonly DEFAULT_FEE_RATE = 0.0010; // 0.10% wie in Spezifikation Abs. 11
  public static readonly DEFAULT_BASE_SLIPPAGE = 0.0005; // 0.05% Basisslippage Abs. 10

  /**
   * Berechnet den dynamischen Slippage-Effekt für Market Orders
   */
  public static calculateSlippage(orderValue: number, baseRate = this.DEFAULT_BASE_SLIPPAGE): number {
    // Slippage skaliert mit der relativen Ordergröße
    const liquidityDepth = 250000;
    const impact = Math.sqrt(Math.max(0, orderValue / liquidityDepth)) * 0.001;
    return Math.min(baseRate + impact, 0.03); // Cap bei 3%
  }

  /**
   * Führt eine Pre-Flight Order-Validierung durch (Abs. 14 & 25)
   */
  public static validateOrder(
    account: Account,
    asset: Asset,
    quote: Quote,
    side: OrderSide,
    orderType: OrderType,
    quantity: number,
    limitPrice?: number,
    positions: Position[] = [],
    limits?: TradingLimits,
    todayTradesCount: number = 0
  ): { valid: boolean; reason?: string; estimatedCost: number; estimatedFee: number; fillPrice: number } {
    // 1. Mindestgröße & Precision
    if (quantity <= 0) {
      return { valid: false, reason: 'Ordergröße muss positiv sein.', estimatedCost: 0, estimatedFee: 0, fillPrice: 0 };
    }
    if (quantity < asset.minOrderSize) {
      return { valid: false, reason: `Mindestordergröße für ${asset.symbol} ist ${asset.minOrderSize}.`, estimatedCost: 0, estimatedFee: 0, fillPrice: 0 };
    }

    // 2. Preis ermitteln: KAUF = ASK, VERKAUF = BID (Abs. 9)
    let fillPrice = side === 'BUY' ? quote.ask : quote.bid;
    if (orderType === 'LIMIT' && limitPrice) {
      fillPrice = limitPrice;
    }

    const tradeValue = quantity * fillPrice;
    const estimatedFee = tradeValue * this.DEFAULT_FEE_RATE;
    const estimatedCost = side === 'BUY' ? tradeValue + estimatedFee : 0;

    // 3. Deckungsprüfung bei Kauf
    if (side === 'BUY') {
      if (estimatedCost > account.cashBalance) {
        return {
          valid: false,
          reason: `Unzureichendes virtuelles Guthaben. Benötigt: €${estimatedCost.toFixed(2)}, Verfügbar: €${account.cashBalance.toFixed(2)}.`,
          estimatedCost,
          estimatedFee,
          fillPrice,
        };
      }
    }

    // 4. Bestandsprüfung bei Verkauf (Version 1.0 ist Spot: kein Short-Selling!)
    if (side === 'SELL') {
      const existingPos = positions.find((p) => p.symbol === asset.symbol);
      const availableQty = existingPos ? existingPos.quantity : 0;
      if (quantity > availableQty) {
        return {
          valid: false,
          reason: `Keine Leerverkäufe in v1.0 möglich. Offene Position: ${availableQty} ${asset.symbol}, Verkaufsauftrag: ${quantity}.`,
          estimatedCost,
          estimatedFee,
          fillPrice,
        };
      }
    }

    // 5. Risikolimits prüfen (Abs. 25)
    if (limits) {
      // Max Trades per Day
      if (todayTradesCount >= limits.maxTradesPerDay && limits.enforcementMode === 'REJECT') {
        return {
          valid: false,
          reason: `Tägliches Handelslimit von ${limits.maxTradesPerDay} Trades erreicht.`,
          estimatedCost,
          estimatedFee,
          fillPrice,
        };
      }

      // Max Position Size
      if (side === 'BUY') {
        const maxAllowedPositionValue = account.equity * (limits.maxPositionSizePct / 100);
        if (tradeValue > maxAllowedPositionValue && limits.enforcementMode === 'REJECT') {
          return {
            valid: false,
            reason: `Positionsgröße (€${tradeValue.toFixed(2)}) überschreitet das Limit von ${limits.maxPositionSizePct}% des Gesamtkapitals (€${maxAllowedPositionValue.toFixed(2)}).`,
            estimatedCost,
            estimatedFee,
            fillPrice,
          };
        }
      }
    }

    return { valid: true, estimatedCost, estimatedFee, fillPrice };
  }

  /**
   * Atomare Ausführung einer Order (Abs. 13 & 42)
   */
  public static executeOrder(
    account: Account,
    asset: Asset,
    quote: Quote,
    side: OrderSide,
    orderType: OrderType,
    quantity: number,
    positions: Position[],
    limitPrice?: number,
    stopPrice?: number,
    limits?: TradingLimits,
    todayTradesCount: number = 0
  ): {
    order: Order;
    execution?: Execution;
    updatedAccount: Account;
    updatedPositions: Position[];
    realizedPnLThisTrade: number;
    logs: string[];
  } {
    const logs: string[] = [];
    const now = Date.now();
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 9);
    const idempotencyKey = 'idemp_' + Math.random().toString(36).substring(2, 11);

    // 1. Validierung
    const validation = this.validateOrder(
      account,
      asset,
      quote,
      side,
      orderType,
      quantity,
      limitPrice,
      positions,
      limits,
      todayTradesCount
    );

    if (!validation.valid) {
      logs.push(`[REJECTED] Order abgewiesen: ${validation.reason}`);
      const rejectedOrder: Order = {
        id: orderId,
        accountId: account.id,
        symbol: asset.symbol,
        side,
        orderType,
        status: 'REJECTED',
        quantity,
        limitPrice,
        stopPrice,
        filledQuantity: 0,
        estimatedFee: validation.estimatedFee,
        totalFee: 0,
        slippage: 0,
        rejectionReason: validation.reason,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };
      return {
        order: rejectedOrder,
        updatedAccount: account,
        updatedPositions: positions,
        realizedPnLThisTrade: 0,
        logs,
      };
    }

    // 2. Limit oder Stop Order handling (wenn noch nicht fillable)
    if (orderType === 'LIMIT' && limitPrice) {
      const isMarketExecutable = (side === 'BUY' && quote.ask <= limitPrice) || (side === 'SELL' && quote.bid >= limitPrice);
      if (!isMarketExecutable) {
        logs.push(`[OPEN] Limit Order im Auftragsbuch platziert @ €${limitPrice.toFixed(2)}. Wartet auf Trigger.`);
        const openOrder: Order = {
          id: orderId,
          accountId: account.id,
          symbol: asset.symbol,
          side,
          orderType,
          status: 'OPEN',
          quantity,
          limitPrice,
          filledQuantity: 0,
          estimatedFee: validation.estimatedFee,
          totalFee: 0,
          slippage: 0,
          idempotencyKey,
          createdAt: now,
          updatedAt: now,
        };
        return {
          order: openOrder,
          updatedAccount: account,
          updatedPositions: positions,
          realizedPnLThisTrade: 0,
          logs,
        };
      }
    }

    // 3. Sofortige Ausführung (Market Fill oder erreichter Limit-Kurs)
    const basePrice = side === 'BUY' ? quote.ask : quote.bid;
    const slippagePct = orderType === 'MARKET' ? this.calculateSlippage(quantity * basePrice) : 0;
    const slippageMultiplier = side === 'BUY' ? (1 + slippagePct) : (1 - slippagePct);
    const finalFillPrice = (orderType === 'LIMIT' && limitPrice) ? limitPrice : (basePrice * slippageMultiplier);
    
    const tradeValue = quantity * finalFillPrice;
    const fee = tradeValue * this.DEFAULT_FEE_RATE;

    logs.push(`[EXECUTE] ${side} ${quantity} ${asset.symbol} @ €${finalFillPrice.toFixed(2)} (Slippage: ${(slippagePct * 100).toFixed(3)}%, Gebühr: €${fee.toFixed(2)})`);

    let realizedPnLThisTrade = 0;
    const newPositions = [...positions];
    const posIndex = newPositions.findIndex((p) => p.symbol === asset.symbol);

    if (side === 'BUY') {
      // Position eröffnen oder vergrößern (Gewichteter Durchschnitt Abs. 17)
      if (posIndex >= 0) {
        const cur = newPositions[posIndex];
        const newTotalQty = cur.quantity + quantity;
        const totalCost = (cur.quantity * cur.averageEntryPrice) + tradeValue;
        const newAvgEntry = totalCost / newTotalQty;

        newPositions[posIndex] = {
          ...cur,
          quantity: newTotalQty,
          averageEntryPrice: newAvgEntry,
          currentPrice: quote.bid,
          marketValue: newTotalQty * quote.bid,
          unrealizedPnL: (quote.bid - newAvgEntry) * newTotalQty,
          unrealizedPnLPercent: ((quote.bid - newAvgEntry) / newAvgEntry) * 100,
          updatedAt: now,
        };
        logs.push(`[POSITION] Aufgestockt auf ${newTotalQty} ${asset.symbol} @ Ø €${newAvgEntry.toFixed(2)}.`);
      } else {
        newPositions.push({
          id: 'pos_' + Math.random().toString(36).substring(2, 9),
          accountId: account.id,
          symbol: asset.symbol,
          quantity,
          averageEntryPrice: finalFillPrice,
          currentPrice: quote.bid,
          marketValue: quantity * quote.bid,
          unrealizedPnL: (quote.bid - finalFillPrice) * quantity,
          unrealizedPnLPercent: ((quote.bid - finalFillPrice) / finalFillPrice) * 100,
          realizedPnL: 0,
          openedAt: now,
          updatedAt: now,
        });
        logs.push(`[POSITION] Neu eröffnet: ${quantity} ${asset.symbol} @ €${finalFillPrice.toFixed(2)}.`);
      }
    } else {
      // VERKAUF (Realized P&L berechnen Abs. 18)
      if (posIndex >= 0) {
        const cur = newPositions[posIndex];
        const grossPnL = (finalFillPrice - cur.averageEntryPrice) * quantity;
        realizedPnLThisTrade = grossPnL - fee;

        logs.push(`[REALIZED P&L] Verkaufserlös: €${tradeValue.toFixed(2)}, Einstand: €${(cur.averageEntryPrice * quantity).toFixed(2)}, Brutto: €${grossPnL.toFixed(2)}, Netto P&L: €${realizedPnLThisTrade.toFixed(2)}.`);

        const remainingQty = cur.quantity - quantity;
        if (remainingQty <= 0.00000001) {
          // Position vollständig geschlossen
          newPositions.splice(posIndex, 1);
          logs.push(`[POSITION] Position ${asset.symbol} vollständig glattgestellt.`);
        } else {
          // Teilverkauf (Average Entry bleibt gleich!)
          newPositions[posIndex] = {
            ...cur,
            quantity: remainingQty,
            currentPrice: quote.bid,
            marketValue: remainingQty * quote.bid,
            unrealizedPnL: (quote.bid - cur.averageEntryPrice) * remainingQty,
            unrealizedPnLPercent: ((quote.bid - cur.averageEntryPrice) / cur.averageEntryPrice) * 100,
            realizedPnL: cur.realizedPnL + realizedPnLThisTrade,
            updatedAt: now,
          };
          logs.push(`[POSITION] Teilverkauf. Restbestand: ${remainingQty.toFixed(4)} ${asset.symbol}.`);
        }
      }
    }

    // 4. Kontosaldo anpassen (Abs. 3)
    let newCashBalance = account.cashBalance;
    if (side === 'BUY') {
      newCashBalance -= (tradeValue + fee);
    } else {
      newCashBalance += (tradeValue - fee);
    }

    const totalInvested = newPositions.reduce((sum, p) => sum + p.marketValue, 0);
    const totalUnrealizedPnL = newPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const newRealizedPnL = account.realizedPnL + realizedPnLThisTrade;
    const newEquity = newCashBalance + totalInvested;
    const totalPnL = (newEquity - account.initialBalance);
    const returnPct = ((newEquity - account.initialBalance) / account.initialBalance) * 100;

    const updatedAccount: Account = {
      ...account,
      cashBalance: newCashBalance,
      buyingPower: newCashBalance,
      invested: totalInvested,
      equity: newEquity,
      realizedPnL: newRealizedPnL,
      unrealizedPnL: totalUnrealizedPnL,
      totalPnL,
      dailyPnL: account.dailyPnL + realizedPnLThisTrade,
      returnPercent: returnPct,
    };

    const filledOrder: Order = {
      id: orderId,
      accountId: account.id,
      symbol: asset.symbol,
      side,
      orderType,
      status: 'FILLED',
      quantity,
      limitPrice,
      stopPrice,
      filledQuantity: quantity,
      averageFillPrice: finalFillPrice,
      estimatedFee: validation.estimatedFee,
      totalFee: fee,
      slippage: slippagePct,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    const execution: Execution = {
      id: 'exec_' + Math.random().toString(36).substring(2, 9),
      orderId,
      accountId: account.id,
      symbol: asset.symbol,
      side,
      quantity,
      price: finalFillPrice,
      fee,
      slippage: slippagePct,
      realizedPnL: side === 'SELL' ? realizedPnLThisTrade : undefined,
      executedAt: now,
    };

    return {
      order: filledOrder,
      execution,
      updatedAccount,
      updatedPositions: newPositions,
      realizedPnLThisTrade,
      logs,
    };
  }

  /**
   * Prüft offene Limit & Stop Orders gegen einen neuen Markt-Quote
   */
  public static checkPendingOrders(
    openOrders: Order[],
    quote: Quote,
    asset: Asset,
    account: Account,
    positions: Position[]
  ): { executedOrders: Order[]; newExecutions: Execution[]; updatedAccount: Account; updatedPositions: Position[]; remainingOrders: Order[] } {
    let curAccount = { ...account };
    let curPositions = [...positions];
    const executedOrders: Order[] = [];
    const newExecutions: Execution[] = [];
    const remainingOrders: Order[] = [];

    for (const ord of openOrders) {
      if (ord.symbol !== quote.symbol || ord.status !== 'OPEN') {
        remainingOrders.push(ord);
        continue;
      }

      let shouldFill = false;
      let fillPrice = ord.limitPrice || quote.lastPrice;

      if (ord.orderType === 'LIMIT' && ord.limitPrice) {
        if (ord.side === 'BUY' && quote.ask <= ord.limitPrice) {
          shouldFill = true;
          fillPrice = ord.limitPrice;
        } else if (ord.side === 'SELL' && quote.bid >= ord.limitPrice) {
          shouldFill = true;
          fillPrice = ord.limitPrice;
        }
      } else if (ord.orderType === 'STOP' && ord.stopPrice) {
        if (ord.side === 'BUY' && quote.ask >= ord.stopPrice) {
          shouldFill = true;
          fillPrice = quote.ask;
        } else if (ord.side === 'SELL' && quote.bid <= ord.stopPrice) {
          shouldFill = true;
          fillPrice = quote.bid;
        }
      }

      if (shouldFill) {
        const res = this.executeOrder(
          curAccount,
          asset,
          quote,
          ord.side,
          'MARKET', // Wird zum fill price ausgeführt
          ord.quantity,
          curPositions,
          fillPrice
        );
        if (res.order.status === 'FILLED' && res.execution) {
          executedOrders.push(res.order);
          newExecutions.push(res.execution);
          curAccount = res.updatedAccount;
          curPositions = res.updatedPositions;
        } else {
          remainingOrders.push(ord);
        }
      } else {
        remainingOrders.push(ord);
      }
    }

    return {
      executedOrders,
      newExecutions,
      updatedAccount: curAccount,
      updatedPositions: curPositions,
      remainingOrders,
    };
  }

  /**
   * Berechnet Performance- und Risikokennzahlen (Abs. 23 & 24)
   */
  public static calculateRiskMetrics(executions: Execution[], initialBalance: number, currentEquity: number): {
    winRate: number;
    lossRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    expectancy: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    largestWin: number;
    largestLoss: number;
  } {
    // Nur Verkäufe haben realizedPnL
    const closedTrades = executions.filter((e) => e.realizedPnL !== undefined);
    const winning = closedTrades.filter((e) => (e.realizedPnL || 0) > 0);
    const losing = closedTrades.filter((e) => (e.realizedPnL || 0) < 0);

    const totalTrades = closedTrades.length;
    const winCount = winning.length;
    const lossCount = losing.length;

    const totalWinAmount = winning.reduce((sum, e) => sum + (e.realizedPnL || 0), 0);
    const totalLossAmount = Math.abs(losing.reduce((sum, e) => sum + (e.realizedPnL || 0), 0));

    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const lossRate = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;
    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;

    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99.9 : 0;

    // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
    const winProb = totalTrades > 0 ? winCount / totalTrades : 0;
    const lossProb = totalTrades > 0 ? lossCount / totalTrades : 0;
    const expectancy = (winProb * avgWin) - (lossProb * avgLoss);

    let largestWin = 0;
    let largestLoss = 0;
    closedTrades.forEach((e) => {
      const pnl = e.realizedPnL || 0;
      if (pnl > largestWin) largestWin = pnl;
      if (pnl < largestLoss) largestLoss = pnl;
    });

    // Drawdown von Initial- bzw. Peak-Equity
    const maxDrawdown = Math.max(0, ((initialBalance - currentEquity) / initialBalance) * 100);

    return {
      totalTrades,
      winningTrades: winCount,
      losingTrades: lossCount,
      winRate,
      lossRate,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      expectancy,
      largestWin,
      largestLoss,
    };
  }
}
