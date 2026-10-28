import React, { useCallback, useRef, useState } from 'react';
import { Sheet } from './ui.jsx';
import { useI18n } from '../lib/i18n.jsx';

function ConfirmDialog({ req, settle }) {
  const { t } = useI18n();
  return (
    <Sheet open={!!req} onClose={() => settle(false)} title={t('confirm')}>
      <p className="mb-5 text-sm leading-relaxed text-slate-300">{req?.message}</p>
      <div className="flex gap-2">
        <button className="btn-danger flex-1" onClick={() => settle(true)}>{req?.okLabel}</button>
        <button className="btn-ghost flex-1" onClick={() => settle(false)}>{t('cancel_back')}</button>
      </div>
    </Sheet>
  );
}

/**
 * تأكيد داخل الصفحة بدل window.confirm (الذي لا يعمل في بعض البيئات المضمّنة).
 * الاستخدام: const [ask, node] = useConfirm();  if (await ask('...', 'نص الزر')) {...}   ثم اعرض {node}
 */
export function useConfirm() {
  const [req, setReq] = useState(null);
  const resolver = useRef(null);

  const ask = useCallback(
    (message, okLabel) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setReq({ message, okLabel });
      }),
    [],
  );

  const settle = (v) => {
    const r = resolver.current;
    resolver.current = null;
    setReq(null);
    if (r) r(v);
  };

  return [ask, <ConfirmDialog key="confirm" req={req} settle={settle} />];
}
