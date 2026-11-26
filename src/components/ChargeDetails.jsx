// نافذة تفاصيل الشحنة (C3): كل بياناتها وزرّا «تعديل» و«حذف». تُفتح من الرئيسية والقائمة والتقويم.
import React from 'react';
import { Sheet, BatteryBar, DateTile, NumUnit } from './ui.jsx';
import { tierLevel, isTiered } from '../lib/tiers.js';
import { formatDate, fix } from '../lib/format.js';
import { useStore, useUi } from '../state/store.jsx';
import { numberCharges } from '../state/derived.js';
import { cycleOf, monthOf } from '../lib/cycle.js';

function Box({ label, children }) {
  return (
    <div className="rounded-2xl bg-ink-900 px-4 py-3">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="tabular mt-1 text-lg font-bold">{children}</div>
    </div>
  );
}

export default function ChargeDetails() {
  const { state: { settings, charges, bills }, t, actions } = useStore();
  const ui = useUi();
  const c = ui.detail ? charges.find((x) => x.id === ui.detail.id) || null : null;
  if (!c) return null;
  const cycle = settings.periodMode === 'month' ? monthOf(c.date) : cycleOf(c.date, settings.cycleStartDay, bills);
  const index = numberCharges(charges, cycle).get(c.id);
  const n = settings.tariff.tiers.length;
  const fast = c.type === 'fast';
  return (
    <Sheet
      open
      onClose={ui.closeDetail}
      title={fast ? t('detail_fast') : t('detail_home')}
      footer={(
        <div className="flex gap-2">
          <button type="button" className="btn-danger px-6 py-3.5" onClick={() => actions.deleteCharge(c.id)} data-testid="detail-delete">{t('delete')}</button>
          <button type="button" className="btn-primary flex-1 py-3.5" onClick={() => ui.openEdit(c)} data-testid="detail-edit">{t('edit')}</button>
        </div>
      )}
    >
      <div className="space-y-4" data-testid="charge-details">
        <div className="flex items-center gap-3">
          <DateTile date={c.date} type={c.type} index={index} size="lg" />
          <div className="text-sm text-slate-400">
            <bdi dir="ltr" className="tabular">{formatDate(c.date)}</bdi>
            {' · '}{t(settings.periodMode === 'month' ? 'detail_nth_month' : 'detail_nth_cycle', { n: index })}
          </div>
        </div>
        <div className="py-1 text-center">
          <NumUnit value={fix(c.energyKwh, 1)} unit="kWh" className="text-[3.25rem] font-bold leading-none" unitClass="text-base font-medium text-slate-400" />
          {c.energyManual && <div className="mt-1 text-sm text-slate-400">{t('energy_from_charger')}</div>}
        </div>
        <BatteryBar before={c.socBefore} after={c.socAfter} type={c.type} height="h-2.5" />
        <div className="grid grid-cols-2 gap-3">
          <Box label={t('kpi_cost')}>{fix(c.totalCost, 2)} <span className="text-sm text-slate-400">{settings.currency}</span></Box>
          {isTiered(c) && c.tier != null ? (
            <Box label={t('tier')}>{t(`tier_${tierLevel(c.tier, n)}_s`)} · {fix(c.pricePerKwh, 3)}{c.tierSource === 'manual' && <span className="text-xs text-slate-400"> · {t('tier_manual')}</span>}</Box>
          ) : (
            <Box label={t('price_kwh')}>{fix(c.pricePerKwh, 3)} <span className="text-sm text-slate-400">{settings.currency}</span></Box>
          )}
        </div>
        {c.note && <p className="text-sm text-slate-400">{fast ? t('station') : t('note')}: {c.note}</p>}
      </div>
    </Sheet>
  );
}
