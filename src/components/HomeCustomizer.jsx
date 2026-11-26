import React, { useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Sheet, Toggle, Segmented } from './ui.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { defaultSettings, RECENT_COUNTS } from '../lib/storage.js';

/** تخصيص الرئيسية (H14): 4 أقسام تُرتّب بالسحب وتُخفى بمفتاح، واختيار عدد آخر الشحنات */
export default function HomeCustomizer({ open, onClose, layout, recentCount, onChange }) {
  const { t } = useI18n();
  const [drag, setDrag] = useState(null); // {from, over}
  const rows = useRef([]);

  const toggle = (id, visible) => onChange({ homeLayout: layout.map((s) => (s.id === id ? { ...s, visible } : s)) });
  const reset = () => onChange({ homeLayout: defaultSettings().homeLayout, recentCount: 5 });
  const move = (from, to) => {
    if (from === to || to < 0 || to >= layout.length) return;
    const next = [...layout];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange({ homeLayout: next });
  };
  // موضع الإفلات = عدد الأقسام الأخرى التي يقع منتصفها فوق الإصبع
  const overIndex = (y) => rows.current.reduce((n, el, i) => {
    if (!el || i === drag?.from) return n;
    const r = el.getBoundingClientRect();
    return y > r.top + r.height / 2 ? n + 1 : n;
  }, 0);

  return (
    <Sheet open={open} onClose={onClose} title={t('cust_title')}
      footer={<div className="flex gap-2"><button className="btn-ghost flex-1" onClick={reset}>{t('cust_reset')}</button><button className="btn-primary flex-1" onClick={onClose}>{t('done')}</button></div>}>
      <p className="mb-4 text-sm leading-relaxed text-slate-400">{t('cust_hint')}</p>
      <ul className="space-y-2" aria-label={t('cust_title')}>
        {layout.map((s, i) => {
          const name = t(`sec_${s.id}`);
          const dragging = drag && drag.from === i;
          return (
            <li key={s.id} ref={(el) => { rows.current[i] = el; }} data-section={s.id}
              className={`rounded-2xl bg-ink-900 p-3 transition ${s.visible ? '' : 'opacity-60'} ${dragging ? 'ring-2 ring-accent' : ''} ${drag && drag.over === i && !dragging ? 'translate-y-1' : ''}`}>
              <div className="flex items-center gap-2">
                <button type="button" className="cursor-grab touch-none rounded-lg p-1 text-slate-400" aria-label={`${t('drag')}: ${name}`}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ from: i, over: i }); }}
                  onPointerMove={(e) => { if (drag) setDrag({ ...drag, over: overIndex(e.clientY) }); }}
                  onPointerUp={() => { if (drag) move(drag.from, drag.over); setDrag(null); }}
                  onPointerCancel={() => setDrag(null)}
                  onKeyDown={(e) => { if (e.key === 'ArrowUp') move(i, i - 1); if (e.key === 'ArrowDown') move(i, i + 1); }}>
                  <GripVertical size={18} />
                </button>
                <span className="flex-1 font-bold">{name}</span>
                <Toggle checked={s.visible} onChange={(v) => toggle(s.id, v)} label={`${s.visible ? t('hide') : t('show')}: ${name}`} />
              </div>
              {s.id === 'recent' && s.visible && (
                <div className="mt-3 flex items-center gap-3 ps-9">
                  <span className="text-sm text-slate-400">{t('recent_count')}</span>
                  <Segmented size="sm" className="flex-1" value={recentCount} onChange={(v) => onChange({ recentCount: v })} options={RECENT_COUNTS.map((n) => ({ value: n, label: String(n) }))} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
