// شريط الفترة (H13): «شهر | دورة الفاتورة | مخصص» وتحته الفترة بين سهمين ‹ ›.
// الاختيار محفوظ في الإعدادات ومشترك بين الرئيسية والشحنات والتحليل؛ الإزاحة (السابقة/التالية) لهذه الجلسة.
import React, { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Sheet, NavArrow } from './ui.jsx';
import DateField from './DateField.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { formatDate } from '../lib/format.js';

function CustomSheet({ open, onClose }) {
  const { state: { settings }, t, actions } = useStore();
  const { setPeriodOffset } = useUi();
  const [from, setFrom] = useState(settings.periodStart);
  const [to, setTo] = useState(settings.periodEnd);
  const pick = (patch) => {
    actions.changeSettings({ periodMode: 'custom', ...patch });
    setPeriodOffset(0);
    onClose();
  };
  const bad = !from || !to || from > to;
  return (
    <Sheet open={open} onClose={onClose} title={t('period_custom')}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['last7', 'last30', 'all'].map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={settings.periodMode === 'custom' && settings.periodPreset === p} onClick={() => pick({ periodPreset: p })} data-testid={`preset-${p}`}>
              {t(`preset_${p}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DateField id="p-from" label={t('period_from')} value={from} onChange={setFrom} />
          <DateField id="p-to" label={t('period_to')} value={to} onChange={setTo} />
        </div>
        {from && to && from > to && <p role="alert" className="text-sm font-medium text-danger">{t('period_bad')}</p>}
        <button type="button" className="btn-primary w-full" disabled={bad} onClick={() => pick({ periodPreset: '', periodStart: from, periodEnd: to })}>{t('apply')}</button>
      </div>
    </Sheet>
  );
}

/**
 * variant: 'hero' داخل البطاقة الرئيسية الداكنة، 'card' بطاقة مستقلة (الشحنات/التحليل)
 * children: سطر صغير تحت الفترة (مثل «آخر شحن قبل 3 أيام» أو «6 شحنات · 183.9 kWh»)
 */
export default function PeriodBar({ period, variant = 'card', children }) {
  const { state: { settings }, t, actions } = useStore();
  const { periodOffset, setPeriodOffset } = useUi();
  const [custom, setCustom] = useState(false);
  const hero = variant === 'hero';
  const mode = settings.periodMode;
  const setMode = (m) => {
    if (m === 'custom') { setCustom(true); return; }
    actions.changeSettings({ periodMode: m });
    setPeriodOffset(0);
  };
  const segBg = hero ? 'hero-panel' : 'bg-ink-900';
  const on = hero ? 'hero-on' : 'bg-solid text-onsolid';
  const off = hero ? 'hero-soft' : 'text-slate-400';
  const arrow = hero ? 'hero-panel' : 'bg-ink-900';
  return (
    <div data-testid="period-bar">
      <div className={`grid grid-cols-3 gap-1 rounded-full p-1 ${segBg}`} role="group" aria-label={t('period_kind')}>
        {[['month', t('kind_month')], ['cycle', t('kind_cycle')], ['custom', t('kind_custom')]].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} data-testid={`kind-${id}`}
            className={`rounded-full px-2 py-2.5 text-sm font-bold transition ${mode === id ? on : off}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <NavArrow dir={-1} label={t('period_prev')} className={arrow} disabled={period.all} onClick={() => setPeriodOffset(periodOffset - 1)} />
        <button type="button" className="min-w-0 flex-1 text-center" onClick={() => mode === 'custom' && setCustom(true)} data-testid="period-range">
          <span className="tabular block text-base font-bold leading-snug">
            {period.all ? t('preset_all') : <>{t('period_from')} <bdi dir="ltr">{formatDate(period.start)}</bdi> {t('period_to')} <bdi dir="ltr">{formatDate(period.end)}</bdi></>}
          </span>
          {children && <span className={`mt-0.5 block text-sm ${hero ? 'hero-soft' : 'text-slate-400'}`}>{children}</span>}
        </button>
        {periodOffset < 0 && !period.all ? (
          <NavArrow dir={1} label={t('period_next')} className={arrow} onClick={() => setPeriodOffset(periodOffset + 1)} />
        ) : (
          <button type="button" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${arrow}`} onClick={() => setCustom(true)} aria-label={t('period_custom')}>
            <CalendarRange size={18} />
          </button>
        )}
      </div>
      {custom && <CustomSheet open={custom} onClose={() => setCustom(false)} />}
    </div>
  );
}
