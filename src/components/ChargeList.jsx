import React from 'react';
import { Battery, Gauge, StickyNote, Plus, Pencil, Trash2, Home, Zap } from 'lucide-react';
import { TypeBadge, Empty } from './ui.jsx';
import { sortChrono } from '../lib/calc.js';
import { formatDate, weekdayOf, fix, num } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

/** بطاقة شحنة: النقر على البطاقة أو القلم يفتح التعديل، وسلة المحذوفات تطلب تأكيداً قبل الحذف */
export function ChargeItem({ c, currency, eff, onEdit, onDelete }) {
  const { t, lang } = useI18n();
  return (
    <div className="card p-3.5 transition hover:border-accent/30">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onEdit(c)} className="min-w-0 flex-1 text-start" aria-label={t('edit')}>
          <div className="text-sm font-bold">
            {weekdayOf(c.date, lang)} {formatDate(c.date, lang)}
          </div>
          <div className="mt-1.5"><TypeBadge type={c.type} /></div>
        </button>
        <div className="tabular text-end">
          <div className="text-lg font-extrabold text-home">{fix(c.totalCost, 2)} <span className="text-xs font-medium text-slate-500">{currency}</span></div>
          <div className="text-xs text-slate-400">{fix(c.energyKwh, 1)} kWh</div>
        </div>
      </div>
      <div className="tabular mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1"><Battery size={13} /> {num(c.socBefore, 0)}% → {num(c.socAfter, 0)}%</span>
        {c.odometer != null && <span className="inline-flex items-center gap-1"><Gauge size={13} /> {num(c.odometer, 0)} {t('km')}</span>}
        <span>{t('per_kwh', { v: fix(c.pricePerKwh, 3) })}</span>
        {eff != null && <span className="font-bold text-fast">{fix(eff, 1)} kWh/100km</span>}
      </div>
      {c.note && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500"><StickyNote size={12} /> {c.note}</div>
      )}
      <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
        <button type="button" className="btn-ghost flex-1 !px-3 !py-1.5 text-xs" onClick={() => onEdit(c)}>
          <Pencil size={14} /> {t('edit')}
        </button>
        <button type="button" className="btn-danger flex-1 !px-3 !py-1.5 text-xs" onClick={() => onDelete(c)}>
          <Trash2 size={14} /> {t('delete')}
        </button>
      </div>
    </div>
  );
}

/** صف شحنة مضغوط للصفحة الرئيسية: التاريخ والنوع والوقت ونسبة البطارية والتكلفة والطاقة. النقر يفتح التعديل */
export function ChargeRow({ c, currency, onEdit }) {
  const { t } = useI18n();
  const fast = c.type === 'fast';
  const Icon = fast ? Zap : Home;
  return (
    <button
      type="button"
      onClick={() => onEdit(c)}
      aria-label={`${t('edit')}: ${formatDate(c.date)}`}
      className="card flex w-full items-center gap-3 px-3.5 py-2.5 text-start transition hover:border-accent/40"
      data-testid="charge-row"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${fast ? 'bg-fast/15 text-fast' : 'bg-accent/15 text-accent'}`}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span dir="ltr" className="tabular text-sm font-extrabold">{formatDate(c.date)}</span>
          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold ${fast ? 'bg-fast/15 text-fast' : 'bg-accent/15 text-accent'}`}>{fast ? t('type_fast_s') : t('type_home_s')}</span>
        </span>
        <span className="tabular mt-0.5 block text-xs text-slate-400">
          <bdi dir="ltr">{c.time}</bdi> · <bdi dir="ltr">{num(c.socBefore, 0)}% → {num(c.socAfter, 0)}%</bdi>
        </span>
      </span>
      <span className="tabular shrink-0 text-end">
        <span className="block text-base font-extrabold">{fix(c.totalCost, 2)} <span className="text-[0.65rem] font-bold text-slate-400">{currency}</span></span>
        <span dir="ltr" className="block text-xs text-slate-400">{fix(c.energyKwh, 1)} kWh</span>
      </span>
    </button>
  );
}

export default function ChargeList({ charges, segments, currency, onEdit, onDelete, onAdd }) {
  const { t } = useI18n();
  if (charges.length === 0) {
    return (
      <Empty icon={Battery} title={t('list_empty_title')} hint={t('list_empty_hint')}>
        <button className="btn-primary" onClick={onAdd}><Plus size={17} /> {t('add_charge')}</button>
      </Empty>
    );
  }
  const effById = new Map(segments.map((s) => [s.endId, s.efficiency]));
  const list = sortChrono(charges).reverse();
  return (
    <div className="space-y-2.5">
      {list.map((c) => (
        <ChargeItem key={c.id} c={c} currency={currency} eff={effById.get(c.id) ?? null} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
