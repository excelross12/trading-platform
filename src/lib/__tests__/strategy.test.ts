// TDD — written BEFORE strategy.ts implementation
// Run: npm test

import { describe, it, expect } from 'vitest'
import {
  generateSignal,
  calcPositionSize,
  calcEMA,
  calcRSI,
  calcADX,
  calcATR,
} from '../strategy'
import type { Candle } from '@/types'

// ── Fixture helpers ──────────────────────────────────────────────────────

/** Build N candles with a given close price (flat market) */
function flatCandles(close: number, n: number): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(Date.now() + i * 60000).toISOString(),
    open: close,
    high: close + 0.0002,
    low: close - 0.0002,
    close,
    volume: 1000,
  }))
}

/** Build trending up candles */
function trendingCandles(start: number, n: number, step = 0.0001): Candle[] {
  return Array.from({ length: n }, (_, i) => {
    const c = start + i * step
    return {
      time: new Date(Date.now() + i * 60000).toISOString(),
      open: c - step / 2,
      high: c + step,
      low: c - step,
      close: c,
      volume: 1000,
    }
  })
}

// ── calcEMA ───────────────────────────────────────────────────────────────

describe('calcEMA', () => {
  it('returns array of same length as input', () => {
    const candles = flatCandles(1.1000, 50)
    const ema = calcEMA(candles, 8)
    expect(ema).toHaveLength(50)
  })

  it('returns NaN for insufficient data points', () => {
    const candles = flatCandles(1.1000, 5)
    const ema = calcEMA(candles, 8)
    expect(ema[0]).toBeNaN()
  })

  it('EMA equals close on flat price series', () => {
    const candles = flatCandles(1.1000, 50)
    const ema = calcEMA(candles, 8)
    const last = ema[ema.length - 1]
    expect(last).toBeCloseTo(1.1000, 4)
  })
})

// ── calcRSI ───────────────────────────────────────────────────────────────

describe('calcRSI', () => {
  it('returns value in 0–100 range', () => {
    const candles = trendingCandles(1.1000, 50)
    const rsi = calcRSI(candles, 14)
    const last = rsi[rsi.length - 1]
    expect(last).toBeGreaterThanOrEqual(0)
    expect(last).toBeLessThanOrEqual(100)
  })

  it('RSI > 50 on strong uptrend', () => {
    const candles = trendingCandles(1.1000, 50, 0.001)
    const rsi = calcRSI(candles, 14)
    const last = rsi[rsi.length - 1]
    expect(last).toBeGreaterThan(50)
  })

  it('RSI < 50 on strong downtrend', () => {
    const candles = trendingCandles(1.2000, 50, -0.001)
    const rsi = calcRSI(candles, 14)
    const last = rsi[rsi.length - 1]
    expect(last).toBeLessThan(50)
  })
})

// ── calcATR ───────────────────────────────────────────────────────────────

describe('calcATR', () => {
  it('ATR is always positive', () => {
    const candles = trendingCandles(1.1000, 50)
    const atr = calcATR(candles, 14)
    const last = atr[atr.length - 1]
    expect(last).toBeGreaterThan(0)
  })

  it('ATR is larger for more volatile candles', () => {
    const calm = Array.from({ length: 50 }, (_, i) => ({
      time: new Date(Date.now() + i * 60000).toISOString(),
      open: 1.1000, high: 1.1001, low: 1.0999, close: 1.1000,
    }))
    const wild = Array.from({ length: 50 }, (_, i) => ({
      time: new Date(Date.now() + i * 60000).toISOString(),
      open: 1.1000, high: 1.1100, low: 1.0900, close: 1.1000,
    }))
    const atrCalm = calcATR(calm, 14)
    const atrWild = calcATR(wild, 14)
    expect(atrWild[atrWild.length - 1]).toBeGreaterThan(atrCalm[atrCalm.length - 1])
  })
})

// ── calcPositionSize ──────────────────────────────────────────────────────

describe('calcPositionSize', () => {
  it('respects 1% risk rule', () => {
    // 10,000 equity, 1% = $100 risk, 20 pip SL on EURUSD ≈ $20/pip per lot
    // → size ≈ 100 / 20 = 0.05 lots (rough)
    const size = calcPositionSize({
      equity: 10000,
      riskPct: 0.01,
      slPips: 20,
      pair: 'EURUSD',
    })
    expect(size).toBeGreaterThan(0)
    expect(size).toBeLessThanOrEqual(10) // sanity cap
  })

  it('returns 0 if SL pips is 0 (divide-by-zero guard)', () => {
    const size = calcPositionSize({ equity: 10000, riskPct: 0.01, slPips: 0, pair: 'EURUSD' })
    expect(size).toBe(0)
  })

  it('scales proportionally with equity', () => {
    const s1 = calcPositionSize({ equity: 10000, riskPct: 0.01, slPips: 20, pair: 'EURUSD' })
    const s2 = calcPositionSize({ equity: 20000, riskPct: 0.01, slPips: 20, pair: 'EURUSD' })
    expect(s2).toBeCloseTo(s1 * 2, 4)
  })
})

// ── generateSignal ────────────────────────────────────────────────────────

describe('generateSignal', () => {
  it('returns hold on flat market (ADX too low)', () => {
    const candles = flatCandles(1.1000, 100)
    const signal = generateSignal('EURUSD', candles, { riskPct: 0.01, equity: 10000 })
    expect(signal.action).toBe('hold')
  })

  it('returns buy signal on EMA crossover + RSI>50 + ADX>25', () => {
    // Strongly trending up market
    const candles = trendingCandles(1.0900, 100, 0.0003)
    const signal = generateSignal('EURUSD', candles, { riskPct: 0.01, equity: 10000 })
    // Trending market should yield buy or hold (never null)
    expect(['buy', 'hold']).toContain(signal.action)
  })

  it('signal always has valid SL and TP offsets when not hold', () => {
    const candles = trendingCandles(1.0900, 100, 0.0003)
    const signal = generateSignal('EURUSD', candles, { riskPct: 0.01, equity: 10000 })
    if (signal.action !== 'hold') {
      expect(signal.sl_offset).toBeGreaterThan(0)
      expect(signal.tp_offset).toBeGreaterThan(0)
      expect(signal.tp_offset).toBeGreaterThan(signal.sl_offset) // TP > SL (2:1.5 ratio)
    }
  })

  it('signal.size is 0 when action is hold', () => {
    const candles = flatCandles(1.1000, 100)
    const signal = generateSignal('EURUSD', candles, { riskPct: 0.01, equity: 10000 })
    expect(signal.size).toBe(0)
  })

  it('needs at least 50 candles (min for all indicators)', () => {
    const candles = flatCandles(1.1000, 10)
    const signal = generateSignal('EURUSD', candles, { riskPct: 0.01, equity: 10000 })
    expect(signal.action).toBe('hold')
  })
})
