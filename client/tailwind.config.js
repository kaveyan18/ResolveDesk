/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        appBg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          bg: 'var(--bg)',
          border: 'var(--border)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          soft: 'var(--sidebar-soft)',
          text: 'var(--sidebar-text)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          soft: 'var(--primary-soft)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          soft: 'var(--purple-soft)',
        },
        gray: {
          DEFAULT: 'var(--gray)',
          soft: 'var(--gray-soft)',
        },
        brand: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          soft: 'var(--primary-soft)',
        },
        status: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
          purple: 'var(--purple)',
        },
      },
      borderRadius: {
        card: '12px',
        sm: '8px',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow)',
        subtle: '0 1px 2px rgba(18, 23, 43, 0.04)',
      },
    },
  },
  plugins: [],
};

