import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout.jsx'
import { Login, Dashboard, ListPage, FormPage, Detail, Settings } from './pages.jsx'
import { lists, forms, details } from './data.js'
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        {Object.entries(lists).map(([p, c]) => <Route key={p} path={p} element={<ListPage c={c} />} />)}
        {Object.entries(forms).map(([p, c]) => <Route key={p} path={p} element={<FormPage c={c} />} />)}
        <Route path="orders/:id" element={<Detail c={details.order} />} />
        <Route path="customers/:id" element={<Detail c={details.customer} />} />
        <Route path="settings" element={<Navigate to="/settings/general" replace />} />
        <Route path="settings/:tab" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
