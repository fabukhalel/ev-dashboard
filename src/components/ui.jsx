import React, { useEffect, useRef } from 'react';
import { pushBack } from '../lib/backStack.js';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';
import { weekdayOf } from '../lib/format.js';

// ألوان تتبع الثيم عبر متغيرات CSS (rgb(var(--home)) ...)
export const C = {
  accent: 'rgb(var(--accent))',
  home: 'rgb(var(--home))',
  fast: 'rgb(var(--fast))',
  grid: 'rgb(var(--c-white) / 0.08)',
  axis: 'rgb(var(--s500))',
  text: 'rgb(var(--s100))',
};

export const typeColor = (type) => (type === 'fast' ? C.fast : C.home);

/** نافذة سفلية. action: زر في الترويسة (مثل حذف)، footer: زر ثابت أسفل النافذة (مثل حفظ) */
export function Sheet({ open, onClose, title, children, action = null, footer = null }) {
  const { t } = useI18n();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    // تسجيل النافذة في مكدس الرجوع (زر الرجوع في أندرويد / Escape)
    const pop = pushBack(() => closeRef.current());
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      pop();
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-black/55" onClick={onClose} />
      <div className="safe-bottom relative flex max-h-[92vh] w-full max-w-lg animate-sheet flex-col rounded-t-[1.875rem] bg-ink-800 shadow-2xl sm:rounded-[1.875rem]">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-white/15" aria-hidden="true" />
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-1.5">
            {action}
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 text-slate-300" aria-label={t('close')}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="px-5 pb-4 pt-1">{footer}</div>}
      </div>
    </div>
  );
}

/** أزرار متجاورة على شكل حبة (pill) */
export function Segmented({ value, onChange, options, className = '', size = 'md' }) {
  return (
    <div className={`grid gap-1 rounded-full bg-ink-900 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            aria-label={o.aria}
            className={`rounded-full px-2 ${size === 'sm' ? 'py-1.5' : 'py-2.5'} text-sm font-bold transition ${active ? 'bg-solid text-onsolid' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** مفتاح تشغيل/إيقاف */
export function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-solid' : 'bg-ink-600'}`}
    >
      <span
        className={`absolute rounded-full transition-all ${checked ? 'bg-onsolid' : 'bg-slate-300'}`}
        style={{ top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', insetInlineStart: checked ? 'calc(100% - 1.5rem)' : '0.25rem' }}
      />
    </button>
  );
}

export function Empty({ icon: Icon, title, hint, children }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      {Icon && <Icon size={34} className="text-accent" />}
      <p className="text-base font-bold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

/** رسالة قصيرة أسفل الشاشة، مع زر اختياري (مثل «تراجع») */
export function Toast({ message, action }) {
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: 'calc(6.5rem + max(env(safe-area-inset-bottom), var(--safe-area-inset-bottom, 0px)))', pointerEvents: action ? 'auto' : 'none' }}>
      <div role="status" className="flex animate-toast items-center gap-3 rounded-full bg-ink-700 px-4 py-2.5 text-sm font-bold shadow-2xl">
        <span>{message}</span>
        {action && <button type="button" className="rounded-full bg-solid px-3 py-1 text-xs font-bold text-onsolid" onClick={action.run}>{action.label}</button>}
      </div>
    </div>
  );
}

/** عنوان الشاشة البسيط لكل التبويبات عدا الرئيسية (V7) */
export function PageTitle({ title, children }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-1 pt-2">
      <h1 className="text-[1.75rem] font-bold leading-tight">{title}</h1>
      {children}
    </div>
  );
}

/** عنوان قسم صغير */
export function SectionTitle({ children, extra }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-1">
      <h3 className="text-lg font-bold">{children}</h3>
      {extra}
    </div>
  );
}

/** رقم كبير مع وحدته (الرقم أولاً دائماً، باتجاه LTR) */
export function NumUnit({ value, unit, className = '', valueClass = '', unitClass = 'text-sm font-medium opacity-70', testid }) {
  return (
    <span className={`num-unit tabular ${className}`}>
      <span className={valueClass} data-testid={testid}>{value}</span>
      {unit && <span className={unitClass}>{unit}</span>}
    </span>
  );
}

/**
 * شريط البطارية من نسبة «قبل» إلى «بعد» (C5): يُرسم دائماً من اليسار لليمين (0% يسار)
 * حتى يبقى صحيحاً في RTL، والنسبتان على طرفيه.
 */
export function BatteryBar({ before, after, type, showLabels = true, height = 'h-2' }) {
  const a = Math.max(0, Math.min(100, before));
  const b = Math.max(a, Math.min(100, after));
  return (
    <div className="tabular flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-400" dir="ltr">
      {showLabels && <span className="shrink-0">{Math.round(a)}%</span>}
      <span className={`relative ${height} min-w-[3rem] flex-1 overflow-hidden rounded-full bg-white/[0.08]`}>
        <span className="absolute inset-y-0 rounded-full" style={{ left: `${a}%`, width: `${b - a}%`, background: typeColor(type) }} />
      </span>
      {showLabels && <span className="shrink-0">{Math.round(b)}%</span>}
    </div>
  );
}

/** مربع التاريخ: رقم اليوم واسمه، مع رقم الشحنة داخل الفترة (H12) */
export function DateTile({ date, type, index, size = 'md' }) {
  const { lang } = useI18n();
  const day = Number(date.slice(8));
  const big = size === 'lg';
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-2xl ${big ? 'h-[4.25rem] w-[4.25rem]' : 'h-[3.75rem] w-[3.75rem]'}`} style={{ background: `color-mix(in srgb, ${typeColor(type)} 16%, transparent)` }}>
      <span className="flex flex-col items-center leading-none">
        <span className={`tabular font-bold ${big ? 'text-2xl' : 'text-xl'}`}>{day}</span>
        <span className="mt-1 text-xs font-medium text-slate-300">{weekdayOf(date, lang)}</span>
      </span>
      {index != null && (
        <span className="tabular absolute -top-1.5 -start-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-ink-700 px-1 text-xs font-bold text-slate-200 ring-2 ring-ink-800" data-testid="charge-index">{index}</span>
      )}
    </span>
  );
}

/** أسهم السابق/التالي باتجاه صحيح في RTL */
export function NavArrow({ dir, onClick, label, className = '', disabled = false }) {
  const { rtl } = useI18n();
  const Icon = (dir < 0) === rtl ? ChevronRight : ChevronLeft;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition disabled:opacity-30 ${className}`}>
      <Icon size={20} />
    </button>
  );
}

/** صف قائمة إعدادات/روابط: أيقونة ملونة + عنوان + وصف + سهم */
export function ListRow({ icon: Icon, tint = C.accent, title, sub, onClick, href, end, testid, danger = false }) {
  const { rtl } = useI18n();
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const inner = (
    <>
      {Icon && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}>
          <Icon size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block text-base font-bold ${danger ? 'text-danger' : ''}`}>{title}</span>
        {sub && <span className="block text-sm text-slate-400">{sub}</span>}
      </span>
      {end !== undefined ? end : (onClick || href) && <Chevron size={18} className="shrink-0 text-slate-500" />}
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-start';
  if (href) return <a className={cls} href={href} target="_blank" rel="noopener noreferrer" data-testid={testid}>{inner}</a>;
  if (onClick) return <button type="button" className={cls} onClick={onClick} data-testid={testid}>{inner}</button>;
  return <div className={cls} data-testid={testid}>{inner}</div>;
}

/** نسبة التغير ▲/▼ مقارنة بالفترة السابقة (H4). good: الاتجاه الذي يُعتبر جيداً */
export function Delta({ pct, label, className = '', tone = 'neutral' }) {
  if (pct == null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  const color = tone === 'cost' ? (up ? 'text-danger' : 'text-home') : '';
  return (
    <span className={`tabular inline-flex items-center gap-1 text-sm font-bold ${color} ${className}`} data-testid="delta">
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      <span>{Math.abs(Math.round(pct))}%</span>
      <span>{label}</span>
    </span>
  );
}
