// ── TraderMade API client — free tier (1000 req/day) ─────────────────────
// ✦ Batch pairs in one request to conserve quota
// ⚠️ API key loaded server-side only — never expose to client

import type { Candle, Quote } from '@/types'

const BASE = 'https://marketdata.tradermade.com/api/v1'

function apiKey(): string {
  const key = process.env.TRADERMADE_API_KEY
  if (!key) throw new Error('TRADERMADE_API_KEY is not set')
  return key
}

// ── Live quotes (batched) ─────────────────────────────────────────────────

export async function fetchQuotes(pairs: string[]): Promise<Quote[]> {
  const currency = pairs.join(',')
  const res = await fetch(
    `${BASE}/live?currency=${currency}&api_key=${apiKey()}`,
    { next: { revalidate: 0 } },   // ✦ always fresh — no Next.js cache
  )
  if (!res.ok) throw new Error(`TraderMade live: ${res.status} ${res.statusText}`)

  const data = (await res.json()) as {
    quotes: Array<{ base_currency: string; quote_currency: string; bid: number; ask: number; mid: number }>
    timestamp: number
  }

  const timestamp = new Date(data.timestamp * 1000).toISOString()
  return data.quotes.map((q) => ({
    pair: `${q.base_currency}${q.quote_currency}`,
    bid:  q.bid,
    ask:  q.ask,
    mid:  q.mid,
    timestamp,
  }))
}

// ── Historical OHLCV candles ──────────────────────────────────────────────

type TFInterval = '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' | 'daily'

export async function fetchCandles(
  pair: string,
  interval: TFInterval = '5min',
  count = 100,
): Promise<Candle[]> {
  const now     = new Date()
  const endDate = now.toISOString().slice(0, 16)                        // YYYY-MM-DDTHH:MM
  const start   = new Date(now.getTime() - count * 5 * 60 * 1000)      // rough start
  const startDate = start.toISOString().slice(0, 16)

  const url =
    `${BASE}/timeseries?currency=${pair}&api_key=${apiKey()}` +
    `&start_date=${startDate}&end_date=${endDate}&interval=${interval}&period=1&format=records`

  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`TraderMade timeseries: ${res.status} ${res.statusText}`)

  const data = (await res.json()) as {
    quotes: Array<{ date: string; open: number; high: number; low: number; close: number }>
  }

  return data.quotes.map((q) => ({
    time:  q.date,
    open:  q.open,
    high:  q.high,
    low:   q.low,
    close: q.close,
  }))
}

// ── CSV fallback parser (for quota exhaustion) ────────────────────────────

export function parseCsvCandles(csv: string): Candle[] {
  const lines = csv.trim().split('\n')
  const header = lines[0].toLowerCase()

  // ✦ Support common CSV formats: Date/Time,Open,High,Low,Close[,Volume]
  const hasVolume = header.includes('volume')

  return lines.slice(1).map((line) => {
    const parts = line.split(',')
    return {
      time:   parts[0].trim(),
      open:   parseFloat(parts[1]),
      high:   parseFloat(parts[2]),
      low:    parseFloat(parts[3]),
      close:  parseFloat(parts[4]),
      ...(hasVolume ? { volume: parseFloat(parts[5]) } : {}),
    }
  }).filter((c) => !isNaN(c.open) && !isNaN(c.close))
}
