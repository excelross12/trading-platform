// ── Shared TypeScript interfaces for the Trading Platform ──────────────────
// All API routes, lib modules, and components import from here.

// ── Market Data ────────────────────────────────────────────────────────────

export interface Candle {
  time: string        // ISO timestamp
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface Quote {
  pair: string
  bid: number
  ask: number
  mid: number
  timestamp: string
}

// ── Strategy / Signals ─────────────────────────────────────────────────────

export type SignalAction = 'buy' | 'sell' | 'hold'

export interface IndicatorSnapshot {
  ema_fast: number
  ema_slow: number
  rsi: number
  adx: number
  atr: number
}

export interface Signal {
  pair: string
  action: SignalAction
  sl_offset: number        // distance in price units (ATR-based)
  tp_offset: number
  size: number             // lot size
  confidence: number       // 0–1
  indicators: IndicatorSnapshot
  generated_at: string     // ISO timestamp
}

// ── Trades (DB + API) ──────────────────────────────────────────────────────

export type TradeStatus = 'open' | 'closed' | 'cancelled'

export interface Trade {
  id: number
  pair: string
  action: 'buy' | 'sell'
  entry_price: number
  exit_price?: number
  sl_price: number
  tp_price: number
  lot_size: number
  pnl?: number
  status: TradeStatus
  opened_at: string
  closed_at?: string
  ticket_id?: string       // MT5 order ticket
  notes?: string
}

export interface NewTrade extends Omit<Trade, 'id' | 'status' | 'opened_at'> {
  status?: TradeStatus
}

export interface EquitySnapshot {
  id: number
  equity: number
  balance: number
  margin?: number
  snapshot_at: string
}

// ── Backtest ───────────────────────────────────────────────────────────────

export interface BacktestMetrics {
  sharpe_ratio: number
  win_rate: number         // 0–1
  max_drawdown: number     // 0–1
  total_pnl: number
  trade_count: number
  avg_pnl_per_trade: number
  profit_factor: number
}

export interface BacktestResult {
  trades: Trade[]
  metrics: BacktestMetrics
  equity_curve: Array<{ time: string; equity: number }>
}

// ── Config ─────────────────────────────────────────────────────────────────

export interface IndicatorConfig {
  ema_fast: number
  ema_slow: number
  rsi_period: number
  rsi_buy_threshold: number
  rsi_sell_threshold: number
  adx_period: number
  adx_min: number
  atr_period: number
  sl_atr_multiplier: number
  tp_atr_multiplier: number
}

export interface TradingConfig {
  pairs: string[]
  risk_pct: number         // 0.01 = 1%
  max_open_per_pair: number
  daily_dd_halt: number    // 0.05 = 5%
  sessions: string[]
  enabled: boolean
  indicators: IndicatorConfig
}

// ── MT5 ────────────────────────────────────────────────────────────────────

export type MT5Action = 'buy' | 'sell' | 'close'

export interface MT5Order {
  symbol: string
  action: MT5Action
  volume: number
  sl: number
  tp: number
  ticket?: number
}

export interface MT5Response {
  ok: boolean
  ticket_id?: string
  error?: string
}

// ── API Response shapes ────────────────────────────────────────────────────

export interface ApiOk<T = unknown> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: string
  details?: unknown
}

export type ApiResponse<T = unknown> = ApiOk<T> | ApiError

// ── Socket.io events ───────────────────────────────────────────────────────

export interface SocketEvents {
  trade_opened: Trade
  trade_closed: Trade
  equity_update: EquitySnapshot
  signal_generated: Signal
  alert: { level: 'info' | 'warn' | 'error'; message: string }
}
