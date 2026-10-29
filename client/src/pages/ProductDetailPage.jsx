import { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router';
import { getProduct, getProductReviews, toDisplayProduct } from '../api';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
    const { slug } = useParams();
    const { addToCart } = useOutletContext();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewPages, setReviewPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError('');
        setProduct(null);
        setReviews([]);
        setReviewPage(1);
        Promise.all([getProduct(slug),])
            .then(([result]) => {
                if (!active) return;
                setProduct(result);
                return getProductReviews(result._id, { page: 1, limit: 5 });
            })
            .then(result => {
                if (active && result) {
                    setReviews(result.reviews || []);
                    setReviewPages(result.totalPages || 1);
                }
            })
            .catch(error => { if (active) setLoadError(error.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [slug]);

    async function loadReviewPage(page) {
        if (!product) return;
        try {
            const result = await getProductReviews(product._id, { page, limit: 5 });
            setReviews(result.reviews || []);
            setReviewPage(result.page || page);
            setReviewPages(result.totalPages || 1);
        } catch (error) {
            setLoadError(error.message);
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading product…</div>;
    if (!product && (loadError || !loading)) return (<div className="min-h-screen flex items-center justify-center flex-col gap-4 text-gray-400 px-4">
      <div className="text-5xl">🌿</div>
      <p>{loadError ? `Unable to load product: ${loadError}` : 'Product not found'}</p>
      <Link to="/products" className="text-[#2D5A2E] underline text-sm">Back to products</Link>
    </div>);

    const related = (product.relatedProducts || []).map(toDisplayProduct);
    const gallery = product.gallery?.length ? product.gallery : product.images || [];
    const ratingSummary = product.ratingSummary || { average: product.rating || 0, count: product.reviews || 0, distribution: {} };
    const temperature = [product.storage?.minTemperatureC, product.storage?.maxTemperatureC].filter(value => value !== null && value !== undefined);

    return (<div className="bg-white min-h-screen">
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link><span>›</span>
          <Link to="/products" className="hover:text-[#2D5A2E]">Products</Link><span>›</span>
          <span className="text-[#2C1A0E] font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            {product.save > 0 && <div className="absolute top-4 left-4 z-10 bg-[#C0392B] text-white text-sm font-bold px-3 py-1.5 rounded-full">Save {product.save}%</div>}
            {gallery[0]?.url ? <img src={gallery[0].url} alt={product.name} className="w-full rounded-2xl shadow-lg object-cover" style={{ maxHeight: '480px' }} /> : <div className="w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400" style={{ minHeight: '320px' }}>Product image unavailable</div>}
            {gallery.length > 1 && <div className="grid grid-cols-4 gap-3 mt-3">{gallery.slice(1, 5).map((image, index) => <img key={`${image.public_id || image.url}-${index}`} src={image.url} alt={`${product.name} ${index + 2}`} className="w-full h-20 rounded-lg object-cover border border-gray-100" />)}</div>}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#2C1A0E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{product.name}</h1>
            <div className="flex items-center gap-3 mb-4"><StarRating rating={ratingSummary.average} /><span className="text-xs text-gray-500">({ratingSummary.count} reviews)</span></div>
            <div className="flex items-center gap-3 mb-6">
              {product.originalPrice && <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}.00</span>}
              <span className="text-3xl font-black text-[#2C1A0E]">₹{product.price}.00</span>
              {product.save > 0 && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{product.save}% OFF</span>}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600 mb-6">
              {product.sku && <span>SKU: {product.sku}</span>}
              <span>{product.availability?.inStock ? 'In stock' : 'Out of stock'}</span>
              {product.variants?.[0]?.name && <span>Pack: {product.variants[0].name}</span>}
            </div>
            {product.variants?.length > 1 && <div className="flex flex-wrap gap-2 mb-6">{product.variants.map((variant, index) => <span key={variant.sku || index} className="border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">{variant.name || variant.sku || `Option ${index + 1}`}{variant.price != null ? ` · ₹${variant.price}` : ''}</span>)}</div>}
            <div className="flex gap-4">
              <button onClick={() => addToCart(product)} disabled={!product.availability?.inStock} className="flex-1 bg-[#2D5A2E] text-white font-bold py-4 rounded-xl hover:bg-[#1e3d1f] transition-colors tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">ADD TO CART</button>
              <button aria-label="Add to wishlist" title="Wishlist requires account integration" disabled className="border-2 border-[#2D5A2E] text-[#2D5A2E] font-bold px-6 py-4 rounded-xl opacity-50 cursor-not-allowed">♡</button>
            </div>
          </div>
        </div>

        <section className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Ideal For Making</h2>
            {product.suitableUses?.length ? <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">{product.suitableUses.map(use => <li key={use}>{use}</li>)}</ul> : <p className="text-sm text-gray-400">No verified use guidance available.</p>}
          </div>
          <div className="border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Storage Conditions</h2>
            <p className="text-sm text-gray-600">{product.storage?.instructions || 'No storage instructions available.'}</p>
            {temperature.length === 2 && <p className="text-sm text-gray-500 mt-2">Temperature guidance: {temperature[0]}°C to {temperature[1]}°C</p>}
          </div>
          <div className="border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Allergen Information</h2>
            <p className="text-sm text-gray-600">{product.allergenInfo?.status === 'none_confirmed' ? 'No allergens reported (confirmed).' : product.allergenInfo?.status === 'contains' ? 'Known allergens are listed below.' : 'Allergen information is unknown.'}</p>
            {product.allergenInfo?.allergens?.length > 0 && <p className="text-sm text-gray-600 mt-2">Allergens: {product.allergenInfo.allergens.join(', ')}</p>}
            {product.allergenInfo?.warnings?.map(warning => <p key={warning} className="text-xs text-amber-700 mt-2">{warning}</p>)}
          </div>
          <div className="border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Shelf Life</h2>
            <p className="text-sm text-gray-600">{product.shelfLife?.duration ? `${product.shelfLife.duration} ${product.shelfLife.unit || ''}` : 'Shelf-life information unavailable.'}</p>
            {product.shelfLife?.afterOpening && <p className="text-sm text-gray-500 mt-2">After opening: {product.shelfLife.afterOpening}</p>}
          </div>
          <div className="border border-gray-100 rounded-xl p-6 md:col-span-2">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Organic Certifications</h2>
            {product.organicCertifications?.length ? <div className="grid sm:grid-cols-2 gap-4">{product.organicCertifications.map((certificate, index) => <div key={`${certificate.name}-${index}`} className="text-sm text-gray-600"><p className="font-semibold text-[#2C1A0E]">{certificate.name} <span className="text-xs font-normal">({certificate.verificationStatus || 'unverified'})</span></p>{certificate.issuingAuthority && <p>Issued by: {certificate.issuingAuthority}</p>}{certificate.validUntil && <p>Valid until: {new Date(certificate.validUntil).toLocaleDateString()}</p>}{certificate.documentUrl && <a href={certificate.documentUrl} target="_blank" rel="noreferrer" className="text-[#2D5A2E] underline">View certificate document</a>}</div>)}</div> : <p className="text-sm text-gray-400">No structured certification details available.</p>}
            {product.certifications?.length > 0 && <div className="mt-4 text-xs text-gray-500">Existing certification labels (unverified): {product.certifications.join(', ')}</div>}
          </div>
        </section>

        {product.faqs?.length > 0 && <section className="mb-14"><h2 className="text-2xl font-bold text-[#2C1A0E] mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>Frequently Asked Questions</h2><div className="space-y-3">{product.faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="border border-gray-100 rounded-lg p-4"><summary className="font-semibold text-sm text-[#2C1A0E] cursor-pointer">{faq.question}</summary><p className="text-sm text-gray-600 mt-3">{faq.answer}</p></details>)}</div></section>}

        <section className="mb-14">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5"><div><h2 className="text-2xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Reviews & Ratings</h2><p className="text-sm text-gray-500 mt-1">{ratingSummary.average} out of 5 · {ratingSummary.count} reviews</p></div><div className="flex gap-3">{[5, 4, 3, 2, 1].map(star => <span key={star} className="text-xs text-gray-500">{star}★ {ratingSummary.distribution?.[star] || 0}</span>)}</div></div>
          {loadError && <p role="alert" className="text-sm text-red-700 mb-3">Unable to load reviews: {loadError}</p>}
          {reviews.length ? <div className="space-y-4">{reviews.map(review => <article key={review._id} className="border-b border-gray-100 pb-4"><div className="flex items-center gap-3"><StarRating rating={review.rating} /><span className="text-xs text-gray-400">{review.user?.name || 'Customer'} · {new Date(review.createdAt).toLocaleDateString()}</span>{review.sampleData && <span className="text-[10px] rounded bg-amber-50 px-2 py-1 text-amber-700">Sample</span>}</div><p className="text-sm text-gray-600 mt-2">{review.comment}</p></article>)}{reviewPages > 1 && <div className="flex items-center justify-center gap-4 pt-2"><button disabled={reviewPage <= 1} onClick={() => loadReviewPage(reviewPage - 1)} className="text-sm text-[#2D5A2E] disabled:text-gray-300">Previous</button><span className="text-xs text-gray-500">Page {reviewPage} of {reviewPages}</span><button disabled={reviewPage >= reviewPages} onClick={() => loadReviewPage(reviewPage + 1)} className="text-sm text-[#2D5A2E] disabled:text-gray-300">Next</button></div>}</div> : <p className="text-sm text-gray-400">No reviews yet.</p>}
        </section>

        {related.length > 0 && <div><h2 className="text-2xl font-bold text-[#2C1A0E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>You May Also Like</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{related.map(item => <ProductCard key={item.id} product={item} onAddToCart={addToCart} />)}</div></div>}
      </div>
    </div>);
}
