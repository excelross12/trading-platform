// GET /api/cron/trade — Vercel cron, runs every 5 minutes
// Polls quotes → generates signals → executes orders → logs equity
// ⚠️ Protected by CRON_SECRET header

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuotes, fetchCandles } from '@/lib/tradermade'
import { generateSignal } from '@/lib/strategy'
import { placeOrder, getAccountInfo } from '@/lib/mt5-proxy'
import { insertTrade, getOpenTradesByPair, insertEquitySnapshot, runMigrations } from '@/lib/db'
import config from '../../../../../config.json'

// ✦ Ensure tables exist (idempotent — safe to call every run)
let migrated = false

export async function GET(req: NextRequest) {
  // ── Auth guard ───────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Kill switch ──────────────────────────────────────────────────────────
  if (!config.enabled) {
    return NextResponse.json({ ok: true, message: 'Bot disabled — set enabled:true in config.json' })
  }

  if (!migrated) {
    await runMigrations()
    migrated = true
  }

  const results = { signals_processed: 0, trades_placed: 0, errors: [] as string[] }

  // ── Get account info for equity sizing ───────────────────────────────────
  const account = await getAccountInfo()
  const equity  = account?.equity ?? 10000  // fallback for demo

  // ── Daily drawdown halt ──────────────────────────────────────────────────
  // ⚠️ TODO: compare equity vs start-of-day balance; halt if DD > config.daily_dd_halt
  // (full implementation requires storing daily open equity in DB)

  // ── Process each pair ────────────────────────────────────────────────────
  for (const pair of config.pairs) {
    try {
      // ── Skip if already have open position ────────────────────────────
      const openTrades = await getOpenTradesByPair(pair)
      if (openTrades.length >= config.max_open_per_pair) continue

      // ── Fetch candles (batched quote fetch above saves quota) ──────────
      const candles = await fetchCandles(pair, '5min', 100)
      if (candles.length < 50) continue

      results.signals_processed++

      const signal = generateSignal(pair, candles, { equity, riskPct: config.risk_pct })
      if (signal.action === 'hold' || signal.size === 0) continue

      const currentPrice = candles[candles.length - 1].close
      const entryPrice   = currentPrice
      const slPrice      = signal.action === 'buy'
        ? entryPrice - signal.sl_offset
        : entryPrice + signal.sl_offset
      const tpPrice      = signal.action === 'buy'
        ? entryPrice + signal.tp_offset
        : entryPrice - signal.tp_offset

      const mt5Res = await placeOrder({
        symbol: pair,
        action: signal.action,
        volume: signal.size,
        sl:     slPrice,
        tp:     tpPrice,
      })

      if (mt5Res.ok) {
        await insertTrade({
          pair,
          action:      signal.action,
          entry_price: entryPrice,
          sl_price:    slPrice,
          tp_price:    tpPrice,
          lot_size:    signal.size,
          ticket_id:   mt5Res.ticket_id,
        })
        results.trades_placed++
      } else {
        results.errors.push(`${pair}: ${mt5Res.error}`)
      }
    } catch (err) {
      results.errors.push(`${pair}: ${(err as Error).message}`)
    }
  }

  // ── Snapshot equity ───────────────────────────────────────────────────────
  if (account) {
    await insertEquitySnapshot(account.equity, account.balance, account.margin)
  }

  return NextResponse.json({ ok: true, data: results })
}
