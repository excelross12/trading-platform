'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'

gsap.registerPlugin()

const NAV_LINKS = [
  { href: '/',          label: 'Dashboard' },
  { href: '/trades',    label: 'Trades'    },
  { href: '/backtest',  label: 'Backtest'  },
  { href: '/settings',  label: 'Settings'  },
]

export default function Navbar() {
  const pathname  = usePathname()
  const navRef    = useRef<HTMLElement>(null)
  const logoRef   = useRef<HTMLSpanElement>(null)
  const linksRef  = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    // Nav slides down from top
    tl.from(navRef.current, { y: -64, opacity: 0, duration: 0.5 })

    // Logo scales in
    tl.from(logoRef.current, { scale: 0.7, opacity: 0, duration: 0.4 }, '-=0.2')

    // Links stagger in from left
    if (linksRef.current) {
      tl.from(linksRef.current.children, {
        x: -16, opacity: 0, duration: 0.35, stagger: 0.07,
      }, '-=0.2')
    }
  }, { scope: navRef })

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 glass-strong border-b border-white/5 px-6 py-0 flex items-center h-14"
    >
      {/* Logo */}
      <span ref={logoRef} className="flex items-center gap-2 mr-8">
        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent select-none">
          ForexBot
        </span>
        <span className="pulse-dot" />
      </span>

      {/* Nav links */}
      <div ref={linksRef} className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'text-white bg-white/8'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }
              `}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Right side: live indicator */}
      <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        <span>Demo</span>
      </div>
    </nav>
  )
}
