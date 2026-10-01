import { Link, useParams, useOutletContext } from 'react-router';
import { COLLECTIONS, PRODUCTS } from '../data';
import ProductCard from '../components/ProductCard';
export function CollectionsListPage() {
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">Collections</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-r from-[#C8952A] to-[#E8702A] overflow-hidden flex items-center">
        <img src="https://images.unsplash.com/photo-1704916029292-ec7b5976204c?w=1400&h=400&fit=crop&auto=format" alt="Collections" className="absolute inset-0 w-full h-full object-cover opacity-20"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Shop by Collection
          </h1>
          <p className="text-white/90 text-sm">Explore our curated categories of organic goodness</p>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COLLECTIONS.map(col => (<Link key={col.id} to={`/collections/${col.slug}`} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 block border border-gray-100">
              <div className="relative overflow-hidden h-56">
                <img src={col.img} alt={col.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">{col.productCount} Products</span>
                  <h3 className="text-white text-xl font-bold mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>{col.name}</h3>
                </div>
              </div>
              <div className="p-5" style={{ backgroundColor: col.color }}>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{col.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all" style={{ color: col.accent }}>
                  Shop Now →
                </span>
              </div>
            </Link>))}
        </div>
      </div>

      {/* Value Banner */}
      <div className="bg-[#2C1A0E] text-white py-14 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>The Organic Tattva Promise</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto mb-8">Every product in every collection is tested for 250+ pesticides, certified organic, and sourced from ethical farms across India.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {[
            { stat: '250+', label: 'Pesticide Tests' },
            { stat: '4', label: 'Certifications' },
            { stat: '100%', label: 'Organic Certified' },
            { stat: '10K+', label: 'Happy Families' },
        ].map(item => (<div key={item.stat}>
                <div className="text-3xl font-black text-[#C8952A]">{item.stat}</div>
                <div className="text-sm text-gray-400 mt-1">{item.label}</div>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
export function CollectionDetailPage() {
    const { slug } = useParams();
    const { addToCart } = useOutletContext();
    const collection = COLLECTIONS.find(c => c.slug === slug);
    const collectionNameMap = {
        'atta-rice-dal': 'Atta, Rice & Dal',
        'masala-oil-more': 'Masala, Oil & More',
        'tea-coffee-healthy': 'Tea, Coffee & Healthy',
        'combo-deals': 'Masala, Oil & More',
        'shravan-special': 'Atta, Rice & Dal',
        'ganapati-special': 'Tea, Coffee & Healthy',
    };
    const products = PRODUCTS.filter(p => slug ? p.category === collectionNameMap[slug] : true);
    if (!collection)
        return (<div className="min-h-screen flex items-center justify-center flex-col gap-4 text-gray-400">
      <div className="text-5xl">🛒</div>
      <p>Collection not found</p>
      <Link to="/collections" className="text-[#2D5A2E] underline text-sm">Back to collections</Link>
    </div>);
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <Link to="/collections" className="hover:text-[#2D5A2E]">Collections</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">{collection.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-64 overflow-hidden flex items-center" style={{ backgroundColor: collection.color }}>
        <img src={collection.img} alt={collection.name} className="absolute inset-0 w-full h-full object-cover opacity-40"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: collection.accent }}>
            {collection.name}
          </h1>
          <p className="text-gray-700 text-sm max-w-md">{collection.description}</p>
          <span className="inline-block mt-3 text-xs font-bold text-gray-500 uppercase tracking-widest">{collection.productCount} Products</span>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {products.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart}/>))}
          </div>) : (<div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🌿</div>
            <p className="font-medium">Products coming soon</p>
            <Link to="/products" className="mt-4 inline-block text-sm text-[#2D5A2E] underline">Browse all products</Link>
          </div>)}
      </div>
    </div>);
}
