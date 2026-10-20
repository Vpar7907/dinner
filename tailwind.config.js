/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Unbounded"', 'Manrope', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#f8f4ec',
          200: '#efe7d6',
        },
        ink: {
          900: '#1f1d1a',
          700: '#45413a',
          500: '#7a746a',
          300: '#b9b2a6',
        },
        brand: {
          50: '#fff4ed',
          100: '#ffe5d3',
          200: '#ffc7a5',
          300: '#ffa06d',
          400: '#fd7a3c',
          500: '#f45d1b',
          600: '#e04510',
          700: '#b9330f',
        },
        sage: {
          50: '#f2f7f3',
          100: '#e0ece3',
          400: '#6fa180',
          500: '#4f8562',
          600: '#3c6a4d',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31,29,26,0.04), 0 8px 24px -8px rgba(31,29,26,0.08)',
        lift: '0 2px 4px rgba(31,29,26,0.04), 0 18px 40px -12px rgba(31,29,26,0.18)',
        glow: '0 8px 30px -6px rgba(244,93,27,0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
