import { useEffect, useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router';
import { getCategories, getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import { PDF_CATEGORIES } from '../data/categories';
const CATEGORIES_FILTER = ['All', ...PDF_CATEGORIES.map(category => category.name)];
const normalizeCategory = value => value.toLowerCase().replace(/sweetners/g, 'sweeteners').replace(/soji|suji/g, 'sooji').replace(/[^a-z0-9]/g, '');
const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Best Rating', 'Most Reviews'];
export default function ProductsPage() {
    const { addToCart } = useOutletContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('search') || '';
    const selectedCategory = searchParams.get('category') || 'All';
    const subcategory = searchParams.get('subcategory') || '';
    function setSelectedCategory(category) {
        setSearchParams(previous => {
            const next = new URLSearchParams(previous);
            if (next.has('subcategory')) {
                next.delete('subcategory');
                next.delete('search');
            }
            if (category === 'All') next.delete('category');
            else next.set('category', category);
            return next;
        });
    }
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoriesReady, setCategoriesReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('Featured');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    useEffect(() => { setPage(1); }, [selectedCategory, subcategory, search]);
    useEffect(() => {
        let active = true;
        getCategories()
            .then(result => { if (active) setCategories(result); })
            .catch(() => {
                if (!active) return;
                setCategories([]);
            })
            .finally(() => { if (active) setCategoriesReady(true); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!categoriesReady) return;
        const categoryId = selectedCategory === 'All' ? undefined : categories.find(category => normalizeCategory(category.name) === normalizeCategory(selectedCategory))?._id;
        if (selectedCategory !== 'All' && !categoryId) {
            setProducts([]);
            setTotal(0);
            setTotalPages(1);
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        setLoadError('');
        const sort = {
            'Price: Low to High': 'price_asc',
            'Price: High to Low': 'price_desc',
            'Best Rating': 'rating',
            'Most Reviews': 'reviews',
        }[sortBy] || 'newest';
        getProducts({ page, limit: 12, search, category: categoryId, minPrice: priceRange[0], maxPrice: priceRange[1], sort })
            .then(result => {
                if (!active) return;
                setProducts(result.products || []);
                setTotal(result.total);
                setTotalPages(result.totalPages);
            })
            .catch(error => {
                if (!active) return;
                setProducts([]);
                setTotal(0);
                setTotalPages(1);
                setLoadError(error.message || 'Unable to load products.');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [categoriesReady, categories, selectedCategory, priceRange, sortBy, search, page]);
    const filtered = products;
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">{subcategory || (selectedCategory === 'All' ? 'All Products' : selectedCategory)}</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative h-48 bg-gradient-to-r from-[#2D5A2E] to-[#4A8A4C] flex items-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1612869538502-b5baa439abd7?w=1400&h=400&fit=crop&auto=format" alt="Products banner" className="absolute inset-0 w-full h-full object-cover opacity-30"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {subcategory || (selectedCategory === 'All' ? 'All Products' : selectedCategory)}
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
                  <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => { setSelectedCategory(cat); setPage(1); }} className="accent-[#2D5A2E]"/>
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
                <input type="range" min={0} max={1000} step={50} value={priceRange[1]} onChange={e => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }} className="w-full accent-[#2D5A2E]"/>
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
              <p className="text-sm text-gray-500">{loading ? 'Loading products…' : `${total} products found`}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2D5A2E] bg-white">
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loadError && <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">Unable to load products: {loadError}</div>}
            {loading ? <ProductGridSkeleton count={6} className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" /> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart}/>))}
            </div>}

            {!loading && !loadError && filtered.length === 0 && (<div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🌿</div>
                <p className="font-medium">No products match your filters</p>
                <button onClick={() => { setSelectedCategory('All'); setPriceRange([0, 1000]); setPage(1); }} className="mt-4 text-sm text-[#2D5A2E] underline">Clear filters</button>
              </div>)}
            {totalPages > 1 && <div className="flex justify-center items-center gap-4 mt-8"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="text-sm text-[#2D5A2E] disabled:text-gray-300">Previous</button><span className="text-xs text-gray-500">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(value => value + 1)} className="text-sm text-[#2D5A2E] disabled:text-gray-300">Next</button></div>}
          </div>
        </div>
      </div>
    </div>);
}
