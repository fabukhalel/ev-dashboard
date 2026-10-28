import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Sheet, Toggle } from './ui.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { defaultSettings } from '../lib/storage.js';

const SEC_KEYS = { summary: 'sec_summary', charges: 'sec_charges' };

/** نافذة ترتيب أقسام الصفحة الرئيسية وإظهار/إخفاء كل قسم */
export default function HomeCustomizer({ open, onClose, layout, onChange }) {
  const { t } = useI18n();

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ homeLayout: next });
  };
  const toggle = (id, visible) => onChange({ homeLayout: layout.map((s) => (s.id === id ? { ...s, visible } : s)) });
  const reset = () => onChange({ homeLayout: defaultSettings().homeLayout });

  return (
    <Sheet open={open} onClose={onClose} title={t('cust_title')}>
      <p className="mb-4 text-xs leading-relaxed text-slate-400">{t('cust_hint')}</p>
      <ul className="space-y-2" aria-label={t('cust_title')}>
        {layout.map((s, i) => (
          <li key={s.id} data-section={s.id} className={`flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/70 p-2.5 ${s.visible ? '' : 'opacity-60'}`}>
            <div className="flex flex-col">
              <button className="rounded p-0.5 text-slate-300 hover:bg-white/10 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${t('move_up')}: ${t(SEC_KEYS[s.id])}`}>
                <ChevronUp size={16} />
              </button>
              <button className="rounded p-0.5 text-slate-300 hover:bg-white/10 disabled:opacity-30" disabled={i === layout.length - 1} onClick={() => move(i, 1)} aria-label={`${t('move_down')}: ${t(SEC_KEYS[s.id])}`}>
                <ChevronDown size={16} />
              </button>
            </div>
            <span className="flex-1 text-sm font-bold">{t(SEC_KEYS[s.id])}</span>
            <Toggle checked={s.visible} onChange={(v) => toggle(s.id, v)} label={`${s.visible ? t('hide') : t('show')}: ${t(SEC_KEYS[s.id])}`} />
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2">
        <button className="btn-ghost flex-1 text-xs" onClick={reset}>{t('cust_reset')}</button>
        <button className="btn-primary flex-1" onClick={onClose}>{t('done')}</button>
      </div>
    </Sheet>
  );
}
