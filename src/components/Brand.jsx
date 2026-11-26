import React from 'react';

/** شعار التطبيق: برق داخل دائرة على مربع داكن (نفس الشعار في الترويسة وصفحة «حول التطبيق») */
export function Logo({ size = 48 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[28%] bg-[#0b1018]" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72}>
        <defs>
          <linearGradient id="ev-bolt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5eead4" />
            <stop offset="1" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="22" fill="none" stroke="#14524c" strokeWidth="3.5" />
        <path d="M36 8 L18 36 H30 L26 56 L46 26 H34 Z" fill="url(#ev-bolt)" />
      </svg>
    </span>
  );
}

/** حلقة «اليوم N من M» للدورة الحالية */
export function CycleRing({ n, m, color = 'rgb(var(--fast))', size = 62 }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const k = m ? Math.min(1, n / m) : 0;
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} data-testid="cycle-ring" aria-label={`${n}/${m}`}>
      <svg viewBox="0 0 64 64" width={size} height={size} className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(var(--c-white) / 0.1)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * k} ${c}`} />
      </svg>
      <span className="tabular absolute inset-0 flex flex-col items-center justify-center leading-none" dir="ltr">
        <span className="text-base font-bold">{n}</span>
        <span className="text-xs text-slate-400">/{m}</span>
      </span>
    </span>
  );
}
