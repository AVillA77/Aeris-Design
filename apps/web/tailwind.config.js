/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        aeris: {
          black: '#09090b',
          white: '#ffffff',
          accent: '#3b5bdb',
          'accent-light': '#eef2ff',
          income: '#16a34a',
          'income-light': '#f0fdf4',
          expense: '#dc2626',
          'expense-light': '#fef2f2',
          warning: '#d97706',
          'warning-light': '#fffbeb',
        },
      },
    },
  },
  plugins: [],
}
