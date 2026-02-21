/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // BroSync — Landing Page Palette
        bg: {
          primary: '#0F172A',
          secondary: '#1E293B',
          tertiary: '#253347',
          card: '#1E293B',
          hover: '#334155',
        },
        brand: {
          blue: '#3B82F6',
          cyan: '#22D3EE',
          purple: '#8B5CF6',
          green: '#22C55E',
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#F59E0B',
        },
        accent: {
          blue: '#60A5FA',
          cyan: '#67E8F9',
          purple: '#A78BFA',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          muted: '#64748B',
          inverse: '#0F172A',
        },
        border: {
          primary: '#334155',
          secondary: '#1E293B',
          accent: '#3B82F6',
        },
        difficulty: {
          easy: '#22C55E',
          medium: '#F59E0B',
          hard: '#EF4444',
        },
        status: {
          accepted: '#22C55E',
          wrong_answer: '#EF4444',
          time_limit: '#F59E0B',
          pending: '#94A3B8',
          running: '#3B82F6',
          runtime_error: '#8B5CF6',
          compilation_error: '#F97316',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #3B82F640' },
          '100%': { boxShadow: '0 0 20px #3B82F680, 0 0 40px #3B82F640' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232f80ed' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
