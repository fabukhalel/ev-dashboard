import React, { useEffect, useState } from 'react';
import { Sheet } from './ui.jsx';
import DateField from './DateField.jsx';
import { todayStr, parseNum, num } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

/** تسجيل قراءة عداد السيارة (كم) في تاريخ معيّن. readings: كل القراءات الحالية للتحقق من التسلسل */
export default function OdoSheet({ open, onClose, onSave, readings }) {
  const { t } = useI18n();
  const [date, setDate] = useState(todayStr());
  const [km, setKm] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setDate(todayStr());
      setKm('');
      setErr('');
    }
  }, [open]);

  const last = readings.length ? readings[readings.length - 1] : null;

  const submit = () => {
    const v = parseNum(km);
    if (!date) return setErr(t('err_date'));
    if (v == null || v < 0 || v > 2000000) return setErr(t('err_odo'));
    // القراءة يجب ألا تتعارض مع ترتيب القراءات الأخرى زمنياً
    const before = [...readings].reverse().find((r) => r.date <= date);
    const after = readings.find((r) => r.date > date);
    if ((before && v < before.km) || (after && v > after.km)) return setErr(t('odo_err_order'));
    onSave({ date, km: v });
    return undefined;
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('odo_add_title')}>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-400">{t('odo_add_hint')}</p>
        <DateField id="odo-date" label={t('date')} value={date} onChange={setDate} />
        <div>
          <label className="label" htmlFor="odo-km">{t('odo_km_label')}</label>
          <input id="odo-km" inputMode="decimal" className="field tabular" value={km} onChange={(e) => { setKm(e.target.value); setErr(''); }} placeholder={last ? t('odo_last', { v: num(last.km, 0) }) : ''} />
        </div>
        {err && <p role="alert" className="text-xs font-medium text-danger">{err}</p>}
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary flex-1" onClick={submit}>{t('save')}</button>
        </div>
      </div>
    </Sheet>
  );
}
