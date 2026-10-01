import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { BLOGS } from '../data';
const BLOG_CATEGORIES = ['All', 'Recipes', 'Brand Story', 'Education', 'Festivals'];
export function BlogsListPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const filtered = BLOGS.filter(b => activeCategory === 'All' || b.category === activeCategory);
    const featured = BLOGS[0];
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">Blogs & Recipes</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-56 bg-[#2D5A2E] overflow-hidden flex items-center">
        <img src="https://images.unsplash.com/photo-1641301553499-9a0ff924fcb5?w=1400&h=400&fit=crop&auto=format" alt="Blogs banner" className="absolute inset-0 w-full h-full object-cover opacity-25"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Blogs & Recipes
          </h1>
          <p className="text-white/80 text-sm">Stories, tips, and kitchen inspiration from our organic world</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {/* Category Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide mb-10 pb-2">
          {BLOG_CATEGORIES.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat
                ? 'bg-[#2D5A2E] text-white shadow-md'
                : 'border border-gray-200 text-gray-600 hover:border-[#2D5A2E] hover:text-[#2D5A2E]'}`}>
              {cat}
            </button>))}
        </div>

        {/* Featured Post */}
        {activeCategory === 'All' && (<Link to={`/blogs/${featured.slug}`} className="block mb-10 group">
            <div className="grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="overflow-hidden">
                <img src={featured.img} alt={featured.title} className="w-full h-72 lg:h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
              </div>
              <div className="p-8 flex flex-col justify-center bg-[#FAFAF7]">
                <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-widest mb-2">Featured · {featured.category}</span>
                <h2 className="text-xl lg:text-2xl font-bold text-[#2C1A0E] mb-3 leading-snug" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {featured.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span>{featured.readTime}</span>
                </div>
              </div>
            </div>
          </Link>)}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeCategory === 'All' ? filtered.slice(1) : filtered).map(blog => (<Link key={blog.id} to={`/blogs/${blog.slug}`} className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="overflow-hidden">
                <img src={blog.img} alt={blog.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"/>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-wide mb-1">{blog.category}</span>
                <h3 className="text-sm font-bold text-[#2C1A0E] mb-2 leading-snug group-hover:text-[#2D5A2E] transition-colors line-clamp-2">{blog.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">{blog.excerpt}</p>
                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <span>{blog.date}</span>
                  <span className="text-[#2D5A2E] font-semibold group-hover:underline">{blog.readTime} →</span>
                </div>
              </div>
            </Link>))}
        </div>

        {filtered.length === 0 && (<div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📖</div>
            <p>No posts in this category yet</p>
          </div>)}
      </div>
    </div>);
}
export function BlogDetailPage() {
    const { slug } = useParams();
    const blog = BLOGS.find(b => b.slug === slug);
    const related = BLOGS.filter(b => b.slug !== slug).slice(0, 3);
    if (!blog)
        return (<div className="min-h-screen flex items-center justify-center flex-col gap-4 text-gray-400">
      <div className="text-5xl">📖</div>
      <p>Article not found</p>
      <Link to="/blogs" className="text-[#2D5A2E] underline text-sm">Back to blogs</Link>
    </div>);
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <Link to="/blogs" className="hover:text-[#2D5A2E]">Blogs</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium line-clamp-1">{blog.title}</span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="w-full h-72 lg:h-96 overflow-hidden">
        <img src={blog.img} alt={blog.title} className="w-full h-full object-cover"/>
      </div>

      {/* Article */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10">
        <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-widest">{blog.category}</span>
        <h1 className="text-2xl lg:text-4xl font-bold text-[#2C1A0E] mt-3 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          {blog.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
          <span>{blog.date}</span>
          <span>·</span>
          <span>{blog.readTime}</span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
          <p className="text-base leading-relaxed">{blog.excerpt}</p>
          <p>Organic Tattva has been committed to bringing the purest, most wholesome food products to Indian households since its inception. Every product undergoes rigorous testing for over 250 pesticides and harmful chemicals before it reaches your doorstep.</p>
          <h2 className="text-xl font-bold text-[#2C1A0E] mt-8 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Why Organic Matters
          </h2>
          <p>Organic farming preserves biodiversity, protects soil health, and ensures that the food we eat is free from synthetic chemicals. By choosing organic, you're not just making a healthier choice for yourself — you're supporting sustainable farming practices that benefit the entire ecosystem.</p>
          <p>Our farmers follow strict organic certification protocols, which means no synthetic pesticides, no GMO seeds, and no artificial fertilizers. The result is food that is genuinely good for you and the planet.</p>
          <h2 className="text-xl font-bold text-[#2C1A0E] mt-8 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            The Organic Tattva Promise
          </h2>
          <p>Every pack of Organic Tattva product comes with a unique QR code that lets you trace the product's journey from farm to your plate. Scan the code to view the test reports, farm details, and certification documents. Transparency is at the heart of everything we do.</p>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100 flex items-center gap-4">
          <span className="text-sm text-gray-500">Share:</span>
          {['Facebook', 'Twitter', 'WhatsApp'].map(s => (<a key={s} href="#" className="text-xs border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:border-[#2D5A2E] hover:text-[#2D5A2E] transition-colors">{s}</a>))}
        </div>
      </div>

      {/* Related */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-[#2C1A0E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map(b => (<Link key={b.id} to={`/blogs/${b.slug}`} className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="overflow-hidden">
                <img src={b.img} alt={b.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"/>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-wide mb-1">{b.category}</span>
                <h3 className="text-sm font-bold text-[#2C1A0E] group-hover:text-[#2D5A2E] transition-colors line-clamp-2">{b.title}</h3>
              </div>
            </Link>))}
        </div>
      </div>
    </div>);
}
