/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f1f4b',
          50: '#f1f5fc',
          100: '#dde7f6',
          500: '#2c4180',
          600: '#1f3169',
          700: '#162954',
          800: '#0f1f4b',
          900: '#080f22'
        },
        brand: {
          blue: '#2563eb',
          'blue-light': '#3b82f6',
          cyan: '#00B0FF',
          green: '#059669'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,27,74,.05), 0 6px 20px rgba(13,27,74,.04)',
        'card-hover': '0 4px 12px rgba(13,27,74,.08), 0 12px 32px rgba(13,27,74,.06)'
      }
    }
  },
  plugins: []
}
