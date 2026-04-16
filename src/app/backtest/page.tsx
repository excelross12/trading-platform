'use client'

import { useState } from 'react'
import type { BacktestResult } from '@/types'

export default function BacktestPage() {
  const [csvText, setCsvText]     = useState('')
  const [pair, setPair]           = useState('EURUSD')
  const [riskPct, setRiskPct]     = useState(0.01)
  const [equity, setEquity]       = useState(10000)
  const [result, setResult]       = useState<BacktestResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvText(await file.text())
  }

  async function runBacktest() {
    if (!csvText) { setError('Upload a CSV file first'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, pair, riskPct, equity }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setResult(json.data.result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const m = result?.metrics

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-xl font-bold">Backtest</h1>

      {/* ── Controls ──────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs text-slate-400 uppercase">Pair</span>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            >
              {PAIRS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400 uppercase">Risk %</span>
            <input
              type="number" min={0.1} max={5} step={0.1}
              value={riskPct * 100}
              onChange={(e) => setRiskPct(parseFloat(e.target.value) / 100)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400 uppercase">Starting Equity ($)</span>
            <input
              type="number" min={100}
              value={equity}
              onChange={(e) => setEquity(parseFloat(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400 uppercase">CSV File (OHLCV)</span>
            <input
              type="file" accept=".csv"
              onChange={handleFile}
              className="w-full text-sm text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-slate-600 file:text-slate-200"
            />
          </label>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={runBacktest}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded font-medium transition-colors"
        >
          {loading ? 'Running…' : 'Run Backtest'}
        </button>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      {m && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Sharpe Ratio"  value={m.sharpe_ratio.toFixed(2)}     color={m.sharpe_ratio > 1 ? 'text-emerald-400' : 'text-slate-300'} />
            <Metric label="Win Rate"      value={`${(m.win_rate * 100).toFixed(1)}%`} color={m.win_rate > 0.5 ? 'text-emerald-400' : 'text-red-400'} />
            <Metric label="Max Drawdown"  value={`${(m.max_drawdown * 100).toFixed(1)}%`} color="text-red-400" />
            <Metric label="Profit Factor" value={m.profit_factor.toFixed(2)}    color={m.profit_factor > 1 ? 'text-emerald-400' : 'text-red-400'} />
            <Metric label="Total PnL"     value={`$${m.total_pnl.toFixed(2)}`} color={m.total_pnl > 0 ? 'text-emerald-400' : 'text-red-400'} />
            <Metric label="Avg PnL/Trade" value={`$${m.avg_pnl_per_trade.toFixed(2)}`} color={m.avg_pnl_per_trade > 0 ? 'text-emerald-400' : 'text-red-400'} />
            <Metric label="Total Trades"  value={String(m.trade_count)} />
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
