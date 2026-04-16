'use client'

import type { Trade } from '@/types'

interface Props { trades: Trade[] }

export default function PositionsTable({ trades }: Props) {
  if (trades.length === 0) {
    return <p className="text-slate-500 text-sm">No open positions.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            {['Pair','Side','Entry','SL','TP','Size','Opened'].map((h) => (
              <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="py-2 pr-4 font-mono font-bold">{t.pair}</td>
              <td className={`py-2 pr-4 font-semibold ${t.action === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.action.toUpperCase()}
              </td>
              <td className="py-2 pr-4 font-mono">{t.entry_price.toFixed(5)}</td>
              <td className="py-2 pr-4 font-mono text-red-400">{t.sl_price.toFixed(5)}</td>
              <td className="py-2 pr-4 font-mono text-emerald-400">{t.tp_price.toFixed(5)}</td>
              <td className="py-2 pr-4">{t.lot_size}</td>
              <td className="py-2 pr-4 text-slate-400">
                {new Date(t.opened_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
