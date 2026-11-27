import React, { useRef, useState } from 'react';
import { Battery, Plus, Trash2 } from 'lucide-react';
import { Empty, BatteryBar, DateTile, NumUnit } from './ui.jsx';
import { tierLevel, isTiered } from '../lib/tiers.js';
import { formatDate, fix } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

/** وصف صغير تحت شريط البطارية: الشريحة للمنزلي، أو السعر والمحطة للسريع */
export function chargeSub(c, t, settings) {
  if (isTiered(c) && c.tier != null) return t(`tier_${tierLevel(c.tier, settings.tariff.tiers.length)}`);
  const price = `${fix(c.pricePerKwh, 3)} ${settings.currency}`;
  return c.type === 'fast' && c.note ? `${c.note}، ${price}` : price;
}

/** صف شحنة (C4/H11): التاريخ واسم اليوم ورقمها في الفترة، شريط البطارية، kWh كبير فوق المبلغ */
export function ChargeRow({ c, index, settings, onOpen }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => onOpen(c)}
      aria-label={`${formatDate(c.date)} · ${fix(c.energyKwh, 1)} kWh`}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-start"
      data-testid="charge-row"
    >
      <DateTile date={c.date} type={c.type} index={index} />
      <span className="min-w-0 flex-1 space-y-1.5">
        <BatteryBar before={c.socBefore} after={c.socAfter} type={c.type} />
        <span className="block truncate text-sm text-slate-400">{chargeSub(c, t, settings)}</span>
      </span>
      <span className="shrink-0 text-end">
        <NumUnit value={fix(c.energyKwh, 1)} unit="kWh" className="text-xl font-bold" unitClass="text-xs font-medium text-slate-400" />
        <span className="tabular block text-sm text-slate-400" data-testid="charge-cost">{fix(c.totalCost, 2)} {settings.currency}</span>
      </span>
    </button>
  );
}

/** صف يُسحب جانباً للحذف (C3). الحذف فوري مع «تراجع» في الرسالة */
function SwipeRow({ children, onSwipe, label }) {
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const moved = useRef(false);
  const W = useRef(1);
  const onDown = (e) => {
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    W.current = e.currentTarget.offsetWidth || 1;
  };
  const onMove = (e) => {
    if (!start.current) return;
    const x = e.clientX - start.current.x;
    const y = e.clientY - start.current.y;
    if (!moved.current && Math.abs(x) > 12 && Math.abs(x) > Math.abs(y) * 1.5) moved.current = true;
    if (moved.current) setDx(x);
  };
  const onUp = () => {
    if (moved.current && Math.abs(dx) > W.current * 0.35) onSwipe();
    setDx(0);
    start.current = null;
  };
  return (
    <div className="relative overflow-hidden" data-testid="charge-item">
      <div className={`absolute inset-0 flex items-center ${dx > 0 ? 'justify-start' : 'justify-end'} bg-danger/20 px-6 text-danger`} aria-hidden={dx === 0}>
        {dx !== 0 && <Trash2 size={20} />}
      </div>
      <div
        className="relative bg-ink-800"
        style={{ transform: `translateX(${dx}px)`, transition: start.current ? 'none' : 'transform .2s', touchAction: 'pan-y' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; } }}
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}

/** قائمة شحنات داخل كرت واحد بفواصل (V8). swipe: السحب للحذف (صفحة الشحنات) */
export default function ChargeList({ charges, numbers, settings, onOpen, onDelete, onAdd, swipe = false }) {
  const { t } = useI18n();
  if (charges.length === 0) {
    return (
      <Empty icon={Battery} title={t('list_empty_title')} hint={t('list_empty_hint')}>
        {onAdd && <button className="btn-primary" onClick={onAdd}><Plus size={17} /> {t('add_charge')}</button>}
      </Empty>
    );
  }
  return (
    <div className="card row-divide overflow-hidden" data-testid="charge-list">
      {charges.map((c) => {
        const row = <ChargeRow key={c.id} c={c} index={numbers ? numbers.get(c.id) : null} settings={settings} onOpen={onOpen} />;
        return swipe ? <SwipeRow key={c.id} onSwipe={() => onDelete(c.id)} label={t('swipe_hint')}>{row}</SwipeRow> : row;
      })}
    </div>
  );
}
