// GET /api/trades  — paginated trade history
// POST /api/trades — manually insert a trade record
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTrades, insertTrade } from '@/lib/db'

const GetQuerySchema = z.object({
  pair:   z.string().optional(),
  status: z.enum(['open', 'closed', 'cancelled']).optional(),
  limit:  z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = GetQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid query params' }, { status: 400 })
  }
  const result = await getTrades(parsed.data)
  return NextResponse.json({ ok: true, data: result })
}

const PostBodySchema = z.object({
  pair:        z.enum(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']),
  action:      z.enum(['buy', 'sell']),
  entry_price: z.number().positive(),
  sl_price:    z.number().positive(),
  tp_price:    z.number().positive(),
  lot_size:    z.number().positive().max(10),
  ticket_id:   z.string().optional(),
  notes:       z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid trade data', details: parsed.error.flatten() }, { status: 400 })
  }
  const trade = await insertTrade(parsed.data)
  return NextResponse.json({ ok: true, data: { trade } }, { status: 201 })
}
