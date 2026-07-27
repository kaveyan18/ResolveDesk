/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        appBg: '#F4F5FA',
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#F4F5FA',
          border: '#E5E7F0',
        },
        sidebar: {
          DEFAULT: '#12172B',
          soft: '#1C2340',
          text: '#98A0BE',
        },
        ink: {
          DEFAULT: '#12172B',
          muted: '#666F8A',
        },
        border: {
          DEFAULT: '#E5E7F0',
        },
        primary: {
          DEFAULT: '#2A4FD1',
          dark: '#1E3AA0',
          soft: '#E9EDFC',
        },
        success: {
          DEFAULT: '#1F9D6C',
          soft: '#E3F6ED',
        },
        warning: {
          DEFAULT: '#DE8F1F',
          soft: '#FBF0DD',
        },
        danger: {
          DEFAULT: '#DB4C4C',
          soft: '#FBE7E7',
        },
        purple: {
          DEFAULT: '#7C5CD6',
          soft: '#EFEAFB',
        },
        gray: {
          DEFAULT: '#8992A6',
          soft: '#EEF0F5',
        },
        brand: {
          DEFAULT: '#2A4FD1',
          dark: '#1E3AA0',
          soft: '#E9EDFC',
        },
        status: {
          success: '#1F9D6C',
          warning: '#DE8F1F',
          danger: '#DB4C4C',
          purple: '#7C5CD6',
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
        card: '0 1px 2px rgba(18, 23, 43, 0.04), 0 8px 24px -12px rgba(18, 23, 43, 0.10)',
        subtle: '0 1px 2px rgba(18, 23, 43, 0.04)',
      },
    },
  },
  plugins: [],
};
