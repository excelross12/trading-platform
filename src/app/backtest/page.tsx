'use client'

import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { BacktestResult } from '@/types'

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'] as const

export default function BacktestPage() {
  const [csvText, setCsvText]   = useState('')
  const [pair, setPair]         = useState('EURUSD')
  const [riskPct, setRiskPct]   = useState(0.01)
  const [equity, setEquity]     = useState(10000)
  const [result, setResult]     = useState<BacktestResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [fileName, setFileName] = useState('')
  const resultsRef              = useRef<HTMLDivElement>(null)
  const pageRef                 = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from(pageRef.current?.querySelectorAll(':scope > *') ?? [], {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
    })
  }, { scope: pageRef })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setCsvText(await file.text())
  }

  async function runBacktest() {
    if (!csvText) { setError('Upload a CSV file first'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res  = await fetch('/api/backtest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ csv: csvText, pair, riskPct, equity }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setResult(json.data.result)

      // Animate results in
      setTimeout(() => {
        if (resultsRef.current) {
          gsap.from(resultsRef.current.querySelectorAll('.metric-card'), {
            scale: 0.92, opacity: 0, duration: 0.45, stagger: 0.06, ease: 'back.out(1.4)',
          })
        }
      }, 50)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const m = result?.metrics

  return (
    <div ref={pageRef} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Backtest</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload historical OHLCV CSV to simulate strategy</p>
      </div>

      {/* Controls */}
      <div className="glass rounded-2xl p-6 gradient-border space-y-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Parameters</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Pair */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Pair</label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              {PAIRS.map((p) => <option key={p} className="bg-surface">{p}</option>)}
            </select>
          </div>

          {/* Risk */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 uppercase tracking-wider">
              Risk per trade — <span className="text-blue-400 font-semibold">{(riskPct * 100).toFixed(1)}%</span>
            </label>
            <input
              type="range" min={0.1} max={5} step={0.1}
              value={riskPct * 100}
              onChange={(e) => setRiskPct(parseFloat(e.target.value) / 100)}
              className="w-full h-1.5 rounded-full bg-slate-700 appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Equity */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Starting Equity</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input
                type="number" min={100}
                value={equity}
                onChange={(e) => setEquity(parseFloat(e.target.value))}
                className="w-full glass rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* File */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 uppercase tracking-wider">OHLCV CSV File</label>
            <label className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors group">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm text-slate-400 truncate">{fileName || 'Choose file…'}</span>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={runBacktest}
          disabled={loading || !csvText}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
            bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white
            shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_28px_rgba(59,130,246,0.35)]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Running simulation…
            </span>
          ) : 'Run Backtest'}
        </button>
      </div>

      {/* Results */}
      {m && (
        <div ref={resultsRef} className="glass rounded-2xl p-6 gradient-border space-y-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Sharpe Ratio"  value={m.sharpe_ratio.toFixed(2)}           good={m.sharpe_ratio > 1} />
            <MetricCard label="Win Rate"      value={`${(m.win_rate * 100).toFixed(1)}%`}  good={m.win_rate > 0.5} />
            <MetricCard label="Max Drawdown"  value={`${(m.max_drawdown * 100).toFixed(1)}%`} good={false} bad />
            <MetricCard label="Profit Factor" value={m.profit_factor.toFixed(2)}           good={m.profit_factor > 1} />
            <MetricCard label="Total PnL"     value={`$${m.total_pnl.toFixed(2)}`}         good={m.total_pnl > 0} bad={m.total_pnl < 0} />
            <MetricCard label="Avg PnL/Trade" value={`$${m.avg_pnl_per_trade.toFixed(2)}`} good={m.avg_pnl_per_trade > 0} bad={m.avg_pnl_per_trade < 0} />
            <MetricCard label="Total Trades"  value={String(m.trade_count)} />
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="metric-card rounded-xl p-3.5 bg-white/[0.03] border border-white/5">
      <p className="text-xs text-slate-500 mb-1.5">{label}</p>
      <p className={`text-lg font-black tabular-nums ${good ? 'text-emerald-400' : bad ? 'text-rose-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
