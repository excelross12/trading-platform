'use client'

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { EquitySnapshot } from '@/types'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

interface Props {
  data: EquitySnapshot[]
}

export default function EquityCurve({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No equity data yet — start trading to see your curve.
      </div>
    )
  }

  const labels  = data.map((d) => new Date(d.snapshot_at).toLocaleDateString())
  const equities = data.map((d) => d.equity)
  const isUp    = equities[equities.length - 1] >= equities[0]

  const chartData = {
    labels,
    datasets: [
      {
        label:           'Equity',
        data:            equities,
        borderColor:     isUp ? '#22c55e' : '#ef4444',
        backgroundColor: isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        borderWidth:     2,
        pointRadius:     0,
        fill:            true,
        tension:         0.3,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { display: false },
      y: {
        ticks:  { color: '#94a3b8', callback: (v) => `$${v}` },
        grid:   { color: 'rgba(148,163,184,0.1)' },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-48">
      <Line data={chartData} options={options} />
    </div>
  )
}
