/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // One-of-a-kind Solid White & Blue Cyber Matrix Palette
        matrix: {
          bg: '#030712',          // Deepest blueprint matrix black
          panel: '#070E22',       // Solid cyber navy panel
          card: '#0A132E',        // Elevated technical card
          cardHover: '#0E1A3D',   // Active state
          border: '#1E3A8A',      // Solid technical cobalt border (1px)
          borderBright: '#3B82F6', // High-contrast active border
          borderCyan: '#00F0FF',  // Radar / laser crosshair
          
          blue: '#0062FF',        // Solid Electric Blue (Primary)
          blueHover: '#1D72FE',   // Solid Blue Hover
          blueLight: '#38BDF8',   // Icy blue highlight
          cyan: '#00F0FF',        // Laser scanning beam
          white: '#FFFFFF',       // Pure Solid White
          textSecondary: '#93C5FD', // Soft matrix blue-tint text
          textMuted: '#60A5FA',   // Secondary data labels
          
          gain: '#00E676',        // Delta Gain
          loss: '#FF3366',        // Delta Loss
        },
        f1: {
          canvas: '#030712',
          panel: '#070E22',
          card: '#0A132E',
          cardHover: '#0E1A3D',
          border: '#1E3A8A',
          borderSubtle: '#142555',
          borderHighlight: '#0062FF',
          
          textPrimary: '#FFFFFF',
          textSecondary: '#93C5FD',
          textMuted: '#60A5FA',
          
          cyan: '#00F0FF',
          cyanGlow: 'rgba(0, 240, 255, 0.35)',
          amber: '#0062FF',
          amberGlow: 'rgba(0, 98, 255, 0.35)',
          emerald: '#00E676',
          emeraldGlow: 'rgba(0, 230, 118, 0.35)',
          crimson: '#FF3366',
          crimsonGlow: 'rgba(255, 51, 102, 0.35)',
          purple: '#38BDF8',
          blue: '#0062FF',
        },
        workstation: {
          bg: '#030712',
          background: '#030712',
          panel: '#070E22',
          surface: '#0A132E',
          surfaceHover: '#0E1A3D',
          card: '#0A132E',
          cardHover: '#0E1A3D',
          border: '#1E3A8A',
          borderSubtle: '#142555',
          borderMuted: '#1E3A8A',
          borderHighlight: '#0062FF',
          borderActive: '#00F0FF',
          textMuted: '#60A5FA',
          textSecondary: '#93C5FD',
          textPrimary: '#FFFFFF',
          textBright: '#FFFFFF',
          accent: '#0062FF',
          accentCyan: '#00F0FF',
          telemetryCyan: '#00F0FF',
          telemetryGreen: '#00E676',
          telemetryAmber: '#0062FF',
          telemetryRed: '#FF3366',
          telemetryPurple: '#38BDF8',
          telemetryBlue: '#0062FF',
        },
        retro: {
          primary: '#0062FF',
          surface: '#0A132E',
          surfaceDark: '#070E22',
          canvas: '#030712',
          border: '#1E3A8A',
          borderMuted: '#142555',
          focusRing: '#0062FF',
          textPrimary: '#FFFFFF',
          textSecondary: '#93C5FD',
          amber: '#0062FF',
          red: '#FF3366',
        },
      },
      boxShadow: {
        'matrix-glow': '0 0 15px rgba(0, 98, 255, 0.5)',
        'matrix-glow-cyan': '0 0 15px rgba(0, 240, 255, 0.5)',
        'matrix-glow-white': '0 0 15px rgba(255, 255, 255, 0.35)',
        'matrix-card': '0 8px 24px rgba(0, 10, 30, 0.7)',
        'f1-card': '0 8px 24px rgba(0, 10, 30, 0.7)',
        'f1-glow-cyan': '0 0 15px rgba(0, 240, 255, 0.4)',
        'f1-glow-amber': '0 0 15px rgba(0, 98, 255, 0.4)',
        'f1-glow-emerald': '0 0 15px rgba(0, 230, 118, 0.4)',
        'f1-glow-crimson': '0 0 15px rgba(255, 51, 102, 0.4)',
        'retro-xs': '0 1px 3px rgba(0, 0, 0, 0.4)',
        'retro-sm': '0 2px 6px rgba(0, 0, 0, 0.5)',
        'retro': '0 4px 12px rgba(0, 0, 0, 0.6)',
        'retro-lg': '0 8px 24px rgba(0, 0, 0, 0.7)',
        'retro-focus': '0 0 0 2px #030712, 0 0 0 4px #0062FF',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '4xs': '0.5rem',
        '3xs': '0.6rem',
        '2xs': '0.675rem',
        'xs': '0.75rem',
        'sm': '0.8125rem',
        'base': '0.875rem',
        'lg': '1rem',
        'xl': '1.125rem',
        '2xl': '1.35rem',
      },
      animation: {
        'scanline': 'scanline 4s linear infinite',
        'radar-sweep': 'radarSweep 6s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'grid-shift': 'gridShift 20s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        gridShift: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
      },
    },
  },
  plugins: [],
};
