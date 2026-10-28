import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';

// ألوان تتبع الثيم عبر متغيرات CSS (rgb(var(--home)) ...)
export const C = {
  accent: 'rgb(var(--accent))',
  home: 'rgb(var(--home))',
  fast: 'rgb(var(--fast))',
  violet: 'rgb(var(--violet))',
  pink: 'rgb(var(--pink))',
  grid: 'rgb(var(--c-white) / 0.1)',
  axis: 'rgb(var(--s500))',
};

export const TYPE_META = {
  home: { color: C.home, text: 'text-home', bg: 'bg-home/15' },
  fast: { color: C.fast, text: 'text-fast', bg: 'bg-fast/15' },
};

export function TypeBadge({ type }) {
  const { t } = useI18n();
  const key = type === 'fast' ? 'fast' : 'home';
  const m = TYPE_META[key];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${m.bg} ${m.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {key === 'fast' ? t('type_fast_dc') : t('type_home_ac')}
    </span>
  );
}

/** نافذة سفلية (Bottom Sheet) */
export function Sheet({ open, onClose, title, children }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="safe-bottom relative flex max-h-[92vh] w-full max-w-lg animate-sheet flex-col rounded-t-3xl border border-white/10 bg-ink-800 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div className={`grid gap-1 rounded-xl border border-white/10 bg-ink-900 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-lg px-2 py-2 text-sm font-bold transition ${
              active ? (o.activeClass || 'bg-accent/20 text-accent') : 'text-slate-400 hover:text-slate-200'
            }`}
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
      className={`relative h-6 w-11 shrink-0 rounded-full border transition ${checked ? 'border-accent/60 bg-accent/30' : 'border-white/15 bg-white/10'}`}
    >
      <span
        className={`absolute rounded-full transition-all ${checked ? 'bg-accent' : 'bg-slate-400'}`}
        style={{ top: '50%', transform: 'translateY(-50%)', width: '1.125rem', height: '1.125rem', insetInlineStart: checked ? 'calc(100% - 1.375rem)' : '0.2rem' }}
      />
    </button>
  );
}

export function Empty({ icon: Icon, title, hint, children }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      {Icon && <Icon size={34} className="text-accent/70" />}
      <p className="text-base font-bold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div className="animate-toast rounded-full border border-white/10 bg-ink-700 px-4 py-2 text-sm font-bold shadow-glow">{message}</div>
    </div>
  );
}
