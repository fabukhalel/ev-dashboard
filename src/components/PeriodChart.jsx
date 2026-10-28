import React, { useState } from 'react';
import { C } from './ui.jsx';
import { fix } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

// رسم SVG خفيف بلا مكتبات: أعمدة مكدّسة (منزلي/سريع) أو أعمدة مفردة أو خط.
// في العربية الأقدم يميناً، وفي الإنجليزية الأقدم يساراً. الألوان من متغيرات الثيم.
const W = 360;
const H = 220;
const PAD = { t: 14, r: 38, b: 30, l: 38 };

function niceStep(max, n = 4) {
  if (!(max > 0)) return 1;
  const raw = max / n;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

/**
 * rows: [{label, home, fast, value}]
 * kind: 'stack' (home+fast) | 'bar' (value) | 'line' (value، وقد تكون null)
 */
export default function PeriodChart({ rows, kind, unit, ariaLabel, decimals = 1 }) {
  const { t, rtl } = useI18n();
  const [sel, setSel] = useState(null);
  const n = rows.length;

  const totals = rows.map((r) => (kind === 'stack' ? r.home + r.fast : r.value));
  const vals = totals.filter((v) => v != null);
  const lo = kind === 'line' && vals.length ? Math.max(0, Math.floor(Math.min(...vals) - 1)) : 0;
  const hiRaw = vals.length ? Math.max(...vals) : 1;
  const span = kind === 'line' ? hiRaw - lo : hiRaw;
  const step = niceStep(span);
  const hi = lo + (Math.ceil(span / step) * step || step);
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);

  const axisLeft = PAD.l;
  const axisRight = W - PAD.r;
  const iw = axisRight - axisLeft;
  const ih = H - PAD.t - PAD.b;
  const slot = n ? iw / n : iw;
  const xc = (i) => (rtl ? axisRight - slot * (i + 0.5) : axisLeft + slot * (i + 0.5));
  const y = (v) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const bw = Math.min(34, slot * 0.58);
  const active = sel != null && sel < n ? sel : null;
  const tickX = rtl ? axisRight + 6 : axisLeft - 6;
  const tickAnchor = rtl ? 'start' : 'end';
  const line = rows.map((r, i) => (r.value != null ? `${xc(i).toFixed(1)},${y(r.value).toFixed(1)}` : null)).filter(Boolean).join(' ');
  const fmt = (v) => (v == null ? '—' : fix(v, decimals));

  if (n === 0) return <p className="py-10 text-center text-sm text-slate-500">{t('ch_empty')}</p>;
  if (kind !== 'stack' && vals.length === 0) return <p className="py-10 text-center text-sm text-slate-500">{t('ch_no_odo')}</p>;

  return (
    <div data-testid="period-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel} style={{ maxHeight: 260 }}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={axisLeft} x2={axisRight} y1={y(tk)} y2={y(tk)} stroke={C.grid} strokeWidth="1" />
            <text x={tickX} y={y(tk) + 3.5} fill={C.axis} fontSize="10" textAnchor={tickAnchor} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fix(tk, step < 1 ? 1 : 0)}
            </text>
          </g>
        ))}

        {kind === 'stack' &&
          rows.map((r, i) => {
            const x = xc(i) - bw / 2;
            const yh = y(r.home);
            const yt = y(r.home + r.fast);
            return (
              <g key={i} opacity={active == null || active === i ? 1 : 0.45}>
                <rect x={x} y={yh} width={bw} height={Math.max(0, y(0) - yh)} fill={C.home} rx="2" />
                {r.fast > 0 && <rect x={x} y={yt} width={bw} height={Math.max(0, yh - yt)} fill={C.fast} rx="3" />}
              </g>
            );
          })}

        {kind === 'bar' &&
          rows.map((r, i) =>
            r.value != null ? (
              <rect key={i} x={xc(i) - bw / 2} y={y(r.value)} width={bw} height={Math.max(0, y(0) - y(r.value))} fill={C.accent} rx="4" opacity={active == null || active === i ? 1 : 0.45} />
            ) : null,
          )}

        {kind === 'line' && (
          <>
            {line && <polyline points={line} fill="none" stroke={C.accent} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
            {rows.map((r, i) => (r.value != null ? <circle key={i} cx={xc(i)} cy={y(r.value)} r={active === i ? 6 : 4} fill={C.accent} stroke="rgb(var(--ink-800))" strokeWidth="2" /> : null))}
          </>
        )}

        {rows.map((r, i) => (
          <g key={`l${i}`}>
            <text x={xc(i)} y={H - 10} fill={active === i ? 'rgb(var(--s100))' : C.axis} fontSize={n > 6 ? '8.5' : '9.5'} textAnchor="middle" fontWeight={active === i ? 700 : 400}>
              {r.label}
            </text>
            <rect x={xc(i) - slot / 2} y={PAD.t} width={slot} height={ih + PAD.b} fill="transparent" style={{ cursor: 'pointer' }}
              onClick={() => setSel(active === i ? null : i)} onMouseEnter={() => setSel(i)} />
          </g>
        ))}
      </svg>

      <div className="tabular mt-2 min-h-[44px] rounded-xl bg-ink-900/70 px-3 py-2 text-xs" aria-live="polite">
        {active == null ? (
          <span className="text-slate-500">…</span>
        ) : kind === 'stack' ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <b className="text-slate-200">{rows[active].label}</b>
            <span style={{ color: C.home }}>{t('type_home_s')} {fmt(rows[active].home)}</span>
            <span style={{ color: C.fast }}>{t('type_fast_s')} {fmt(rows[active].fast)}</span>
            <span className="text-slate-300">Σ {fmt(rows[active].home + rows[active].fast)} {unit}</span>
          </div>
        ) : (
          <span className="font-bold" style={{ color: C.accent }}>{rows[active].label}: {rows[active].value != null ? `${fmt(rows[active].value)} ${unit}${rows[active].est ? ' ≈' : ''}` : '—'}</span>
        )}
      </div>

      {kind === 'stack' && (
        <div className="mt-2 flex justify-center gap-5 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C.home }} /> {t('type_home_s')}</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C.fast }} /> {t('type_fast_s')}</span>
        </div>
      )}
    </div>
  );
}
