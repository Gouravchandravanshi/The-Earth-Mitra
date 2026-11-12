import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';
import { Activity, ArrowRight, Brain, ChevronLeft, ChevronRight, ClipboardCheck, CookingPot, Copy, Dna, Factory, HeartPulse, Ribbon, Sprout } from 'lucide-react';
import { getProduct, getProductReviews, getProducts, toDisplayProduct } from '../api';
import { ALLERGEN_INFO, FARM_TO_PLATE, FSSAI_NUMBER, IDEAL_FOR, MANUFACTURER_INFO, OFFERS, PESTICIDE_RISKS, PRODUCTS, STORAGE_INFO, getFaqs, getReviews } from '../data';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import WhyChooseCarousel from '../components/WhyChooseCarousel';
import { ProductDetailSkeleton, RowsSkeleton } from '../components/Skeleton';
import DeliveryChecker from '../components/DeliveryChecker';
import InstagramReels from '../components/InstagramReels';

const SECTION_ICONS = { activity: Activity, brain: Brain, 'cooking-pot': CookingPot, dna: Dna, factory: Factory, 'heart-pulse': HeartPulse, ribbon: Ribbon, sprout: Sprout };

function localProduct(slug) {
  const item = PRODUCTS.find(product => product.slug === slug);
  if (!item) return null;
  return {
    ...item,
    _id: item.slug,
    id: item.id,
    gallery: (item.images?.length ? item.images : [item.img]).filter(Boolean).map(url => ({ url })),
    availability: { inStock: true },
    variants: item.weight ? [{ name: item.weight, price: item.price }] : [],
    faqs: getFaqs(item).map(({ q, a }) => ({ question: q, answer: a })),
    ratingSummary: { average: item.rating || 0, count: item.reviews || 0, distribution: {} },
  };
}

function withLocalDetails(product, slug) {
  const fallback = localProduct(slug);
  if (!fallback) return product;
  return {
    ...fallback,
    ...product,
    img: product.img || fallback.img,
    gallery: product.gallery?.length ? product.gallery : fallback.gallery,
    images: product.images?.length ? product.images : fallback.images,
    description: product.description || fallback.description,
    category: product.category || fallback.category,
    weight: product.weight || fallback.weight,
    faqs: product.faqs?.length ? product.faqs : fallback.faqs,
    ratingSummary: product.ratingSummary || fallback.ratingSummary,
    suitableUses: product.suitableUses?.length ? product.suitableUses : fallback.suitableUses,
    storage: product.storage || fallback.storage,
    allergenInfo: product.allergenInfo || fallback.allergenInfo,
  };
}

function imageUrl(image) {
  return typeof image === 'string' ? image : image?.url;
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="border-b border-gray-200">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between py-4 text-left">
      <span className="text-sm font-semibold text-[#2C1A0E]">{title}</span>
      <ChevronRight size={17} className={`text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && <div className="pb-5 text-sm leading-relaxed text-gray-600">{children}</div>}
  </div>;
}

function ImageGallery({ images, name, save }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [images]);
  const move = delta => setActive(index => (index + delta + images.length) % images.length);
  return <div className="min-w-0">
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F8F7F3] shadow-sm">
      {save > 0 && <span className="absolute left-4 top-4 z-10 rounded-full bg-[#C0392B] px-3 py-1.5 text-sm font-bold text-white shadow">Save {save}%</span>}
      {images[active] ? <img src={images[active]} alt={name} className="block h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-sm text-gray-400">Product image unavailable</div>}
      {images.length > 1 && <>
        <button type="button" aria-label="Previous image" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#2C1A0E] shadow hover:bg-white"><ChevronLeft /></button>
        <button type="button" aria-label="Next image" onClick={() => move(1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#2C1A0E] shadow hover:bg-white"><ChevronRight /></button>
      </>}
    </div>
    {images.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto pb-1">{images.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)} className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${active === index ? 'border-[#2D5A2E]' : 'border-gray-200 hover:border-gray-300'}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div>}
  </div>;
}

function RatingBreakdown({ distribution, total }) {
  return <div className="space-y-2">{[5, 4, 3, 2, 1].map(star => {
    const count = Number(distribution?.[star] || 0);
    const percent = total > 0 ? Math.min(100, count / total * 100) : 0;
    return <div key={star} className="flex items-center gap-2 text-xs">
      <span className="flex w-10 items-center gap-1 text-gray-500">{star}<span className="text-[#C8952A]">★</span></span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C8952A]" style={{ width: `${percent}%` }} /></div>
      <span className="w-8 text-right text-gray-400">{count}</span>
    </div>;
  })}</div>;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useOutletContext();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSort, setReviewSort] = useState('recent');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    setReviewError('');
    setProduct(null);
    setReviews([]);
    setRelated([]);
    setReviewPage(1);
    setReviewPages(1);
    setQuantity(1);
    (async () => {
      let result;
      try {
        result = await getProduct(slug);
      } catch (error) {
        result = localProduct(slug);
        if (!result) throw error;
      }
      result = withLocalDetails(result, slug);
      if (!active) return;
      setProduct(result);
      const [reviewResult, productResult] = await Promise.allSettled([
        getProductReviews(result._id || result.id, { page: 1, limit: 10 }),
        getProducts({ limit: 4, sort: 'rating' }),
      ]);
      if (!active) return;
      if (reviewResult.status === 'fulfilled') {
        setReviews(reviewResult.value.reviews || []);
        setReviewPage(reviewResult.value.page || 1);
        setReviewPages(reviewResult.value.totalPages || 1);
      } else {
        const local = PRODUCTS.find(item => item.slug === slug);
        if (local) setReviews(getReviews(local));
      }
      const apiRelated = (productResult.status === 'fulfilled' ? productResult.value.products || [] : []).filter(item => item.slug !== slug);
      setRelated(apiRelated.length ? apiRelated : PRODUCTS.filter(item => item.slug !== slug).slice(0, 4));
    })()
      .catch(error => { if (active) setLoadError(error.message || 'Product could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const gallery = useMemo(() => {
    const entries = product?.gallery?.length ? product.gallery : product?.images || [];
    const urls = entries.map(imageUrl).filter(Boolean);
    if (urls.length) return [...new Set(urls)];
    return product?.img ? [product.img] : [];
  }, [product]);
  const faqs = useMemo(() => (product?.faqs?.length ? product.faqs : getFaqs(product || { name: 'this product' }).map(({ q, a }) => ({ question: q, answer: a }))).map(faq => ({ question: faq.question || faq.q, answer: faq.answer || faq.a })), [product]);
  const rating = Number(product?.ratingSummary?.average ?? product?.rating ?? 0);
  const reviewCount = Number(product?.ratingSummary?.count ?? product?.reviews ?? 0);
  const distribution = useMemo(() => {
    const saved = product?.ratingSummary?.distribution || product?.ratingDistribution || {};
    if (Object.values(saved).some(value => Number(value) > 0)) return saved;
    return reviews.reduce((counts, review) => {
      const stars = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));
      counts[stars] += 1;
      return counts;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  }, [product, reviews]);
  const price = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || (Number(product?.mrp) > price ? product.mrp : 0));
  const discount = Number(product?.save || (originalPrice > price && originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0));
  const sortedReviews = useMemo(() => [...reviews].sort((a, b) => {
    if (reviewSort === 'highest') return Number(b.rating) - Number(a.rating);
    if (reviewSort === 'lowest') return Number(a.rating) - Number(b.rating);
    return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
  }), [reviews, reviewSort]);

  async function loadReviewPage(page) {
    if (!product?._id || product._id === slug) return;
    setReviewsLoading(true);
    setReviewError('');
    try {
      const result = await getProductReviews(product._id, { page, limit: 10 });
      setReviews(result.reviews || []);
      setReviewPage(result.page || page);
      setReviewPages(result.totalPages || 1);
    } catch (error) {
      setReviewError(error.message || 'Unable to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(''), 1500);
    } catch { setCopiedCode(''); }
  }

  function addQuantity(andCheckout = false) {
    const item = product._id ? product : { ...product, id: product.id };
    for (let index = 0; index < quantity; index += 1) addToCart(item);
    if (andCheckout) navigate('/checkout');
  }

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-gray-500"><span className="text-5xl">🌿</span><p>{loadError ? `Unable to load product: ${loadError}` : 'Product not found'}</p><Link to="/products" className="text-sm text-[#2D5A2E] underline">Back to products</Link></div>;

  const stock = product.availability?.quantity ?? product.stock;
  const inStock = product.availability?.inStock !== false && (stock == null || stock > 0);
  const category = typeof product.category === 'object' ? product.category?.name : product.category;
  const certificationLabels = [
    ...(product.certifications || []),
    ...(product.organicCertifications || []).map(certification => [certification.name, certification.issuingAuthority].filter(Boolean).join(' — ')),
  ].filter(Boolean);
  const certifications = certificationLabels.length ? certificationLabels : ['Certification information will be updated soon.'];
  const packContents = product.packContains?.length
    ? product.packContains
    : [`${product.name}${product.weight ? ` – ${product.weight}` : ''}`];
  const displayReviews = sortedReviews.map(review => ({
    ...review,
    name: review.user?.name || review.name || 'Earth Mitra customer',
    date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : review.date || '',
    title: review.title || '',
    body: review.comment || review.body || '',
    initial: review.initial || (review.user?.name || review.name || 'C').trim().slice(0, 1).toUpperCase(),
  }));

  return <div className="min-h-screen bg-white">
    <div className="border-b border-gray-100 bg-[#FAFAF7]"><div className="mx-auto flex max-w-[1680px] items-center gap-2 px-5 py-3 text-xs text-gray-500 lg:px-10"><Link to="/" className="hover:text-[#2D5A2E]">Home</Link><span>›</span><Link to="/products" className="hover:text-[#2D5A2E]">Products</Link><span>›</span><span className="line-clamp-1 font-medium text-[#2C1A0E]">{product.name}</span></div></div>

    <main className="mx-auto min-w-0 max-w-[1680px] px-5 py-6 sm:py-10 lg:px-10">
      <div className="mb-12 grid min-w-0 gap-8 lg:mb-16 lg:grid-cols-2 lg:gap-12">
        <ImageGallery images={gallery} name={product.name} save={discount} />
        <section className="flex min-w-0 flex-col">
          <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C8952A]">{category || 'Organic essentials'}</span>
          <h1 className="mb-3 font-display text-2xl font-bold text-[#2C1A0E] lg:text-3xl">{product.name}</h1>
          <div className="mb-4 flex items-center gap-3"><StarRating rating={rating} /><span className="text-xs text-gray-500">({reviewCount} Reviews)</span></div>
          <div className="mb-1 flex items-center gap-3">{originalPrice > price && <span className="text-lg text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}.00</span>}<span className="text-3xl font-black text-[#2C1A0E]">₹{price.toLocaleString('en-IN')}.00</span>{discount > 0 && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">{discount}% OFF</span>}</div>
          <p className="mb-6 text-xs text-gray-400">(Inclusive of all taxes)</p>
          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.origin && <span>Origin: {product.origin}</span>}
            <span className={inStock ? 'text-green-700' : 'text-red-700'}>{inStock ? (stock == null ? 'In stock' : `${stock} available`) : 'Currently unavailable'}</span>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2"><span className="text-base">🏷️</span><span className="text-sm font-semibold text-[#2C1A0E]">Available Offers</span></div>
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">{OFFERS.map(offer => <div key={offer.code} className="w-56 shrink-0 rounded-lg border border-dashed border-[#C8952A] bg-[#FFFBF2] p-3"><p className="mb-0.5 text-sm font-bold text-[#2C1A0E]">{offer.title}</p><p className="mb-2 text-xs leading-snug text-gray-500">{offer.desc}</p><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#2C1A0E]">Code: <span className="text-[#2D5A2E]">{offer.code}</span></span><button type="button" onClick={() => copyCode(offer.code)} className="flex items-center gap-1 text-xs font-semibold text-[#2D5A2E] hover:underline">{copiedCode === offer.code ? <ClipboardCheck size={14} /> : <Copy size={13} />}{copiedCode === offer.code ? 'Copied' : 'Copy'}</button></div></div>)}</div>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex overflow-hidden rounded-lg border border-gray-300"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(value => Math.max(1, value - 1))} className="flex h-11 w-10 items-center justify-center text-lg hover:bg-gray-50">−</button><span className="grid w-10 place-items-center text-sm font-semibold">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(value => Math.min(stock || 99, value + 1))} disabled={stock != null && quantity >= stock} className="flex h-11 w-10 items-center justify-center text-lg hover:bg-gray-50 disabled:opacity-40">+</button></div>
            {(product.weight || product.variants?.[0]?.name) && <span className="rounded-full border border-[#2D5A2E] px-3 py-1 text-sm font-semibold text-[#2D5A2E]">{product.weight || product.variants[0].name}</span>}
          </div>

          <div className="mb-6 flex gap-3 sm:gap-4"><button type="button" onClick={() => addQuantity()} disabled={!inStock} className="flex-1 rounded-xl bg-[#2D5A2E] py-4 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-[#1e3d1f] disabled:cursor-not-allowed disabled:opacity-50">{inStock ? 'Add to Cart' : 'Out of Stock'}</button><button type="button" onClick={() => addQuantity(true)} disabled={!inStock} className="flex-1 rounded-xl bg-[#2C1A0E] py-4 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">Buy It Now</button></div>
          <DeliveryChecker />
          <div className="mb-6 grid grid-cols-2 gap-3 text-xs text-gray-600">{['Tested for 250+ Pesticides', 'No Chemical Fumigation', 'Non-GMO', 'Sustainably Sourced'].map(feature => <div key={feature} className="flex items-center gap-2"><span className="grid size-4 shrink-0 place-items-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">✓</span>{feature}</div>)}</div>
          <div className="mt-2">
            <Accordion title="Description" defaultOpen><p>{product.description}</p><p className="mt-3">Every batch is carefully sourced, checked for quality, and packed to preserve its natural goodness.</p></Accordion>
            <Accordion title="Pack Contains"><ul className="list-inside list-disc">{packContents.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></Accordion>
            <Accordion title="Ideal For Making">{product.suitableUses?.length ? <ul className="list-inside list-disc">{product.suitableUses.map(use => <li key={use}>{use}</li>)}</ul> : IDEAL_FOR}</Accordion>
            <Accordion title="FSSAI Number">{product.fssaiNumber || FSSAI_NUMBER}</Accordion>
            <Accordion title="Marketed & Manufactured By">{product.manufacturer || MANUFACTURER_INFO}</Accordion>
            <Accordion title="Certifications"><ul className="list-inside list-disc">{certifications.map((certificate, index) => <li key={`${certificate}-${index}`}>{certificate}</li>)}</ul></Accordion>
            {product.shelfLife?.duration != null && <Accordion title="Shelf Life">{product.shelfLife.duration} {product.shelfLife.unit || 'months'}{product.shelfLife.afterOpening ? ` · ${product.shelfLife.afterOpening} after opening` : ''}</Accordion>}
            <Accordion title="Allergen Information">{product.allergenInfo?.status === 'none_confirmed' ? 'No allergens reported.' : product.allergenInfo?.allergens?.length ? `Contains: ${product.allergenInfo.allergens.join(', ')}` : product.allergenInfo?.warnings?.join(' ') || ALLERGEN_INFO}</Accordion>
            <Accordion title="Storage Conditions"><p>{product.storage?.instructions || STORAGE_INFO}</p>{(product.storage?.minTemperatureC != null || product.storage?.maxTemperatureC != null) && <p className="mt-2">Store between {product.storage.minTemperatureC ?? '—'}°C and {product.storage.maxTemperatureC ?? '—'}°C.</p>}</Accordion>
          </div>
          <div className="mt-6 flex items-center gap-3"><span className="text-sm font-semibold text-[#2C1A0E]">Share</span>{[['f', 'Facebook'], ['𝕏', 'X'], ['P', 'Pinterest']].map(([symbol, label]) => <button key={label} type="button" aria-label={`Share on ${label}`} onClick={() => copyCode(window.location.href)} className="grid size-8 place-items-center rounded-full bg-gray-100 text-xs font-bold text-[#2C1A0E] transition hover:bg-gray-200">{symbol}</button>)}</div>
        </section>
      </div>

      {related.length > 0 && <section className="mb-16"><h2 className="mb-8 font-display text-2xl font-bold text-[#2C1A0E]">You May Also Like…</h2><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.slice(0, 4).map(item => <ProductCard key={item.id || item._id || item.slug} product={item} onAddToCart={addToCart} />)}</div></section>}

      <section className="mb-16 border-y border-gray-100 bg-[#FAFAF7] py-14"><div className="mx-auto max-w-[1680px] px-5 lg:px-10"><div className="mb-12 text-center"><h2 className="section-heading font-bold text-[#2C1A0E]">Why Choose Organic Tattva</h2><div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#2D5A2E]" /></div><WhyChooseCarousel /></div></section>

      <InstagramReels />

      <section aria-labelledby="farm-journey-title" className="overflow-hidden rounded-3xl bg-[#2D3B2E] px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 id="farm-journey-title" className="mb-10 text-center font-display text-2xl font-bold text-white sm:text-3xl">Journey from Farm to Plate</h2>
          <ol className="grid gap-6 md:grid-cols-3 md:gap-10">
            {FARM_TO_PLATE.map((step, index) => {
              const Icon = SECTION_ICONS[step.icon];
              return <li key={step.title} className="relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center">
                <div className="mb-5 grid size-20 place-items-center rounded-2xl border border-[#E8C14A]/30 bg-[#E8C14A]/10 text-[#E8C14A]">
                  <Icon size={36} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <span className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-[#E8C14A]">STEP {String(index + 1).padStart(2, '0')}</span>
                <h3 className="mb-3 text-lg font-semibold text-white">{step.title}</h3>
                <p className="max-w-64 text-sm leading-6 text-white/75">{step.desc}</p>
                {index < FARM_TO_PLATE.length - 1 && <span aria-hidden="true" className="absolute -right-8 top-16 hidden size-6 items-center justify-center text-[#E8C14A] md:flex"><ArrowRight size={22} strokeWidth={1.6} /></span>}
              </li>;
            })}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 py-16 lg:px-10">
        <div className="mb-16 rounded-3xl border border-[#2D5A2E]/10 bg-[#F8F7F2] px-4 py-10 sm:px-8 lg:py-12">
          <h2 className="mx-auto mb-8 max-w-2xl text-center font-display text-2xl font-bold leading-snug text-[#2C1A0E] sm:text-3xl">Did you know pesticides in your daily diet can cause</h2>
          <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {PESTICIDE_RISKS.map(risk => {
              const Icon = SECTION_ICONS[risk.icon];
              return <li key={risk.label} className="flex items-center gap-4 rounded-2xl border border-[#2D5A2E]/10 bg-white px-5 py-6 sm:flex-col sm:text-center">
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#EEF3E9] text-[#2D5A2E]">
                  <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <span className="text-sm font-medium leading-6 text-[#465044]">{risk.label}</span>
              </li>;
            })}
          </ul>
        </div>
        <h2 className="mb-6 font-display text-2xl font-bold text-[#2C1A0E]">Frequently Asked Questions</h2><div className="mb-20 max-w-3xl">{faqs.map(faq => <FaqRow key={faq.question} question={faq.question} answer={faq.answer} />)}</div>
        <section className="border-t border-gray-200 pt-12"><div className="mb-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-start"><div className="flex items-start gap-8"><div><StarRating rating={rating} /><p className="mt-1 text-xs text-gray-500">Based on {reviewCount} reviews</p></div><div className="w-64 max-w-[45vw]"><RatingBreakdown distribution={distribution} total={reviewCount} /></div></div><div className="flex gap-3"><button type="button" onClick={() => setReviewError('Please sign in to write a review.')} className="whitespace-nowrap rounded-lg bg-[#C8952A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#b07e22]">Write A Review</button><button type="button" onClick={() => setReviewError('Questions can be sent to Earth Mitra support.')} className="whitespace-nowrap rounded-lg bg-[#C8952A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#b07e22]">Ask A Question</button></div></div>
          {reviewError && <p role="status" className="mb-4 text-sm text-amber-700">{reviewError}</p>}
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3"><div className="flex gap-6 text-sm"><span className="border-b-2 border-[#2D5A2E] pb-3 font-semibold text-[#2C1A0E]">Reviews ({reviewCount || reviews.length})</span><span className="text-gray-400">Questions (0)</span></div><select aria-label="Sort reviews" value={reviewSort} onChange={event => setReviewSort(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 outline-none"><option value="recent">Most Recent</option><option value="highest">Highest Rated</option><option value="lowest">Lowest Rated</option></select></div>
          {reviewsLoading && <RowsSkeleton label="Loading reviews…" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" />}
          {!reviewsLoading && displayReviews.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{displayReviews.map(review => <article key={review._id || review.id} className="rounded-xl border border-gray-100 p-5"><div className="mb-2 flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: review.color || '#2D5A2E' }}>{review.initial}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#2C1A0E]">{review.name}</p><StarRating rating={review.rating} /></div><span className="shrink-0 text-[11px] text-gray-400">{review.date}</span></div>{review.title && <h3 className="mb-1.5 text-sm font-bold text-[#2C1A0E]">{review.title}</h3>}<p className="mb-3 text-xs leading-relaxed text-gray-600">{review.body}</p><div className="flex gap-4 text-xs text-gray-400"><span>👍 {review.likes || 0}</span><span>👎 {review.dislikes || 0}</span></div></article>)}</div> : !reviewsLoading && <p className="py-8 text-sm text-gray-500">No reviews yet.</p>}
          {reviewPages > 1 && <div className="mt-6 flex items-center justify-center gap-5"><button type="button" disabled={reviewPage <= 1 || reviewsLoading} onClick={() => loadReviewPage(reviewPage - 1)} className="text-sm text-[#2D5A2E] disabled:text-gray-300">Previous</button><span className="text-xs text-gray-500">Page {reviewPage} of {reviewPages}</span><button type="button" disabled={reviewPage >= reviewPages || reviewsLoading} onClick={() => loadReviewPage(reviewPage + 1)} className="text-sm text-[#2D5A2E] disabled:text-gray-300">Next</button></div>}
        </section>
      </section>
    </main>
  </div>;
}

function FaqRow({ question, answer }) {
  const [open, setOpen] = useState(false);
  return <div className="mb-3 overflow-hidden rounded-lg border border-gray-200"><button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"><ChevronRight size={14} className={`shrink-0 text-[#2D5A2E] transition-transform ${open ? 'rotate-90' : ''}`} /><span className="text-sm font-semibold text-[#2C1A0E]">{question}</span></button>{open && <p className="px-4 pb-4 pl-10 text-sm leading-relaxed text-gray-600">{answer}</p>}</div>;
}
