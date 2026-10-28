import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, Zap, Info, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import DateField from './DateField.jsx';
import { Segmented, Sheet, C } from './ui.jsx';
import { TARIFF_PLANS } from '../lib/tariff.js';
import { billResult } from '../lib/analysis.js';
import { latestBill } from '../lib/period.js';
import { uid } from '../lib/storage.js';
import { fix, num, parseNum, formatDate } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

function Row({ label, value, unit, color, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm text-slate-300">{label}</div>
        {sub && <div className="text-[0.7rem] text-slate-500">{sub}</div>}
      </div>
      <div className="tabular shrink-0 text-base font-extrabold" style={{ color }}>
        {value} <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

/** نموذج إضافة/تعديل فاتورة: الفترة + الاستهلاك + المبلغ (اختياري) */
function BillSheet({ open, onClose, initial, onSave }) {
  const { t } = useI18n();
  const [f, setF] = useState({ start: '', end: '', kwh: '', amount: '' });
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open) return;
    setErr('');
    setF(initial ? { start: initial.start, end: initial.end, kwh: String(initial.kwh), amount: initial.amount != null ? String(initial.amount) : '' } : { start: '', end: '', kwh: '', amount: '' });
  }, [open, initial]);

  const submit = () => {
    const kwh = parseNum(f.kwh);
    const amount = f.amount.trim() === '' ? null : parseNum(f.amount);
    if (!f.start || !f.end || f.start > f.end) return setErr(t('bill_bad_dates'));
    if (kwh == null || kwh <= 0) return setErr(t('bill_bad_total'));
    if (amount != null && amount < 0) return setErr(t('bill_bad_amount'));
    onSave({ id: initial ? initial.id : uid(), start: f.start, end: f.end, kwh, amount });
    return undefined;
  };

  return (
    <Sheet open={open} onClose={onClose} title={initial ? t('bill_edit') : t('bill_add')}>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-400">{t('bill_form_hint')}</p>
        <div className="grid grid-cols-2 gap-3">
          <DateField id="b-from" label={t('bill_from')} value={f.start} onChange={(v) => setF((x) => ({ ...x, start: v }))} />
          <DateField id="b-to" label={t('bill_to')} value={f.end} onChange={(v) => setF((x) => ({ ...x, end: v }))} />
        </div>
        <div>
          <label className="label" htmlFor="b-total">{t('bill_total')}</label>
          <input id="b-total" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: 750 })} value={f.kwh} onChange={(e) => { setF((x) => ({ ...x, kwh: e.target.value })); setErr(''); }} />
        </div>
        <div>
          <label className="label" htmlFor="b-amount">{t('bill_amount')}</label>
          <input id="b-amount" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: '58.5' })} value={f.amount} onChange={(e) => setF((x) => ({ ...x, amount: e.target.value }))} />
        </div>
        {err && <p role="alert" className="text-xs font-medium text-danger">{err}</p>}
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary flex-1" onClick={submit}>{t('bill_save')}</button>
        </div>
      </div>
    </Sheet>
  );
}

/** أثر شحن السيارة المنزلي على فواتير الكهرباء المسجّلة، حسب التعرفة المتدرجة */
export default function BillImpact({ charges, bills, settings, onChange, onSaveBill, onDeleteBill }) {
  const { t } = useI18n();
  const tariff = settings.tariff;
  const setTariff = (patch) => onChange({ tariff: { ...tariff, ...patch } });
  const [selId, setSelId] = useState(null);
  const [sheet, setSheet] = useState({ open: false, bill: null });

  const bill = bills.find((b) => b.id === selId) || latestBill(bills);
  const lossPct = parseNum(settings.bill.loss) || 0;
  const r = useMemo(() => (bill ? billResult(bill, charges, tariff, lossPct) : null), [bill, charges, tariff, lossPct]);
  const cur = settings.currency;
  const ordered = [...bills].sort((a, b) => b.end.localeCompare(a.end));

  const setPlan = (plan) => {
    if (plan === 'custom') setTariff({ plan });
    else setTariff({ plan, tiers: TARIFF_PLANS[plan].map((x) => ({ ...x })) });
  };
  const setTier = (i, patch) => setTariff({ plan: 'custom', tiers: tariff.tiers.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const tierLabel = (p) => (p.to == null ? t('tier_above', { a: num(p.from, 0) }) : t('tier_range', { a: num(p.from, 0), b: num(p.to, 0) }));

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base font-extrabold"><Receipt size={18} className="text-accent" /> {t('bill_title')}</div>
          <button className="btn-primary !px-3 !py-2 text-xs" onClick={() => setSheet({ open: true, bill: null })}><Plus size={15} /> {t('bill_add')}</button>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">{t('bill_intro')}</p>
      </section>

      {!bill ? (
        <div className="card p-6 text-center text-sm text-slate-400">{t('bill_none')}</div>
      ) : (
        <section className="card space-y-1 p-4" aria-live="polite" data-testid="bill-result">
          <div className="tabular flex items-center justify-between gap-2 text-xs text-slate-400">
            <bdi dir="ltr">{formatDate(bill.start)} → {formatDate(bill.end)}</bdi>
            <span>{t('bill_days', { d: r.days })}</span>
          </div>
          <div className="rounded-xl border border-fast/30 bg-fast/[0.07] p-4 text-center">
            <div className="text-xs text-slate-400">{t('bill_impact')}</div>
            <div className="tabular text-4xl font-extrabold text-fast" data-testid="impact">{fix(r.res.impact, 2)} <span className="text-base font-medium">{cur}</span></div>
            <div className="mt-1 text-[0.7rem] text-slate-400">
              {t('bill_share', { v: num(r.res.share, 0) })}
              {r.res.effectiveRate != null && ` · ${t('bill_eff', { v: fix(r.res.effectiveRate, 3), c: cur })}`}
            </div>
            {r.approx && <div className="mt-1 text-[0.7rem] font-bold text-fast">{t('bill_approx')}</div>}
          </div>

          {r.res.capped && (
            <p className="flex gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-danger"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{t('bill_capped', { ev: fix(r.evKwh, 1) })}</p>
          )}
          {bill.amount != null && Math.abs(r.diff) > Math.max(0.5, bill.amount * 0.05) && (
            <p data-testid="bill-diff" className="flex gap-2 rounded-lg bg-fast/10 px-3 py-2 text-xs font-medium text-fast"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{t('bill_diff', { est: fix(r.res.billWith, 2), real: fix(bill.amount, 2), c: cur })}</p>
          )}

          <div className="divide-y divide-white/[0.06]">
            <Row label={t('bill_ev')} value={fix(r.homeKwh, 1)} unit="kWh" color={C.home} sub={r.homeN ? `${t('bill_ev_sub', { n: r.homeN })}${lossPct ? ` · ${t('bill_ev_loss', { v: fix(r.evKwh, 1) })}` : ''}` : t('bill_no_ev')} />
            <Row label={t('bill_base')} value={fix(r.res.base, 1)} unit="kWh" />
            <Row label={t('bill_without')} value={fix(r.res.billWithout, 2)} unit={cur} />
            <Row label={t('bill_with')} value={fix(r.res.billWith, 2)} unit={cur} color={C.accent} />
          </div>

          <h4 className="pt-3 text-sm font-extrabold">{t('bill_break')}</h4>
          <ul className="space-y-1.5" data-testid="breakdown">
            {r.res.evParts.map((p, i) => (
              <li key={i} className="tabular flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                <span className="text-slate-300">{p.to == null ? tierLabel(p) : <bdi dir="ltr">{tierLabel(p)}</bdi>}</span>
                <span className="text-slate-400"><bdi dir="ltr">{fix(p.kwh, 1)} kWh × {fix(p.rate * 1000, 0)}</bdi> {t('fils')}</span>
                <b className="text-fast">{fix(p.cost, 2)} {cur}</b>
              </li>
            ))}
          </ul>
          {r.months > 1 && <p className="flex gap-2 pt-2 text-[0.7rem] text-slate-500"><Info size={14} className="shrink-0" />{t('tariff_scale', { m: r.months })}</p>}
        </section>
      )}

      {ordered.length > 0 && (
        <section className="card space-y-2 p-4" data-testid="bill-list">
          <h3 className="text-base font-extrabold">{t('bill_list')}</h3>
          {ordered.map((b) => {
            const x = billResult(b, charges, tariff, lossPct);
            const on = bill && b.id === bill.id;
            return (
              <div key={b.id} className={`rounded-xl border p-3 ${on ? 'border-accent/60 bg-accent/10' : 'border-white/10'}`}>
                <button type="button" className="flex w-full items-center justify-between gap-2 text-start" onClick={() => setSelId(b.id)} aria-pressed={on}>
                  <span>
                    <bdi dir="ltr" className="tabular block text-sm font-extrabold">{formatDate(b.start)} → {formatDate(b.end)}</bdi>
                    <span dir="ltr" className="tabular block text-xs text-slate-400">{fix(b.kwh, 0)} kWh{b.amount != null ? ` · ${fix(b.amount, 2)} ${cur}` : ''}</span>
                  </span>
                  <span className="tabular text-end">
                    <span className="block text-[0.65rem] text-slate-400">{t('bill_impact_short')}</span>
                    <span className="block text-base font-extrabold text-fast">{fix(x.res.impact, 2)} {cur}</span>
                  </span>
                </button>
                <div className="mt-2 flex gap-2">
                  <button className="btn-ghost flex-1 !px-3 !py-1.5 text-xs" onClick={() => setSheet({ open: true, bill: b })}><Pencil size={14} /> {t('edit')}</button>
                  <button className="btn-danger flex-1 !px-3 !py-1.5 text-xs" onClick={() => onDeleteBill(b)}><Trash2 size={14} /> {t('delete')}</button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="card space-y-4 p-4">
        <div className="flex items-center gap-2 text-base font-extrabold"><Zap size={18} className="text-accent" /> {t('tariff_title')}</div>
        <div>
          <span className="label">{t('tariff_plan')}</span>
          <Segmented
            value={tariff.plan}
            onChange={setPlan}
            options={[
              { value: 'subsidized', label: t('plan_sub') },
              { value: 'unsubsidized', label: t('plan_unsub') },
              { value: 'custom', label: t('plan_custom') },
            ]}
          />
        </div>
        <div className="space-y-2">
          {tariff.tiers.map((x, i) => {
            const last = i === tariff.tiers.length - 1;
            return (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor={`t-up-${i}`}>{last ? t('tier_last') : t('tier_limit')}</label>
                  {last ? (
                    <div className="field tabular flex items-center text-slate-500">{t('tier_above', { a: num(tariff.tiers[i - 1].upTo, 0) })}</div>
                  ) : (
                    <input id={`t-up-${i}`} inputMode="decimal" className="field tabular" defaultValue={x.upTo} key={`${tariff.plan}-${i}-${x.upTo}`}
                      onBlur={(e) => { const n = parseNum(e.target.value); if (n != null && n > 0 && n !== x.upTo) setTier(i, { upTo: n }); }} />
                  )}
                </div>
                <div>
                  <label className="label" htmlFor={`t-rate-${i}`}>{t('tier_rate')}</label>
                  <input id={`t-rate-${i}`} inputMode="decimal" className="field tabular" defaultValue={Math.round(x.rate * 10000) / 10} key={`${tariff.plan}-r${i}-${x.rate}`}
                    onBlur={(e) => { const n = parseNum(e.target.value); if (n != null && n >= 0 && Math.abs(n / 1000 - x.rate) > 1e-9) setTier(i, { rate: n / 1000 }); }} />
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <label className="label" htmlFor="t-extra">{t('tariff_extra')}</label>
          <input id="t-extra" inputMode="decimal" className="field tabular" defaultValue={tariff.extraFils}
            onBlur={(e) => { const n = parseNum(e.target.value); if (n != null && n >= 0 && n <= 500) setTariff({ extraFils: n }); }} />
          <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-500">{t('tariff_extra_hint')}</p>
        </div>
        <div>
          <label className="label" htmlFor="b-loss">{t('bill_loss')}</label>
          <input id="b-loss" inputMode="decimal" className="field tabular" placeholder="0" value={settings.bill.loss} onChange={(e) => onChange({ bill: { ...settings.bill, loss: e.target.value } })} />
          <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-500">{t('bill_loss_hint')}</p>
        </div>
        <p className="text-[0.7rem] leading-relaxed text-slate-500">{t('tariff_src')}</p>
        <p className="text-[0.7rem] leading-relaxed text-slate-500">{t('tariff_unmodeled')}</p>
        <button className="btn-ghost w-full text-xs" onClick={() => onChange({ tariff: { plan: 'subsidized', tiers: TARIFF_PLANS.subsidized.map((x) => ({ ...x })), extraFils: 0 } })}>{t('tariff_reset')}</button>
      </section>

      <BillSheet
        open={sheet.open}
        onClose={() => setSheet({ open: false, bill: null })}
        initial={sheet.bill}
        onSave={(b) => { onSaveBill(b); setSelId(b.id); setSheet({ open: false, bill: null }); }}
      />
    </div>
  );
}
