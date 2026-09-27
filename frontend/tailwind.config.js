/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        workstation: {
          bg: '#0b0d10',
          panel: '#11141a',
          surface: '#171b22',
          card: '#151921',
          border: '#232936',
          borderSubtle: '#1b202a',
          borderMuted: '#161a22',
          textMuted: '#64748b',
          textSecondary: '#94a3b8',
          textPrimary: '#e2e8f0',
          textBright: '#f8fafc',
          accent: '#0284c7',
          accentCyan: '#38bdf8',
          telemetryGreen: '#10b981',
          telemetryAmber: '#f59e0b',
          telemetryRed: '#ef4444',
          telemetryPurple: '#a855f7',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.65rem',
        'xs': '0.75rem',
        'sm': '0.8125rem',
        'base': '0.875rem',
      },
    },
  },
  plugins: [],
};
