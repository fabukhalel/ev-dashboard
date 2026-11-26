import React from 'react';
import AnalysisView from '../components/Analysis.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { useReadings } from '../state/derived.js';

export default function Analysis() {
  const { state: { charges, bills, odos, settings }, actions } = useStore();
  const ui = useUi();
  const readings = useReadings();
  return <AnalysisView charges={charges} bills={bills} readings={readings} odos={odos} settings={settings} onAddOdo={() => ui.openSheet('odo')} onDeleteOdo={actions.deleteOdo} />;
}
