import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, RefreshCw } from 'lucide-react'
import { useListQuery, useSendMutation } from './store.js'
import { Badge, Btn, Card, Head, Loading } from './ui.jsx'

export default function InstagramSettings() {
  const { data, isLoading, isFetching, error, refetch } = useListQuery('/auth/instagram/status')
  const [send, { isLoading: saving }] = useSendMutation()
  const [message, setMessage] = useState('')
  if (isLoading) return <Loading label="Checking Instagram connection…" />
  let publicOrigin = ''
  try { const url = new URL(data?.redirectUri); if (url.protocol === 'https:') publicOrigin = url.origin } catch { /* Incomplete configuration is displayed below. */ }
  const correctOrigin = publicOrigin === window.location.origin
  async function connect() {
    setMessage('')
    try {
      const result = await send({ url: '/auth/instagram/connect', body: { origin: window.location.origin } }).unwrap()
      const url = new URL(result.authorizationUrl)
      if (url.origin !== 'https://www.facebook.com') throw new Error('Invalid authorization URL.')
      window.location.assign(url.toString())
    } catch (e) { setMessage(e.data?.message || e.message || 'Could not start Instagram authorization.') }
  }
  return <div className="max-w-3xl space-y-5">
    <Head title="Instagram" sub="Connect the store’s Instagram account through your Meta Unified Login configuration."><Btn v="ghost" onClick={refetch} disabled={isFetching}><RefreshCw size={16} />Refresh</Btn></Head>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error.data?.message || 'Unable to load Instagram settings.'}</p>}
    <Card title="Connection"><div className="space-y-4 text-sm">
      <p>Status: <Badge>{data?.connected ? 'Connected' : data?.expired ? 'Expired' : 'Not connected'}</Badge></p>
      {data?.connection && <p className="text-mute">Authorized {new Date(data.connection.connectedAt).toLocaleString()}{data.connection.expiresAt ? ` · Token expires ${new Date(data.connection.expiresAt).toLocaleString()}` : ' · Meta did not return an expiry time'}</p>}
      {data?.configurationError && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{data.configurationError}</p>}
      {publicOrigin && !correctOrigin && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Connect from the public domain so the authorization can return to this browser. <a href={`${publicOrigin}/admin/settings/instagram`} className="font-semibold underline">Open public admin</a> and sign in there.</p>}
      <div className="flex flex-wrap gap-2"><Btn disabled={!data?.configured || !correctOrigin || saving} onClick={connect}><Instagram size={17} />{saving ? 'Opening…' : data?.connected ? 'Reconnect Instagram' : 'Connect Instagram'}</Btn>{data?.connection && <Btn v="ghost" disabled={saving} onClick={async () => { if (!window.confirm('Remove the Instagram token stored by this website? This does not revoke the app in Meta.')) return; try { const result = await send({ url: '/auth/instagram/connection', method: 'DELETE' }).unwrap(); setMessage(result.message); refetch() } catch (e) { setMessage(e.data?.message || 'Could not remove the connection.') } }}>Remove saved connection</Btn>}</div>
      <p className="text-xs text-mute">This page manages the optional saved OAuth connection. The Reels integration uses the account token configured separately on the backend. <Link to="/instagram" className="font-semibold underline">Open Reels and analytics</Link> to check that connection and view supported statistics.</p>
      {message && <p role="status" className="rounded-lg bg-bg p-3">{message}</p>}
    </div></Card>
    <Card title="Meta redirect URL"><div className="space-y-3 text-sm"><p>Save this exact URL in Meta → Instagram API → API setup with Unified login → Register a new redirect URL.</p><code className="block break-all rounded-lg bg-bg p-3">{data?.redirectUri || 'Set INSTAGRAM_REDIRECT_URI in server/.env'}</code><p className="text-xs text-mute">Do not add a trailing slash. Start authorization with the Connect Instagram button above, so the backend can validate the return request.</p><p className="text-xs text-mute">Use your Meta App ID, App Secret and Unified Login Configuration ID in server/.env. Configure the permissions required for your Instagram insights in Meta’s login configuration.</p></div></Card>
  </div>
}
