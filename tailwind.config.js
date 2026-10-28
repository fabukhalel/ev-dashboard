/** @type {import('tailwindcss').Config} */
// الألوان معرّفة كمتغيرات CSS في src/index.css لتتبدّل بين الوضع الداكن والنهاري
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: 'var(--font)' },
      colors: {
        white: v('c-white'), // في الوضع النهاري يتحوّل إلى لون داكن لتبقى الحدود والتراكبات ظاهرة
        slate: { 100: v('s100'), 200: v('s200'), 300: v('s300'), 400: v('s400'), 500: v('s500'), 600: v('s600') },
        ink: { 950: v('ink-950'), 900: v('ink-900'), 800: v('ink-800'), 700: v('ink-700'), 600: v('ink-600') },
        accent: v('accent'),
        brand1: v('brand1'),
        brand2: v('brand2'),
        home: v('home'),
        fast: v('fast'),
        violet: v('violet'),
        pink: v('pink'),
        danger: v('danger'),
        onaccent: v('onaccent'),
      },
      boxShadow: {
        glow: '0 0 28px -6px rgb(var(--accent) / .45)',
        'glow-home': '0 0 24px -6px rgb(var(--home) / .4)',
        'glow-fast': '0 0 24px -6px rgb(var(--fast) / .4)',
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        toast: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        sheet: 'sheet .28s cubic-bezier(.2,.8,.2,1)',
        fade: 'fade .2s ease-out',
        toast: 'toast .25s ease-out',
      },
    },
  },
  plugins: [],
};
