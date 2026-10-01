import { X } from 'lucide-react'
const tone = s => /^(active|paid|delivered|published|approved|completed|in stock)/i.test(s) ? 'bg-[#e7f6ef] text-[#2f9e6b]'
  : /^(pending|draft|open|low|scheduled)/i.test(s) ? 'bg-[#fff5dc] text-[#9a6814]'
  : /^(shipped|processing)/i.test(s) ? 'bg-[#eaf3fb] text-[#3b82c4]'
  : /^(cancel|failed|out|rejected|hidden|refund)/i.test(s) ? 'bg-[#fdebeb] text-[#d64545]' : null
export const Badge = ({ children }) => { const t = tone(String(children)); return t ? <span className={`inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-xs font-medium ${t}`}><i className="size-1.5 rounded-full bg-current" />{children}</span> : children }
export const Btn = ({ v = 'solid', className = '', ...p }) => (
  <button className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${v === 'solid' ? 'bg-forest-600 text-white hover:bg-forest-700' : v === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-line bg-card text-ink'} ${className}`} {...p} />)
export const Head = ({ title, sub, children }) => (
  <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-[24px] font-semibold text-ink">{title}</h1>{sub && <p className="text-sm text-mute">{sub}</p>}</div><div className="flex gap-2">{children}</div></div>)
export const Card = ({ title, children, className = '' }) => (
  <section className={`overflow-hidden rounded-xl border border-line bg-card shadow-[0_6px_10px_rgba(61,42,23,0.05)] ${className}`}>{title && <h3 className="px-5 pt-5 text-lg font-semibold text-ink">{title}</h3>}<div className={title ? 'p-5 pt-4' : ''}>{children}</div></section>)
export const Field = ({ l, t = 'text', o, span, n }) => {
  const c = 'w-full rounded-lg border border-line bg-card px-3 text-sm text-ink outline-none focus:border-forest-600'
  return <label className={`block ${span ? 'col-span-2' : ''}`}>
    {t === 'check' ? <span className="flex items-center gap-2 text-sm text-ink"><input name={n || l} type="checkbox" className="accent-[#1e6e53]" />{l}</span> : <>
      <span className="mb-2 block text-xs font-semibold text-ink">{l}</span>
      {t === 'select' ? <select name={n || l} className={`${c} h-[42px]`}>{o.map(x => <option key={x}>{x}</option>)}</select>
        : t === 'area' ? <textarea name={n || l} rows={4} className={`${c} py-2`} /> : <input name={n || l} type={t} className={`${c} h-[42px]`} />}</>}
  </label>
}
export const Fields = ({ fs = [] }) => <div className="grid grid-cols-2 gap-4">{fs.map(f => <Field key={f.l} {...f} />)}</div>
export const Modal = ({ open, onClose, title, side, children }) => open && (
  <div className="fixed inset-0 z-50 flex bg-black/40" onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className={side ? 'ml-auto h-full w-[420px] max-w-full overflow-y-auto bg-card p-6' : 'm-auto w-[480px] max-w-[92%] rounded-2xl bg-card p-6'}>
      <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-ink">{title}</h3><button onClick={onClose}><X size={18} className="text-mute" /></button></div>{children}
    </div></div>)
export const Table = ({ cols, rows, onRow }) => (<>
  <div className="space-y-3 p-3 md:hidden">{rows.map((r, i) => (
    <div key={i} onClick={() => onRow?.(r)} className="rounded-xl border border-line p-3 text-sm"><div className="font-medium text-ink">{r[0]}</div>
      {r.slice(1).map((x, j) => <div key={j} className="mt-1 flex justify-between gap-3"><span className="text-mute">{cols[j + 1]}</span><span className="text-right text-ink"><Badge>{x}</Badge></span></div>)}</div>))}</div>
  <div className="hidden overflow-x-auto md:block"><table className="w-full text-xs"><thead><tr>{cols.map(c => <th key={c} className="h-[42px] bg-head px-[14px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-mute">{c}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} onClick={() => onRow?.(r)} className={`border-t border-line ${onRow ? 'cursor-pointer hover:bg-forest-50/10' : ''}`}>{r.map((x, j) => <td key={j} className="whitespace-nowrap px-[14px] py-3 text-xs text-ink"><Badge>{x}</Badge></td>)}</tr>)}</tbody></table></div></>)
