import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Layout from './Layout.jsx'
import { Login, LiveDashboard, ListPage, FormPage, Detail, OrderDetail, Settings } from './pages.jsx'
import { lists, forms, details } from './data.js'
import { setUser, useListQuery } from './store.js'
import { ManagedCatalog } from './CatalogPages.jsx'
import { Loading } from './ui.jsx'
import { BillingPage, ShippingSettingsPage } from './ShippingPages.jsx'
import InstagramSettings from './InstagramSettings.jsx'
import InstagramAnalytics from './InstagramAnalytics.jsx'

function AdminGate() {
  const dispatch = useDispatch()
  const knownUser = useSelector(state => state.auth.user)
  const { data: sessionUser, isLoading, error } = useListQuery('/users/me', { skip: knownUser?.role === 'admin' })
  const user = knownUser || sessionUser
  useEffect(() => { if (sessionUser?.role === 'admin') dispatch(setUser(sessionUser)) }, [dispatch, sessionUser])
  if (isLoading) return <div className="grid min-h-screen place-items-center"><Loading label="Checking admin session…" /></div>
  if (error || user?.role !== 'admin') return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminGate />}>
       <Route element={<Layout />}>
        <Route index element={<LiveDashboard />} />
        <Route path="products" element={<ManagedCatalog kind="products" />} />
        <Route path="collections" element={<ManagedCatalog kind="collections" />} />
        <Route path="blogs" element={<ManagedCatalog kind="blogs" />} />
        <Route path="recipes" element={<ManagedCatalog kind="recipes" />} />
        <Route path="banners" element={<ManagedCatalog kind="banners" />} />
        {Object.entries(lists).filter(([p]) => !['products', 'collections', 'banners'].includes(p)).map(([p, c]) => <Route key={p} path={p} element={<ListPage c={c} />} />)}
        {Object.entries(forms).map(([p, c]) => <Route key={p} path={p} element={<FormPage c={c} />} />)}
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings/shipping" element={<ShippingSettingsPage />} />
        <Route path="settings/instagram" element={<InstagramSettings />} />
        <Route path="instagram" element={<InstagramAnalytics />} />
        <Route path="customers/:id" element={<Detail c={details.customer} />} />
        <Route path="settings" element={<Navigate to="/settings/general" replace />} />
        <Route path="settings/:tab" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
       </Route>
      </Route>
    </Routes>
  )
}
