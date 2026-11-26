// نموذج إضافة/تعديل الشحنة (F1–F10, T2, T4):
// المنزلي بلا حقل سعر: شارة الشريحة (قابلة للضغط) والتكلفة محسوبة. السريع: سعر للكيلوواط أو المبلغ الكلي،
// ويُتذكر السعر لكل محطة، مع حقل اختياري «kWh من شاشة الشاحن».
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, ChevronDown, AlertTriangle, Check } from 'lucide-react';
import { Sheet, Segmented, BatteryBar, NumUnit } from './ui.jsx';
import DateField from './DateField.jsx';
import { energyFromSoc, round, sortChrono } from '../lib/calc.js';
import { tierOn, tierLevel } from '../lib/tiers.js';
import { parseNum, todayStr, fix, num, weekdayOf } from '../lib/format.js';
import { addDays } from '../lib/cycle.js';
import { uid } from '../lib/storage.js';
import { useI18n } from '../lib/i18n.jsx';
import { useStore } from '../state/store.jsx';

const clean = (n, d) => (n == null ? '' : String(round(n, d)));

/** آخر سعر مستخدم في محطة سريعة بنفس الاسم، وإلا آخر سعر سريع، وإلا الافتراضي (F5, T4) */
export function suggestFastPrice(charges, station, fallback) {
  const fast = sortChrono(charges.filter((c) => c.type === 'fast' && c.pricePerKwh > 0)).reverse();
  const key = (station || '').trim();
  const same = key ? fast.find((c) => (c.note || '').trim() === key) : null;
  return (same || fast[0] || { pricePerKwh: fallback }).pricePerKwh;
}

function initState(initial, charges) {
  if (initial) {
    return {
      date: initial.date,
      type: initial.type,
      before: String(initial.socBefore),
      after: String(initial.socAfter),
      energyStr: initial.energyManual ? clean(initial.energyKwh, 2) : '',
      costMode: 'price',
      priceStr: initial.type === 'fast' ? clean(initial.pricePerKwh, 4) : '',
      totalStr: clean(initial.totalCost, 3),
      tierSource: initial.tierSource || null,
      tier: initial.tier,
      note: initial.note || '',
    };
  }
  const last = sortChrono(charges).pop();
  return {
    date: todayStr(), type: last ? last.type : 'home', before: '', after: '', energyStr: '',
    costMode: 'price', priceStr: '', totalStr: '', tierSource: 'auto', tier: null, note: '',
  };
}

export default function ChargeForm({ open, onClose, onSave, onDelete, initial, settings }) {
  const { t } = useI18n();
  // نموذج فيه تعديلات غير محفوظة يسأل قبل الإغلاق (زر الرجوع، X، النقر خارج النافذة)
  const dirty = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const submitRef = useRef(null);
  useEffect(() => { if (!open) setConfirmDel(false); }, [open]);
  const close = () => {
    dirty.current = false;
    setAskDiscard(false);
    onClose();
  };
  const guardedClose = () => {
    if (dirty.current && !askDiscard) setAskDiscard(true);
    else close();
  };
  return (
    <Sheet
      open={open}
      onClose={guardedClose}
      title={initial ? t('form_edit') : t('form_new')}
      action={initial ? (
        <button type="button" className={`grid h-10 place-items-center rounded-full bg-danger/15 text-danger ${confirmDel ? 'px-3 text-sm font-bold' : 'w-10'}`}
          onClick={() => (confirmDel ? onDelete(initial.id) : setConfirmDel(true))} aria-label={t('delete')} data-testid="form-delete">
          {confirmDel ? t('confirm_delete') : <Trash2 size={18} />}
        </button>
      ) : null}
      footer={open ? <button type="button" className="btn-primary w-full py-3.5 text-base" onClick={() => submitRef.current && submitRef.current()}>{t('save_charge')}</button> : null}
    >
      {open && askDiscard && (
        <div role="alert" className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-fast/15 px-3 py-2 text-sm font-bold text-fast" data-testid="discard-ask">
          <span>{t('discard_q')}</span>
          <span className="flex shrink-0 gap-1.5">
            <button type="button" className="btn-danger !px-3 !py-1.5 text-xs" onClick={close}>{t('discard')}</button>
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setAskDiscard(false)}>{t('keep_editing')}</button>
          </span>
        </div>
      )}
      {open && (
        <Inner
          key={initial ? initial.id : 'new'}
          submitRef={submitRef}
          onDirty={(v) => { dirty.current = v; }}
          onSave={(c) => { dirty.current = false; onSave(c); }}
          initial={initial}
          settings={settings}
        />
      )}
    </Sheet>
  );
}

function TierPicker({ value, auto, tiers, currency, onPick }) {
  const { t } = useI18n();
  const n = tiers.length;
  const label = (i) => {
    const lo = i === 0 ? 0 : tiers[i - 1].upTo;
    if (i === 0) return t('tier_under', { a: num(tiers[0].upTo, 0) });
    if (i === n - 1) return t('tier_over', { a: num(lo, 0) });
    return t('tier_between', { a: num(lo, 0), b: num(tiers[i].upTo, 0) });
  };
  const Opt = ({ active, onClick, title, sub, testid }) => (
    <button type="button" onClick={onClick} aria-pressed={active} data-testid={testid}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-start ${active ? 'bg-accent/15 text-accent' : 'bg-ink-900'}`}>
      <span><span className="block font-bold">{title}</span><span className="tabular block text-sm opacity-80">{sub}</span></span>
      {active && <Check size={18} />}
    </button>
  );
  return (
    <div className="space-y-2" data-testid="tier-picker">
      <Opt active={value.source === 'auto'} onClick={() => onPick({ source: 'auto' })} title={t('tier_auto')} sub={`${t(`tier_${tierLevel(auto, n)}`)} · ${fix(tiers[auto].rate, 3)} ${currency}`} testid="tier-auto" />
      {tiers.map((x, i) => (
        <Opt key={i} active={value.source === 'manual' && value.tier === i} onClick={() => onPick({ source: 'manual', tier: i })}
          title={t(`tier_${tierLevel(i, n)}`)} sub={`${label(i)} · ${fix(x.rate, 3)} ${currency}`} testid={`tier-${i}`} />
      ))}
    </div>
  );
}

function Inner({ submitRef, onDirty, onSave, initial, settings }) {
  const { t, lang } = useI18n();
  const { state: { charges, bills } } = useStore();
  const [f, setF] = useState(() => initState(initial, charges));
  const [start] = useState(f);
  useEffect(() => { onDirty(f !== start); }, [f, start, onDirty]);
  const [error, setError] = useState('');
  const [tierOpen, setTierOpen] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const fast = f.type === 'fast';
  const tiers = settings.tariff.tiers;
  const capacity = initial?.capacity ?? settings.capacity;

  const before = parseNum(f.before);
  const after = parseNum(f.after);
  const socValid = before != null && after != null && before >= 0 && after <= 100 && after > before;
  const autoEnergy = socValid ? energyFromSoc(before, after, capacity) : null;
  const manualEnergy = fast ? parseNum(f.energyStr) : null;
  const energy = manualEnergy != null && manualEnergy > 0 ? manualEnergy : autoEnergy;

  // F7: «قبل» أعلى من «بعد» للشحنة السابقة = غالباً خطأ إدخال
  const prev = useMemo(() => {
    const list = sortChrono(charges.filter((c) => c.id !== initial?.id && c.date <= (f.date || '9999')));
    return list[list.length - 1] || null;
  }, [charges, initial, f.date]);
  const socWarn = prev && before != null && before > prev.socAfter;

  // المنزلي: الشريحة تلقائية حسب التاريخ في الدورة (مع قاعدة عدم النزول) أو يدوية
  const legacyHome = !fast && initial && initial.type === 'home' && !initial.tierSource && !f.tierSource;
  const autoTier = /^\d{4}-\d{2}-\d{2}$/.test(f.date) ? tierOn(f.date, charges, settings, bills, initial?.id) : 0;
  const tier = f.tierSource === 'manual' && Number.isInteger(f.tier) ? Math.min(f.tier, tiers.length - 1) : autoTier;
  const homeRate = legacyHome ? initial.pricePerKwh : tiers[tier].rate;

  // السريع: سعر للكيلوواط (يُقترح من المحطة) أو المبلغ الكلي
  const suggested = suggestFastPrice(charges, f.note, settings.fastPrice);
  const typedPrice = parseNum(f.priceStr);
  const typedTotal = parseNum(f.totalStr);
  let price;
  let total;
  if (!fast) {
    price = homeRate;
    total = energy != null ? energy * price : null;
  } else if (f.costMode === 'price') {
    price = typedPrice != null ? typedPrice : suggested;
    total = energy != null ? energy * price : null;
  } else {
    total = typedTotal;
    price = energy && total != null ? total / energy : null;
  }

  const stations = useMemo(() => {
    const seen = [];
    for (const c of sortChrono(charges).reverse()) {
      const n = (c.note || '').trim();
      if (c.type === 'fast' && n && !seen.includes(n)) seen.push(n);
      if (seen.length >= 4) break;
    }
    return seen;
  }, [charges]);

  const submit = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setError(t('err_date'));
    if (before == null || after == null) return setError(t('err_soc_missing'));
    if (before < 0 || after > 100) return setError(t('err_soc_range'));
    if (after <= before) return setError(t('err_soc_order'));
    if (energy == null || energy <= 0) return setError(t('err_energy'));
    // الحد الأعلى: لا يمكن أن تتجاوز الطاقة المسجلة سعة البطارية الحقيقية
    if (energy > capacity + 1e-6) return setError(t('err_energy_cap', { cap: fix(capacity, 2) }));
    if (total == null || total < 0) return setError(t('err_cost'));
    onSave({
      id: initial?.id || uid(),
      date: f.date,
      time: initial?.time || '00:00',
      socBefore: before,
      socAfter: after,
      energyKwh: round(energy, 3),
      energyManual: manualEnergy != null && manualEnergy > 0 && Math.abs(manualEnergy - (autoEnergy ?? 0)) > 0.005,
      capacity,
      pricePerKwh: round(price ?? 0, 4),
      totalCost: round(total, 3),
      type: f.type,
      odometer: initial?.odometer ?? null, // قراءات قديمة تبقى كما هي؛ لا حقل عداد بعد الآن (F3)
      tier: fast || legacyHome ? null : tier,
      tierSource: fast || legacyHome ? null : f.tierSource === 'manual' ? 'manual' : 'auto',
      note: f.note.trim(),
      createdAt: initial?.createdAt || Date.now(),
    });
    return undefined;
  };
  submitRef.current = submit;

  const today = todayStr();
  const yesterday = addDays(today, -1);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(f.date);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5" noValidate>
      <Segmented
        value={f.type}
        onChange={(v) => setF((s) => ({ ...s, type: v }))}
        options={[{ value: 'home', label: t('type_home_s') }, { value: 'fast', label: t('type_fast_s') }]}
      />

      <div>
        <span className="label">{t('date')}</span>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1"><DateField id="f-date" value={f.date} onChange={(v) => setF((s) => ({ ...s, date: v }))} /></div>
          <button type="button" className="chip shrink-0" aria-pressed={f.date === today} onClick={() => setF((s) => ({ ...s, date: today }))}>{t('today')}</button>
          <button type="button" className="chip shrink-0" aria-pressed={f.date === yesterday} onClick={() => setF((s) => ({ ...s, date: yesterday }))}>{t('yesterday')}</button>
        </div>
        {validDate && <p className="mt-1.5 text-sm text-slate-400" data-testid="form-weekday">{weekdayOf(f.date, lang)}</p>}
      </div>

      <div>
        <span className="label">{t('battery')}</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl bg-ink-900 px-4 py-3" htmlFor="f-before">
            <span className="block text-sm text-slate-400">{t('soc_before_s')}</span>
            <span className="num-unit text-2xl font-bold"><input id="f-before" inputMode="decimal" className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-slate-600" placeholder="20" value={f.before} onChange={set('before')} />%</span>
          </label>
          <label className="rounded-2xl bg-ink-900 px-4 py-3" htmlFor="f-after">
            <span className="block text-sm text-slate-400">{t('soc_after_s')}</span>
            <span className="num-unit text-2xl font-bold"><input id="f-after" inputMode="decimal" className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-slate-600" placeholder="80" value={f.after} onChange={set('after')} />%</span>
          </label>
        </div>
        {socValid && <div className="mt-3"><BatteryBar before={before} after={after} type={f.type} showLabels={false} /></div>}
        {socWarn && (
          <p className="mt-2 flex gap-2 rounded-xl bg-fast/10 px-3 py-2 text-sm font-medium text-fast" data-testid="soc-warn">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />{t('warn_soc_prev', { a: num(prev.socAfter, 0) })}
          </p>
        )}
      </div>

      <div>
        <span className="label">{fast ? t('energy_charger') : t('energy')}</span>
        <div className="rounded-2xl bg-ink-900 px-4 py-4 text-center">
          {fast ? (
            <>
              <span className="num-unit text-[2.75rem] font-bold leading-none">
                <input id="f-energy" inputMode="decimal" className="w-[5ch] bg-transparent text-center outline-none placeholder:text-slate-600" placeholder={autoEnergy != null ? fix(autoEnergy, 1) : '—'} value={f.energyStr} onChange={set('energyStr')} aria-label={t('energy_charger')} />
                <span className="text-base font-medium text-slate-400">kWh</span>
              </span>
              <p className="mt-1 text-sm text-slate-400">{t('energy_soc_est', { v: autoEnergy != null ? fix(autoEnergy, 1) : '—' })}</p>
            </>
          ) : (
            <>
              <NumUnit value={energy != null ? fix(energy, 1) : '—'} unit="kWh" className="text-[2.75rem] font-bold leading-none" unitClass="text-base font-medium text-slate-400" />
              <p className="mt-1 text-sm text-slate-400">{t('energy_auto', { cap: fix(capacity, 2) })}</p>
            </>
          )}
        </div>
      </div>

      {!fast ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            {legacyHome ? (
              <button type="button" className="chip" onClick={() => setTierOpen((v) => !v)} data-testid="tier-chip">
                {t('price_recorded', { v: fix(homeRate, 3) })} <ChevronDown size={15} />
              </button>
            ) : (
              <button type="button" className="chip !bg-fast/15 !text-fast" onClick={() => setTierOpen((v) => !v)} data-testid="tier-chip" aria-expanded={tierOpen}>
                <span className="h-2 w-2 rounded-full bg-current" />
                {t(`tier_${tierLevel(tier, tiers.length)}`)} · <bdi className="tabular">{fix(homeRate, 3)}</bdi>
                <ChevronDown size={15} />
              </button>
            )}
            <span className="tabular text-sm text-slate-400" data-testid="form-cost">{t('kpi_cost')} <b className="text-base text-slate-100">{total != null ? fix(total, 2) : '—'}</b> {settings.currency}</span>
          </div>
          {tierOpen && (
            <div className="mt-3">
              <TierPicker
                value={{ source: f.tierSource === 'manual' ? 'manual' : legacyHome ? 'legacy' : 'auto', tier }}
                auto={autoTier} tiers={tiers} currency={settings.currency}
                onPick={(v) => { setF((s) => ({ ...s, tierSource: v.source, tier: v.tier ?? null })); setTierOpen(false); }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <span className="label !mb-0">{t('price')}</span>
          <div className="flex items-center gap-2">
            <Segmented size="sm" className="flex-1" value={f.costMode} onChange={(v) => setF((s) => ({ ...s, costMode: v }))}
              options={[{ value: 'price', label: t('by_price') }, { value: 'total', label: t('by_total') }]} />
            {f.costMode === 'price' ? (
              <label className="flex w-36 items-center gap-1 rounded-2xl bg-ink-900 px-3 py-2.5" htmlFor="f-price">
                <input id="f-price" inputMode="decimal" className="tabular w-full bg-transparent text-lg font-bold outline-none placeholder:text-slate-500" placeholder={String(suggested)} value={f.priceStr} onChange={set('priceStr')} />
                <span className="text-sm text-slate-400">{settings.currency}</span>
              </label>
            ) : (
              <label className="flex w-36 items-center gap-1 rounded-2xl bg-ink-900 px-3 py-2.5" htmlFor="f-total">
                <input id="f-total" inputMode="decimal" className="tabular w-full bg-transparent text-lg font-bold outline-none placeholder:text-slate-500" placeholder="4.50" value={f.totalStr} onChange={set('totalStr')} />
                <span className="text-sm text-slate-400">{settings.currency}</span>
              </label>
            )}
          </div>
          <p className="tabular flex justify-between text-sm text-slate-400" data-testid="form-cost">
            <span>{f.costMode === 'price' ? t('kpi_cost') : t('price_kwh')}</span>
            <b className="text-base text-slate-100">{f.costMode === 'price' ? (total != null ? `${fix(total, 2)} ${settings.currency}` : '—') : (price != null ? `${fix(price, 3)} ${settings.currency}` : '—')}</b>
          </p>
        </div>
      )}

      <div>
        <label className="label" htmlFor="f-note">{fast ? t('station_note') : t('note_opt')}</label>
        <input id="f-note" className="field" maxLength={200} placeholder={fast ? t('station_ph') : t('note_ph')} value={f.note} onChange={set('note')} />
        {fast && stations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2" data-testid="stations">
            {stations.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={f.note.trim() === s} onClick={() => setF((x) => ({ ...x, note: s, priceStr: '' }))}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
    </form>
  );
}
