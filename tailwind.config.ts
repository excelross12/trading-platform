import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#060b14',
        surface:  '#0d1626',
        surface2: '#111f35',
        profit:   '#10b981',
        loss:     '#f43f5e',
        accent:   '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glass:      '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow-green': '0 0 24px rgba(16,185,129,0.2)',
        'glow-red':   '0 0 24px rgba(244,63,94,0.2)',
        'glow-blue':  '0 0 24px rgba(59,130,246,0.2)',
      },
      backgroundImage: {
        'gradient-card':   'linear-gradient(135deg, rgba(13,22,38,0.9), rgba(17,31,53,0.8))',
        'gradient-profit': 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
        'gradient-loss':   'linear-gradient(135deg, rgba(244,63,94,0.1),  rgba(244,63,94,0.03))',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
