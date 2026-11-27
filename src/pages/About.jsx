// «حول التطبيق» (S7): الشعار، الاسم، الإصدار والبناء وتاريخه، ما الجديد، التحقق من التحديثات، المطوّر، الخصوصية، المكتبات.
import React, { useState } from 'react';
import { Star, RefreshCw, Github, Mail, Lock, Package } from 'lucide-react';
import { Logo } from '../components/Brand.jsx';
import { ListRow, Sheet, C } from '../components/ui.jsx';
import { useStore } from '../state/store.jsx';
import { formatDate } from '../lib/format.js';

const REPO = 'fabukhalel/ev-dashboard';
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
const BUILD = typeof __BUILD_NUMBER__ !== 'undefined' ? __BUILD_NUMBER__ : '';
const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';
// نسخة Google Play: التحديث عن طريق المتجر فقط، فلا زر «التحقق من التحديثات» ولا أي اتصال بالإنترنت
const PLAY = typeof __PLAY__ !== 'undefined' && __PLAY__ === true;
export const PRIVACY_URL = 'https://fabukhalel.github.io/ev-dashboard/privacy.html';

/** مقارنة إصدارين بصيغة 1.2.3 (تتجاهل v في البداية) */
export function newerThan(a, b) {
  const p = (v) => String(v).replace(/^v/i, '').split('.').map((x) => parseInt(x, 10) || 0);
  const [x, y] = [p(a), p(b)];
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

/** رابط التحديث يُقبل فقط إن كان صفحة إصدار في مستودع التطبيق نفسه، وإلا نستخدم صفحة آخر إصدار */
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
export function safeReleaseUrl(url) {
  return typeof url === 'string' && url.startsWith(`https://github.com/${REPO}/releases/`) && !/[\s"'<>]/.test(url) ? url : RELEASES_URL;
}

const LIBS = [
  ['React', 'MIT'], ['Vite', 'MIT'], ['Tailwind CSS', 'MIT'], ['Capacitor', 'MIT'], ['Lucide', 'ISC'],
  ['Readex Pro', 'OFL-1.1'], ['IBM Plex Sans / Arabic', 'OFL-1.1'],
];

export default function About() {
  const { t } = useStore();
  const [sheet, setSheet] = useState(null); // 'new' | 'privacy' | 'libs'
  const [upd, setUpd] = useState({ state: 'idle' });

  // التحقق من التحديثات: طلب واحد عند الضغط فقط إلى GitHub Releases (لا يُرسل أي بيانات من التطبيق)
  const check = async () => {
    setUpd({ state: 'loading' });
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      if (r.status === 404) { setUpd({ state: 'none' }); return; }
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      setUpd(newerThan(j.tag_name, APP_VERSION) ? { state: 'new', tag: String(j.tag_name).slice(0, 20), url: safeReleaseUrl(j.html_url) } : { state: 'latest' });
    } catch {
      setUpd({ state: 'error' });
    }
  };
  const updSub = {
    idle: t('upd_sub'), loading: t('upd_loading'), none: t('upd_none'), latest: t('upd_latest'), error: t('upd_error'),
    new: t('upd_new', { v: upd.tag }),
  }[upd.state];

  return (
    <div className="space-y-5" data-testid="about">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <Logo size={96} />
        <h2 className="mt-2 text-2xl font-bold">{t('app_name')}</h2>
        <p className="text-slate-400" dir="ltr">EV Smart Dashboard</p>
        <span className="tabular rounded-full bg-ink-800 px-4 py-1.5 text-sm font-bold" data-testid="app-version">
          {t('version_build', { v: APP_VERSION, b: BUILD || '—' })}
        </span>
        {BUILD_DATE && <p className="tabular text-sm text-slate-400">{t('released_on', { d: formatDate(BUILD_DATE) })}</p>}
      </div>

      <div className="card row-divide overflow-hidden">
        <ListRow icon={Star} tint={C.home} title={t('whats_new')} sub={t('whats_new_sub')} onClick={() => setSheet('new')} />
        {PLAY ? null : upd.state === 'new'
          ? <ListRow icon={RefreshCw} tint={C.fast} title={t('upd_title')} sub={updSub} href={upd.url} testid="check-updates" />
          : <ListRow icon={RefreshCw} tint={C.fast} title={t('upd_title')} sub={updSub} onClick={check} testid="check-updates" />}
      </div>

      <section className="space-y-2">
        <h3 className="px-1 text-lg font-bold">{t('developer')}</h3>
        <div className="card row-divide overflow-hidden">
          <ListRow icon={null} title={<span dir="ltr">Eng. Fadi Abu Khalel</span>} sub={t('dev_role')}
            end={<span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-base font-bold text-[#141414]">FA</span>} />
          <ListRow icon={Github} tint={C.text} title="GitHub" sub="fabukhalel" href="https://github.com/fabukhalel" />
          <ListRow icon={Mail} tint={C.fast} title={t('contact_me')} sub="fabukhalel@gmail.com" href="mailto:fabukhalel@gmail.com" />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="px-1 text-lg font-bold">{t('info')}</h3>
        <div className="card row-divide overflow-hidden">
          <ListRow icon={Lock} tint={C.home} title={t('privacy')} sub={t('privacy_sub')} onClick={() => setSheet('privacy')} />
          <ListRow icon={Package} tint={C.accent} title={t('libs')} sub={t('libs_sub')} onClick={() => setSheet('libs')} />
        </div>
      </section>

      <p className="text-center text-sm text-slate-500">{t('made_in')}</p>

      <Sheet open={sheet === 'new'} onClose={() => setSheet(null)} title={t('whats_new')}>
        <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-slate-300">
          {t('whats_new_list').split('|').map((x) => <li key={x}>{x}</li>)}
        </ul>
      </Sheet>
      <Sheet open={sheet === 'privacy'} onClose={() => setSheet(null)} title={t('privacy')}>
        <p className="text-sm leading-relaxed text-slate-300">{t(PLAY ? 'privacy_text_play' : 'privacy_text')}</p>
        <a className="mt-3 inline-block text-sm font-bold underline" style={{ color: 'rgb(var(--fast))' }} href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">{t('privacy_full')}</a>
      </Sheet>
      <Sheet open={sheet === 'libs'} onClose={() => setSheet(null)} title={t('libs')}>
        <ul className="row-divide text-sm">
          {LIBS.map(([n, l]) => <li key={n} className="flex justify-between py-2.5"><span dir="ltr">{n}</span><span className="text-slate-400" dir="ltr">{l}</span></li>)}
        </ul>
      </Sheet>
    </div>
  );
}
