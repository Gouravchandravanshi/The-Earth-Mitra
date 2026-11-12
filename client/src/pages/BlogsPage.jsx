import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getContent, getContentList } from '../api';
import { ContentGridSkeleton, ArticleSkeleton } from '../components/Skeleton';

const dateLabel = date => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const postPath = post => `/${post.type === 'recipe' ? 'recipes' : 'blogs'}/${post.slug}`;

export function BlogsListPage() {
    const [posts, setPosts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        Promise.all([getContentList('blog'), getContentList('recipe')])
            .then(([blogs, recipes]) => { if (active) setPosts([...blogs, ...recipes].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))); })
            .catch(reason => { if (active) setError(reason.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);
    const categories = useMemo(() => ['All', 'Recipes', ...new Set(posts.filter(post => post.type === 'blog' && post.category).map(post => post.category))], [posts]);
    const filtered = posts.filter(post => activeCategory === 'All' || (activeCategory === 'Recipes' ? post.type === 'recipe' : post.category === activeCategory));
    const featured = activeCategory === 'All' ? filtered.find(post => post.type === 'blog') : null;
    const cards = featured ? filtered.filter(post => post._id !== featured._id) : filtered;
    return <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-[#FAFAF7]"><div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 text-xs text-gray-500 lg:px-8"><Link to="/">Home</Link><span>›</span><span className="font-medium text-[#2C1A0E]">Blogs & Recipes</span></div></div>
      <header className="bg-[#2D5A2E] px-4 py-14 text-center text-white"><h1 className="font-display text-3xl font-bold lg:text-4xl">Blogs & Recipes</h1><p className="mt-2 text-sm text-white/80">Stories, ideas, and recipes from Earth Mitra</p></header>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">{categories.map(category => <button key={category} onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold ${activeCategory === category ? 'bg-[#2D5A2E] text-white' : 'border border-gray-200 text-gray-600'}`}>{category}</button>)}</div>
        {loading && <ContentGridSkeleton featured />}
        {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">Unable to load blogs and recipes: {error}</p>}
        {!loading && !error && featured && <Link to={postPath(featured)} className="group mb-10 grid overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFAF7] shadow-sm transition hover:shadow-lg lg:grid-cols-2"><div className="h-64 bg-[#F5F1EB] lg:h-80">{featured.coverImage && <img src={featured.coverImage} alt={featured.title} className="h-full w-full object-cover transition group-hover:scale-[1.02]"/>}</div><div className="flex flex-col justify-center p-7 lg:p-10"><span className="text-xs font-semibold uppercase tracking-widest text-[#C8952A]">Featured · {featured.category || 'Story'}</span><h2 className="mt-3 font-display text-2xl font-bold text-[#2C1A0E]">{featured.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{featured.excerpt}</p><span className="mt-5 text-xs text-gray-500">{dateLabel(featured.publishedAt)} · {featured.readTime} min read</span></div></Link>}
        {!loading && !error && cards.length === 0 && !featured && <p className="py-16 text-center text-sm text-gray-500">No published posts here yet.</p>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{!loading && cards.map(post => <Link key={post._id} to={postPath(post)} className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md"><div className="h-48 bg-[#F5F1EB]">{post.coverImage && <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition group-hover:scale-105"/>}</div><div className="flex flex-1 flex-col p-5"><span className="text-xs font-semibold uppercase tracking-wide text-[#C8952A]">{post.type === 'recipe' ? 'Recipe' : post.category || 'Blog'}</span><h2 className="mt-2 line-clamp-2 text-base font-bold text-[#2C1A0E] group-hover:text-[#2D5A2E]">{post.title}</h2><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">{post.excerpt}</p><span className="mt-4 text-xs text-gray-500">{dateLabel(post.publishedAt)} · {post.readTime} min read</span></div></Link>)}</div>
      </main>
    </div>;
}

export function BlogDetailPage() {
    const { slug } = useParams();
    const isRecipe = useLocation().pathname.startsWith('/recipes/');
    const type = isRecipe ? 'recipe' : 'blog';
    const [post, setPost] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([getContent(type, slug), getContentList(type)])
            .then(([result, list]) => { if (active) { setPost(result); setRelated(list.filter(item => item.slug !== slug).slice(0, 3)); } })
            .catch(reason => { if (active) setError(reason.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [slug, type]);
    if (loading) return <ArticleSkeleton />;
    if (error || !post) return <div className="grid min-h-[50vh] place-items-center px-5 text-center"><div><p className="mb-4 text-gray-500">{error ? `Unable to load article: ${error}` : 'Article not found'}</p><Link to="/blogs" className="font-semibold text-[#2D5A2E] underline">Back to blogs</Link></div></div>;
    return <article className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-[#FAFAF7]"><div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 text-xs text-gray-500 lg:px-8"><Link to="/">Home</Link><span>›</span><Link to="/blogs">Blogs</Link><span>›</span><span className="line-clamp-1 font-medium text-[#2C1A0E]">{post.title}</span></div></div>
      <div className="h-64 bg-[#F5F1EB] lg:h-96">{post.coverImage && <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover"/>}</div>
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-8"><span className="text-xs font-semibold uppercase tracking-widest text-[#C8952A]">{type === 'recipe' ? 'Recipe' : post.category || 'Blog'}</span><h1 className="mt-3 font-display text-3xl font-bold text-[#2C1A0E] lg:text-4xl">{post.title}</h1><div className="mt-4 border-b border-gray-100 pb-6 text-sm text-gray-500">{post.author} · {dateLabel(post.publishedAt)} · {post.readTime} min read</div><p className="mt-7 text-lg leading-8 text-gray-700">{post.excerpt}</p><div className="mt-6 whitespace-pre-wrap text-base leading-8 text-gray-700">{post.content}</div>{post.tags?.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{post.tags.map(tag => <span key={tag} className="rounded-full bg-[#F5F1EB] px-3 py-1 text-xs text-gray-600">{tag}</span>)}</div>}</main>
      {related.length > 0 && <aside className="mx-auto max-w-7xl border-t border-gray-100 px-4 py-10 lg:px-8"><h2 className="mb-6 font-display text-2xl font-bold">More {type === 'recipe' ? 'recipes' : 'stories'}</h2><div className="grid gap-5 md:grid-cols-3">{related.map(item => <Link key={item._id} to={postPath(item)} className="rounded-xl border border-gray-100 p-5 hover:shadow-md"><h3 className="font-semibold text-[#2C1A0E]">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm text-gray-500">{item.excerpt}</p></Link>)}</div></aside>}
    </article>;
}
