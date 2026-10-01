import { useState } from 'react';
import { useOutletContext, Link } from 'react-router';
import { PRODUCTS } from '../data';
import ProductCard from '../components/ProductCard';
const CATEGORIES_FILTER = ['All', 'Atta, Rice & Dal', 'Masala, Oil & More', 'Tea, Coffee & Healthy'];
const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Best Rating', 'Most Reviews'];
export default function ProductsPage() {
    const { addToCart } = useOutletContext();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Featured');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const filtered = PRODUCTS
        .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
        .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
        .sort((a, b) => {
        if (sortBy === 'Price: Low to High')
            return a.price - b.price;
        if (sortBy === 'Price: High to Low')
            return b.price - a.price;
        if (sortBy === 'Best Rating')
            return b.rating - a.rating;
        if (sortBy === 'Most Reviews')
            return b.reviews - a.reviews;
        return 0;
    });
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">All Products</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative h-48 bg-gradient-to-r from-[#2D5A2E] to-[#4A8A4C] flex items-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1612869538502-b5baa439abd7?w=1400&h=400&fit=crop&auto=format" alt="Products banner" className="absolute inset-0 w-full h-full object-cover opacity-30"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            All Products
          </h1>
          <p className="text-white/80 text-sm">Pure, organic, and tested for your health</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm sticky top-24">
              <h3 className="font-bold text-[#2C1A0E] mb-4 text-sm uppercase tracking-wide">Filters</h3>

              {/* Category */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Category</h4>
                <div className="space-y-2">
                  {CATEGORIES_FILTER.map(cat => (<label key={cat} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} className="accent-[#2D5A2E]"/>
                      <span className={`text-sm transition-colors ${selectedCategory === cat ? 'text-[#2D5A2E] font-semibold' : 'text-gray-600 group-hover:text-[#2D5A2E]'}`}>{cat}</span>
                    </label>))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Price Range</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>₹{priceRange[0]}</span>
                  <span>—</span>
                  <span>₹{priceRange[1]}</span>
                </div>
                <input type="range" min={0} max={1000} step={50} value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full accent-[#2D5A2E]"/>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {['Pesticide-free', 'Non-GMO', 'Cold Pressed', 'Organic'].map(tag => (<span key={tag} className="text-xs border border-[#2D5A2E] text-[#2D5A2E] px-2 py-1 rounded-full cursor-pointer hover:bg-[#2D5A2E] hover:text-white transition-colors">
                      {tag}
                    </span>))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-sm text-gray-500">{filtered.length} products found</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2D5A2E] bg-white">
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart}/>))}
            </div>

            {filtered.length === 0 && (<div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🌿</div>
                <p className="font-medium">No products match your filters</p>
                <button onClick={() => { setSelectedCategory('All'); setPriceRange([0, 1000]); }} className="mt-4 text-sm text-[#2D5A2E] underline">Clear filters</button>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
