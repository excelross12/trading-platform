import { getTrades, getEquityCurve, getLatestEquity } from '@/lib/db'
import type { Trade, EquitySnapshot } from '@/types'
import EquityCurve from '@/components/EquityCurve'
import PositionsTable from '@/components/PositionsTable'
import AnimatedStatCard from '@/components/AnimatedStatCard'
import PageWrapper from '@/components/PageWrapper'

export const revalidate = 30

export default async function HomePage() {
  const [openTrades, equityCurve, latestEquity] = await Promise.all([
    getTrades({ status: 'open', limit: 20 }).then((r) => r.trades),
    getEquityCurve(200),
    getLatestEquity(),
  ]).catch((): [Trade[], EquitySnapshot[], null] => [[], [], null])

  const closedPnl = await getTrades({ status: 'closed', limit: 500 })
    .then((r) => r.trades.reduce((s, t) => s + (t.pnl ?? 0), 0))
    .catch(() => 0)

  const equity  = latestEquity?.equity  ?? 0
  const balance = latestEquity?.balance ?? 0

  return (
    <PageWrapper>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live performance overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
          Demo account
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard
          label="Equity"     icon="💰"
          value={`$${equity.toFixed(2)}`}
          rawNum={equity}
          trend="neutral"    delay={0}
        />
        <AnimatedStatCard
          label="Balance"    icon="🏦"
          value={`$${balance.toFixed(2)}`}
          rawNum={balance}
          trend="neutral"    delay={0.07}
        />
        <AnimatedStatCard
          label="Open Trades" icon="📊"
          value={String(openTrades.length)}
          rawNum={openTrades.length}
          trend="neutral"    delay={0.14}
        />
        <AnimatedStatCard
          label="Realised PnL" icon={closedPnl >= 0 ? '📈' : '📉'}
          value={`${closedPnl >= 0 ? '+' : ''}$${closedPnl.toFixed(2)}`}
          rawNum={closedPnl}
          trend={closedPnl > 0 ? 'up' : closedPnl < 0 ? 'down' : 'neutral'}
          delay={0.21}
        />
      </div>

      {/* ── Equity curve ─────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 gradient-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Equity Curve
          </h2>
          <span className="text-xs text-slate-600 tabular-nums">
            {equityCurve.length} data points
          </span>
        </div>
        <EquityCurve data={equityCurve} />
      </div>

      {/* ── Open positions ───────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 gradient-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Open Positions
          </h2>
          {openTrades.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {openTrades.length} active
            </span>
          )}
        </div>
        <PositionsTable trades={openTrades} />
      </div>
    </PageWrapper>
  )
}
