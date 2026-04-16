// Trades page — paginated closed trade history
import { getTrades } from '@/lib/db'

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
    pair:   searchParams.pair,
    status: 'closed',
    limit,
    offset,
  }).catch(() => ({ trades: [], total: 0 }))

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Trade History</h1>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 text-slate-400">
                {['#','Pair','Side','Entry','Exit','SL','TP','Size','PnL','Opened','Closed'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-500">No closed trades yet.</td></tr>
              )}
              {trades.map((t) => {
                const pnl = t.pnl ?? 0
                return (
                  <tr key={t.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-4 py-3 text-slate-500">{t.id}</td>
                    <td className="px-4 py-3 font-mono font-bold">{t.pair}</td>
                    <td className={`px-4 py-3 font-semibold ${t.action === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.action.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-mono">{t.entry_price.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono">{t.exit_price?.toFixed(5) ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-red-400">{t.sl_price.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{t.tp_price.toFixed(5)}</td>
                    <td className="px-4 py-3">{t.lot_size}</td>
                    <td className={`px-4 py-3 font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(t.opened_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{t.closed_at ? new Date(t.closed_at).toLocaleString() : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between text-sm text-slate-400">
            <span>Page {page} of {totalPages} · {total} trades</span>
            <div className="flex gap-2">
              {page > 1 && <a href={`/trades?page=${page - 1}`} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">Prev</a>}
              {page < totalPages && <a href={`/trades?page=${page + 1}`} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">Next</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
