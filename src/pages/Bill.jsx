import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
import DateField from '../components/DateField.jsx';
import PeriodChart from '../components/PeriodChart.jsx';
import { PageTitle, Sheet, NumUnit, SectionTitle, C } from '../components/ui.jsx';
import { useStore } from '../state/store.jsx';
import { cyclesBetween, dayOf, inPeriod } from '../lib/cycle.js';
import { billResult } from '../lib/analysis.js';
import { sortChrono } from '../lib/calc.js';
import { uid } from '../lib/storage.js';
import { fix, num, parseNum, formatDate, shortDM, todayStr } from '../lib/format.js';

/** تسجيل/تعديل فاتورة: التواريخ معبأة من الدورة، والإدخال: الاستهلاك الكلي والمبلغ (B3) */
function BillSheet({ open, onClose, initial, onSave }) {
  const { t, state: { settings } } = useStore();
  const [f, setF] = useState(() => ({ start: initial.start, end: initial.end, kwh: initial.kwh != null ? String(initial.kwh) : '', amount: initial.amount != null ? String(initial.amount) : '' }));
  const [err, setErr] = useState('');
  const submit = () => {
    const kwh = parseNum(f.kwh);
    const amount = f.amount.trim() === '' ? null : parseNum(f.amount);
    if (!f.start || !f.end || f.start > f.end) return setErr(t('bill_bad_dates'));
    if (kwh == null || kwh <= 0) return setErr(t('bill_bad_total'));
    if (amount != null && amount < 0) return setErr(t('bill_bad_amount'));
    onSave({ id: initial.id || uid(), start: f.start, end: f.end, kwh, amount });
    return undefined;
  };
  return (
    <Sheet open={open} onClose={onClose} title={initial.id ? t('bill_edit') : t('bill_add')}
      footer={<button type="button" className="btn-primary w-full py-3.5" onClick={submit} data-testid="bill-save">{t('bill_save')}</button>}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-400">{t('bill_form_hint')}</p>
        <div className="grid grid-cols-2 gap-3">
          <DateField id="b-from" label={t('bill_from')} value={f.start} onChange={(v) => setF((x) => ({ ...x, start: v }))} />
          <DateField id="b-to" label={t('bill_to')} value={f.end} onChange={(v) => setF((x) => ({ ...x, end: v }))} />
        </div>
        <div>
          <label className="label" htmlFor="b-total">{t('bill_total')}</label>
          <input id="b-total" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: 700 })} value={f.kwh} onChange={(e) => { setF((x) => ({ ...x, kwh: e.target.value })); setErr(''); }} />
        </div>
        <div>
          <label className="label" htmlFor="b-amount">{t('bill_amount_c', { c: settings.currency })}</label>
          <input id="b-amount" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: '58.5' })} value={f.amount} onChange={(e) => setF((x) => ({ ...x, amount: e.target.value }))} />
        </div>
        {err && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
      </div>
    </Sheet>
  );
}

function CycleCard({ c, onRecord, onEdit, onDelete }) {
  const { state: { settings }, t } = useStore();
  const [open, setOpen] = useState(false);
  const cur = settings.currency;
  const r = c.result;
  const tierLabel = (p) => (p.to == null ? t('tier_above', { a: num(p.from, 0) }) : t('tier_range', { a: num(p.from, 0), b: num(p.to, 0) }));
  return (
    <div className="card p-4" data-testid="cycle-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold">{t('cycle_title', { a: shortDM(c.p.start), b: formatDate(c.p.end) })}</div>
          <div className="text-sm text-slate-400">{c.day ? t('day_n_of_m', { n: c.day.n, m: c.day.m }) : r ? t('bill_recorded') : t('bill_not_recorded')}</div>
        </div>
        {c.day && <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">{t('current')}</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ink-900 px-3.5 py-3">
          <div className="text-sm text-slate-400">{t('bill_ev_kwh')}</div>
          <NumUnit value={fix(c.homeKwh, 1)} unit="kWh" className="mt-1 text-xl font-bold" unitClass="text-xs text-slate-400" />
        </div>
        <div className="rounded-2xl bg-ink-900 px-3.5 py-3">
          <div className="text-sm text-slate-400">{t('bill_estimate')}</div>
          <div className="tabular mt-1 text-xl font-bold">{fix(c.estimate, 2)} <span className="text-xs font-medium text-slate-400">{cur}</span></div>
        </div>
      </div>

      {r && (
        <div className="mt-3 space-y-2" data-testid="bill-result">
          <div className="rounded-2xl px-4 py-3 text-center" style={{ background: `color-mix(in srgb, ${C.fast} 12%, transparent)` }}>
            <div className="text-sm text-slate-400">{t('bill_impact')}</div>
            <div className="tabular text-[2rem] font-bold leading-tight" style={{ color: C.fast }} data-testid="impact">{fix(r.res.impact, 2)} <span className="text-base font-medium">{cur}</span></div>
            <div className="tabular text-sm text-slate-400">
              {t('bill_share', { v: num(r.res.share, 0) })}
              {r.res.effectiveRate != null && ` · ${t('bill_eff', { v: fix(r.res.effectiveRate, 3), c: cur })}`}
            </div>
          </div>
          {/* B5: مقارنة التقدير بالفعلي */}
          <p className="tabular flex justify-between rounded-2xl bg-ink-900 px-4 py-2.5 text-sm" data-testid="est-vs-real">
            <span className="text-slate-400">{t('bill_est_vs_real')}</span>
            <b dir="ltr">{fix(c.estimate, 2)} → {fix(r.res.impact, 2)}</b>
          </p>
          {r.res.capped && <p className="flex gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{t('bill_capped', { ev: fix(r.evKwh, 1) })}</p>}
          {c.bill.amount != null && Math.abs(r.diff) > Math.max(0.5, c.bill.amount * 0.05) && (
            <p data-testid="bill-diff" className="flex gap-2 rounded-xl bg-fast/10 px-3 py-2 text-sm font-medium text-fast"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{t('bill_diff', { est: fix(r.res.billWith, 2), real: fix(c.bill.amount, 2), c: cur })}</p>
          )}
          <button type="button" className="flex w-full items-center justify-between py-1 text-sm font-bold text-slate-300" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {t('bill_break')} <ChevronDown size={16} className={open ? 'rotate-180' : ''} />
          </button>
          {open && (
            <ul className="space-y-1.5" data-testid="breakdown">
              {r.res.evParts.map((p, i) => (
                <li key={i} className="tabular flex items-center justify-between rounded-xl bg-ink-900 px-3 py-2 text-sm">
                  <span className="text-slate-300">{p.to == null ? tierLabel(p) : <bdi dir="ltr">{tierLabel(p)}</bdi>}</span>
                  <span className="text-slate-400"><bdi dir="ltr">{fix(p.kwh, 1)} kWh × {fix(p.rate * 1000, 0)}</bdi> {t('fils')}</span>
                  <b style={{ color: C.fast }}>{fix(p.cost, 2)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {c.bill ? (
          <>
            <button className="btn-ghost flex-1" onClick={() => onEdit(c.bill)}><Pencil size={15} /> {t('edit')}</button>
            <button className="btn-danger flex-1" onClick={() => onDelete(c.bill)}><Trash2 size={15} /> {t('delete')}</button>
          </>
        ) : (
          <button className="btn-ghost flex-1" onClick={() => onRecord(c.p)} data-testid="bill-record"><Plus size={16} /> {t('bill_record')}</button>
        )}
      </div>
    </div>
  );
}

/** الفاتورة (B1–B6): بطاقة لكل دورة (الحالية أولاً) وتسجيل الفاتورة ونتيجتها، ومخطط حصة السيارة */
export default function Bill() {
  const { state: { charges, bills, settings }, t, actions } = useStore();
  const [sheet, setSheet] = useState(null);
  const today = todayStr();
  const lossPct = parseNum(settings.bill.loss) || 0;

  const cycles = useMemo(() => {
    const dates = [...sortChrono(charges).map((c) => c.date), ...bills.map((b) => b.start)].sort();
    const first = dates[0] || today;
    return cyclesBetween(first, today, settings.cycleStartDay, bills).slice(-12).map((p) => {
      const home = charges.filter((c) => c.type === 'home' && inPeriod(c.date, p));
      const homeKwh = home.reduce((s, c) => s + c.energyKwh, 0);
      const estimate = home.reduce((s, c) => s + c.totalCost, 0) + (homeKwh * (settings.tariff.extraFils || 0)) / 1000;
      const bill = p.billId ? bills.find((b) => b.id === p.billId) : null;
      return { p, day: dayOf(p, today), homeKwh, estimate, bill, result: bill ? billResult(bill, charges, settings.tariff, lossPct) : null };
    }).reverse();
  }, [charges, bills, settings.cycleStartDay, settings.tariff, lossPct, today]);

  const withBills = [...cycles].reverse().filter((c) => c.result);

  return (
    <>
      <PageTitle title={t('tab_bill')} />
      <p className="px-1 text-sm leading-relaxed text-slate-400">{t('bill_intro_new')}</p>
      {withBills.length >= 2 && (
        <section className="card p-4">
          <SectionTitle>{t('bill_share_chart')}</SectionTitle>
          <PeriodChart kind="bar" unit="%" decimals={0} ariaLabel={t('bill_share_chart')} rows={withBills.map((c) => ({ label: shortDM(c.p.start), value: c.result.res.share }))} />
        </section>
      )}
      {cycles.map((c) => (
        <CycleCard key={c.p.start} c={c}
          onRecord={(p) => setSheet({ start: p.start, end: p.end })}
          onEdit={(b) => setSheet(b)}
          onDelete={actions.deleteBill} />
      ))}
      {sheet && <BillSheet open initial={sheet} onClose={() => setSheet(null)} onSave={(b) => { actions.saveBill(b); setSheet(null); }} />}
    </>
  );
}
