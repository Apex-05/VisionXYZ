/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VisionXYZ dark theme palette
        surface: {
          50: '#f5f5f5',
          100: '#1a1a1a',
          200: '#141414',
          300: '#0f0f0f',
          400: '#0a0a0a',
        },
        accent: {
          cyan: '#00d4ff',
          green: '#00ff88',
          orange: '#ff6b00',
          purple: '#7c3aed',
          pink: '#ec4899',
        },
        status: {
          active: '#00ff88',
          inactive: '#4b5563',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(0, 212, 255, 0.4)' },
          '50%': { boxShadow: '0 0 16px rgba(0, 212, 255, 0.8)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
