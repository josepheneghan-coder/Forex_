import { Asset, Quote, Candle, Account, TradingLimits } from '../types/trading';

export const INITIAL_ACCOUNT: Account = {
  id: 'acc_demo_paper_1',
  name: 'Standard Paper Account',
  currency: 'EUR',
  initialBalance: 100000.0,
  cashBalance: 100000.0,
  equity: 100000.0,
  buyingPower: 100000.0,
  invested: 0.0,
  realizedPnL: 0.0,
  unrealizedPnL: 0.0,
  totalPnL: 0.0,
  dailyPnL: 0.0,
  returnPercent: 0.0,
};

export const INITIAL_TRADING_LIMITS: TradingLimits = {
  maxPositionSizePct: 25, // Max 25% pro Position
  maxDailyLossPct: 5,     // Max 5% Tagesverlust
  maxRiskPerTradePct: 2,  // Max 2% Risiko pro Trade
  maxTradesPerDay: 50,    // Max 50 Trades pro Tag
  enforcementMode: 'WARNING',
};

export const ASSET_CATALOG: Asset[] = [
  {
    id: 'asset_audusd',
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    assetType: 'stock',
    baseCurrency: 'AUD',
    quoteCurrency: 'USD',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_gold',
    symbol: 'Gold',
    name: 'Gold Spot (XAU/USD)',
    assetType: 'stock',
    baseCurrency: 'XAU',
    quoteCurrency: 'USD',
    exchange: 'Metals Spot',
    tickSize: 0.01,
    quantityPrecision: 2,
    pricePrecision: 2,
    minOrderSize: 0.1,
    isActive: true,
  },
  {
    id: 'asset_euraud',
    symbol: 'EURAUD',
    name: 'Euro / Australian Dollar',
    assetType: 'stock',
    baseCurrency: 'EUR',
    quoteCurrency: 'AUD',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_brent',
    symbol: 'BRENT',
    name: 'Brent Crude Oil Futures',
    assetType: 'stock',
    baseCurrency: 'BRENT',
    quoteCurrency: 'USD',
    exchange: 'Energy Futures',
    tickSize: 0.01,
    quantityPrecision: 1,
    pricePrecision: 2,
    minOrderSize: 10,
    isActive: true,
  },
  {
    id: 'asset_copper',
    symbol: 'High Grade Copper',
    name: 'High Grade Copper',
    assetType: 'stock',
    baseCurrency: 'COPPER',
    quoteCurrency: 'USD',
    exchange: 'Metals Futures',
    tickSize: 0.0001,
    quantityPrecision: 0,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_audcad',
    symbol: 'AUDCAD',
    name: 'Australian Dollar / Canadian Dollar',
    assetType: 'stock',
    baseCurrency: 'AUD',
    quoteCurrency: 'CAD',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_audchf',
    symbol: 'AUDCHF',
    name: 'Australian Dollar / Swiss Franc',
    assetType: 'stock',
    baseCurrency: 'AUD',
    quoteCurrency: 'CHF',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_audjpy',
    symbol: 'AUDJPY',
    name: 'Australian Dollar / Japanese Yen',
    assetType: 'stock',
    baseCurrency: 'AUD',
    quoteCurrency: 'JPY',
    exchange: 'Forex Spot',
    tickSize: 0.001,
    quantityPrecision: 2,
    pricePrecision: 3,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_audnzd',
    symbol: 'AUDNZD',
    name: 'Australian Dollar / New Zealand Dollar',
    assetType: 'stock',
    baseCurrency: 'AUD',
    quoteCurrency: 'NZD',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_eurusd',
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    assetType: 'stock',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_gbpusd',
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    assetType: 'stock',
    baseCurrency: 'GBP',
    quoteCurrency: 'USD',
    exchange: 'Forex Spot',
    tickSize: 0.0001,
    quantityPrecision: 2,
    pricePrecision: 4,
    minOrderSize: 100,
    isActive: true,
  },
  {
    id: 'asset_btc_eur',
    symbol: 'BTC/EUR',
    name: 'Bitcoin',
    assetType: 'crypto',
    baseCurrency: 'BTC',
    quoteCurrency: 'EUR',
    exchange: 'PaperTrade Global Crypto',
    tickSize: 0.50,
    quantityPrecision: 4,
    pricePrecision: 2,
    minOrderSize: 0.001,
    isActive: true,
    binanceSymbol: 'btceur',
  },
  {
    id: 'asset_eth_eur',
    symbol: 'ETH/EUR',
    name: 'Ethereum',
    assetType: 'crypto',
    baseCurrency: 'ETH',
    quoteCurrency: 'EUR',
    exchange: 'PaperTrade Global Crypto',
    tickSize: 0.10,
    quantityPrecision: 3,
    pricePrecision: 2,
    minOrderSize: 0.01,
    isActive: true,
    binanceSymbol: 'etheur',
  },
  {
    id: 'asset_aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'stock',
    baseCurrency: 'AAPL',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    assetType: 'stock',
    baseCurrency: 'NVDA',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_msft',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    assetType: 'stock',
    baseCurrency: 'MSFT',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_tsla',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    assetType: 'stock',
    baseCurrency: 'TSLA',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_spy',
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    assetType: 'etf',
    baseCurrency: 'SPY',
    quoteCurrency: 'USD',
    exchange: 'NYSE Arca',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_amzn',
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    assetType: 'stock',
    baseCurrency: 'AMZN',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_googl',
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    assetType: 'stock',
    baseCurrency: 'GOOGL',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_meta',
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    assetType: 'stock',
    baseCurrency: 'META',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_nflx',
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    assetType: 'stock',
    baseCurrency: 'NFLX',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_amd',
    symbol: 'AMD',
    name: 'Advanced Micro Devices Inc.',
    assetType: 'stock',
    baseCurrency: 'AMD',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
  {
    id: 'asset_intc',
    symbol: 'INTC',
    name: 'Intel Corp.',
    assetType: 'stock',
    baseCurrency: 'INTC',
    quoteCurrency: 'USD',
    exchange: 'NASDAQ',
    tickSize: 0.01,
    quantityPrecision: 0,
    pricePrecision: 2,
    minOrderSize: 1,
    isActive: true,
  },
];

// Helper to generate realistic Quotes with Bid and Ask Spread (Section 9)
export function createQuote(symbol: string, basePrice: number, spreadBps: number = 1.5): Quote {
  const isForex = basePrice < 10 || symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('AUD');
  const decimals = isForex ? 4 : 2;
  const spreadAmount = isForex ? 0.00018 : basePrice * (spreadBps / 10000);
  const halfSpread = spreadAmount / 2;
  const bid = Number((basePrice - halfSpread).toFixed(decimals));
  const ask = Number((basePrice + halfSpread).toFixed(decimals));
  const spread = Number((ask - bid).toFixed(decimals));
  return {
    symbol,
    timestamp: Date.now(),
    lastPrice: Number(basePrice.toFixed(decimals)),
    bid,
    ask,
    spread,
    volume: Math.floor(Math.random() * 100000 + 5000),
    dayOpen: Number((basePrice * 0.992).toFixed(decimals)),
    dayHigh: Number((basePrice * 1.008).toFixed(decimals)),
    dayLow: Number((basePrice * 0.988).toFixed(decimals)),
    previousClose: Number((basePrice * 0.998).toFixed(decimals)),
    change24h: -0.02,
  };
}

export const INITIAL_QUOTES: Record<string, Quote> = {
  'AUDUSD': createQuote('AUDUSD', 1.6100, 3),
  'Gold': createQuote('Gold', 1845.50, 4),
  'EURAUD': createQuote('EURAUD', 1.6348, 4),
  'BRENT': createQuote('BRENT', 80.39, 3),
  'High Grade Copper': createQuote('High Grade Copper', 2.2940, 4),
  'AUDCAD': createQuote('AUDCAD', 0.8495, 2),
  'AUDCHF': createQuote('AUDCHF', 0.7693, 2),
  'AUDJPY': createQuote('AUDJPY', 75.14, 2),
  'AUDNZD': createQuote('AUDNZD', 1.0845, 2),
  'EURUSD': createQuote('EURUSD', 1.0850, 2),
  'GBPUSD': createQuote('GBPUSD', 1.2744, 2),
  'BTC/EUR': createQuote('BTC/EUR', 62450.00, 4),
  'ETH/EUR': createQuote('ETH/EUR', 3180.50, 4),
  'AAPL': createQuote('AAPL', 226.70, 3),
  'NVDA': createQuote('NVDA', 138.45, 3),
  'MSFT': createQuote('MSFT', 418.20, 3),
  'TSLA': createQuote('TSLA', 254.80, 5),
  'SPY': createQuote('SPY', 576.30, 2),
  'AMZN': createQuote('AMZN', 186.50, 3),
  'GOOGL': createQuote('GOOGL', 168.20, 3),
  'META': createQuote('META', 585.00, 4),
  'NFLX': createQuote('NFLX', 710.20, 4),
  'AMD': createQuote('AMD', 162.40, 4),
  'INTC': createQuote('INTC', 22.80, 4),
};

// Generiert historische Candles für Live-Chart & Replay-Engine
export function generateCandles(
  currentPrice: number,
  count: number = 70,
  intervalMinutes: number = 5,
  decimals: number = 4
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  // Auf exaktes Intervall gerundeter aktueller Bucket-Zeitstempel
  const currentBucketTime = Math.floor(now / intervalMs) * intervalMs;
  let price = currentPrice * (1 - (count * 0.0012));

  for (let i = count; i >= 1; i--) {
    const time = currentBucketTime - (i * intervalMs);
    const pipUnit = Math.pow(10, -decimals);
    const volatility = Math.max(price * 0.0016, pipUnit * 5);
    const change = (Math.random() - 0.49) * volatility;
    const open = price;
    const close = Math.max(pipUnit * 10, open + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.6;
    const low = Math.min(open, close) - Math.random() * volatility * 0.6;
    const volume = Math.floor(Math.random() * 250 + 40) * (currentPrice > 1000 ? 0.3 : 4);

    candles.push({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.round(volume),
    });

    price = close;
  }

  // Die aktuell noch offene Kerze (Beginn des laufenden Zeitintervalls)
  const pipUnit = Math.pow(10, -decimals);
  const openPrice = price;
  const highPrice = Math.max(openPrice, currentPrice) + Math.random() * pipUnit * 2;
  const lowPrice = Math.min(openPrice, currentPrice) - Math.random() * pipUnit * 2;

  candles.push({
    time: currentBucketTime,
    open: Number(openPrice.toFixed(decimals)),
    high: Number(highPrice.toFixed(decimals)),
    low: Number(lowPrice.toFixed(decimals)),
    close: Number(currentPrice.toFixed(decimals)),
    volume: Math.floor(Math.random() * 40 + 10),
  });

  return candles;
}

export const PAPERTRADE_POSTGRES_SCHEMA = `-- =====================================================================
-- PAPERTRADE v1.0 - TECHNISCHES DATENBANKSCHEMA (PostgreSQL)
-- Basiert exakt auf Spezifikation v1.0 Abschnitt 38
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. ACCOUNTS (Virtuelle Konten)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) DEFAULT 'Paper Trading' NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR' NOT NULL,
    initial_balance NUMERIC(20, 4) DEFAULT 100000.0000 NOT NULL,
    cash_balance NUMERIC(20, 4) DEFAULT 100000.0000 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_cash_positive CHECK (cash_balance >= 0)
);

-- 3. ASSETS
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    asset_type VARCHAR(20) NOT NULL, -- 'crypto', 'stock', 'etf'
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    tick_size NUMERIC(10, 4) DEFAULT 0.01 NOT NULL,
    quantity_precision INTEGER DEFAULT 4 NOT NULL,
    price_precision INTEGER DEFAULT 2 NOT NULL,
    min_order_size NUMERIC(15, 6) DEFAULT 0.001 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 4. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE RESTRICT NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    order_type VARCHAR(20) NOT NULL, -- 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'OPEN', 'FILLED', 'REJECTED', 'CANCELLED'
    quantity NUMERIC(20, 8) NOT NULL,
    limit_price NUMERIC(20, 4),
    stop_price NUMERIC(20, 4),
    filled_quantity NUMERIC(20, 8) DEFAULT 0 NOT NULL,
    average_fill_price NUMERIC(20, 4),
    estimated_fee NUMERIC(20, 4) DEFAULT 0 NOT NULL,
    total_fee NUMERIC(20, 4) DEFAULT 0 NOT NULL,
    rejection_reason TEXT,
    idempotency_key VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_qty_positive CHECK (quantity > 0)
);

-- 5. EXECUTIONS
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE RESTRICT NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    price NUMERIC(20, 4) NOT NULL,
    fee NUMERIC(20, 4) NOT NULL,
    slippage NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. POSITIONS
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE RESTRICT NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    average_entry_price NUMERIC(20, 4) NOT NULL,
    realized_pnl NUMERIC(20, 4) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_account_asset UNIQUE (account_id, asset_id),
    CONSTRAINT chk_pos_quantity_nonneg CHECK (quantity >= 0)
);

-- 7. PORTFOLIO SNAPSHOTS
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    cash NUMERIC(20, 4) NOT NULL,
    market_value NUMERIC(20, 4) NOT NULL,
    equity NUMERIC(20, 4) NOT NULL,
    realized_pnl NUMERIC(20, 4) NOT NULL,
    unrealized_pnl NUMERIC(20, 4) NOT NULL
);

-- 8. TRADING JOURNAL ENTRIES
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    trade_id UUID,
    strategy VARCHAR(100),
    setup VARCHAR(100),
    reason TEXT,
    market_context TEXT,
    emotion VARCHAR(50),
    notes TEXT,
    planned_entry NUMERIC(20, 4),
    planned_stop NUMERIC(20, 4),
    planned_target NUMERIC(20, 4),
    planned_risk_reward NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INDEXES FÜR HIGH-PERFORMANCE
CREATE INDEX idx_orders_account ON orders(account_id, status);
CREATE INDEX idx_executions_order ON executions(order_id);
CREATE INDEX idx_positions_account ON positions(account_id);
CREATE INDEX idx_snapshots_account_time ON portfolio_snapshots(account_id, timestamp DESC);
`;

export const FASTAPI_BACKEND_CODE = `# =====================================================================
# PAPERTRADE v1.0 - FASTAPI BACKEND ARCHITEKTUR
# Streng serverseitige Validierung, Decimal-Arithmetik, Atomare DB-Locks
# =====================================================================

from fastapi import FastAPI, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional, List
from enum import Enum
import uuid

app = FastAPI(title="PaperTrade Simulation API", version="1.0.0")

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"

class OrderCreateRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: Decimal = Field(..., gt=0)
    limit_price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None

class OrderResponse(BaseModel):
    order_id: str
    status: str
    filled_quantity: Decimal
    average_fill_price: Optional[Decimal]
    fee: Decimal
    slippage: Decimal

@app.post("/api/orders", response_model=OrderResponse)
async def create_order(
    req: OrderCreateRequest,
    idempotency_key: Optional[str] = Header(None),
    # db: AsyncSession = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    """
    Spezifikation Abs. 14 & 42:
    Atomare Order-Verarbeitung mit Mutex-Row-Lock (SELECT FOR UPDATE).
    Berechnet Fill-Kurs (Ask bei Buy, Bid bei Sell), Slippage und Gebühr.
    """
    # 1. Idempotency Check
    # if await db.is_duplicate_idempotency(idempotency_key):
    #     return await db.get_existing_order(idempotency_key)

    # 2. Quote abrufen
    # quote = await market_data_service.get_quote(req.symbol)
    # ask = quote.ask
    # bid = quote.bid

    # 3. Validierung & Deckungsprüfung
    # 4. Atomare Buchung: Cash anpassen, Position aktualisieren, Execution anlegen
    return OrderResponse(
        order_id=f"ord_{uuid.uuid4().hex[:8]}",
        status="FILLED",
        filled_quantity=req.quantity,
        average_fill_price=Decimal("62450.00"),
        fee=Decimal("12.49"),
        slippage=Decimal("0.0005")
    )
`;
