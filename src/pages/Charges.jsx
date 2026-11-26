import React from 'react';
import { ChevronDown } from 'lucide-react';
import ChargeList from '../components/ChargeList.jsx';
import CalendarView from '../components/CalendarView.jsx';
import { Segmented } from '../components/ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { useFilteredCharges, useMonthKeys } from '../state/derived.js';
import { monthLabel } from '../lib/format.js';

/** فلتر الشهر والنوع: يظهر داخل الترويسة الثابتة في عرض القائمة */
export function ChargesFilters() {
  const { state: { charges }, t, lang } = useStore();
  const ui = useUi();
  const monthKeys = useMonthKeys();
  if (ui.tab !== 'list' || ui.chargesView !== 'list' || charges.length === 0) return null;
  return (
    <div className="space-y-2 px-4 pb-3">
      <div className="relative">
        <select className="field appearance-none pe-9 font-bold" value={ui.month} onChange={(e) => ui.setMonth(e.target.value)} aria-label={t('filter_month')}>
          <option value="all">{t('all_months')}</option>
          {monthKeys.map((k) => <option key={k} value={k}>{monthLabel(k, lang)}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
      <Segmented
        value={ui.typeFilter}
        onChange={ui.setTypeFilter}
        options={[
          { value: 'all', label: t('all') },
          { value: 'home', label: t('type_home_s'), activeClass: 'bg-home/20 text-home' },
          { value: 'fast', label: t('type_fast_s'), activeClass: 'bg-fast/20 text-fast' },
        ]}
      />
    </div>
  );
}

export default function Charges() {
  const { state: { charges, settings }, t, actions } = useStore();
  const ui = useUi();
  const view = useFilteredCharges();
  const monthKeys = useMonthKeys();
  return (
    <>
      <Segmented
        value={ui.chargesView}
        onChange={ui.setChargesView}
        options={[{ value: 'list', label: t('view_list') }, { value: 'calendar', label: t('view_calendar') }]}
      />
      {ui.chargesView === 'list' ? (
        <ChargeList charges={view.charges} segments={view.segments} currency={settings.currency} onEdit={ui.openEdit} onDelete={actions.requestDelete} onAdd={ui.openAdd} />
      ) : (
        <CalendarView
          key={ui.month}
          charges={charges}
          segments={view.allSegments}
          currency={settings.currency}
          onEdit={ui.openEdit}
          onDelete={actions.requestDelete}
          initialMonth={ui.month !== 'all' ? ui.month : monthKeys[0]}
        />
      )}
    </>
  );
}
