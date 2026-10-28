import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDate, parseDMY, maskDMY } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

/**
 * حقل تاريخ بصيغة dd/mm/yyyy: كتابة مباشرة (تُضاف الشرطات تلقائياً) أو زر التقويم.
 * value/onChange بصيغة ISO (yyyy-mm-dd)؛ onChange('') إن كان النص غير مكتمل أو غير صحيح.
 */
export default function DateField({ id, value, onChange, label, min, max }) {
  const { t } = useI18n();
  const [text, setText] = useState(value ? formatDate(value) : '');

  // مزامنة عند تغيّر القيمة من الخارج (مثلاً زر التقويم أو فتح نموذج آخر)
  useEffect(() => {
    const cur = parseDMY(text);
    if (value && cur !== value) setText(formatDate(value));
    if (!value && cur) setText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onType = (e) => {
    const masked = maskDMY(e.target.value);
    setText(masked);
    const iso = parseDMY(masked);
    onChange(iso || '');
  };

  const invalid = text.length > 0 && !parseDMY(text) && text.length >= 10;

  return (
    <div>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <div className="relative">
        <input
          id={id}
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t('date_ph')}
          className={`field tabular pe-11 ${invalid ? '!border-red-500/60' : ''}`}
          value={text}
          onChange={onType}
          onBlur={() => { if (value) setText(formatDate(value)); }}
          aria-invalid={invalid}
        />
        <span className="absolute end-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center overflow-hidden rounded-lg text-accent">
          <CalendarDays size={19} />
          <input
            type="date"
            tabIndex={-1}
            aria-label={t('pick_date')}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={value || ''}
            min={min}
            max={max}
            onChange={(e) => e.target.value && onChange(e.target.value)}
          />
        </span>
      </div>
    </div>
  );
}
