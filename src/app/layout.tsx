import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Forex Trading Bot',
  description: 'EMA/RSI/ADX automated forex trading platform',
}

const NAV_LINKS = [
  { href: '/',           label: 'Dashboard' },
  { href: '/trades',     label: 'Trades'    },
  { href: '/backtest',   label: 'Backtest'  },
  { href: '/settings',   label: 'Settings'  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <nav className="border-b border-slate-700 bg-slate-800 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-emerald-400 text-lg tracking-tight">⚡ ForexBot</span>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
