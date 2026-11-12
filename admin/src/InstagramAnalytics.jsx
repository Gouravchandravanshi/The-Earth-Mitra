import { useState } from 'react'
import { Instagram, RefreshCw } from 'lucide-react'
import { useListQuery, useSendMutation } from './store.js'
import { Badge, Btn, Card, Head, Loading } from './ui.jsx'

const metricText = value => value == null ? 'Unavailable' : Number(value).toLocaleString('en-IN')
function ReelAnalytics({ reel }) {
  const [enabled, setEnabled] = useState(false)
  const { data, isFetching, error, refetch } = useListQuery(`/instagram/reels/${reel.id}/insights`, { skip: !enabled })
  return <div className="rounded-xl border border-line p-4">
    <div className="flex gap-3">{reel.thumbnailUrl && <img src={reel.thumbnailUrl} alt="Reel thumbnail" loading="lazy" className="h-24 w-16 shrink-0 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold">{reel.caption || `Reel ${reel.id}`}</p><p className="mt-1 text-xs text-mute">{reel.timestamp ? new Date(reel.timestamp).toLocaleDateString() : 'Date unavailable'} · {reel.id}</p>{reel.permalink && <a className="mt-2 inline-block text-xs font-semibold text-forest-600 underline" href={reel.permalink} target="_blank" rel="noopener noreferrer">View on Instagram ↗</a>}</div></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{[['Likes', reel.likeCount], ['Comments', reel.commentCount], ...['views', 'reach', 'shares', 'saves'].map(key => [key, data?.metrics[key]?.available ? data.metrics[key].value : null])].map(([label, value]) => <div key={label} className="rounded-lg bg-bg p-3"><dt className="text-xs capitalize text-mute">{label}</dt><dd className="mt-1 text-sm font-semibold">{!enabled && !['Likes', 'Comments'].includes(label) ? 'Not fetched' : metricText(value)}</dd></div>)}</dl>
    <Btn v="ghost" className="mt-4" disabled={isFetching} onClick={() => enabled ? refetch() : setEnabled(true)}>{isFetching ? 'Fetching insights…' : enabled ? 'Check insights again' : 'Load private insights'}</Btn>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error.data?.message || 'Could not load insights.'}{error.data?.metaCode != null && ` (Meta code ${error.data.metaCode})`}</p>}
    {data && Object.entries(data.metrics).filter(([, value]) => !value.available).map(([key, value]) => <p key={key} className="mt-2 text-xs text-mute"><span className="capitalize">{key}</span>: {value.reason}{value.metaCode != null && ` (Meta code ${value.metaCode})`}{value.requiredPermissions?.length ? ` Required: ${value.requiredPermissions.join(', ')}` : ''}</p>)}
  </div>
}

export default function InstagramAnalytics() {
  const status = useListQuery('/instagram/status')
  const [send] = useSendMutation(), [reels, setReels] = useState([]), [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(false), [loaded, setLoaded] = useState(false), [error, setError] = useState(''), [fetchedAt, setFetchedAt] = useState('')
  async function load(after = null) {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ limit: '6' }); if (after) params.set('after', after)
      const data = await send({ url: `/instagram/reels?${params}`, method: 'GET' }).unwrap()
      setReels(current => [...new Map((after ? [...current, ...data.reels] : data.reels).map(reel => [reel.id, reel])).values()])
      setCursor(data.paging.nextCursor); setFetchedAt(data.fetchedAt); setLoaded(true)
    } catch (e) { setError(e.data?.message || 'Could not load Reels.') }
    finally { setLoading(false) }
  }
  return <div className="space-y-5"><Head title="Instagram Reels & analytics" sub="Your own account’s Reels, with private insights available only to admins."><Btn v="ghost" disabled={status.isFetching} onClick={() => status.refetch()}><RefreshCw size={16} />Check connection</Btn></Head>
    <Card title="Account connection">{status.isLoading ? <Loading /> : <div className="space-y-3 text-sm"><p className="flex items-center gap-2"><Instagram size={18} /><Badge>{status.data?.connected ? 'Connected' : 'Unavailable'}</Badge></p>{status.data && <p>@{status.data.account.username} · {status.data.account.id} · {status.data.apiVersion}</p>}{status.error && <p role="alert" className="text-red-700">{status.error.data?.message || 'The Instagram connection check failed.'}{status.error.data?.metaCode != null && ` (Meta code ${status.error.data.metaCode})`}</p>}<p className="text-xs text-mute">Account token comes from the backend environment. This integration does not sign website customers into Instagram.</p></div>}</Card>
    <div className="grid gap-4 sm:grid-cols-3"><Card title="Fetched Reels"><p className="text-2xl font-semibold">{reels.length}</p><p className="mt-1 text-xs text-mute">Loaded here, not your account’s total</p></Card><Card title="Data refreshed"><p className="text-sm">{fetchedAt ? new Date(fetchedAt).toLocaleString() : 'Not fetched'}</p><p className="mt-1 text-xs text-mute">Server cache: 30 minutes</p></Card><Card title="Missing metrics"><p className="text-sm">Unavailable ≠ zero</p><p className="mt-1 text-xs text-mute">Meta permissions and media support determine availability.</p></Card></div>
    <Card title="Reels"><div className="mb-4 flex flex-wrap gap-2"><Btn disabled={loading || !status.data?.connected} onClick={() => load()}>{loading ? 'Loading…' : loaded ? 'Reload Reels' : 'Load Reels'}</Btn>{cursor && <Btn v="ghost" disabled={loading} onClick={() => load(cursor)}>Load more</Btn>}</div>{error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}{loaded && !reels.length && <p className="text-sm text-mute">No Reels in these recent posts.{cursor ? ' Load more to check older posts.' : ''}</p>}<div className="space-y-4">{reels.map(reel => <ReelAnalytics key={reel.id} reel={reel} />)}</div></Card>
  </div>
}
