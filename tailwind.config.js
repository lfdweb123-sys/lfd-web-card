/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF7A00',
          'orange-dark': '#E06A00',
          'orange-light': '#FFF0E0',
          green: '#00C853',
          'green-light': '#E6FFF0',
        },
        surface: {
          bg: '#F7F9FC',
          card: '#FFFFFF',
          border: '#E8ECF0',
          muted: '#F0F3F6',
        },
        ink: {
          primary: '#0A0A0A',
          secondary: '#5A6474',
          muted: '#9BA3AF',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.06)',
        orange: '0 4px 20px rgba(255,122,0,0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
