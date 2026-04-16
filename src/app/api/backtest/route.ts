// POST /api/backtest — run event-driven sim on uploaded CSV
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseCsvCandles } from '@/lib/tradermade'
import { runBacktest } from '@/lib/backtester'

const BodySchema = z.object({
  csv:      z.string().min(10, 'CSV data required'),
  pair:     z.enum(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']).default('EURUSD'),
  riskPct:  z.number().min(0.001).max(0.05).default(0.01),
  equity:   z.number().positive().default(10000),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { csv, pair, riskPct, equity } = parsed.data
  const candles = parseCsvCandles(csv)

  if (candles.length < 50) {
    return NextResponse.json({ ok: false, error: 'Need at least 50 candles in CSV' }, { status: 422 })
  }

  const result = runBacktest(pair, candles, { risk_pct: riskPct, indicators: {} as never }, equity)
  return NextResponse.json({ ok: true, data: { result } })
}
