/** @type {import('tailwindcss').Config} */
// الألوان معرّفة كمتغيرات CSS في src/index.css لتتبدّل بين الوضع الداكن والنهاري
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: 'var(--font)' },
      // لا نص أصغر من 12px عند الحجم الافتراضي 15px (V2)
      // الخط الأصغر لا ينزل عن 12px حتى لو صغّر المستخدم حجم الخط العام
      fontSize: { xs: ['max(12px, 0.8rem)', { lineHeight: '1.15rem' }], sm: ['max(12px, 0.875rem)', { lineHeight: '1.25rem' }] },
      colors: {
        white: v('c-white'), // في الوضع النهاري يتحوّل إلى لون داكن لتبقى الحدود والتراكبات ظاهرة
        slate: { 100: v('s100'), 200: v('s200'), 300: v('s300'), 400: v('s400'), 500: v('s500'), 600: v('s600') },
        ink: { 950: v('ink-950'), 900: v('ink-900'), 800: v('ink-800'), 700: v('ink-700'), 600: v('ink-600') },
        accent: v('accent'),
        solid: v('solid'),
        onsolid: v('onsolid'),
        home: v('home'),
        fast: v('fast'),
        danger: v('danger'),
      },
      boxShadow: {
        glow: '0 10px 30px -8px rgb(var(--solid) / .55)',
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        grow: { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
        toast: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        sheet: 'sheet .28s cubic-bezier(.2,.8,.2,1)',
        fade: 'fade .2s ease-out',
        toast: 'toast .25s ease-out',
        grow: 'grow .7s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
};
