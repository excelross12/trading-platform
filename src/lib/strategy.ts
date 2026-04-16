// ── Core Trading Strategy: EMA(8/21) + RSI(14) + ADX(14) ─────────────────
// Signal: buy when EMA8 > EMA21, RSI > 50, ADX > 25
//         sell when EMA8 < EMA21, RSI < 50, ADX > 25
//         hold otherwise
// Risk:   SL = 1.5×ATR(14), TP = 2.0×ATR(14), size = 1% equity

import {
  EMA,
  RSI,
  ADX,
  ATR,
} from 'technicalindicators'
import type { Candle, Signal, IndicatorSnapshot } from '@/types'

// ── Indicator helpers ─────────────────────────────────────────────────────

export function calcEMA(candles: Candle[], period: number): number[] {
  if (candles.length < period) {
    return candles.map(() => NaN)
  }
  const values = EMA.calculate({
    period,
    values: candles.map((c) => c.close),
  })
  // Pad the front with NaN to match input length
  const pad = candles.length - values.length
  return [...Array(pad).fill(NaN), ...values]
}

export function calcRSI(candles: Candle[], period = 14): number[] {
  if (candles.length < period + 1) {
    return candles.map(() => NaN)
  }
  const values = RSI.calculate({
    period,
    values: candles.map((c) => c.close),
  })
  const pad = candles.length - values.length
  return [...Array(pad).fill(NaN), ...values]
}

export function calcADX(candles: Candle[], period = 14): number[] {
  if (candles.length < period * 2) {
    return candles.map(() => NaN)
  }
  const values = ADX.calculate({
    period,
    high:  candles.map((c) => c.high),
    low:   candles.map((c) => c.low),
    close: candles.map((c) => c.close),
  })
  const pad = candles.length - values.length
  return [
    ...Array(pad).fill(NaN),
    ...values.map((v) => (typeof v === 'object' && v !== null ? (v as { adx: number }).adx : NaN)),
  ]
}

export function calcATR(candles: Candle[], period = 14): number[] {
  if (candles.length < period + 1) {
    return candles.map(() => NaN)
  }
  const values = ATR.calculate({
    period,
    high:  candles.map((c) => c.high),
    low:   candles.map((c) => c.low),
    close: candles.map((c) => c.close),
  })
  const pad = candles.length - values.length
  return [...Array(pad).fill(NaN), ...values]
}

// ── Position sizing ───────────────────────────────────────────────────────

interface SizeParams {
  equity:  number
  riskPct: number   // 0.01 = 1%
  slPips:  number
  pair:    string
}

const PIP_VALUE: Record<string, number> = {
  // Value per pip per lot in USD (approximate — good enough for demo sizing)
  EURUSD: 10, GBPUSD: 10, AUDUSD: 10, NZDUSD: 10,
  USDJPY: 9,  USDCAD: 7.5, USDCHF: 11,
}

export function calcPositionSize({ equity, riskPct, slPips, pair }: SizeParams): number {
  if (slPips <= 0) return 0
  const riskAmount  = equity * riskPct
  const pipValue    = PIP_VALUE[pair] ?? 10
  const rawSize     = riskAmount / (slPips * pipValue)
  // ✦ Round to nearest 0.01 lot, cap at 10 lots (demo sanity)
  return Math.min(Math.round(rawSize * 100) / 100, 10)
}

// ── Main signal generator ─────────────────────────────────────────────────

interface SignalParams {
  equity:  number
  riskPct: number
}

const MIN_CANDLES  = 50
const EMA_FAST     = 8
const EMA_SLOW     = 21
const RSI_PERIOD   = 14
const ADX_PERIOD   = 14
const ATR_PERIOD   = 14
const ADX_MIN      = 25
const SL_MULT      = 1.5
const TP_MULT      = 2.0
const PRICE_FACTOR = 10000   // pips = (price diff) × PRICE_FACTOR

function holdSignal(pair: string, indicators: IndicatorSnapshot): Signal {
  return {
    pair,
    action: 'hold',
    sl_offset: 0,
    tp_offset: 0,
    size: 0,
    confidence: 0,
    indicators,
    generated_at: new Date().toISOString(),
  }
}

export function generateSignal(
  pair: string,
  candles: Candle[],
  { equity, riskPct }: SignalParams,
): Signal {
  // ⚠️ Guard: need enough data for all indicators
  if (candles.length < MIN_CANDLES) {
    return holdSignal(pair, { ema_fast: NaN, ema_slow: NaN, rsi: NaN, adx: NaN, atr: NaN })
  }

  const emaFastArr = calcEMA(candles, EMA_FAST)
  const emaSlowArr = calcEMA(candles, EMA_SLOW)
  const rsiArr     = calcRSI(candles, RSI_PERIOD)
  const adxArr     = calcADX(candles, ADX_PERIOD)
  const atrArr     = calcATR(candles, ATR_PERIOD)

  const emaFast = emaFastArr[emaFastArr.length - 1]
  const emaSlow = emaSlowArr[emaSlowArr.length - 1]
  const rsi     = rsiArr[rsiArr.length - 1]
  const adx     = adxArr[adxArr.length - 1]
  const atr     = atrArr[atrArr.length - 1]

  const indicators: IndicatorSnapshot = { ema_fast: emaFast, ema_slow: emaSlow, rsi, adx, atr }

  // ⚠️ Guard: indicator calculation failed
  if ([emaFast, emaSlow, rsi, adx, atr].some(isNaN)) {
    return holdSignal(pair, indicators)
  }

  // ✦ Trend filter: ADX must show a trending market
  if (adx < ADX_MIN) return holdSignal(pair, indicators)

  const slOffset = atr * SL_MULT
  const tpOffset = atr * TP_MULT
  const slPips   = slOffset * PRICE_FACTOR

  const isBullish = emaFast > emaSlow && rsi > 50
  const isBearish = emaFast < emaSlow && rsi < 50

  if (!isBullish && !isBearish) return holdSignal(pair, indicators)

  const action = isBullish ? 'buy' : 'sell'
  const size   = calcPositionSize({ equity, riskPct, slPips, pair })

  // ✦ Confidence: simple linear score from ADX strength and RSI divergence from 50
  const adxScore = Math.min((adx - ADX_MIN) / 50, 1)
  const rsiScore = Math.min(Math.abs(rsi - 50) / 50, 1)
  const confidence = parseFloat(((adxScore + rsiScore) / 2).toFixed(2))

  return {
    pair,
    action,
    sl_offset: slOffset,
    tp_offset: tpOffset,
    size,
    confidence,
    indicators,
    generated_at: new Date().toISOString(),
  }
}
