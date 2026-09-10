/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        railway: {
          bg: 'var(--bg-primary)', surface: 'var(--bg-secondary)', card: 'var(--bg-card)', cardHover: 'var(--bg-card-hover)',
          border: 'var(--border-color)', borderLight: 'var(--border-light)', muted: 'var(--text-muted)', text: 'var(--text-primary)',
          orange: 'var(--accent-orange)', orangeLight: 'var(--accent-orange-light)', blue: 'var(--accent-blue)',
          blueLight: 'var(--accent-blue-light)', green: 'var(--accent-green)', greenLight: 'var(--accent-green-light)',
          amber: 'var(--accent-yellow)', red: 'var(--accent-red)', purple: 'var(--accent-purple)'
        },
        white: 'rgb(var(--color-white) / <alpha-value>)', black: 'rgb(var(--color-black) / <alpha-value>)',
        slate: Object.fromEntries([100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, `rgb(var(--color-slate-${shade}) / <alpha-value>)`])),
        blue: Object.fromEntries([300, 400, 500, 600, 950].map((shade) => [shade, `rgb(var(--color-blue-${shade}) / <alpha-value>)`])),
        cyan: Object.fromEntries([200, 300, 400, 500, 600, 950].map((shade) => [shade, `rgb(var(--color-cyan-${shade}) / <alpha-value>)`])),
        orange: Object.fromEntries([200, 300, 400, 500, 600, 950].map((shade) => [shade, `rgb(var(--color-orange-${shade}) / <alpha-value>)`])),
        amber: Object.fromEntries([200, 300, 400, 500, 600, 950].map((shade) => [shade, `rgb(var(--color-amber-${shade}) / <alpha-value>)`])),
        emerald: Object.fromEntries([200, 300, 400, 500, 600, 800, 950].map((shade) => [shade, `rgb(var(--color-emerald-${shade}) / <alpha-value>)`])),
        green: Object.fromEntries([400].map((shade) => [shade, `rgb(var(--color-green-${shade}) / <alpha-value>)`])),
        red: Object.fromEntries([400, 700, 950].map((shade) => [shade, `rgb(var(--color-red-${shade}) / <alpha-value>)`])),
        rose: Object.fromEntries([200, 300, 400, 500, 600, 800, 900, 950].map((shade) => [shade, `rgb(var(--color-rose-${shade}) / <alpha-value>)`])),
        purple: Object.fromEntries([300, 400, 500, 600, 950].map((shade) => [shade, `rgb(var(--color-purple-${shade}) / <alpha-value>)`])),
        indigo: Object.fromEntries([400, 500, 700].map((shade) => [shade, `rgb(var(--color-indigo-${shade}) / <alpha-value>)`])),
        yellow: Object.fromEntries([200].map((shade) => [shade, `rgb(var(--color-yellow-${shade}) / <alpha-value>)`])),
        sky: { 300: 'rgb(var(--color-cyan-300) / <alpha-value>)', 500: 'rgb(var(--color-cyan-500) / <alpha-value>)' },
        teal: { 500: 'rgb(var(--color-emerald-500) / <alpha-value>)', 600: 'rgb(var(--color-emerald-600) / <alpha-value>)', 700: 'rgb(var(--color-emerald-800) / <alpha-value>)' },
        violet: { 700: 'rgb(var(--color-purple-600) / <alpha-value>)' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px -5px var(--shadow-glow-orange)',
        'glow-blue': '0 0 20px -5px var(--shadow-glow-blue)',
        'glow-green': '0 0 20px -5px var(--shadow-glow-green)',
        'glow-red': '0 0 20px -5px var(--shadow-glow-red)',
        'glass': '0 8px 32px 0 var(--shadow-color)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'train-flow': 'flow 10s linear infinite',
      },
      keyframes: {
        flow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}
