import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, FileText, RefreshCw, CheckCircle2, Package } from 'lucide-react'
import { useListQuery, useSendMutation, apiBaseUrl } from './store.js'
import { Badge, Btn, Card, Head, Loading } from './ui.jsx'

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0))
const inputClass = 'w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink'
function DocumentLink({ url, children }) {
  if (!/^https:\/\//i.test(url || '')) return null
  return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 underline"><FileText size={15} />{children}</a>
}
async function downloadInvoice(id) {
  const response = await fetch(`${apiBaseUrl}/admin/shipping/orders/${id}/invoice.pdf`, { credentials: 'include' })
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || 'Invoice download failed.') }
  const url = URL.createObjectURL(await response.blob()), anchor = document.createElement('a')
  anchor.href = url; anchor.download = `invoice-${id}.pdf`; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export function ShippingPanel({ order, onChange }) {
  const [send, { isLoading: busy }] = useSendMutation()
  const [parcel, setParcel] = useState(order.parcel || {})
  const [message, setMessage] = useState(''), [error, setError] = useState('')
  const [couriers, setCouriers] = useState([]), [courierId, setCourierId] = useState(''), [loading, setLoading] = useState(false)
  const shipping = order.shipping || {}, base = `/admin/shipping/orders/${order._id}`
  const locked = busy || loading || Boolean(shipping.operation) || Boolean(shipping.pendingAction) || shipping.needsReview
  const terminal = ['cancelled', 'delivered'].includes(order.status)
  const paid = order.paymentMethod === 'COD' || order.paymentInfo?.status === 'paid'
  useEffect(() => { setParcel(order.parcel || {}); setCouriers([]); setCourierId('') }, [order._id, order.parcel?.weightKg, order.parcel?.lengthCm, order.parcel?.breadthCm, order.parcel?.heightCm])
  async function act(action, body, method = 'POST') {
    setMessage(''); setError('')
    try {
      const result = await send({ url: `${base}/${action}`, method, body }).unwrap()
      setMessage(result.message || `${action.replaceAll('-', ' ')} completed.`)
      await onChange()
    } catch (e) { setError(e?.data?.message || 'Request could not be completed.'); await onChange() }
  }
  async function rates() {
    setLoading(true); setError(''); setCouriers([]); setCourierId('')
    try { const result = await send({ url: `${base}/couriers`, method: 'GET' }).unwrap(); setCouriers(result.couriers); if (!result.couriers.length) setMessage('No couriers available for this parcel.') }
    catch (e) { setError(e?.data?.message || 'Could not fetch courier rates.') }
    finally { setLoading(false) }
  }
  async function invoice() {
    setLoading(true); setError('')
    try { await downloadInvoice(order._id); await onChange() } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  return <Card title="Shiprocket fulfilment">
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm"><Truck size={18} /><Badge>{shipping.status || order.approval || 'Pending'}</Badge></p><Link to="/settings/shipping" className="text-sm text-forest-600 underline">Shipping settings</Link></div>
      <ol className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{[['Approve', order.approval === 'approved'], ['Create shipment', shipping.shipmentId], ['Assign courier', shipping.awb], ['Request pickup', shipping.pickupRequested]].map(([label, done], i) => <li key={label} className={`flex items-center gap-2 rounded-lg border p-3 ${done ? 'border-green-200 bg-green-50 text-green-800' : 'border-line text-mute'}`}>{done ? <CheckCircle2 size={15} /> : <span>{i + 1}.</span>}{label}</li>)}</ol>
      {!paid && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Payment must be confirmed before processing this prepaid order.</p>}
      {(shipping.needsReview || shipping.operation || shipping.pendingAction) && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{shipping.operation ? `Action in progress: ${shipping.operation}.` : 'A previous action could not be confirmed.'} Reconcile with Shiprocket before continuing. Interrupted actions can be reconciled after two minutes.</div>}
      <form onSubmit={e => { e.preventDefault(); act('parcel', parcel, 'PUT') }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['weightKg', 'Packed weight (kg)'], ['lengthCm', 'Length (cm)'], ['breadthCm', 'Breadth (cm)'], ['heightCm', 'Height (cm)']].map(([key, label]) => <label key={key} className="text-xs text-mute">{label}<input className={`${inputClass} mt-1`} required type="number" min={key === 'weightKg' ? '0.001' : '0.5'} max={key === 'weightKg' ? '1000' : '500'} step="0.001" value={parcel[key] ?? ''} disabled={locked || terminal || Boolean(shipping.shipmentId)} onChange={e => setParcel(p => ({ ...p, [key]: e.target.value }))} /></label>)}</div>
        <div className="flex flex-wrap gap-2"><Btn type="submit" v="ghost" disabled={locked || terminal || Boolean(shipping.shipmentId) || !paid}><Package size={16} />Save parcel</Btn><Btn type="button" disabled={locked || terminal || Boolean(shipping.shipmentId) || order.approval === 'approved' || !paid} onClick={() => act('approve')}>Approve order</Btn><Btn type="button" disabled={locked || terminal || Boolean(shipping.shipmentId) || order.approval !== 'approved'} onClick={() => act('create-shipment')}>Create shipment</Btn></div>
      </form>
      <div className="space-y-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-3"><Btn v="ghost" disabled={locked || terminal || !paid} onClick={rates}>{loading ? 'Checking…' : 'Check courier rates'}</Btn><span className="text-xs text-mute">Rates are estimates; Shiprocket confirms the final charge.</span></div>
        {couriers.length > 0 && <><label className="block text-sm">Courier<select className={`${inputClass} mt-1`} value={courierId} onChange={e => setCourierId(e.target.value)} disabled={Boolean(shipping.awb) || locked}><option value="">Choose a courier</option>{couriers.map(c => <option key={c.id} value={c.id}>{c.name} — {money(c.rate)} {c.etd ? `— ${c.etd}` : ''}</option>)}</select></label><Btn disabled={locked || !courierId || !shipping.shipmentId || Boolean(shipping.awb)} onClick={() => act('assign-courier', { courierId: Number(courierId) })}>Assign courier &amp; AWB</Btn><p className="text-xs text-mute">Assigning an AWB can debit your Shiprocket wallet.</p></>}
        {shipping.shipmentId && <dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs text-mute">Shiprocket order / shipment</dt><dd>{shipping.shiprocketOrderId} / {shipping.shipmentId}</dd></div><div><dt className="text-xs text-mute">AWB / courier</dt><dd>{shipping.awb || 'Awaiting assignment'} {shipping.courierName}</dd></div><div><dt className="text-xs text-mute">Quoted freight</dt><dd>{shipping.quotedRate != null ? money(shipping.quotedRate) : '—'}</dd></div></dl>}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Btn disabled={locked || terminal || !shipping.awb || shipping.pickupRequested} onClick={() => act('pickup')}>Request pickup</Btn>
        <Btn v="ghost" disabled={locked || !shipping.awb} onClick={() => act('label')}>Generate label</Btn>
        <Btn v="ghost" disabled={locked || !shipping.pickupRequested} onClick={() => act('manifest')}>Generate manifest</Btn>
        <Btn v="ghost" disabled={locked || !shipping.manifestUrl} onClick={() => act('print-manifest')}>Print manifest</Btn>
        <Btn v="ghost" disabled={busy || loading || !shipping.awb} onClick={() => act('track', undefined, 'GET')}><RefreshCw size={15} />Sync tracking</Btn>
        <Btn v="ghost" disabled={busy || loading} onClick={() => act('reconcile')}>Reconcile</Btn>
        <Btn v="danger" disabled={locked || terminal} onClick={() => { if (window.confirm('Cancel this order and its Shiprocket shipment? This does not refund the payment.')) act('cancel') }}>Cancel order</Btn>
      </div>
      <div className="space-y-3 border-t border-line pt-4"><h4 className="font-semibold">Invoice &amp; documents</h4><div className="flex flex-wrap gap-2"><Btn v="ghost" disabled={busy || loading || order.approval !== 'approved'} onClick={invoice}>Download order invoice PDF</Btn><Btn v="ghost" disabled={locked || !shipping.shipmentId} onClick={() => act('invoice')}>Generate Shiprocket invoice</Btn></div><div className="flex flex-wrap gap-4"><DocumentLink url={shipping.labelUrl}>Shipping label</DocumentLink><DocumentLink url={shipping.manifestUrl}>Manifest PDF</DocumentLink><DocumentLink url={shipping.invoiceUrl}>Shiprocket invoice</DocumentLink><DocumentLink url={shipping.trackingUrl}>Track shipment</DocumentLink></div></div>
      {shipping.events?.length > 0 && <div className="border-t border-line pt-4"><h4 className="mb-3 font-semibold">Tracking history</h4><ol className="max-h-64 space-y-3 overflow-y-auto">{[...shipping.events].sort((a, b) => new Date(b.at) - new Date(a.at)).map((event, index) => <li key={event.eventKey || index} className="border-l-2 border-forest-600 pl-3 text-sm"><p>{event.status}</p><p className="text-xs text-mute">{new Date(event.at).toLocaleString()} {event.location}</p></li>)}</ol></div>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
  </Card>
}

export function ShippingSettingsPage() {
  const { data, isLoading, error, refetch } = useListQuery('/admin/shipping/settings')
  const connection = useListQuery('/admin/shipping/connection')
  const [send, { isLoading: saving }] = useSendMutation()
  const [form, setForm] = useState({}), [message, setMessage] = useState(''), [failed, setFailed] = useState(false)
  useEffect(() => { if (data) setForm({ ...data.settings, ...(!data.settings.pickupLocation && connection.data?.settings.pickupLocation ? { pickupLocation: connection.data.settings.pickupLocation } : {}) }) }, [data, connection.data])
  if (isLoading) return <Loading />
  if (error) return <p role="alert">{error.data?.message || 'Could not load shipping settings.'}</p>
  const locations = connection.data?.locations || []
  return <div className="space-y-5"><Head title="Shipping & billing settings" sub="Connect your Shiprocket warehouse and manage invoice details." />
    <Card title="Shiprocket connection"><div className="space-y-3 text-sm"><p>API credentials: <Badge>{data?.configured ? 'Configured' : 'Missing'}</Badge></p><p>Account connection: <Badge>{connection.isFetching ? 'Checking…' : connection.error ? 'Failed' : connection.data?.connected ? 'Connected' : 'Pending'}</Badge></p>{connection.error && <p role="alert" className="text-red-700">{connection.error.data?.message || 'Could not connect to Shiprocket.'}</p>}<Btn v="ghost" disabled={connection.isFetching} onClick={() => connection.refetch()}>Test connection / refresh warehouses</Btn>{connection.data && !locations.length && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">No pickup locations were returned. Add and verify your warehouse in Shiprocket Settings → Pickup Address, then refresh this list.</p>}<p className="text-xs text-mute">Tracking webhook: {data?.webhookConfigured ? 'Secret configured' : 'Add SHIPROCKET_WEBHOOK_KEY in server/.env'}. Set your public backend URL + /api/webhooks/courier-events in Shiprocket with the matching x-api-key.</p></div></Card>
    <Card title="Warehouse & invoice seller"><form className="space-y-4" onSubmit={async e => { e.preventDefault(); setMessage(''); try { await send({ url: '/admin/shipping/settings', method: 'PUT', body: form }).unwrap(); setFailed(false); setMessage('Settings saved.'); refetch() } catch (e) { setFailed(true); setMessage(e.data?.message || 'Could not save settings.') } }}>
      <label className="block text-sm">Pickup warehouse<select className={`${inputClass} mt-1`} required value={form.pickupLocation || ''} onChange={e => setForm(f => ({ ...f, pickupLocation: e.target.value }))}><option value="">Select verified warehouse</option>{locations.filter(p => p.active).map(p => <option key={p.id} value={p.name}>{p.name} — {p.pincode}</option>)}</select></label>
      {[['businessName', 'Business name'], ['businessAddress', 'Business address'], ['businessGstin', 'GSTIN (if applicable)']].map(([key, label]) => <label key={key} className="block text-sm">{label}<input className={`${inputClass} mt-1`} value={form[key] || ''} maxLength={1000} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} /></label>)}
      <p className="text-xs text-mute">Set each product’s packed weight and dimensions under Products before accepting checkout payments. Order invoices show saved billing totals; no GST breakup is invented.</p>
      <Btn type="submit" disabled={saving || !locations.length}>{saving ? 'Saving…' : 'Save settings'}</Btn>{message && <p role={failed ? 'alert' : 'status'} className={`text-sm ${failed ? 'text-red-700' : 'text-forest-600'}`}>{message}</p>}
    </form></Card></div>
}

export function BillingPage() {
  const [page, setPage] = useState(1), [message, setMessage] = useState(''), [downloading, setDownloading] = useState('')
  const { data, isFetching, error, refetch } = useListQuery(`/admin/shipping/billing?page=${page}`)
  return <div className="space-y-5"><Head title="Invoices & billing" sub="Saved order payments, customer billing and shipping estimates."><Btn v="ghost" disabled={isFetching} onClick={refetch}><RefreshCw size={15} />Refresh</Btn></Head>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Order total', data?.summary.sales], ['Payments recorded paid', data?.summary.paid], ['Shipping collected', data?.summary.shippingCollected], ['Quoted courier freight', data?.summary.shippingQuoted]].map(([label, value]) => <Card key={label}><div className="p-5"><p className="text-xs text-mute">{label}</p><p className="mt-2 text-xl font-semibold">{money(value)}</p></div></Card>)}</div>
    <p className="text-xs text-mute">Courier quotes are not wallet debits or settlement statements. COD delivery does not mark payment as paid. Cancellation does not issue a payment refund.</p>
    {error && <p role="alert" className="text-red-700">{error.data?.message || 'Billing could not be loaded.'}</p>}{message && <p role="alert" className="text-red-700">{message}</p>}
    <Card title="Order invoices">{isFetching ? <Loading /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line text-xs text-mute">{['Order / customer', 'Invoice', 'Total / payment', 'Shipment', 'Action'].map(title => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{(data?.orders || []).map(o => <tr key={o._id} className="border-b border-line"><td className="p-3"><Link className="font-semibold text-forest-600" to={`/orders/${o._id}`}>#{o._id.slice(-8).toUpperCase()}</Link><p className="text-xs text-mute">{o.user?.name || o.guestName || o.guestEmail}</p></td><td className="p-3 text-xs">{o.invoice?.number || 'Not generated'}</td><td className="p-3">{money(o.totalAmount)}<p className="text-xs"><Badge>{o.paymentInfo?.status || 'pending'}</Badge></p></td><td className="p-3 text-xs">{o.shipping?.awb || o.shipping?.status || o.status}</td><td className="p-3"><Btn v="ghost" disabled={o.approval !== 'approved' || Boolean(downloading)} onClick={async () => { setDownloading(o._id); setMessage(''); try { await downloadInvoice(o._id); refetch() } catch (e) { setMessage(e.message) } finally { setDownloading('') } }}>{downloading === o._id ? 'Downloading…' : 'Invoice PDF'}</Btn></td></tr>)}</tbody></table>{!data?.orders?.length && <p className="p-5 text-sm text-mute">No orders yet.</p>}</div>}<div className="mt-4 flex items-center justify-between text-sm"><Btn v="ghost" disabled={page === 1 || isFetching} onClick={() => setPage(p => p - 1)}>Previous</Btn><span>Page {page} of {data?.pages || 1}</span><Btn v="ghost" disabled={page >= (data?.pages || 1) || isFetching} onClick={() => setPage(p => p + 1)}>Next</Btn></div></Card>
  </div>
}
