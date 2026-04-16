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
        // ✦ Trading UI palette
        profit: '#22c55e',   // green-500
        loss:   '#ef4444',   // red-500
        hold:   '#94a3b8',   // slate-400
      },
    },
  },
  plugins: [],
}

export default config
