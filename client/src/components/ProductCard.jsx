import { Link } from 'react-router';
import StarRating from './StarRating';
export default function ProductCard({ product, onAddToCart }) {
    return (<div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group bg-white flex flex-col">
      <Link to={`/products/${product.slug}`} className="relative block bg-gray-50 overflow-hidden">
        {product.save && (<div className="absolute top-3 left-3 z-10 bg-[#C0392B] text-white text-xs font-bold px-2 py-1 rounded-full">
            Save {product.save}%
          </div>)}
        <img src={product.img} alt={product.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"/>
        {product.tag && (<div className="absolute bottom-0 left-0 right-0 text-center text-white text-xs font-bold py-1.5" style={{ backgroundColor: product.tagColor || '#2D7A3A' }}>
            {product.tag}
          </div>)}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-[#2C1A0E] mb-2 line-clamp-2 min-h-[2.5rem] hover:text-[#2D5A2E] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          {product.originalPrice && (<span className="text-xs text-gray-400 line-through">₹{product.originalPrice}.00</span>)}
          <span className="text-base font-bold text-[#2C1A0E]">₹{product.price}.00</span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col gap-0.5">
            <StarRating rating={product.rating}/>
            <span className="text-[10px] text-gray-400">({product.reviews} reviews)</span>
          </div>
          <button onClick={() => onAddToCart(product)} className="bg-[#2D5A2E] text-white text-xs font-bold px-3 py-2 rounded hover:bg-[#1e3d1f] transition-colors tracking-wide whitespace-nowrap">
            ADD TO CART
          </button>
        </div>
      </div>
    </div>);
}
