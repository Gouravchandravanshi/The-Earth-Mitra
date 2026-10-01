import { useState } from 'react'
import { useNavigate, useParams, NavLink, Navigate } from 'react-router-dom'
import { Plus, Leaf, ShieldCheck, Mail, Lock, Check, CalendarDays, ChevronDown, IndianRupee, ShoppingBag, Users, ReceiptIndianRupee, PackageCheck, RotateCcw, MessageSquare } from 'lucide-react'
import { Btn, Head, Card, Field, Fields, Modal, Table } from './ui.jsx'
import { useDispatch } from 'react-redux'
import { settings, dash, lists } from './data.js'
import { useListQuery, useSendMutation, setUser } from './store.js'

const leaves = [[55, 50, -18, 164], [276, 235, 32, 179], [55, 340, -18, 164], [276, 525, 32, 179], [55, 630, -18, 164], [276, 815, 32, 179]]
const IField = ({ l, I, ...p }) => (
  <label className="flex flex-col gap-2"><span className="text-xs font-semibold text-ink">{l}</span>
    <span className="flex h-[42px] items-center gap-2 rounded-lg border border-line bg-white px-3"><I size={16} className="text-mute" /><input {...p} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink" /></span></label>)
export function Login() {
  const nav = useNavigate(), dispatch = useDispatch(), [send] = useSendMutation(), [err, setErr] = useState('')
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-[650px] shrink-0 flex-col justify-between overflow-hidden bg-forest-600 p-16 lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]">{leaves.map(([x, y, r, z], i) => <Leaf key={i} size={130} strokeWidth={0.5} color="#fff" className="absolute" style={{ left: x + (z - 130) / 2, top: y + (z - 130) / 2, transform: `rotate(${r}deg)` }} />)}</div>
        <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white"><Leaf size={24} color="#1e6e53" /></span><span className="text-[22px] font-bold text-white">Earth Mitra Admin</span></div>
        <div className="relative flex w-[500px] flex-col gap-5"><h2 className="text-[44px] font-semibold leading-[1.12] text-white">Good products. Better business. One calm workspace.</h2>
          <p className="leading-[1.6] text-[#e6f2ed]">Manage every organic order, product and customer with the care your sustainable store deserves.</p>
          <p className="flex items-center gap-[9px] text-[13px] text-white"><ShieldCheck size={18} />Secure admin access · GST-ready · Made for India</p></div>
        <p className="relative text-xs text-[#d2e8df]">© 2026 Earth Mitra Organics Pvt. Ltd.</p>
      </div>
      <div className="grid flex-1 place-items-center p-6">
        <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-xl border border-line bg-white p-9 shadow-[0_6px_10px_rgba(61,42,23,0.05)]">
          <div className="flex flex-col gap-2"><h1 className="text-[28px] font-semibold text-ink">Welcome back</h1><p className="text-sm text-mute">Sign in to your Earth Mitra Admin account.</p></div>
          <form className="flex flex-col gap-4" onSubmit={async e => { e.preventDefault(); const r = await send({ url: '/auth/login', body: Object.fromEntries(new FormData(e.target)) }); r.data ? (dispatch(setUser(r.data.user || r.data)), nav('/')) : setErr('Login failed') }}>
            <IField l="Email address" I={Mail} name="email" type="email" placeholder="ananya@earthmitra.in" />
            <IField l="Password" I={Lock} name="password" type="password" placeholder="••••••••••••" />
            <div className="flex justify-between text-xs"><span className="flex items-center gap-2 text-mute"><span className="grid size-[18px] place-items-center rounded bg-forest-600"><Check size={12} color="#fff" /></span>Remember me</span><span className="font-semibold text-forest-600">Forgot password?</span></div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Btn type="submit" className="w-full justify-center">Sign in securely</Btn>
            <button type="button" className="text-[11px] text-mute" onClick={() => nav('/')}>Continue without login (demo)</button>
          </form>
          <p className="flex justify-center gap-[5px] text-xs text-mute">Need help? <b className="font-semibold text-forest-600">Contact support</b></p>
        </div>
      </div>
    </div>)
}

const Pill = ({ bg, c, children }) => <span className="inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-xs font-medium" style={{ background: bg, color: c }}><i className="size-1.5 rounded-full bg-current" />{children}</span>
const Sec = ({ t, s, link, children, className = '' }) => (
  <section className={`flex flex-col gap-4 rounded-xl border border-line bg-card p-5 shadow-[0_6px_10px_rgba(61,42,23,0.05)] ${className}`}>
    <div className="flex items-center justify-between"><div><p className="text-lg font-semibold text-ink">{t}</p>{s && <p className="text-xs text-mute">{s}</p>}</div>{link && <span className="text-xs font-semibold text-forest-600">{link}</span>}</div>{children}</section>)
const Thumb = () => <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-forest-50"><Leaf size={18} color="#1e6e53" /></span>
export function Dashboard() {
  const nav = useNavigate()
  const stats = [['Revenue', '₹12.48L', '+18.2%', IndianRupee], ['Orders', '1,284', '+12.6%', ShoppingBag], ['Customers', '8,642', '+8.4%', Users], ['Avg order value', '₹1,972', '+4.1%', ReceiptIndianRupee]]
  const top = [['Groundnut Oil', '428 units', '₹2.18L'], ['Bilona A2 Cow Ghee', '286 units', '₹1.92L'], ['Little Millet', '214 units', '₹84,520']]
  const cats = [['Cold-pressed oils', 42, '#1e6e53'], ['A2 ghee', 26, '#e8a21a'], ['Millets', 18, '#3b82c4'], ['Herbal care', 14, '#2f9e6b']]
  const act = [['Orders to ship', 18, PackageCheck, '#fff5dc', '#9a6814'], ['Refund requests', 4, RotateCcw, '#fdebeb', '#d64545'], ['Reviews to moderate', 9, MessageSquare, '#eaf3fb', '#3b82c4']]
  const rows = [['#EM10482 · Priya Sharma', '₹3,240', 'Paid', 'Processing', 'Pune, MH'], ['#EM10481 · Arjun Mehta', '₹1,899', 'COD', 'Shipped', 'Indore, MP'], ['#EM10480 · Sneha Iyer', '₹5,460', 'Paid', 'Delivered', 'Bengaluru, KA'], ['#EM10479 · Kabir Singh', '₹2,125', 'Pending', 'Processing', 'Jaipur, RJ']]
  let off = 0
  return <div className="flex flex-col gap-[22px]">
    <div className="flex items-end justify-between"><div className="flex flex-col gap-[5px]"><p className="text-xs text-mute">Dashboard · 28 Sep 2026</p><h1 className="text-[24px] font-semibold text-ink">Namaste, Ananya 👋</h1></div>
      <Btn onClick={() => nav('/orders')}><Plus size={15} />Create order</Btn></div>
    <div className="flex items-center justify-between"><p className="text-sm text-mute">Here’s what’s happening with Earth Mitra today.</p>
      <span className="hidden items-center gap-2 rounded-lg border border-line bg-card px-3 py-[9px] text-xs text-ink sm:flex"><CalendarDays size={15} />1 Sep – 28 Sep 2026<ChevronDown size={13} /></span></div>
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([k, v, t, I]) => (
      <div key={k} className="flex flex-col gap-3.5 rounded-xl border border-line bg-card p-[18px] shadow-[0_6px_20px_rgba(61,42,23,0.05)]">
        <div className="flex items-center justify-between"><span className="text-sm text-mute">{k}</span><span className="grid size-[34px] place-items-center rounded-lg bg-forest-50"><I size={16} color="#1e6e53" /></span></div>
        <p className="text-[28px] font-semibold text-ink">{v}</p><div className="flex items-center gap-[7px]"><Pill bg="#e7f6ef" c="#2f9e6b">{t}</Pill><span className="text-xs text-mute">vs last month</span></div></div>))}</div>
    <div className="grid gap-4 xl:grid-cols-[520px_290px_1fr]">
      <Sec t="Revenue overview" s="Gross sales after discounts" link="View report">
        <div className="flex items-center justify-between pt-4"><div><p className="text-xs text-mute">Net sales</p><p className="text-[22px] font-semibold text-ink">₹12,48,560</p></div><Pill bg="#e7f6ef" c="#2f9e6b">+18.2%</Pill></div>
        <svg viewBox="0 0 300 150" className="h-40 w-full" preserveAspectRatio="none">{[20, 70, 120].map(y => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#ece7df" />)}
          <path d="M5 140 C40 128 60 130 90 108 S130 80 160 72 S215 50 245 38 S280 28 295 22" fill="none" stroke="#1e6e53" strokeWidth="3" /></svg></Sec>
      <Sec t="Top-selling products" s="By net sales">{top.map(([n, u, v]) => <div key={n} className="flex items-center gap-2.5"><Thumb /><div className="flex-1"><p className="text-xs font-semibold text-ink">{n}</p><p className="text-[11px] text-mute">{u}</p></div><b className="text-xs text-ink">{v}</b></div>)}</Sec>
      <Sec t="Sales by category"><div className="flex flex-col items-center gap-3.5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">{cats.map(([n, p, c]) => { const d = <circle key={n} cx="50" cy="50" r="38" fill="none" stroke={c} strokeWidth="14" strokeDasharray={`${p * 2.388 - 2} 239`} strokeDashoffset={-off * 2.388} />; off += p; return d })}</svg>
        <div className="flex w-full flex-col gap-2.5">{cats.map(([n, p, c]) => <div key={n} className="flex items-center gap-2 text-xs"><i className="size-2 rounded-full" style={{ background: c }} /><span className="flex-1 text-mute">{n}</span><b className="text-ink">{p}%</b></div>)}</div></div></Sec>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Sec t="Recent orders" s="Updated just now" link="View all orders">
        <div className="overflow-hidden rounded-xl border border-line"><Table cols={['Order', 'Total', 'Payment', 'Fulfilment', 'Location']} rows={rows} />
          <div className="flex h-12 items-center justify-between border-t border-line px-3.5 text-xs"><span className="text-mute">Showing 1–4 of 128</span><b className="text-forest-600">‹ Previous &nbsp; 1 &nbsp; Next ›</b></div></div></Sec>
      <div className="flex flex-col gap-4">
        <Sec t="Pending actions">{act.map(([l, n, I, bg, c]) => <div key={l} className="flex items-center gap-2.5"><span className="grid size-[34px] place-items-center rounded-lg" style={{ background: bg }}><I size={16} color={c} /></span><span className="flex-1 text-xs text-ink">{l}</span><Pill bg={bg} c={c}>{n}</Pill></div>)}</Sec>
        <Sec t="Low-stock alerts" link="View inventory">{[['Neem Hair Oil · 200ml', 'SKU NHO-200', '4 left'], ['Organic Jaggery · 1kg', 'SKU JAG-1K', '7 left']].map(([n, k, v]) => <div key={n} className="flex items-center gap-2.5"><Thumb /><div className="flex-1"><p className="text-xs font-semibold text-ink">{n}</p><p className="text-[11px] text-mute">{k}</p></div><b className="text-xs text-ink">{v}</b></div>)}</Sec>
      </div></div>
  </div>
}

export function ListPage({ c }) {
  const nav = useNavigate(), [open, setOpen] = useState(false), [tab, setTab] = useState('All')
  const { data } = useListQuery(c.api?.path, { skip: !c.api })
  const live = c.api && (Array.isArray(data) ? data : data?.[c.api.key])
  const all = live?.length ? live.map(c.api.map) : c.rows
  const rows = tab === 'All' ? all : all.filter(r => r.includes(tab))
  const onRow = r => (c.rowTo ? nav(c.rowTo(r)) : c.panel && setOpen(true))
  return <>
    <Head title={c.title} sub={c.sub}>{c.cta && <Btn onClick={() => (c.cta.to ? nav(c.cta.to) : setOpen(true))}><Plus size={16} />{c.cta.label}</Btn>}</Head>
    {c.tabs && <div className="mb-4 flex flex-wrap gap-2">{['All', ...c.tabs].map(t => (
      <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? 'bg-forest-600 text-white' : 'border border-line bg-card text-ink'}`}>{t}</button>))}</div>}
    {c.charts && <Charts />}<Card className={c.charts ? 'mt-5' : ''}><Table cols={c.cols} rows={rows} onRow={c.rowTo || c.panel ? onRow : null} /></Card>
    {c.panel && <Modal open={open} onClose={() => setOpen(false)} title={c.panel.title} side={c.panel.side}>
      <Fields fs={c.panel.fields} /><div className="mt-5 flex justify-end gap-2"><Btn v="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={() => setOpen(false)}>{c.panel.cta}</Btn></div></Modal>}
  </>
}

export function FormPage({ c }) {
  const nav = useNavigate(), [send, { isLoading }] = useSendMutation(), [msg, setMsg] = useState('')
  const submit = async e => {
    e.preventDefault()
    if (!c.api) return
    const { json, ...req } = c.api, fd = new FormData(e.currentTarget)
    const r = await send({ ...req, body: json ? Object.fromEntries(fd) : fd })
    r.data ? nav(-1) : setMsg('Save failed - check the API route and field names')
  }
  return <form onSubmit={submit}>
    <Head title={c.title} sub={c.sub}><Btn type="button" v="ghost" onClick={() => nav(-1)}>Discard</Btn><Btn type="submit" disabled={isLoading}>{c.save || 'Save'}</Btn></Head>
    {msg && <p className="mb-3 text-sm text-red-600">{msg}</p>}
    <div className="space-y-5">{c.sections.map(s => <Card key={s.t} title={s.t}>{s.picker ? <Picker /> : <Fields fs={s.f} />}</Card>)}</div></form>
}

export function Detail({ c }) {
  const [m, setM] = useState(null)
  return <>
    <Head title={c.title} sub={c.sub}>{c.actions.map(a => <Btn key={a.l} v={a.v} onClick={() => setM(a)}>{a.l}</Btn>)}</Head>
    <div className="grid gap-5 lg:grid-cols-3">
      <Card title={c.table.t} className="lg:col-span-2"><Table cols={c.table.cols} rows={c.table.rows} /></Card>
      <Card title="Details"><dl className="space-y-3 text-sm">{c.meta.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-mute">{k}</dt><dd className="text-right text-ink">{v}</dd></div>)}</dl></Card>
    </div>
    <Modal open={!!m} onClose={() => setM(null)} title={m?.l}>
      <p className="mb-4 text-sm text-mute">{m?.text}</p><Fields fs={m?.fields} />
      <div className="mt-5 flex justify-end gap-2"><Btn v="ghost" onClick={() => setM(null)}>Close</Btn><Btn v={m?.v} onClick={() => setM(null)}>Confirm</Btn></div></Modal>
  </>
}

export function Settings() {
  const { tab } = useParams(), c = settings[tab]
  if (!c) return <Navigate to="/settings/general" replace />
  return <>
    <div className="mb-6 flex flex-wrap gap-2">{Object.entries(settings).map(([k, s]) => (
      <NavLink key={k} to={`/settings/${k}`} className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-forest-600 text-white' : 'border border-line bg-card text-ink'}`}>{s.tab}</NavLink>))}</div>
    {c.cols ? <ListPage key={tab} c={c} /> : <FormPage key={tab} c={c} />}
  </>
}

function Picker() {
  const [q, setQ] = useState('')
  const { data } = useListQuery('/products')
  const live = Array.isArray(data) ? data : data?.products
  const items = (live?.length ? live : lists.products.rows.map(r => ({ _id: r[0], name: r[0] }))).filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  return <div><input value={q} onChange={e => setQ(e.target.value)} placeholder="Browse products" className="mb-3 h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink outline-none" />
    <div className="max-h-56 space-y-1 overflow-y-auto">{items.map(p => <label key={p._id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-ink"><input type="checkbox" name="products" value={p._id} className="accent-[#1e6e53]" />{p.name}</label>)}</div></div>
}

function Charts() {
  const rev = [30, 45, 38, 60, 52, 78, 90], ord = [12, 18, 15, 24, 20, 31, 36], top = [['Neem Comb', 92], ['Bamboo Toothbrush Set', 74], ['Jute Tote Bag', 51]]
  const pts = rev.map((v, i) => `${i * 60 + 10},${110 - v}`).join(' ')
  return <div className="grid gap-5 lg:grid-cols-3">
    <Card title="Revenue" className="lg:col-span-2"><svg viewBox="0 0 380 120" className="w-full"><polyline points={pts} fill="none" stroke="#1e6e53" strokeWidth="3" />{rev.map((v, i) => <circle key={i} cx={i * 60 + 10} cy={110 - v} r="4" fill="#1e6e53" />)}</svg></Card>
    <Card title="Top products"><div className="space-y-3">{top.map(([n, v]) => <div key={n} className="text-sm text-ink">{n}<div className="mt-1 h-2 rounded bg-line"><div className="h-2 rounded bg-forest-600" style={{ width: `${v}%` }} /></div></div>)}</div></Card>
    <Card title="Orders per day" className="lg:col-span-3"><div className="flex h-32 items-end gap-3">{ord.map((v, i) => <div key={i} className="flex-1 rounded-t bg-forest-600/70" style={{ height: `${v * 2.6}%` }} />)}</div></Card></div>
}
