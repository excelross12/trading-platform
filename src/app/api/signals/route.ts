// POST /api/signals — run strategy on candles, return signal
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateSignal } from '@/lib/strategy'

const CandleSchema = z.object({
  time:   z.string(),
  open:   z.number(),
  high:   z.number(),
  low:    z.number(),
  close:  z.number(),
  volume: z.number().optional(),
})

const BodySchema = z.object({
  pair:    z.enum(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']),
  candles: z.array(CandleSchema).min(50, 'Need at least 50 candles'),
  equity:  z.number().positive().default(10000),
  riskPct: z.number().min(0.001).max(0.05).default(0.01),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { pair, candles, equity, riskPct } = parsed.data
  const signal = generateSignal(pair, candles, { equity, riskPct })
  return NextResponse.json({ ok: true, data: { signal } })
}
