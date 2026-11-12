import { useState } from 'react';
import { Link } from 'react-router';
import StarRating from './StarRating';
export default function ProductCard({ product, onAddToCart }) {
    const [activeImage, setActiveImage] = useState(0);
    const [imageHovered, setImageHovered] = useState(false);
    const rawImages = product.gallery?.length ? product.gallery : product.images?.length ? product.images : [product.img];
    const images = rawImages.map(image => typeof image === 'string' ? image : image?.url).filter(Boolean);
    if (!images.length) images.push('');
    const indicatorCount = Math.max(3, images.length);
    const productHref = product.href || `/products/${product.slug || product.id}`;
    function handleImageHover(event) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = (event.clientX - bounds.left) / bounds.width;
        const imageIndex = Math.min(images.length - 1, Math.floor(position * images.length));
        setActiveImage(current => current === imageIndex ? current : imageIndex);
    }
    const formatPrice = price => Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (<div className="h-[500px] w-full border border-gray-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group bg-white flex flex-col">
      <div className="relative block shrink-0 bg-gray-50 overflow-hidden aspect-square" onMouseEnter={() => setImageHovered(true)} onMouseMove={handleImageHover} onMouseLeave={() => { setImageHovered(false); setActiveImage(0); }}>
        <Link to={productHref} className="absolute inset-0 block overflow-hidden">
          {images[activeImage % images.length] ? <img src={images[activeImage % images.length]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/> : <span className="grid h-full place-items-center text-xs text-gray-400">Image unavailable</span>}
        </Link>
        {product.save && (<div className={`absolute top-2 left-2 z-10 bg-[#B00000] text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm transition-opacity ${imageHovered ? 'opacity-0' : 'opacity-100'}`}>
            Save {product.save}%
          </div>)}
        {product.cardBadge && <div className="absolute top-2 left-2 z-10 rounded-full bg-[#C0392B] px-2.5 py-1.5 text-xs font-bold text-white shadow-sm">{product.cardBadge}</div>}
        {product.tag && (<div className="absolute bottom-0 left-0 right-0 text-center text-white text-xs font-bold py-1.5 tracking-wide" style={{ backgroundColor: product.tagColor || '#2D7A3A' }}>
            {product.tag}
          </div>)}
        <div className="absolute left-3 right-3 top-3 z-20 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          {Array.from({ length: indicatorCount }, (_, index) => <button key={index} type="button" onClick={() => setActiveImage(Math.min(index, images.length - 1))} aria-label={`Show ${product.name} image ${Math.min(index + 1, images.length)}`} aria-pressed={activeImage === index} className={`h-1 flex-1 rounded-full transition-colors ${activeImage === index ? 'bg-[#2C1A0E]' : 'bg-[#2C1A0E]/25'}`} />)}
        </div>
      </div>
      <div className="p-3 pt-6 flex flex-col flex-1">
        <Link to={productHref}>
          <h3 className="text-[15px] font-semibold text-[#2C1A0E] mb-2 line-clamp-2 min-h-[1.5rem] hover:text-[#2D5A2E] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          {product.originalPrice && (<span className="text-sm text-gray-500 line-through">₹{formatPrice(product.originalPrice)}</span>)}
          <span className="text-base font-bold text-[#171717]">₹{formatPrice(product.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <StarRating rating={product.rating} size={18} valueClassName="text-base font-semibold text-[#171717]"/>
            {product.showReviews !== false && <span className="text-[10px] text-gray-400">({product.reviews} reviews)</span>}
          </div>
          <button onClick={() => onAddToCart(product)} className="inline-flex h-[35px] w-[100px] max-w-full shrink-0 items-center justify-center rounded-md bg-[#425D32] px-1 text-[11px] font-bold tracking-wide text-white shadow-sm transition-all hover:bg-[#314626] active:scale-95 whitespace-nowrap">
            ADD TO CART
          </button>
        </div>
      </div>
    </div>);
}
