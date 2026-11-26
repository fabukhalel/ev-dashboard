import React, { useEffect, useState } from 'react';
import { Sheet } from './ui.jsx';
import DateField from './DateField.jsx';
import { todayStr, parseNum, num } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

/** تسجيل قراءة عداد السيارة (كم) في تاريخ معيّن. readings: كل القراءات الحالية للتحقق من التسلسل */
export default function OdoSheet({ open, onClose, onSave, onDelete, initial, readings: all }) {
  const { t } = useI18n();
  const [date, setDate] = useState(todayStr());
  const [km, setKm] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setDate(initial ? initial.date : todayStr());
      setKm(initial ? String(initial.km) : '');
      setErr('');
    }
  }, [open, initial]);

  // عند التعديل: القراءة نفسها لا تدخل في فحص الترتيب
  const readings = initial ? all.filter((r) => !(r.id === initial.id && r.src === initial.src)) : all;

  const last = readings.length ? readings[readings.length - 1] : null;

  const submit = () => {
    const v = parseNum(km);
    if (!date) return setErr(t('err_date'));
    if (v == null || v < 0 || v > 2000000) return setErr(t('err_odo'));
    // القراءة يجب ألا تتعارض مع ترتيب القراءات الأخرى زمنياً
    const before = [...readings].reverse().find((r) => r.date <= date);
    const after = readings.find((r) => r.date > date);
    if ((before && v < before.km) || (after && v > after.km)) return setErr(t('odo_err_order'));
    onSave({ date, km: v }, initial);
    return undefined;
  };

  return (
    <Sheet open={open} onClose={onClose} title={initial ? t('odo_edit_title') : t('odo_add_title')}
      footer={<div className="flex gap-2">{initial
        ? <button type="button" className="btn-danger px-6" onClick={() => onDelete(initial)} data-testid="odo-delete">{t('delete')}</button>
        : <button type="button" className="btn-ghost flex-1" onClick={onClose}>{t('cancel')}</button>}<button type="button" className="btn-primary flex-1 py-3.5" onClick={submit} data-testid="odo-save">{t('save')}</button></div>}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-400">{initial?.src === 'charge' ? t('odo_from_charge_hint') : t('odo_add_hint')}</p>
        <DateField id="odo-date" label={t('date')} value={date} onChange={setDate} />
        <div>
          <label className="label" htmlFor="odo-km">{t('odo_km_label')}</label>
          <div className="relative" dir="ltr">
            <input id="odo-km" inputMode="decimal" className="field tabular !py-4 pe-14 text-2xl font-bold" value={km} onChange={(e) => { setKm(e.target.value); setErr(''); }} placeholder={last ? num(last.km, 0) : '0'} />
            <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">km</span>
          </div>
          {last && <p className="mt-1.5 text-sm text-slate-400">{t('odo_last', { v: num(last.km, 0) })}</p>}
        </div>
        {err && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
      </div>
    </Sheet>
  );
}
