// Home — equity curve + open positions + PnL summary
// ✦ Server Component: fetches data server-side, no client bundle cost

import { getTrades, getEquityCurve, getLatestEquity } from '@/lib/db'
import type { Trade, EquitySnapshot } from '@/types'
import EquityCurve from '@/components/EquityCurve'
import PositionsTable from '@/components/PositionsTable'

export const revalidate = 30  // ISR: refresh every 30s

export default async function HomePage() {
  // ✦ Parallel fetch — no waterfall
  const [openTrades, equityCurve, latestEquity] = await Promise.all([
    getTrades({ status: 'open',   limit: 20 }).then((r) => r.trades),
    getEquityCurve(200),
    getLatestEquity(),
  ]).catch((): [Trade[], EquitySnapshot[], null] => [[], [], null])

  const closedPnl = await getTrades({ status: 'closed', limit: 500 })
    .then((r) => r.trades.reduce((s, t) => s + (t.pnl ?? 0), 0))
    .catch(() => 0)

  const equity  = latestEquity?.equity  ?? 0
  const balance = latestEquity?.balance ?? 0

  return (
    <div className="space-y-8">
      {/* ── PnL summary cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Equity"       value={`$${equity.toFixed(2)}`}  />
        <StatCard label="Balance"      value={`$${balance.toFixed(2)}`} />
        <StatCard label="Open Trades"  value={String(openTrades.length)} />
        <StatCard
          label="Realised PnL"
          value={`${closedPnl >= 0 ? '+' : ''}$${closedPnl.toFixed(2)}`}
          color={closedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      {/* ── Equity curve ──────────────────────────────────────────────── */}
      <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Equity Curve
        </h2>
        <EquityCurve data={equityCurve} />
      </section>

      {/* ── Open positions ────────────────────────────────────────────── */}
      <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Open Positions
        </h2>
        <PositionsTable trades={openTrades} />
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'text-white',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
