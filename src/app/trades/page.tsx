import { getTrades } from '@/lib/db'
import PageWrapper from '@/components/PageWrapper'

export const revalidate = 30

export default async function TradesPage({
  searchParams,
}: {
  searchParams: { page?: string; pair?: string }
}) {
  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const limit  = 25
  const offset = (page - 1) * limit

  const { trades, total } = await getTrades({
    pair: searchParams.pair, status: 'closed', limit, offset,
  }).catch(() => ({ trades: [], total: 0 }))

  const totalPages = Math.ceil(total / limit)
  const PAIRS      = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Trade History</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} closed trades</p>
        </div>

        {/* Pair filter */}
        <div className="flex items-center gap-1.5">
          <a
            href="/trades"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !searchParams.pair ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            All
          </a>
          {PAIRS.map((p) => (
            <a
              key={p}
              href={`/trades?pair=${p}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                searchParams.pair === p ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden gradient-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                {['#','Pair','Side','Entry','Exit','SL','TP','Size','PnL','Opened','Closed'].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <p className="text-sm">No closed trades yet</p>
                    </div>
                  </td>
                </tr>
              )}
              {trades.map((t, i) => {
                const pnl = t.pnl ?? 0
                return (
                  <tr
                    key={t.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{t.id}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{t.pair}</td>
                    <td className="px-4 py-3">
                      <span className={t.action === 'buy' ? 'badge-buy' : 'badge-sell'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.action === 'buy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {t.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{t.entry_price.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{t.exit_price?.toFixed(5) ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-rose-400/70">{t.sl_price.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400/70">{t.tp_price.toFixed(5)}</td>
                    <td className="px-4 py-3 text-slate-400">{t.lot_size}</td>
                    <td className={`px-4 py-3 font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">{new Date(t.opened_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">{t.closed_at ? new Date(t.closed_at).toLocaleString() : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages} · {total} trades total</span>
            <div className="flex gap-1.5">
              {page > 1 && (
                <a href={`/trades?page=${page - 1}`} className="px-3 py-1.5 glass rounded-lg hover:bg-white/5 transition-colors">
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a href={`/trades?page=${page + 1}`} className="px-3 py-1.5 glass rounded-lg hover:bg-white/5 transition-colors">
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
