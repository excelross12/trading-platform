// POST /api/execute — send order to MT5 proxy + persist to DB
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { placeOrder } from '@/lib/mt5-proxy'
import { insertTrade, getOpenTradesByPair } from '@/lib/db'

const BodySchema = z.object({
  pair:       z.enum(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']),
  action:     z.enum(['buy', 'sell']),
  entry_price: z.number().positive(),
  sl_price:   z.number().positive(),
  tp_price:   z.number().positive(),
  lot_size:   z.number().positive().max(10),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid order', details: parsed.error.flatten() }, { status: 400 })
  }

  const { pair, action, entry_price, sl_price, tp_price, lot_size } = parsed.data

  // ✦ Idempotency: skip if already have an open trade for this pair
  const existing = await getOpenTradesByPair(pair)
  if (existing.length > 0) {
    return NextResponse.json({ ok: false, error: `Already have open position for ${pair}` }, { status: 409 })
  }

  const mt5Response = await placeOrder({
    symbol: pair,
    action,
    volume: lot_size,
    sl:     sl_price,
    tp:     tp_price,
  })

  if (!mt5Response.ok) {
    return NextResponse.json({ ok: false, error: `MT5 rejected order: ${mt5Response.error}` }, { status: 502 })
  }

  const trade = await insertTrade({
    pair, action, entry_price, sl_price, tp_price,
    lot_size, ticket_id: mt5Response.ticket_id,
  })

  return NextResponse.json({ ok: true, data: { trade } }, { status: 201 })
}
