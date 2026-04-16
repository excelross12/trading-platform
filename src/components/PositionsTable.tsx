'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { Trade } from '@/types'

interface Props { trades: Trade[] }

export default function PositionsTable({ trades }: Props) {
  const tableRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!tableRef.current) return
    const rows = tableRef.current.querySelectorAll('tbody tr')
    gsap.from(rows, {
      x: -20, opacity: 0,
      duration: 0.4, ease: 'power2.out',
      stagger: 0.06, delay: 0.2,
    })
  }, { scope: tableRef, dependencies: [trades.length] })

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-600">
        <svg className="w-7 h-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No open positions</p>
      </div>
    )
  }

  return (
    <div ref={tableRef} className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
            {['Pair','Side','Entry','SL','TP','Size','Opened'].map((h) => (
              <th key={h} className="text-left pb-3 pr-5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.id}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
            >
              <td className="py-3 pr-5 font-mono font-bold text-white tracking-wide">{t.pair}</td>
              <td className="py-3 pr-5">
                <span className={t.action === 'buy' ? 'badge-buy' : 'badge-sell'}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.action === 'buy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {t.action.toUpperCase()}
                </span>
              </td>
              <td className="py-3 pr-5 font-mono text-slate-300">{t.entry_price.toFixed(5)}</td>
              <td className="py-3 pr-5 font-mono text-rose-400/80">{t.sl_price.toFixed(5)}</td>
              <td className="py-3 pr-5 font-mono text-emerald-400/80">{t.tp_price.toFixed(5)}</td>
              <td className="py-3 pr-5 text-slate-400">{t.lot_size}</td>
              <td className="py-3 pr-5 text-slate-500 text-xs tabular-nums">
                {new Date(t.opened_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
