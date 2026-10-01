import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Layers, ShoppingBag, Menu, Moon, Sun, Leaf } from 'lucide-react'
const groups = [['SALES', [['Orders', '/orders'], ['Returns & Refunds', '/returns'], ['Payments', '/payments'], ['Customers', '/customers']]],
  ['CATALOG', [['Products', '/products'], ['Collections', '/collections'], ['Categories', '/categories'], ['Inventory', '/inventory'], ['Reviews', '/reviews']]],
  ['MARKETING', [['Coupons', '/coupons'], ['Banners & Homepage', '/banners']]], ['INSIGHTS', [['Analytics', '/analytics']]],
  ['SETTINGS', [['General', '/settings/general'], ['Shipping & Tax', '/settings/shipping'], ['Team & Roles', '/settings/team'], ['Activity Log', '/settings/activity']]]]
export default function Layout() {
  const [open, setOpen] = useState(false), [dark, setDark] = useState(false)
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  return (
    <div className="min-h-screen bg-bg text-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col gap-[18px] overflow-y-auto border-r border-line bg-card px-4 pb-[18px] pt-[22px] transition-transform lg:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2.5 px-2"><span className="grid size-9 place-items-center rounded-[10px] bg-forest-600"><Leaf size={20} color="#fff" /></span><b className="text-lg text-ink">Earth Mitra Admin</b></div>
        <div className="flex flex-col gap-3">
          <NavLink to="/" end onClick={() => setOpen(false)} className={({ isActive }) => `flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs ${isActive ? 'border-l-[3px] border-forest-600 bg-forest-50 font-semibold text-forest-600' : 'text-mute'}`}><LayoutDashboard size={15} />Dashboard</NavLink>
          <div onClick={() => setOpen(false)} className="space-y-3 text-[11px] leading-[1.75] text-mute">{groups.map(([g, items]) => (
            <div key={g}><p>{g}</p><p>{items.map(([l, to], i) => <span key={to}>{i > 0 && ' · '}<NavLink to={to} className={({ isActive }) => (isActive ? 'font-semibold text-forest-600' : 'hover:text-ink')}>{l}</NavLink></span>)}</p></div>))}</div>
        </div>
        <p className="text-[11px] font-semibold text-ink">earthmitra.in · Live store</p>
      </aside>
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-line bg-card px-4 lg:px-7">
          <button className="lg:hidden" onClick={() => setOpen(!open)}><Menu /></button>
          <div className="hidden h-10 w-[420px] max-w-full items-center rounded-lg border border-line bg-bg px-3 text-sm text-[#a99c8e] sm:flex"><span className="flex-1">⌕  Search orders, products, customers…</span><span>⌘ K</span></div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm font-medium text-forest-600 sm:block">View store ↗</span>
            <button onClick={() => setDark(!dark)} className="text-mute">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <span className="grid size-[34px] place-items-center rounded-full bg-forest-50 text-[11px] font-bold text-forest-600">AR</span>
            <span className="hidden text-xs font-semibold text-ink sm:block">Ananya Rao ⌄</span>
          </div>
        </header>
        <main className="p-4 pb-24 lg:px-8 lg:pb-9 lg:pt-[26px]"><Outlet /></main>
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card lg:hidden">{[['/', 'Home', LayoutDashboard], ['/orders', 'Orders', ShoppingBag], ['/products', 'Products', Package], ['/collections', 'Collections', Layers]].map(([to, l, I]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${isActive ? 'text-forest-600' : 'text-mute'}`}><I size={18} />{l}</NavLink>))}
          <button onClick={() => setOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-mute"><Menu size={18} />More</button></nav>
      </div>
    </div>)
}
