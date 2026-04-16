'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

interface Props {
  children: React.ReactNode
  className?: string
}

// Wraps any page — animates children with a staggered fade-up on mount
export default function PageWrapper({ children, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Animate direct children with stagger
    if (!wrapRef.current) return
    const children = wrapRef.current.querySelectorAll(':scope > *')
    gsap.from(children, {
      y: 24, opacity: 0,
      duration: 0.5, ease: 'power3.out',
      stagger: 0.08, clearProps: 'all',
    })
  }, { scope: wrapRef })

  return (
    <div ref={wrapRef} className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}
