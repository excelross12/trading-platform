'use client'

import { useState } from 'react'
import type { TradingConfig } from '@/types'
import configJson from '../../../config.json'

export default function SettingsPage() {
  const [cfg, setCfg]       = useState<TradingConfig>(configJson as TradingConfig)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  // ✦ In production this would POST to an /api/config endpoint
  // For MVP, displays config read-only with toggle
  function toggle() {
    setCfg((prev) => ({ ...prev, enabled: !prev.enabled }))
    setSaved(false)
  }

  function handlePairToggle(pair: string) {
    setCfg((prev) => ({
      ...prev,
      pairs: prev.pairs.includes(pair)
        ? prev.pairs.filter((p) => p !== pair)
        : [...prev.pairs, pair],
    }))
  }

  const ALL_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* ── Bot toggle ─────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between">
        <div>
          <p className="font-semibold">Bot Status</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {cfg.enabled ? '🟢 Running — cron will execute trades' : '🔴 Stopped — no trades will be placed'}
          </p>
        </div>
        <button
          onClick={toggle}
          className={`px-5 py-2 rounded font-medium transition-colors ${
            cfg.enabled ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {cfg.enabled ? 'Stop Bot' : 'Start Bot'}
        </button>
      </div>

      {/* ── Pairs ──────────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Pairs</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_PAIRS.map((pair) => (
            <button
              key={pair}
              onClick={() => handlePairToggle(pair)}
              className={`px-3 py-1.5 rounded text-sm font-mono font-medium border transition-colors ${
                cfg.pairs.includes(pair)
                  ? 'bg-emerald-900 border-emerald-600 text-emerald-400'
                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>

      {/* ── Risk params ────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Risk Parameters</h2>
        <Field label="Risk per trade (%)" value={`${(cfg.risk_pct * 100).toFixed(1)}%`} />
        <Field label="Max open per pair"  value={String(cfg.max_open_per_pair)} />
        <Field label="Daily DD halt (%)"  value={`${(cfg.daily_dd_halt * 100).toFixed(0)}%`} />
        <Field label="EMA Fast / Slow"    value={`${cfg.indicators.ema_fast} / ${cfg.indicators.ema_slow}`} />
        <Field label="RSI period"         value={String(cfg.indicators.rsi_period)} />
        <Field label="ADX min threshold"  value={String(cfg.indicators.adx_min)} />
        <Field label="SL / TP multiplier" value={`${cfg.indicators.sl_atr_multiplier}× / ${cfg.indicators.tp_atr_multiplier}×`} />
        <p className="text-xs text-slate-500 mt-2">
          To change risk params, edit <code className="bg-slate-700 px-1 rounded">config.json</code> and redeploy.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-emerald-400 text-sm">Settings saved.</p>}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  )
}
