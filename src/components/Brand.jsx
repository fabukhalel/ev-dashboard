import React from 'react';

/** شعار التطبيق: برق داخل دائرة على مربع داكن (نفس الشعار في الترويسة وصفحة «حول التطبيق») */
export function Logo({ size = 48 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[28%] bg-[#0b1018]" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72}>
        <defs>
          <linearGradient id="ev-bolt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'rgb(var(--accent))' }} />
            <stop offset="1" style={{ stopColor: 'rgb(var(--home))' }} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="22" fill="none" style={{ stroke: 'rgb(var(--accent) / 0.35)' }} strokeWidth="3.5" />
        <path d="M36 8 L18 36 H30 L26 56 L46 26 H34 Z" fill="url(#ev-bolt)" />
      </svg>
    </span>
  );
}
