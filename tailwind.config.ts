import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#18181b',
          elevated: '#27272a',
          border: '#3f3f46',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          hover: '#a78bfa',
          muted: '#8b5cf633',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(139, 92, 246, 0.25)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(63, 63, 70, 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config
