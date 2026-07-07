/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        darkCard: '#151c2c',
        darkBorder: '#222f47',
        primary: {
          50: '#f4f6fb',
          100: '#e9edf7',
          200: '#c7d5ef',
          300: '#a6bce7',
          400: '#648ad6',
          500: '#2258c5', // Premium blue
          600: '#1f4fb1',
          700: '#1a4294',
          800: '#153576',
          900: '#112b61',
        },
        accent: {
          50: '#fdf3f3',
          100: '#fbe8e8',
          200: '#f5c6c6',
          300: '#efa3a3',
          400: '#e35e5e',
          500: '#d71919', // Crimson alerts
          600: '#c21717',
          700: '#a11313',
          800: '#810f0f',
          900: '#690c0c',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
