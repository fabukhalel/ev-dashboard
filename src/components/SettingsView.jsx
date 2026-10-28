import React, { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, FlaskConical, Trash2, Car, SlidersHorizontal, Palette, CalendarRange, Gauge, User } from 'lucide-react';
import { parseNum, formatDate } from '../lib/format.js';
import { MIN_FONT_PX, MAX_FONT_PX, DEFAULT_CAR_COLOR } from '../lib/storage.js';
import { PALETTES, FONT_STACKS } from '../lib/theme.js';
import DateField from './DateField.jsx';
import { MIN_CAPACITY, MAX_CAPACITY } from '../lib/storage.js';
import { Segmented, Toggle } from './ui.jsx';
import CarImage from './CarImage.jsx';
import { useI18n } from '../lib/i18n.jsx';

function NumField({ id, label, value, onCommit, hint, min = 0, max = Infinity }) {
  const [text, setText] = useState(String(value));
  const [bad, setBad] = useState(false);
  const commit = () => {
    const n = parseNum(text);
    if (n == null || n < min || n > max) {
      setBad(true);
      return;
    }
    setBad(false);
    onCommit(n);
  };
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        className={`field tabular ${bad ? '!border-red-500/60' : ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        aria-invalid={bad}
      />
      {hint && <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="card space-y-4 p-4">
      <h3 className="flex items-center gap-2 text-base font-extrabold">
        {Icon && <Icon size={18} className="text-accent" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function SettingsView({
  settings, count, onChange, onReset, onExportCsv, onExportBackup, onImportBackup, onPhoto, onDemo, onClear, onCustomize, onPdf, onAddOdo, bills = [],
}) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const photoRef = useRef(null);
  const set = (k) => (e) => onChange({ [k]: e.target.value });

  return (
    <div className="space-y-4">
      <Section title={t('s_profile')} icon={User}>
        <div>
          <label className="label" htmlFor="s-username">{t('user_name')}</label>
          <input id="s-username" className="field" maxLength={24} value={settings.userName} onChange={set('userName')} placeholder={t('user_name_ph')} />
          <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-500">{t('user_name_hint')}</p>
        </div>
      </Section>

      <Section title={t('s_appearance')}>
        <div>
          <span className="label">{t('s_lang')}</span>
          <Segmented
            value={settings.lang}
            onChange={(v) => onChange({ lang: v })}
            options={[{ value: 'ar', label: t('lang_ar') }, { value: 'en', label: t('lang_en') }]}
          />
        </div>
        <div>
          <span className="label">{t('s_theme')}</span>
          <Segmented
            value={settings.theme}
            onChange={(v) => onChange({ theme: v })}
            options={[
              { value: 'system', label: t('theme_system') },
              { value: 'dark', label: t('theme_dark') },
              { value: 'light', label: t('theme_light') },
            ]}
          />
        </div>
        <div>
          <label className="label" htmlFor="s-fontsize">{t('font_size_val', { v: `${settings.fontPx}px` })}</label>
          <input
            id="s-fontsize" type="range" min={MIN_FONT_PX} max={MAX_FONT_PX} step="0.5" value={settings.fontPx}
            onChange={(e) => onChange({ fontPx: Number(e.target.value) })} className="w-full accent-[rgb(var(--accent))]"
          />
        </div>
        <div>
          <span className="label">{t('s_fontfamily')}</span>
          <div className="grid grid-cols-2 gap-2">
            {['tajawal', 'cairo', 'almarai', 'system'].map((f) => (
              <button
                key={f} type="button" aria-pressed={settings.fontFamily === f}
                onClick={() => onChange({ fontFamily: f })}
                style={{ fontFamily: FONT_STACKS[f] }}
                className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${settings.fontFamily === f ? 'border-accent/60 bg-accent/15 text-accent' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
              >
                {t(`font_${f}`)}
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">{t('font_sample')}</p>
        </div>
      </Section>

      <Section title={t('s_colors')} icon={Palette}>
        <div>
          <span className="label">{t('col_pal')}</span>
          <div className="grid grid-cols-3 gap-2">
            {PALETTES.map((p) => {
              const active = ['accent', 'home', 'fast'].every((k) => (settings.colors[k] || '') === p.colors[k]);
              return (
                <button
                  key={p.id} type="button" data-palette={p.id} aria-pressed={active}
                  onClick={() => onChange({ colors: { ...p.colors } })}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition ${active ? 'border-accent/60 bg-accent/10' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <span className="flex">
                    {p.preview.map((c) => <span key={c} className="-ms-1 h-5 w-5 rounded-full border border-black/20 first:ms-0" style={{ background: c }} />)}
                  </span>
                  {t(`pal_${p.id}`)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="label">{t('col_custom')}</span>
          <div className="grid grid-cols-3 gap-2">
            {[['accent', 'col_accent', '#22d3ee'], ['home', 'col_home', '#2ef2a0'], ['fast', 'col_fast', '#ff9a3c']].map(([k, key, def]) => (
              <label key={k} className="flex flex-col items-center gap-1.5 text-[0.7rem] text-slate-400">
                <input
                  type="color" aria-label={t(key)} data-color={k}
                  value={settings.colors[k] || def}
                  onChange={(e) => onChange({ colors: { ...settings.colors, [k]: e.target.value } })}
                  className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
                />
                {t(key)}
              </label>
            ))}
          </div>
        </div>
        <button className="btn-ghost w-full text-xs" onClick={() => onChange({ colors: { accent: '', home: '', fast: '' }, carColor: DEFAULT_CAR_COLOR })}>{t('col_reset')}</button>
      </Section>

      <Section title={t('s_period')} icon={CalendarRange}>
        <div>
          <span className="label">{t('period_mode')}</span>
          <select className="field" value={settings.periodMode} onChange={set('periodMode')} aria-label={t('period_mode')}>
            <option value="month">{t('period_month')}</option>
            <option value="prev">{t('period_prev')}</option>
            <option value="custom">{t('period_custom')}</option>
            <option value="all">{t('period_all')}</option>
            <option value="bill" disabled={!bills.length}>{t('kind_bill')}</option>
          </select>
        </div>
        {settings.periodMode === 'custom' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <DateField id="p-from" label={t('period_from')} value={settings.periodStart} onChange={(v) => onChange({ periodStart: v })} />
              <DateField id="p-to" label={t('period_to')} value={settings.periodEnd} onChange={(v) => onChange({ periodEnd: v })} />
            </div>
            {(!settings.periodStart || !settings.periodEnd || settings.periodStart > settings.periodEnd) && (
              <p role="alert" className="text-xs font-medium text-fast">{t('period_bad')}</p>
            )}
          </>
        )}
        <p className="text-[0.7rem] leading-relaxed text-slate-500">{t('period_hint')}</p>
      </Section>

      <Section title={t('s_car')} icon={Car}>
        <div className="flex items-center gap-3">
          <CarImage settings={settings} size="md" />
          <p className="text-[0.7rem] leading-relaxed text-slate-500">{t('img_hint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="s-name">{t('car_name')}</label>
            <input id="s-name" className="field" maxLength={40} value={settings.carName} onChange={set('carName')} />
          </div>
          <div>
            <label className="label" htmlFor="s-model">{t('car_model')}</label>
            <input id="s-model" className="field" maxLength={40} value={settings.carModel} onChange={set('carModel')} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-style">{t('car_image')}</label>
          <select id="s-style" className="field" value={settings.carStyle} onChange={set('carStyle')} disabled={!!settings.carPhoto}>
            <option value="auto">{t('img_auto')}</option>
            <option value="yuan">{t('style_yuan')}</option>
            <option value="sedan">{t('style_sedan')}</option>
            <option value="suv">{t('style_suv')}</option>
            <option value="hatch">{t('style_hatch')}</option>
            <option value="pickup">{t('style_pickup')}</option>
          </select>
          <div className="mt-2 flex gap-2">
            <button className="btn-ghost flex-1 text-xs" onClick={() => photoRef.current?.click()}><Upload size={15} /> {t('upload_photo')}</button>
            {settings.carPhoto && (
              <button className="btn-danger flex-1 text-xs" onClick={() => onChange({ carPhoto: '' })}><Trash2 size={15} /> {t('remove_photo')}</button>
            )}
          </div>
          <input
            ref={photoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ''; }}
          />
        </div>
        <div>
          <span className="label">{t('col_car')}</span>
          <input
            type="color" aria-label={t('col_car')} data-color="car" value={settings.carColor}
            onChange={(e) => onChange({ carColor: e.target.value })}
            className="h-10 w-24 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
          />
        </div>
        <button className="btn-ghost w-full text-xs" onClick={onAddOdo} data-testid="settings-add-odo"><Gauge size={15} /> {t('odo_add_long')}</button>
        <NumField
          id="s-cap" label={t('capacity_label')} value={settings.capacity} min={MIN_CAPACITY} max={MAX_CAPACITY}
          onCommit={(n) => onChange({ capacity: n })} hint={t('capacity_hint')}
        />
      </Section>

      <Section title={t('s_pricing')}>
        <div>
          <label className="label" htmlFor="s-cur">{t('currency_label')}</label>
          <input id="s-cur" className="field" maxLength={10} value={settings.currency} onChange={set('currency')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="s-home" label={t('home_price')} value={settings.homePrice} onCommit={(n) => onChange({ homePrice: n })} />
          <NumField id="s-fast" label={t('fast_price')} value={settings.fastPrice} onCommit={(n) => onChange({ fastPrice: n })} />
        </div>
        <button className="btn-ghost w-full text-xs" onClick={onReset}>{t('reset_defaults')}</button>
      </Section>

      <Section title={t('s_entry')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <label className="text-sm font-bold" htmlFor="s-manual">{t('manual_energy')}</label>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-500">{t('manual_energy_hint')}</p>
          </div>
          <Toggle id="s-manual" checked={settings.allowManualEnergy} onChange={(v) => onChange({ allowManualEnergy: v })} label={t('manual_energy')} />
        </div>
      </Section>

      <Section title={t('s_home')}>
        <button className="btn-ghost w-full" onClick={onCustomize}><SlidersHorizontal size={16} /> {t('customize_home')}</button>
      </Section>

      <Section title={t('s_data')}>
        <p className="text-xs text-slate-400">{t('data_hint', { n: count })}</p>
        <button className="btn-primary w-full" onClick={onPdf} disabled={!count} data-testid="export-pdf"><FileText size={17} /> {t('export_pdf')}</button>
        <button className="btn-ghost w-full" onClick={onExportCsv} disabled={!count}><FileSpreadsheet size={17} /> {t('export_csv')}</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={onExportBackup}><Download size={16} /> {t('backup')}</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('restore')}</button>
        </div>
        <input
          ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportBackup(f); e.target.value = ''; }}
        />
      </Section>

      <Section title={t('s_tools')}>
        <button className="btn-ghost w-full" onClick={onDemo}><FlaskConical size={16} /> {t('load_demo')}</button>
        <button className="btn-danger w-full" onClick={onClear} disabled={!count}><Trash2 size={16} /> {t('clear_all')}</button>
      </Section>

      <Section title={t('s_about')}>
        <p dir="ltr" className="text-center text-sm font-bold text-slate-300">{t('dev_by')}</p>
      </Section>
    </div>
  );
}
