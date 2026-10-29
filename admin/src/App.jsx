import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Layout from './Layout.jsx'
import { Login, LiveDashboard, ListPage, FormPage, Detail, Settings } from './pages.jsx'
import { lists, forms, details } from './data.js'
import { setUser, useListQuery } from './store.js'

function AdminGate() {
  const dispatch = useDispatch()
  const knownUser = useSelector(state => state.auth.user)
  const { data: sessionUser, isLoading, error } = useListQuery('/users/me', { skip: knownUser?.role === 'admin' })
  const user = knownUser || sessionUser
  useEffect(() => { if (sessionUser?.role === 'admin') dispatch(setUser(sessionUser)) }, [dispatch, sessionUser])
  if (isLoading) return <div className="grid min-h-screen place-items-center text-sm text-ink">Checking admin session…</div>
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
        {Object.entries(lists).map(([p, c]) => <Route key={p} path={p} element={<ListPage c={c} />} />)}
        {Object.entries(forms).map(([p, c]) => <Route key={p} path={p} element={<FormPage c={c} />} />)}
        <Route path="orders/:id" element={<Detail c={details.order} />} />
        <Route path="customers/:id" element={<Detail c={details.customer} />} />
        <Route path="settings" element={<Navigate to="/settings/general" replace />} />
        <Route path="settings/:tab" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
       </Route>
      </Route>
    </Routes>
  )
}
