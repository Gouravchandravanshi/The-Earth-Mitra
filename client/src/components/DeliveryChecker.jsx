import { useEffect, useRef, useState } from 'react';
import { checkDelivery } from '../api';

export default function DeliveryChecker({ pincode: externalPin }) {
  const [pincode, setPincode] = useState(externalPin || '');
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const requestSequence = useRef(0);
  useEffect(() => { if (externalPin !== undefined) setPincode(externalPin); setMessage(''); setBusy(false); requestSequence.current++; return () => { requestSequence.current++; }; }, [externalPin]);
  async function check() {
    const checkedPin = pincode;
    const sequence = ++requestSequence.current;
    setBusy(true); setMessage('');
    try { const result = await checkDelivery(checkedPin); if (sequence === requestSequence.current) { setFailed(false); setMessage(result.message); } }
    catch (error) { if (sequence === requestSequence.current) { setFailed(true); setMessage(error.message); } }
    finally { if (sequence === requestSequence.current) setBusy(false); }
  }
  return <div className="my-4 rounded-xl border border-gray-200 bg-white p-4">
    <p className="mb-2 text-sm font-semibold text-[#2C1A0E]">Check delivery availability</p>
    <div className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Delivery PIN code</span><input value={pincode} onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMessage(''); }} readOnly={externalPin !== undefined} disabled={busy} inputMode="numeric" maxLength={6} placeholder="6-digit PIN code" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label><button type="button" disabled={busy || !/^[1-9]\d{5}$/.test(pincode)} onClick={check} className="rounded-lg bg-[#2D5A2E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Checking…' : 'Check'}</button></div>
    {message && <p role={failed ? 'alert' : 'status'} className={`mt-2 text-xs ${failed ? 'text-red-700' : 'text-gray-600'}`}>{message}</p>}
  </div>;
}
