import React from 'react';
import { Check } from 'lucide-react';
import { Sheet } from './ui.jsx';
import DateField from './DateField.jsx';
import { formatDate, fix } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

/** اختيار الفترة المعروضة: شهر حالي/سابق/مخصصة/الكل أو دورة فاتورة محددة */
export default function PeriodSheet({ open, onClose, settings, bills, onChange }) {
  const { t } = useI18n();
  const mode = settings.periodMode;
  const opts = [
    ['month', t('period_month')],
    ['prev', t('period_prev')],
    ['custom', t('period_custom')],
    ['all', t('period_all')],
  ];
  const ordered = [...bills].sort((a, b) => b.end.localeCompare(a.end));

  const Row = ({ active, children, onClick, testid }) => (
    <button type="button" onClick={onClick} aria-pressed={active} data-testid={testid}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-start text-sm font-bold transition ${active ? 'border-accent/60 bg-accent/10 text-accent' : 'border-white/10 hover:bg-white/5'}`}>
      <span className="min-w-0">{children}</span>
      {active && <Check size={18} />}
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title={t('period_sheet_title')}>
      <div className="space-y-2">
        {opts.map(([id, label]) => (
          <Row key={id} active={mode === id} onClick={() => onChange({ periodMode: id })} testid={`period-${id}`}>{label}</Row>
        ))}
        {mode === 'custom' && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <DateField id="p-from" label={t('period_from')} value={settings.periodStart} onChange={(v) => onChange({ periodStart: v })} />
              <DateField id="p-to" label={t('period_to')} value={settings.periodEnd} onChange={(v) => onChange({ periodEnd: v })} />
            </div>
            {(!settings.periodStart || !settings.periodEnd || settings.periodStart > settings.periodEnd) && (
              <p role="alert" className="text-xs font-medium text-fast">{t('period_bad')}</p>
            )}
          </div>
        )}
        <h4 className="pt-3 text-xs font-bold text-slate-400">{t('period_bills')}</h4>
        {ordered.length === 0 && <p className="rounded-xl bg-white/[0.04] px-3 py-3 text-xs text-slate-400">{t('period_no_bills')}</p>}
        {ordered.map((b) => (
          <Row key={b.id} active={mode === 'bill' && (settings.periodBillId === b.id || (!settings.periodBillId && b === ordered[0]))}
            onClick={() => onChange({ periodMode: 'bill', periodBillId: b.id })} testid="period-bill">
            <bdi dir="ltr" className="tabular">{formatDate(b.start)} → {formatDate(b.end)}</bdi>
            <span className="tabular mt-0.5 block text-xs font-medium text-slate-400"><bdi dir="ltr">{fix(b.kwh, 0)} kWh</bdi></span>
          </Row>
        ))}
        <button className="btn-primary mt-3 w-full" onClick={onClose}>{t('done')}</button>
      </div>
    </Sheet>
  );
}
