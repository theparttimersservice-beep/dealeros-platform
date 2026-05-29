/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mukta', 'sans-serif'],
        display: ['Tiro Odia', 'serif'],
      },
      colors: {
        ocean: {
          50:  '#eef7ff',
          100: '#d9edff',
          200: '#bbdeff',
          300: '#8ac9ff',
          400: '#52a9ff',
          500: '#2b84f5',
          600: '#1463d9',
          700: '#1150b0',
          800: '#144290',
          900: '#163a76',
          950: '#111f3e',
        },
        tide: {
          50:  '#f0fdf9',
          100: '#ccfbee',
          200: '#99f5de',
          300: '#5eebc9',
          400: '#29d4b0',
          500: '#0fb897',
          600: '#089379',
          700: '#0a7463',
          800: '#0c5c50',
          900: '#0d4c43',
        },
        sand: {
          50:  '#fdfbf3',
          100: '#faf5e1',
          200: '#f4e9bc',
          300: '#edd98d',
          400: '#e3c25c',
          500: '#d9a83a',
          600: '#bf8a25',
          700: '#9d6a1e',
          800: '#7f531f',
          900: '#6b451e',
        }
      }
    }
  },
  plugins: [],
}
