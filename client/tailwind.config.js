/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary brand — Google Blue ────────────────────────────────────
        blue: {
          50:  '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          300: '#74A7F8',
          400: '#4285F4',
          500: '#1A73E8',   // primary
          600: '#1557B0',
          700: '#0D47A1',
          800: '#0A3880',
          900: '#062A65',
        },
        // ── Semantic: success ──────────────────────────────────────────────
        green: {
          50:  '#E6F4EA',
          100: '#CEEAD6',
          200: '#A8D5B5',
          300: '#81C995',
          400: '#5BB974',
          500: '#34A853',   // success
          600: '#2D8F46',
          700: '#267539',
        },
        // ── Semantic: warning ──────────────────────────────────────────────
        yellow: {
          50:  '#FEF9E7',
          100: '#FDF3C4',
          200: '#FAE680',
          300: '#F6D64B',
          400: '#FBBC04',   // Google Yellow
          500: '#F9A825',
          600: '#F57F17',
          700: '#E65100',
        },
        // ── Google Orange ─────────────────────────────────────────────────
        orange: {
          50:  '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF6D00',   // Google Orange
          600: '#E65100',
          700: '#BF360C',
        },
        // ── Semantic: danger ───────────────────────────────────────────────
        red: {
          50:  '#FCE8E6',
          100: '#FAD2CF',
          200: '#F5A9A5',
          300: '#EF7B6A',
          400: '#EA4335',   // danger
          500: '#C62828',
          600: '#B71C1C',
          700: '#7F0000',
        },
        // ── Neutral / text ─────────────────────────────────────────────────
        gray: {
          50:  '#F8F9FA',   // page background
          100: '#F1F3F4',   // hover background
          200: '#E8EAED',   // subtle borders
          300: '#DADCE0',   // borders
          400: '#BDC1C6',
          500: '#9AA0A6',
          600: '#80868B',
          700: '#5F6368',   // secondary text
          800: '#3C4043',
          900: '#202124',   // primary text
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Google Sans"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"Roboto Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      fontSize: {
        xs:   ['12px', { lineHeight: '16px' }],
        sm:   ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        md:   ['15px', { lineHeight: '22px' }],
        lg:   ['16px', { lineHeight: '24px' }],
        xl:   ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
        '5xl': ['32px', { lineHeight: '40px' }],
      },
      borderRadius: {
        sm:  '4px',
        DEFAULT: '8px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '24px',
      },
      boxShadow: {
        sm:  '0 1px 2px 0 rgba(60,64,67,0.08)',
        DEFAULT: '0 1px 3px 0 rgba(60,64,67,0.12), 0 1px 2px -1px rgba(60,64,67,0.08)',
        md:  '0 2px 6px 2px rgba(60,64,67,0.10)',
        lg:  '0 4px 16px 2px rgba(60,64,67,0.12)',
        card:'0 1px 2px 0 rgba(60,64,67,0.06), 0 1px 3px 1px rgba(60,64,67,0.04)',
        none: 'none',
      },
      spacing: {
        sidebar: '240px',
        topbar:  '56px',
      },
    },
  },
  plugins: [],
}
