import React from 'react';
import { C } from './ui.jsx';
import { fix } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

// رسم SVG خفيف بلا مكتبات (A3): أعمدة رفيعة (مكدّسة منزلي/سريع أو مفردة) أو خط،
// مع الرقم فوق كل عمود وخط متقطع للمتوسط. في العربية الأقدم يميناً.
const W = 360;
const H = 210;
const PAD = { t: 26, r: 10, b: 28, l: 10 };

/** rows: [{label, home, fast, value}] ، kind: 'stack' | 'bar' | 'line' */
export default function PeriodChart({ rows, kind, unit, ariaLabel, decimals = 1 }) {
  const { t, rtl } = useI18n();
  const n = rows.length;
  const totals = rows.map((r) => (kind === 'stack' ? r.home + r.fast : r.value));
  const vals = totals.filter((v) => v != null && v > 0);
  if (n === 0) return <p className="py-10 text-center text-sm text-slate-500">{t('ch_empty')}</p>;
  if (vals.length === 0) return <p className="py-10 text-center text-sm text-slate-500">{kind === 'stack' ? t('ch_empty') : t('ch_no_odo')}</p>;

  const lo = kind === 'line' ? Math.max(0, Math.min(...vals) * 0.85) : 0;
  const hi = Math.max(...vals) * (kind === 'line' ? 1.08 : 1) || 1;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / n;
  const xc = (i) => (rtl ? W - PAD.r - slot * (i + 0.5) : PAD.l + slot * (i + 0.5));
  const y = (v) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const bw = Math.max(8, Math.min(22, slot * 0.42));
  const fs = n > 8 ? 10.5 : 12;
  const line = rows.map((r, i) => (r.value != null ? `${xc(i).toFixed(1)},${y(r.value).toFixed(1)}` : null)).filter(Boolean).join(' ');

  return (
    <div data-testid="period-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel} style={{ maxHeight: 260 }}>
        {kind === 'stack' && rows.map((r, i) => {
          const x = xc(i) - bw / 2;
          const yh = y(r.home);
          const yt = y(r.home + r.fast);
          const last = i === n - 1;
          return (
            <g key={i} opacity={last ? 1 : 0.85}>
              {r.home > 0 && <rect x={x} y={yh} width={bw} height={Math.max(0, y(0) - yh)} fill={C.home} rx={bw / 2} />}
              {r.fast > 0 && <rect x={x} y={yt} width={bw} height={Math.max(0, yh - yt)} fill={C.fast} rx={bw / 2} />}
            </g>
          );
        })}
        {kind === 'bar' && rows.map((r, i) => (r.value != null ? <rect key={i} x={xc(i) - bw / 2} y={y(r.value)} width={bw} height={Math.max(0, y(0) - y(r.value))} fill={C.accent} rx={bw / 2} /> : null))}
        {kind === 'line' && (
          <>
            {line && <polyline points={line} fill="none" stroke={C.accent} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
            {rows.map((r, i) => (r.value != null ? <circle key={i} cx={xc(i)} cy={y(r.value)} r={4.5} fill={C.accent} stroke="rgb(var(--ink-800))" strokeWidth="2" /> : null))}
          </>
        )}
        {/* خط المتوسط */}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(avg)} y2={y(avg)} stroke={C.axis} strokeWidth="1.2" strokeDasharray="4 4" data-testid="avg-line" />
        {/* الرقم فوق كل عمود + عنوانه */}
        {rows.map((r, i) => {
          const v = totals[i];
          return (
            <g key={`l${i}`}>
              {v != null && v > 0 && (
                <text x={xc(i)} y={y(v) - 6} fill={C.text} fontSize={fs} fontWeight="700" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }} data-testid="bar-value">
                  {fix(v, decimals)}
                </text>
              )}
              <text x={xc(i)} y={H - 8} fill={C.axis} fontSize={fs} textAnchor="middle">{r.label}</text>
            </g>
          );
        })}
      </svg>
      {/* وسيلة الإيضاح: الألوان + المتوسط كنص واضح تحت الرسم بدل كتابته فوق الخط */}
      <div className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-slate-400">
        {kind === 'stack' && (
          <>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C.home }} /> {t('type_home_s')}</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C.fast }} /> {t('type_fast_s')}</span>
          </>
        )}
        <span className="inline-flex items-center gap-1.5" data-testid="avg-legend">
          <i className="w-4 border-t-2 border-dashed" style={{ borderColor: C.axis }} />
          {t('avg')} <b className="tabular text-slate-200" dir="ltr">{fix(avg, decimals)}{unit ? ` ${unit}` : ''}</b>
        </span>
      </div>
    </div>
  );
}
