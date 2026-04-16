// GET /api/quotes/[pair] — fetch live quote + recent candles
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchQuotes, fetchCandles } from '@/lib/tradermade'

const VALID_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']

export async function GET(
  _req: NextRequest,
  { params }: { params: { pair: string } },
) {
  // ✦ Validate pair at entry point — never trust URL params
  const pair = params.pair.toUpperCase()
  const parsed = z.enum(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']).safeParse(pair)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: `Invalid pair. Allowed: ${VALID_PAIRS.join(', ')}` }, { status: 400 })
  }

  try {
    const [quotes, candles] = await Promise.all([
      fetchQuotes([pair]),
      fetchCandles(pair, '5min', 100),
    ])
    return NextResponse.json({ ok: true, data: { quote: quotes[0], candles } })
  } catch (err) {
    console.error('[/api/quotes] error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to fetch market data' }, { status: 502 })
  }
}
