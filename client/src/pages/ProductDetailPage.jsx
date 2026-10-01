import { useParams, Link, useOutletContext } from 'react-router';
import { PRODUCTS } from '../data';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
export default function ProductDetailPage() {
    const { slug } = useParams();
    const { addToCart } = useOutletContext();
    const product = PRODUCTS.find(p => p.slug === slug);
    if (!product)
        return (<div className="min-h-screen flex items-center justify-center flex-col gap-4 text-gray-400">
      <div className="text-5xl">🌿</div>
      <p>Product not found</p>
      <Link to="/products" className="text-[#2D5A2E] underline text-sm">Back to products</Link>
    </div>);
    const related = PRODUCTS.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-[#2D5A2E]">Products</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="relative">
            {product.save && (<div className="absolute top-4 left-4 z-10 bg-[#C0392B] text-white text-sm font-bold px-3 py-1.5 rounded-full">
                Save {product.save}%
              </div>)}
            <img src={product.img} alt={product.name} className="w-full rounded-2xl shadow-lg object-cover" style={{ maxHeight: '480px' }}/>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#2C1A0E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating}/>
              <span className="text-xs text-gray-500">({product.reviews} reviews)</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {product.originalPrice && (<span className="text-lg text-gray-400 line-through">₹{product.originalPrice}.00</span>)}
              <span className="text-3xl font-black text-[#2C1A0E]">₹{product.price}.00</span>
              {product.save && (<span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{product.save}% OFF</span>)}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              {['Tested for 250+ Pesticides', 'No Chemical Fumigation', 'Non-GMO', 'Sustainably Sourced'].map(feat => (<div key={feat} className="flex items-center gap-2 text-gray-600">
                  <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-[10px] flex-shrink-0">✓</span>
                  {feat}
                </div>))}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-500">Weight:</span>
              <span className="border border-[#2D5A2E] text-[#2D5A2E] text-sm font-semibold px-3 py-1 rounded-full">{product.weight}</span>
            </div>

            <div className="flex gap-4">
              <button onClick={() => addToCart(product)} className="flex-1 bg-[#2D5A2E] text-white font-bold py-4 rounded-xl hover:bg-[#1e3d1f] transition-colors tracking-wide shadow-lg">
                ADD TO CART
              </button>
              <button className="border-2 border-[#2D5A2E] text-[#2D5A2E] font-bold px-6 py-4 rounded-xl hover:bg-[#2D5A2E] hover:text-white transition-colors">
                ♡
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (<div>
            <h2 className="text-2xl font-bold text-[#2C1A0E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart}/>))}
            </div>
          </div>)}
      </div>
    </div>);
}
