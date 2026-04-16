'use client'

import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { TradingConfig } from '@/types'
import configJson from '../../../config.json'

export default function SettingsPage() {
  const [cfg, setCfg]     = useState<TradingConfig>(configJson as TradingConfig)
  const pageRef           = useRef<HTMLDivElement>(null)
  const toggleRef         = useRef<HTMLButtonElement>(null)
  const PAIRS             = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']

  useGSAP(() => {
    gsap.from(pageRef.current?.querySelectorAll(':scope > *') ?? [], {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out',
    })
  }, { scope: pageRef })

  function toggle() {
    const next = !cfg.enabled
    setCfg((prev) => ({ ...prev, enabled: next }))

    // ✦ GSAP bounce on toggle
    gsap.timeline()
      .to(toggleRef.current, { scale: 0.92, duration: 0.1 })
      .to(toggleRef.current, { scale: 1,    duration: 0.2, ease: 'back.out(2)' })
  }

  function handlePairToggle(pair: string) {
    setCfg((prev) => ({
      ...prev,
      pairs: prev.pairs.includes(pair)
        ? prev.pairs.filter((p) => p !== pair)
        : [...prev.pairs, pair],
    }))
  }

  return (
    <div ref={pageRef} className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bot configuration and controls</p>
      </div>

      {/* Bot toggle */}
      <div className="glass rounded-2xl gradient-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Bot Status</p>
            <p className="text-sm text-slate-500 mt-1">
              {cfg.enabled
                ? 'Running — cron will execute trades every 5 min'
                : 'Stopped — no trades will be placed'}
            </p>
          </div>
          <button
            ref={toggleRef}
            onClick={toggle}
            className={`relative w-24 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              cfg.enabled
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {cfg.enabled ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Status bar */}
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
          cfg.enabled ? 'bg-emerald-500/8 text-emerald-400' : 'bg-slate-500/8 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.enabled ? 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`} />
          {cfg.enabled ? 'Bot is active — 5-min cron running' : 'Bot is inactive — set enabled: true in config.json and redeploy'}
        </div>
      </div>

      {/* Active pairs */}
      <div className="glass rounded-2xl gradient-border p-6 space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Pairs</h2>
        <div className="flex flex-wrap gap-2">
          {PAIRS.map((pair) => {
            const active = cfg.pairs.includes(pair)
            return (
              <button
                key={pair}
                onClick={() => handlePairToggle(pair)}
                className={`px-4 py-2 rounded-xl text-sm font-mono font-semibold border transition-all duration-200 ${
                  active
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'bg-white/[0.03] border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
                }`}
              >
                {pair}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-600">{cfg.pairs.length} of {PAIRS.length} pairs active</p>
      </div>

      {/* Risk parameters — read-only display */}
      <div className="glass rounded-2xl gradient-border p-6 space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Risk Parameters</h2>
        <div className="space-y-3">
          {[
            { label: 'Risk per trade',   value: `${(cfg.risk_pct * 100).toFixed(1)}%`,                    icon: '⚡' },
            { label: 'Max open / pair',  value: String(cfg.max_open_per_pair),                             icon: '🔒' },
            { label: 'Daily DD halt',    value: `${(cfg.daily_dd_halt * 100).toFixed(0)}%`,                icon: '🛑' },
            { label: 'EMA fast / slow',  value: `${cfg.indicators.ema_fast} / ${cfg.indicators.ema_slow}`, icon: '📊' },
            { label: 'RSI period',       value: String(cfg.indicators.rsi_period),                         icon: '📈' },
            { label: 'ADX min',          value: String(cfg.indicators.adx_min),                            icon: '🎯' },
            { label: 'SL / TP mult',     value: `${cfg.indicators.sl_atr_multiplier}× / ${cfg.indicators.tp_atr_multiplier}×`, icon: '📐' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <span className="opacity-60">{icon}</span>{label}
              </span>
              <span className="font-mono text-sm font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15 text-xs text-blue-400">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Edit <code className="mx-1 px-1 py-0.5 rounded bg-blue-500/15 font-mono">config.json</code> and redeploy to change risk parameters
        </div>
      </div>
    </div>
  )
}
