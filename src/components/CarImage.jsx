import React, { useState } from 'react';
import { resolveStyle } from '../lib/carCatalog.js';
import { hexToRgb, rgbToHex, mix } from '../lib/theme.js';

// درجات اللون من لون الطلاء: فاتح للأعلى وداكن للأسفل (يعطي إحساس الحجم)
function paint(hex) {
  const c = hexToRgb(hex);
  if (!c) return null;
  return {
    hi: rgbToHex(mix(c, [255, 255, 255], 0.38)),
    mid: rgbToHex(c),
    lo: rgbToHex(mix(c, [0, 0, 0], 0.45)),
    deep: rgbToHex(mix(c, [0, 0, 0], 0.65)),
  };
}

const SPOKES = [0, 72, 144, 216, 288];

function Wheel({ cx, cy, r, id }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 2.6} fill="#06080d" opacity="0.92" />
      <circle cx={cx} cy={cy} r={r} fill="#12161e" />
      <circle cx={cx} cy={cy} r={r * 0.7} fill={`url(#${id}-rim)`} />
      {SPOKES.map((a) => (
        <line
          key={a}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos((a * Math.PI) / 180) * r * 0.68}
          y2={cy + Math.sin((a * Math.PI) / 180) * r * 0.68}
          stroke="#2a313d"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#3b4452" />
      <circle cx={cx} cy={cy} r={r * 0.09} fill="#aab4c2" />
    </g>
  );
}

/** رسم مفصّل لسيارة BYD Yuan Plus (Atto 3) بجسم مظلّل يوحي بالمجسّم ثلاثي الأبعاد */
function YuanArt({ id, color, label }) {
  const c = paint(color) || { hi: '#d5dbe4', mid: '#8a94a6', lo: '#4a5363', deep: '#2a303b' };
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" role="img" aria-label={label} data-car-style="yuan">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.hi} />
          <stop offset="0.38" stopColor={c.mid} />
          <stop offset="1" stopColor={c.lo} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#52627a" />
          <stop offset="0.5" stopColor="#1b2434" />
          <stop offset="1" stopColor="#0b0f18" />
        </linearGradient>
        <radialGradient id={`${id}-rim`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#eef2f7" />
          <stop offset="1" stopColor="#6d7886" />
        </radialGradient>
        <radialGradient id={`${id}-gnd`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ظل الأرض */}
      <ellipse cx="110" cy="88" rx="98" ry="6" fill={`url(#${id}-gnd)`} />

      {/* الهيكل */}
      <path
        d="M12 74 L11 58 Q11 50 16 46 L22 42 Q30 32 40 22 Q46 16 58 15 L116 15 Q128 15 136 24 L158 42 L193 48 Q205 50 207 58 L208 67 Q208 74 200 74 Z"
        fill={`url(#${id}-body)`}
      />
      {/* عتبة سفلية داكنة */}
      <path d="M16 70 L204 70 L204 74 L16 74 Z" fill={c.deep} opacity="0.75" />
      {/* خط الكتف: لمعة على الجانب */}
      <path d="M24 43 L158 44 L192 50 L192 53 L158 48 L24 47 Z" fill={`url(#${id}-sheen)`} opacity="0.7" />
      <path d="M34 30 Q42 19 58 16.5 L116 16.5 Q125 16.5 131 22" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />

      {/* الزجاج: نافذة خلفية صغيرة وأمامية كبيرة */}
      <path d="M36 40 Q40 31 46 25 Q50 21 57 21 L82 21 L82 40 Z" fill={`url(#${id}-glass)`} />
      <path d="M88 21 L114 21 Q123 21 129 28 L146 40 L88 40 Z" fill={`url(#${id}-glass)`} />
      <path d="M92 23 L106 23 L97 39 L92 39 Z" fill="#fff" opacity="0.12" />
      {/* العمود B وحدود الأبواب */}
      <path d="M82 21 L88 21 L88 40 L82 40 Z" fill={c.deep} />
      <path d="M85 40 L85 69" stroke={c.deep} strokeWidth="1.1" opacity="0.8" />
      <path d="M31 42 L31 69 M141 41 L141 69" stroke={c.deep} strokeWidth="1" opacity="0.55" />
      {/* مقابض الأبواب */}
      <rect x="68" y="45" width="10" height="2.2" rx="1.1" fill={c.deep} opacity="0.85" />
      <rect x="104" y="45" width="10" height="2.2" rx="1.1" fill={c.deep} opacity="0.85" />
      {/* قضبان السقف */}
      <path d="M62 13.5 L114 13.5" stroke="#1a1f29" strokeWidth="2.2" strokeLinecap="round" />
      {/* المرآة الجانبية */}
      <path d="M146 38 L156 39 L157 43 L148 43.5 Z" fill={c.lo} />

      {/* المصابيح: أمامي (DRL) وخلفي عريض */}
      <path d="M191 49 Q203 50 206.5 55 L199 58 L190 54 Z" fill="#fff6d6" />
      <path d="M193 51 L203 53.5" stroke="#ffe8a0" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.5 53 L17 47 L22 50.5 L12 58 Z" fill="#ff5a4d" />
      <path d="M13 53 L20 49" stroke="#ffd2cc" strokeWidth="1" opacity="0.8" strokeLinecap="round" />
      {/* فتحة الصدام الأمامي */}
      <path d="M194 61 L207 62 L206 69 L193 67 Z" fill="#0c1017" opacity="0.9" />
      <path d="M196 64 L205 64.6" stroke="#3b4452" strokeWidth="1" />

      {/* رمز البرق (سيارة كهربائية) على الباب */}
      <path d="M104 52 L99 60 L103 60 L101.2 66 L108 57.5 L104 57.5 Z" fill="#fff" opacity="0.8" />

      {/* العجلات */}
      <circle cx="52" cy="71" r="18" fill="#06080d" opacity="0.95" />
      <circle cx="172" cy="71" r="18" fill="#06080d" opacity="0.95" />
      <Wheel cx={52} cy={71} r={14} id={id} />
      <Wheel cx={172} cy={71} r={14} id={id} />
    </svg>
  );
}


// رسوم جانبية مبسّطة لكل فئة هيكل (ViewBox: 160×64)
// body: الهيكل، glass: النوافذ، wheels: مراكز العجلات
const SHAPES = {
  sedan: {
    body: 'M8 46 L8 39 Q8 35 14 34 L40 30 Q52 17 68 16 L100 16 Q116 17 127 30 L148 34 Q154 36 154 41 L154 46 Q154 48 151 48 L11 48 Q8 48 8 46 Z',
    glass: ['M46 30 Q55 21 68 20 L80 20 L80 30 Z', 'M85 20 L100 20 Q111 21 119 30 L85 30 Z'],
    wheels: [38, 124],
  },
  suv: {
    body: 'M8 49 L8 38 Q8 33 14 32 L36 29 Q44 14 62 12 L108 12 Q125 12 133 29 L148 32 Q154 34 154 39 L154 49 Q154 51 151 51 L11 51 Q8 51 8 49 Z',
    glass: ['M44 29 Q50 18 63 17 L78 17 L78 29 Z', 'M83 17 L106 17 Q118 18 126 29 L83 29 Z'],
    wheels: [38, 124],
  },
  hatch: {
    body: 'M12 48 L12 40 Q12 36 18 35 L38 32 Q47 17 63 15 L96 15 Q112 15 120 31 L140 35 Q147 37 147 42 L147 48 Q147 50 144 50 L15 50 Q12 50 12 48 Z',
    glass: ['M44 32 Q51 21 63 19 L78 19 L78 32 Z', 'M83 19 L96 19 Q107 20 113 32 L83 32 Z'],
    wheels: [40, 119],
  },
  pickup: {
    body: 'M6 48 L6 40 Q6 36 11 35 L28 32 Q34 18 48 17 L78 17 L84 32 L152 33 Q157 34 157 38 L157 48 Q157 50 154 50 L9 50 Q6 50 6 48 Z',
    glass: ['M38 32 Q42 22 51 21 L66 21 L66 32 Z', 'M70 21 L77 21 L81 32 L70 32 Z'],
    wheels: [34, 126],
  },
};

/**
 * صورة السيارة: صورة المستخدم إن وُجدت، وإلا رسم حسب الموديل.
 * size: 'hd' للترويسة، 'md' للإعدادات. اللون من settings.carColor (أحمر فيراري افتراضياً).
 * الرسم تصوير مرسوم بالكود وليس صورة فوتوغرافية؛ ارفع صورة سيارتك الحقيقية من الإعدادات إن أردت.
 */
export default function CarImage({ settings, size = 'md', className = '' }) {
  const dims = { sm: 'h-11 w-[4.5rem]', hd: 'h-14 w-[7.2rem]', md: 'h-20 w-40' }[size] || 'h-20 w-40';
  const label = `${settings.carName} ${settings.carModel}`.trim();

  // 1) صورة رفعها المستخدم  2) ملف public/car.jpg إن وُجد (صورة حقيقية مدمجة في التطبيق)  3) الرسم
  const [bundledFailed, setBundledFailed] = useState(false);
  const photo = settings.carPhoto || (bundledFailed ? '' : `${import.meta.env?.BASE_URL || './'}car.jpg`);
  if (photo) {
    return (
      <img
        src={photo}
        alt={label}
        onError={() => !settings.carPhoto && setBundledFailed(true)}
        className={`${dims} shrink-0 rounded-xl border border-white/10 object-cover ${className}`}
      />
    );
  }

  const style = resolveStyle(settings);
  const gid = `cg-${style}-${size}`;
  if (style === 'yuan') {
    return (
      <div className={`${dims} shrink-0 ${className}`}>
        <YuanArt id={gid} color={settings.carColor} label={label} />
      </div>
    );
  }
  const s = SHAPES[style] || SHAPES.sedan;
  const pc = paint(settings.carColor);
  const wy = style === 'suv' ? 51 : 50;

  return (
    <svg
      viewBox="0 0 160 64"
      className={`${dims} shrink-0 ${className}`}
      role="img"
      aria-label={label}
      data-car-style={style}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pc ? pc.hi : 'rgb(var(--accent))'} stopOpacity="0.97" />
          <stop offset="1" stopColor={pc ? pc.lo : 'rgb(var(--home))'} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="58" rx="64" ry="3.5" fill="rgb(var(--c-white))" opacity="0.08" />
      <path d={s.body} fill={`url(#${gid})`} />
      {s.glass.map((d, i) => (
        <path key={i} d={d} fill="rgb(var(--ink-900))" opacity="0.85" />
      ))}
      {s.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={wy} r="9.5" fill="rgb(var(--ink-950))" />
          <circle cx={cx} cy={wy} r="4.2" fill="rgb(var(--s400))" />
        </g>
      ))}
      {/* وسم البرق: إشارة إلى أنها كهربائية */}
      <path d="M82 36 L76 44 L80.5 44 L78.5 50 L86 41 L81.5 41 Z" fill="rgb(var(--onaccent))" opacity="0.9" />
    </svg>
  );
}
