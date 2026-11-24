import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './tray.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Instrument Sans', 'Atkinson Hyperlegible Next', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier Prime', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
