// ── Event-driven backtester ───────────────────────────────────────────────
// Simulates the strategy against historical candles.
// Slippage: 1 pip. Commission: 2 pips per round-trip.
// ✦ Pure function — no DB or network calls. Safe to run in API routes.

import { generateSignal } from './strategy'
import type { Candle, Trade, BacktestResult, TradingConfig } from '@/types'

const SLIPPAGE_PIPS    = 1
const COMMISSION_PIPS  = 2
const PRICE_FACTOR     = 10000   // price diff → pips

interface OpenPosition {
  pair:        string
  action:      'buy' | 'sell'
  entry_price: number
  sl_price:    number
  tp_price:    number
  lot_size:    number
  opened_at:   string
}

export function runBacktest(
  pair: string,
  candles: Candle[],
  config: Pick<TradingConfig, 'risk_pct' | 'indicators'>,
  initialEquity = 10000,
): BacktestResult {
  const trades: Trade[]                                = []
  const equityCurve: Array<{ time: string; equity: number }> = []
  let equity    = initialEquity
  let tradeId   = 1
  let openPos: OpenPosition | null = null

  // ✦ Walk-forward: each candle is a new bar
  for (let i = 50; i < candles.length; i++) {
    const bar     = candles[i]
    const history = candles.slice(0, i + 1)

    // ── Check if open position hit SL or TP ──────────────────────────────
    if (openPos) {
      const { high, low, close, time } = bar
      let closed = false
      let exitPrice = 0
      let exitReason: 'sl' | 'tp' | '' = ''

      if (openPos.action === 'buy') {
        if (low <= openPos.sl_price)  { exitPrice = openPos.sl_price; exitReason = 'sl'; closed = true }
        if (high >= openPos.tp_price) { exitPrice = openPos.tp_price; exitReason = 'tp'; closed = true }
      } else {
        if (high >= openPos.sl_price) { exitPrice = openPos.sl_price; exitReason = 'sl'; closed = true }
        if (low <= openPos.tp_price)  { exitPrice = openPos.tp_price; exitReason = 'tp'; closed = true }
      }

      if (closed) {
        const pipsMoved = (exitPrice - openPos.entry_price) *
          (openPos.action === 'buy' ? 1 : -1) * PRICE_FACTOR
        const grossPnl = pipsMoved * openPos.lot_size * 10
        const commPnl  = -COMMISSION_PIPS * openPos.lot_size * 10
        const pnl      = parseFloat((grossPnl + commPnl).toFixed(2))
        equity        += pnl

        trades.push({
          id:          tradeId++,
          pair:        openPos.pair,
          action:      openPos.action,
          entry_price: openPos.entry_price,
          exit_price:  exitPrice,
          sl_price:    openPos.sl_price,
          tp_price:    openPos.tp_price,
          lot_size:    openPos.lot_size,
          pnl,
          status:      'closed',
          opened_at:   openPos.opened_at,
          closed_at:   time,
          notes:       exitReason,
        })
        openPos = null
        equityCurve.push({ time, equity })
      }
    }

    // ── Generate signal if no open position ──────────────────────────────
    if (!openPos) {
      const signal = generateSignal(pair, history, { equity, riskPct: config.risk_pct })

      if (signal.action !== 'hold' && signal.size > 0) {
        const slip   = SLIPPAGE_PIPS / PRICE_FACTOR
        const slipAdj = signal.action === 'buy' ? slip : -slip
        const entry  = bar.close + slipAdj

        openPos = {
          pair,
          action:      signal.action,
          entry_price: entry,
          sl_price:    signal.action === 'buy'
            ? entry - signal.sl_offset
            : entry + signal.sl_offset,
          tp_price:    signal.action === 'buy'
            ? entry + signal.tp_offset
            : entry - signal.tp_offset,
          lot_size:    signal.size,
          opened_at:   bar.time,
        }
      }
    }
  }

  // ── Close any remaining open position at last close ───────────────────
  if (openPos && candles.length > 0) {
    const last     = candles[candles.length - 1]
    const pipsMoved = (last.close - openPos.entry_price) *
      (openPos.action === 'buy' ? 1 : -1) * PRICE_FACTOR
    const pnl = parseFloat((pipsMoved * openPos.lot_size * 10 - COMMISSION_PIPS * openPos.lot_size * 10).toFixed(2))
    equity   += pnl
    trades.push({
      id: tradeId++, pair: openPos.pair, action: openPos.action,
      entry_price: openPos.entry_price, exit_price: last.close,
      sl_price: openPos.sl_price, tp_price: openPos.tp_price,
      lot_size: openPos.lot_size, pnl, status: 'closed',
      opened_at: openPos.opened_at, closed_at: last.time, notes: 'end-of-data',
    })
    equityCurve.push({ time: last.time, equity })
  }

  return { trades, metrics: calcMetrics(trades, initialEquity), equity_curve: equityCurve }
}

function calcMetrics(trades: Trade[], initialEquity: number) {
  if (trades.length === 0) {
    return { sharpe_ratio: 0, win_rate: 0, max_drawdown: 0, total_pnl: 0, trade_count: 0, avg_pnl_per_trade: 0, profit_factor: 0 }
  }

  const pnls      = trades.map((t) => t.pnl ?? 0)
  const totalPnl  = pnls.reduce((a, b) => a + b, 0)
  const wins      = pnls.filter((p) => p > 0)
  const losses    = pnls.filter((p) => p < 0)
  const winRate   = wins.length / trades.length

  // Sharpe (annualised, assuming 5-min bars → ~288 bars/day)
  const mean = totalPnl / trades.length
  const std  = Math.sqrt(pnls.reduce((a, p) => a + Math.pow(p - mean, 2), 0) / trades.length)
  const sharpe = std > 0 ? parseFloat(((mean / std) * Math.sqrt(252)).toFixed(2)) : 0

  // Max drawdown
  let peak = initialEquity, equity = initialEquity, maxDD = 0
  for (const pnl of pnls) {
    equity += pnl
    if (equity > peak) peak = equity
    const dd = (peak - equity) / peak
    if (dd > maxDD) maxDD = dd
  }

  const grossWin  = wins.reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
  const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 999 : 0

  return {
    sharpe_ratio:       sharpe,
    win_rate:           parseFloat(winRate.toFixed(4)),
    max_drawdown:       parseFloat(maxDD.toFixed(4)),
    total_pnl:          parseFloat(totalPnl.toFixed(2)),
    trade_count:        trades.length,
    avg_pnl_per_trade:  parseFloat((totalPnl / trades.length).toFixed(2)),
    profit_factor:      profitFactor,
  }
}
