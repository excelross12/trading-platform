'use client'

import { useRef } from 'react'
import {
  Chart as ChartJS,
  LineElement, PointElement,
  LinearScale, CategoryScale,
  Tooltip, Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { EquitySnapshot } from '@/types'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

interface Props { data: EquitySnapshot[] }

export default function EquityCurve({ data }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from(wrapRef.current, {
      opacity: 0, y: 16, duration: 0.6, ease: 'power2.out', delay: 0.3,
    })
  }, { scope: wrapRef })

  if (data.length === 0) {
    return (
      <div ref={wrapRef} className="h-56 flex flex-col items-center justify-center gap-2 text-slate-600">
        <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-sm">No equity data yet — start trading to see your curve.</p>
      </div>
    )
  }

  const labels   = data.map((d) => new Date(d.snapshot_at).toLocaleDateString())
  const equities = data.map((d) => d.equity)
  const isUp     = equities[equities.length - 1] >= equities[0]

  const upGrad   = 'rgba(16,185,129,'
  const downGrad = 'rgba(244,63,94,'

  const chartData = {
    labels,
    datasets: [{
      label:           'Equity',
      data:            equities,
      borderColor:     isUp ? `${upGrad}0.9)`   : `${downGrad}0.9)`,
      backgroundColor: (ctx: { chart: ChartJS }) => {
        const chart  = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'transparent'
        const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        if (isUp) {
          grad.addColorStop(0,   `${upGrad}0.25)`)
          grad.addColorStop(0.7, `${upGrad}0.05)`)
          grad.addColorStop(1,   `${upGrad}0)`)
        } else {
          grad.addColorStop(0,   `${downGrad}0.2)`)
          grad.addColorStop(0.7, `${downGrad}0.05)`)
          grad.addColorStop(1,   `${downGrad}0)`)
        }
        return grad
      },
      borderWidth: 2,
      pointRadius:     0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: isUp ? '#10b981' : '#f43f5e',
      fill:    true,
      tension: 0.35,
    }],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(13,22,38,0.95)',
        borderColor:     'rgba(99,179,237,0.15)',
        borderWidth:     1,
        titleColor:      '#94a3b8',
        bodyColor:       '#f1f5f9',
        padding:         10,
        callbacks: { label: (ctx) => ` $${Number(ctx.raw).toLocaleString()}` },
      },
      legend: { display: false },
    },
    scales: {
      x: { display: false },
      y: {
        ticks: {
          color: '#475569',
          font:  { size: 11 },
          callback: (v) => `$${Number(v).toLocaleString()}`,
        },
        grid:   { color: 'rgba(255,255,255,0.03)' },
        border: { display: false },
      },
    },
  }

  return (
    <div ref={wrapRef} className="h-56">
      <Line data={chartData} options={options} />
    </div>
  )
}
