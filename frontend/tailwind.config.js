/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aicte: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bfe0',
          400: '#609ed1',
          500: '#3c82c0',
          600: '#2b68a4',
          700: '#235385',
          800: '#20466e',
          900: '#0B192C',
          950: '#070f1b',
        },
        navy: {
          800: '#0F2038',
          900: '#0B192C',
          950: '#07101C',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
