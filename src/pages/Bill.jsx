import React from 'react';
import BillImpact from '../components/BillImpact.jsx';
import { useStore } from '../state/store.jsx';

export default function Bill() {
  const { state: { charges, bills, settings }, actions } = useStore();
  return <BillImpact charges={charges} bills={bills} settings={settings} onChange={actions.changeSettings} onSaveBill={actions.saveBill} onDeleteBill={actions.deleteBill} />;
}
