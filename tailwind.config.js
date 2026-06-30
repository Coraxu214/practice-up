/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fff5f5',
          100: '#ffe4e4',
          200: '#ffc9c9',
          300: '#ffa0a0',
          400: '#ff7a85',
          500: '#ff5a6e',
          600: '#f23a55',
          700: '#d12846',
        },
        cream: '#fffaf6',
        ink: '#1f1f1f',
        sub: '#7a7a7a',
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"HarmonyOS Sans"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 6px 24px -8px rgba(255, 90, 110, 0.18)',
        soft: '0 2px 12px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
