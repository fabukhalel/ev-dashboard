import React from 'react';
import SettingsView from '../components/SettingsView.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { usePeriod } from '../state/derived.js';

export default function Settings() {
  const { state: { settings, charges, bills }, actions: a, settingsKey, autoBackups } = useStore();
  const ui = useUi();
  const { period } = usePeriod();
  return (
    <SettingsView
      key={settingsKey}
      settings={settings}
      count={charges.length}
      onChange={a.changeSettings}
      onReset={a.resetSettings}
      onExportCsv={a.exportCsv}
      onExportBackup={a.exportBackup}
      autoBackups={autoBackups}
      onAutoBackupNow={a.autoBackupNow}
      onShareAutoBackup={a.shareAutoBackup}
      onRestoreAutoBackup={a.restoreAutoBackup}
      onImportBackup={a.importBackup}
      onPhoto={a.setPhoto}
      onDemo={a.loadDemo}
      onClear={a.clearAll}
      onCustomize={() => ui.openSheet('customize')}
      onPdf={() => a.exportPdf(period)}
      onAddOdo={() => ui.openSheet('odo')}
      bills={bills}
    />
  );
}
