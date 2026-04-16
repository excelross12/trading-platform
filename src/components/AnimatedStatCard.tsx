'use client'

import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

interface Props {
  label:   string
  value:   string        // display string e.g. "$12,450.00"
  rawNum?: number        // if provided, counter animation runs
  trend?:  'up' | 'down' | 'neutral'
  icon?:   string        // emoji/icon
  delay?:  number        // stagger delay (seconds)
}

export default function AnimatedStatCard({
  label, value, rawNum, trend = 'neutral', icon, delay = 0,
}: Props) {
  const cardRef    = useRef<HTMLDivElement>(null)
  const numRef     = useRef<HTMLSpanElement>(null)
  const glowRef    = useRef<HTMLDivElement>(null)

  const glowColor =
    trend === 'up'   ? 'rgba(16,185,129,0.12)' :
    trend === 'down' ? 'rgba(244,63,94,0.12)'  :
                       'rgba(59,130,246,0.08)'

  const borderColor =
    trend === 'up'   ? 'rgba(16,185,129,0.2)'  :
    trend === 'down' ? 'rgba(244,63,94,0.2)'   :
                       'rgba(99,179,237,0.12)'

  const textColor =
    trend === 'up'   ? 'text-emerald-400' :
    trend === 'down' ? 'text-rose-400'    :
                       'text-white'

  useGSAP(() => {
    // Card entrance
    gsap.from(cardRef.current, {
      y: 28, opacity: 0, duration: 0.55,
      ease: 'power3.out', delay,
    })

    // Glow pulse on entry
    gsap.from(glowRef.current, {
      opacity: 0, scale: 0.5, duration: 0.8,
      ease: 'power2.out', delay: delay + 0.1,
    })

    // Number counter (if numeric)
    if (rawNum !== undefined && numRef.current) {
      const prefix = value.startsWith('+') ? '+' : value.startsWith('$') ? '$' : ''
      const suffix = value.endsWith('%') ? '%' : ''
      const obj    = { val: 0 }

      gsap.to(obj, {
        val: rawNum, duration: 1.2, ease: 'power2.out', delay: delay + 0.1,
        onUpdate() {
          if (numRef.current) {
            const formatted = Math.abs(obj.val) >= 1000
              ? `${prefix}${obj.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`
              : `${prefix}${obj.val.toFixed(2)}${suffix}`
            numRef.current.textContent = (rawNum < 0 && prefix !== '+') ? `-${formatted.replace('-','')}` : formatted
          }
        },
      })
    }
  }, { scope: cardRef })

  // Hover magnetic glow
  function onMouseEnter() {
    gsap.to(cardRef.current, { scale: 1.02, duration: 0.25, ease: 'power2.out' })
    gsap.to(glowRef.current, { opacity: 1, duration: 0.25 })
  }
  function onMouseLeave() {
    gsap.to(cardRef.current, { scale: 1,    duration: 0.3,  ease: 'power2.inOut' })
    gsap.to(glowRef.current, { opacity: 0.5, duration: 0.3 })
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{
        background: 'rgba(13,22,38,0.75)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Ambient glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none transition-opacity"
        style={{ background: glowColor, filter: 'blur(1px)' }}
      />

      {/* Subtle top shine */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</p>
          {icon && <span className="text-base opacity-60">{icon}</span>}
        </div>
        <p className={`text-2xl font-black tracking-tight ${textColor}`}>
          {rawNum !== undefined
            ? <span ref={numRef}>0</span>
            : value
          }
        </p>
      </div>
    </div>
  )
}
