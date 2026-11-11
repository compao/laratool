/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        laravel: '#FF2D20',
        php: '#777BB4',
        node: '#5FA04E',
        nginx: '#009639',
        /* Semantic token bindings */
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        'surface-solid': 'var(--bg-surface-solid)',
        'surface-subtle': 'var(--bg-surface-subtle)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'border-subtle': 'var(--border-subtle)',
        'content-primary': 'var(--text-primary)',
        'content-secondary': 'var(--text-secondary)',
        'content-muted': 'var(--text-muted)',
      },
      boxShadow: {
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.25)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-blue': '0 0 20px -3px rgba(59, 130, 246, 0.25)',
      }
    },
  },
  plugins: [],
};
