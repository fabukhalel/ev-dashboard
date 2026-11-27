import React from 'react';
import { List, CalendarDays, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import ChargeList from '../components/ChargeList.jsx';
import CalendarView from '../components/CalendarView.jsx';
import PeriodBar from '../components/PeriodBar.jsx';
import { PageTitle } from '../components/ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { usePeriod } from '../state/derived.js';
import { num } from '../lib/format.js';

/** الشحنات (C1–C10): نفس نظام الفترات، ملخص الفترة، فلتر النوع، قائمة أو تقويم */
export default function Charges() {
  const { state: { settings, charges }, t, actions } = useStore();
  const ui = useUi();
  const p = usePeriod();
  const asc = settings.chargesSort === 'asc';
  const filtered = ui.typeFilter === 'all' ? p.sortedDesc : p.sortedDesc.filter((c) => c.type === ui.typeFilter);
  const list = asc ? [...filtered].reverse() : filtered;
  const energy = list.reduce((s, c) => s + c.energyKwh, 0);
  const viewBtn = (id, Icon, label) => (
    <button type="button" aria-pressed={ui.chargesView === id} aria-label={label} onClick={() => ui.setChargesView(id)}
      className={`grid h-10 w-12 place-items-center rounded-full transition ${ui.chargesView === id ? 'bg-solid text-onsolid' : 'text-slate-400'}`}>
      <Icon size={19} />
    </button>
  );
  return (
    <>
      <PageTitle title={t('tab_list')}>
        <div className="flex rounded-full bg-ink-800 p-1" role="group" aria-label={t('view_kind')}>
          {viewBtn('list', List, t('view_list'))}
          {viewBtn('calendar', CalendarDays, t('view_calendar'))}
        </div>
      </PageTitle>
      {ui.chargesView === 'list' ? (
        <>
          <section className="card p-3.5">
            <PeriodBar period={p.period}>
              <span data-testid="period-summary">{t('charges_n', { n: list.length })} · <bdi dir="ltr">{num(energy, 1)} kWh</bdi></span>
            </PeriodBar>
          </section>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('filter_type')}>
            {[['all', t('all')], ['home', t('type_home_s')], ['fast', t('type_fast_s')]].map(([id, label]) => (
              <button key={id} type="button" className="chip !px-5" aria-pressed={ui.typeFilter === id} onClick={() => ui.setTypeFilter(id)} data-testid={`filter-${id}`}>{label}</button>
            ))}
            <button type="button" className="chip ms-auto inline-flex items-center gap-1.5 !px-3.5" onClick={() => actions.changeSettings({ chargesSort: asc ? 'desc' : 'asc' })}
              aria-label={t('sort_label')} data-testid="sort-toggle">
              {asc ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}{asc ? t('sort_oldest') : t('sort_newest')}
            </button>
          </div>
          <ChargeList charges={list} numbers={p.numbers} settings={settings} onOpen={ui.openDetail} onDelete={actions.deleteCharge} onAdd={ui.openAdd} swipe />
          {list.length > 0 && <p className="text-center text-xs text-slate-500">{t('swipe_hint')}</p>}
        </>
      ) : (
        <CalendarView charges={charges} settings={settings} onOpen={ui.openDetail} />
      )}
    </>
  );
}
