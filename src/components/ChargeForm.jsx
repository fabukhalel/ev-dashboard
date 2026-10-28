import React, { useState } from 'react';
import { Home, Zap, Save, Trash2 } from 'lucide-react';
import { Sheet, Segmented } from './ui.jsx';
import DateField from './DateField.jsx';
import { energyFromSoc, round } from '../lib/calc.js';
import { parseNum, todayStr, fix } from '../lib/format.js';
import { uid } from '../lib/storage.js';
import { useI18n } from '../lib/i18n.jsx';

const clean = (n, d) => (n == null ? '' : String(round(n, d)));

function initState(initial) {
  if (initial) {
    return {
      date: initial.date,
      type: initial.type,
      before: String(initial.socBefore),
      after: String(initial.socAfter),
      energyStr: initial.energyManual ? clean(initial.energyKwh, 2) : '',
      costMode: 'total',
      priceStr: clean(initial.pricePerKwh, 4),
      totalStr: clean(initial.totalCost, 3),
      odo: initial.odometer != null ? String(initial.odometer) : '',
      note: initial.note || '',
    };
  }
  return {
    date: todayStr(),
    type: 'home',
    before: '',
    after: '',
    energyStr: '',
    costMode: 'price',
    priceStr: '',
    totalStr: '',
    odo: '',
    note: '',
  };
}

export default function ChargeForm({ open, onClose, onSave, onDelete, initial, settings }) {
  const { t } = useI18n();
  return (
    <Sheet open={open} onClose={onClose} title={initial ? t('form_edit') : t('add_charge')}>
      {open && (
        <Inner
          key={initial ? initial.id : 'new'}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          initial={initial}
          settings={settings}
        />
      )}
    </Sheet>
  );
}

function Inner({ onClose, onSave, onDelete, initial, settings }) {
  const { t } = useI18n();
  const [f, setF] = useState(() => initState(initial));
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  // الحقل اليدوي يظهر فقط إن فعّله المستخدم من الإعدادات (أو كانت الشحنة المعدّلة مدخلة يدوياً أصلاً)
  const showManual = settings.allowManualEnergy || !!initial?.energyManual;

  const capacity = initial?.capacity ?? settings.capacity;
  const defaultPrice = f.type === 'fast' ? settings.fastPrice : settings.homePrice;

  const before = parseNum(f.before);
  const after = parseNum(f.after);
  const socValid = before != null && after != null && before >= 0 && after <= 100 && after > before;

  const autoEnergy = socValid ? energyFromSoc(before, after, capacity) : null;
  const manualEnergy = showManual ? parseNum(f.energyStr) : null;
  const energy = manualEnergy != null && manualEnergy > 0 ? manualEnergy : autoEnergy;

  // التكلفة: إدخال السعر => المجموع تلقائي، أو إدخال المجموع => السعر تلقائي
  const typedPrice = parseNum(f.priceStr);
  const typedTotal = parseNum(f.totalStr);
  let price = null;
  let total = null;
  if (f.costMode === 'price') {
    price = typedPrice != null ? typedPrice : defaultPrice;
    total = energy != null && price != null ? energy * price : null;
  } else {
    total = typedTotal;
    price = energy && total != null ? total / energy : null;
  }

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setError(t('err_date'));
    if (before == null || after == null) return setError(t('err_soc_missing'));
    if (before < 0 || after > 100) return setError(t('err_soc_range'));
    if (after <= before) return setError(t('err_soc_order'));
    if (energy == null || energy <= 0) return setError(t('err_energy'));
    // الحد الأعلى: لا يمكن أن تتجاوز الطاقة المسجلة سعة البطارية الحقيقية
    if (energy > capacity + 1e-6) return setError(t('err_energy_cap', { cap: fix(capacity, 2) }));
    if (total == null || total < 0) return setError(t('err_cost'));
    const odo = f.odo.trim() === '' ? null : parseNum(f.odo);
    if (f.odo.trim() !== '' && (odo == null || odo < 0)) return setError(t('err_odo'));

    onSave({
      id: initial?.id || uid(),
      date: f.date,
      time: initial?.time || '00:00', // الوقت لم يعد يُدخَل؛ نحتفظ بقيمة الشحنات القديمة فقط
      socBefore: before,
      socAfter: after,
      energyKwh: round(energy, 3),
      energyManual: manualEnergy != null && manualEnergy > 0 && Math.abs(manualEnergy - (autoEnergy ?? 0)) > 0.005,
      capacity,
      pricePerKwh: round(price ?? 0, 4),
      totalCost: round(total, 3),
      type: f.type,
      odometer: odo,
      note: f.note.trim(),
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <span className="label">{t('charger_type')}</span>
        <Segmented
          value={f.type}
          onChange={(v) => setF((s) => ({ ...s, type: v }))}
          options={[
            { value: 'home', label: <span className="inline-flex items-center gap-1.5"><Home size={15} /> {t('type_home_ac')}</span>, activeClass: 'bg-home/20 text-home' },
            { value: 'fast', label: <span className="inline-flex items-center gap-1.5"><Zap size={15} /> {t('type_fast_dc')}</span>, activeClass: 'bg-fast/20 text-fast' },
          ]}
        />
      </div>

      <DateField id="f-date" label={t('date')} value={f.date} onChange={(v) => setF((s) => ({ ...s, date: v }))} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-before">{t('soc_before')}</label>
          <input id="f-before" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: 20 })} value={f.before} onChange={set('before')} />
        </div>
        <div>
          <label className="label" htmlFor="f-after">{t('soc_after')}</label>
          <input id="f-after" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: 80 })} value={f.after} onChange={set('after')} />
        </div>
      </div>

      {/* الطاقة المحتسبة تلقائياً دائماً */}
      <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{t('energy_auto', { cap: fix(capacity, 2) })}</span>
          <span className="tabular shrink-0 text-lg font-extrabold text-accent">{energy != null ? fix(energy, 2) : '—'} <span className="text-xs font-medium">kWh</span></span>
        </div>
        {showManual && (
          <>
            <label className="label mt-2" htmlFor="f-energy">{t('energy_manual')}</label>
            <input id="f-energy" inputMode="decimal" className="field tabular" placeholder={t('energy_manual_ph')} value={f.energyStr} onChange={set('energyStr')} />
            <p className="mt-1 text-[0.7rem] text-slate-500">{t('energy_max_hint', { cap: fix(capacity, 2) })}</p>
          </>
        )}
      </div>

      {/* التكلفة */}
      <div>
        <span className="label">{t('cost_input')}</span>
        <Segmented
          className="mb-3"
          value={f.costMode}
          onChange={(v) => setF((s) => ({ ...s, costMode: v }))}
          options={[
            { value: 'price', label: t('by_price') },
            { value: 'total', label: t('by_total') },
          ]}
        />
        {f.costMode === 'price' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="f-price">{t('price_c', { c: settings.currency })}</label>
              <input id="f-price" inputMode="decimal" className="field tabular" placeholder={String(defaultPrice)} value={f.priceStr} onChange={set('priceStr')} />
            </div>
            <div>
              <span className="label">{t('total_auto')}</span>
              <div className="field tabular flex items-center font-bold text-home">{total != null ? fix(total, 3) : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="f-total">{t('total_c', { c: settings.currency })}</label>
              <input id="f-total" inputMode="decimal" className="field tabular" placeholder={t('eg', { v: '3.5' })} value={f.totalStr} onChange={set('totalStr')} />
            </div>
            <div>
              <span className="label">{t('price_auto')}</span>
              <div className="field tabular flex items-center font-bold text-home">{price != null ? fix(price, 4) : '—'}</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="f-odo">{t('odo_label')}</label>
        <input id="f-odo" inputMode="decimal" className="field tabular" placeholder={t('odo_ph')} value={f.odo} onChange={set('odo')} />
      </div>

      <div>
        <label className="label" htmlFor="f-note">{t('note')}</label>
        <input id="f-note" className="field" maxLength={200} placeholder={t('note_ph')} value={f.note} onChange={set('note')} />
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1"><Save size={17} /> {t('save_charge')}</button>
        {initial && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => (confirmDel ? onDelete(initial.id) : setConfirmDel(true))}
            aria-label={t('delete')}
          >
            <Trash2 size={17} />
            {confirmDel && <span>{t('confirm_delete')}</span>}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
      </div>
    </form>
  );
}
