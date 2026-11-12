import { Skeleton, LoadingRegion } from './Skeleton';
import { useEffect, useRef, useState } from 'react';
import { Camera as Instagram, ChevronLeft, ChevronRight, ExternalLink, Heart, MessageCircle, Play } from 'lucide-react';
import { getInstagramReels } from '../api';

const number = value => value == null ? 'Unavailable' : new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value);
const PLAY_EVENT = 'earth-mitra:instagram-play';

function ReelCard({ reel }) {
  const video = useRef(null);
  const [started, setStarted] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => {
    const pauseOthers = event => { if (event.detail !== video.current) video.current?.pause(); };
    const onHide = () => { if (document.hidden) video.current?.pause(); };
    window.addEventListener(PLAY_EVENT, pauseOthers); document.addEventListener('visibilitychange', onHide);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => { if (!entries[0].isIntersecting) video.current?.pause(); });
    if (video.current) observer?.observe(video.current);
    return () => { window.removeEventListener(PLAY_EVENT, pauseOthers); document.removeEventListener('visibilitychange', onHide); observer?.disconnect(); };
  }, []);
  async function play() {
    if (!video.current || !reel.videoUrl) return;
    setStarted(true); setFailed(false);
    // Assign the signed video URL only after a user requests playback.
    if (!video.current.getAttribute('src')) video.current.src = reel.videoUrl;
    try { await video.current.play(); }
    catch { setFailed(true); }
  }
  return <article data-instagram-reel={reel.id} className="w-[230px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#e7e5dc] bg-white shadow-sm sm:w-[280px]">
    <div className="relative aspect-[9/16] overflow-hidden bg-[#e9ede4]">
      <video ref={video} aria-label={`Instagram Reel ${reel.id}`} preload="none" playsInline controls={started && !failed} poster={started ? reel.thumbnailUrl || undefined : undefined}
        className={`h-full w-full object-cover ${!started || failed ? 'invisible' : ''}`} onPlay={() => window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: video.current }))} onError={() => setFailed(true)} />
      {(!started || failed) && <>{reel.thumbnailUrl ? <img src={reel.thumbnailUrl} alt={reel.caption ? reel.caption.slice(0, 120) : 'Earth Mitra Instagram Reel'} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-[#2D5A2E]"><Instagram size={42} aria-hidden="true" /></div>}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/15 p-4">
          {reel.videoUrl && !failed ? <button type="button" onClick={play} aria-label={`Play Reel ${reel.id}`} className="grid size-16 place-items-center rounded-full bg-white/95 text-[#2D5A2E] shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"><Play className="ml-1" size={28} fill="currentColor" /></button>
            : <>{failed && <p className="rounded-lg bg-black/70 p-2 text-center text-xs text-white">This video could not play here.</p>}{reel.permalink ? <a href={reel.permalink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#2D5A2E]">Watch on Instagram ↗</a> : <p className="rounded-lg bg-white px-4 py-3 text-sm text-gray-700">Video unavailable</p>}</>}
        </div>
      </>}
    </div>
    <div className="space-y-3 p-4">
      <p className="line-clamp-3 min-h-[3.75rem] whitespace-pre-line text-sm leading-5 text-[#2C1A0E]">{reel.caption || 'A moment from Earth Mitra Farmers.'}</p>
      <div className="flex flex-wrap gap-4 text-xs text-gray-600"><span className="inline-flex items-center gap-1" title="Likes"><Heart size={14} />{number(reel.likeCount)}<span className="sr-only"> likes</span></span><span className="inline-flex items-center gap-1" title="Comments"><MessageCircle size={14} />{number(reel.commentCount)}<span className="sr-only"> comments</span></span></div>
      {reel.permalink && <a href={reel.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#2D5A2E] hover:underline">View on Instagram <ExternalLink size={13} /></a>}
    </div>
  </article>;
}

export default function InstagramReels() {
  const section = useRef(null), rail = useRef(null), requestId = useRef(0);
  const [ready, setReady] = useState(false), [loading, setLoading] = useState(false), [reels, setReels] = useState([]);
  const [error, setError] = useState(''), [cursor, setCursor] = useState(null), [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setReady(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { setReady(true); observer.disconnect(); } }, { rootMargin: '500px' });
    observer.observe(section.current); return () => { observer.disconnect(); requestId.current++; };
  }, []);
  async function load(after = null) {
    const id = ++requestId.current; setLoading(true); setError('');
    try {
      const result = await getInstagramReels({ limit: 6, after });
      if (id !== requestId.current) return;
      setReels(current => { const merged = after ? [...current, ...result.reels] : result.reels; return [...new Map(merged.map(reel => [reel.id, reel])).values()]; });
      setCursor(result.paging.nextCursor); setLoaded(true);
    } catch (e) { if (id === requestId.current) setError(e.message || 'Instagram Reels are unavailable right now.'); }
    finally { if (id === requestId.current) setLoading(false); }
  }
  useEffect(() => { if (ready) load(); }, [ready]);
  return <section ref={section} aria-label="Earth Mitra Instagram Reels" data-instagram-section className="relative overflow-hidden bg-[#FAFAF7] py-12 sm:py-14">
    <div className="mx-auto max-w-[1680px] px-5 lg:px-10">
      <div className="relative mb-7 flex flex-col gap-4"><div className="w-full text-center lg:px-28"><p className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2D5A2E]"><Instagram size={16} />@earth_mitra</p><h2 className="font-display text-2xl font-bold text-[#2C1A0E] sm:text-3xl">From our farms, on film</h2><p className="mt-2 text-sm text-gray-600">Meet the people, produce and everyday moments behind Earth Mitra.</p></div></div>
      <div className="group/reels relative">
        <div ref={rail} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {reels.map(reel => <ReelCard key={reel.id} reel={reel} />)}
          {(!ready || (loading && !reels.length)) && <LoadingRegion label="Loading Instagram Reels…"><div className="flex gap-5">{[0, 1, 2].map(i => <Skeleton key={i} className="aspect-[9/16] w-[230px] shrink-0 rounded-2xl sm:w-[280px]" />)}</div></LoadingRegion>}
        </div>
        {reels.length > 0 && <>
          <button type="button" aria-label="Previous Reels" onClick={() => rail.current?.scrollBy({ left: -310, behavior: 'smooth' })} className="instagram-reel-arrow pointer-events-none absolute left-2 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-[#d6ddcf] bg-white/95 text-[#2D5A2E] opacity-0 shadow-md transition-opacity duration-200 group-hover/reels:pointer-events-auto group-hover/reels:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D5A2E]"><ChevronLeft size={22} /></button>
          <button type="button" aria-label="Next Reels" onClick={() => rail.current?.scrollBy({ left: 310, behavior: 'smooth' })} className="instagram-reel-arrow pointer-events-none absolute right-2 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-[#d6ddcf] bg-white/95 text-[#2D5A2E] opacity-0 shadow-md transition-opacity duration-200 group-hover/reels:pointer-events-auto group-hover/reels:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D5A2E]"><ChevronRight size={22} /></button>
        </>}
      </div>
      {loaded && !reels.length && !loading && !error && <p className="rounded-xl border border-[#e0e5d8] bg-white p-6 text-sm text-gray-600">No Reels in these recent posts.{cursor ? ' Check more posts below.' : ' Visit our Instagram for the latest updates.'}</p>}
      {error && <div role="alert" className="rounded-xl border border-[#e0e5d8] bg-white p-5 text-sm text-gray-600"><p>{error}</p><button type="button" disabled={loading} onClick={() => load(reels.length ? cursor : null)} className="mt-2 font-semibold text-[#2D5A2E] underline">Try again</button></div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><a href="https://www.instagram.com/earth_mitra/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#2D5A2E] hover:underline">Follow @earth_mitra ↗</a>{cursor && <button type="button" disabled={loading} onClick={() => load(cursor)} className="rounded-full border border-[#2D5A2E] px-5 py-2 text-sm font-semibold text-[#2D5A2E] disabled:opacity-50">{loading ? 'Loading…' : 'More Reels'}</button>}</div>
    </div>
  </section>;
}
