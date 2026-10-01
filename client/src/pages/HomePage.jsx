import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router';
import { PRODUCTS, BLOGS } from '../data';
import ProductCard from '../components/ProductCard';
/* ─── Hero slides ─────────────────────────────────── */
const SLIDES = [
    {
        tag: 'Rakhi Sale',
        headline: 'Pure Essentials',
        sub: "For A Bond That's Worth Celebrating",
        promo: { pct: 25, extra: '+3 Free products of your choice', code: 'FESTIVE25', valid: '3rd Sept' },
        bg: 'from-[#f0ede8] to-[#e8e3dc]',
        img: 'https://images.unsplash.com/photo-1612869538502-b5baa439abd7?w=800&h=560&fit=crop&auto=format',
        badgeBg: 'from-[#C0392B] to-[#E8702A]',
    },
    {
        tag: 'Ganapati Special',
        headline: 'Joyous Celebrations',
        sub: 'Begin With Pure Organic Ingredients',
        promo: { pct: 30, extra: 'Use Code FESTIVE30', code: 'FESTIVE30', valid: '15th Sept' },
        bg: 'from-[#e8f0e8] to-[#d8ecd8]',
        img: 'https://images.unsplash.com/photo-1578129377420-4795675e892e?w=800&h=560&fit=crop&auto=format',
        badgeBg: 'from-[#2D5A2E] to-[#4A8A4C]',
    },
    {
        tag: 'Farm to Fork',
        headline: 'The Journey',
        sub: 'From Our Farms To Your Plates',
        promo: { pct: 20, extra: 'Free shipping above ₹599', code: 'ORGANIC20', valid: '30th Sept' },
        bg: 'from-[#f5f0e8] to-[#ede5d8]',
        img: 'https://images.unsplash.com/photo-1704916029292-ec7b5976204c?w=800&h=560&fit=crop&auto=format',
        badgeBg: 'from-[#C8952A] to-[#E8B840]',
    },
];
/* ─── Category icons ──────────────────────────────── */
const CATEGORIES = [
    { icon: '🌾', label: 'Atta & Flours', path: '/collections/atta-rice-dal', anim: 'wiggle' },
    { icon: '🫘', label: 'Dal & Pulses', path: '/collections/atta-rice-dal', anim: 'bounce' },
    { icon: '🍚', label: 'Rice & Grains', path: '/collections/atta-rice-dal', anim: 'pop' },
    { icon: '🫀', label: 'Healthy Snacks', path: '/collections/tea-coffee-healthy', anim: 'wiggle' },
    { icon: '🫙', label: 'Oils & Ghee', path: '/collections/masala-oil-more', anim: 'bounce' },
    { icon: '⏱️', label: 'Ready to Cook', path: '/collections/combo-deals', anim: 'pop' },
    { icon: '🍵', label: 'Tea & Coffee', path: '/collections/tea-coffee-healthy', anim: 'wiggle' },
    { icon: '🧂', label: 'Spices & Salt', path: '/collections/masala-oil-more', anim: 'bounce' },
    { icon: '🌸', label: 'Herbal & Teas', path: '/collections/tea-coffee-healthy', anim: 'pop' },
];
const WHY_ITEMS = [
    { label: 'Sustainable Farming\nTechniques', icon: '🌱', color: '#E8F5E9', border: '#4CAF50' },
    { label: 'Chemical\nPesticide-free', icon: '🚫', color: '#FFF3E0', border: '#FF9800' },
    { label: 'Non-GMO\nProduce', icon: '🧬', color: '#E3F2FD', border: '#2196F3' },
    { label: 'Locally Ethically\nSourced', icon: '🌿', color: '#F3E5F5', border: '#9C27B0' },
    { label: '250 Global Testing\nStandards', icon: '🌐', color: '#E8EAF6', border: '#3F51B5' },
];
/* ─── Animated category icon ─────────────────────── */
function CategoryIcon({ cat, index }) {
    const [hovered, setHovered] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    return (<Link to={cat.path} className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer" onMouseEnter={() => { setHovered(true); setAnimKey(k => k + 1); }} onMouseLeave={() => setHovered(false)} style={{ animationDelay: `${index * 60}ms` }}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${hovered ? 'shadow-lg scale-110' : 'scale-100'}`} style={{
            background: hovered ? WHY_ITEMS[index % WHY_ITEMS.length].color : '#F5F5F5',
            border: hovered ? `2px solid ${WHY_ITEMS[index % WHY_ITEMS.length].border}` : '2px solid transparent',
        }}>
        <span key={animKey} className="select-none" style={{
            display: 'inline-block',
            animation: hovered
                ? cat.anim === 'wiggle' ? 'iconWiggle 0.5s ease'
                    : cat.anim === 'bounce' ? 'iconBounce 0.5s ease'
                        : 'iconPop 0.4s ease'
                : 'none',
        }}>
          {cat.icon}
        </span>
      </div>
      <span className={`text-xs text-center whitespace-nowrap font-medium transition-colors duration-200 ${hovered ? 'text-[#2D5A2E]' : 'text-gray-600'}`}>
        {cat.label}
      </span>
    </Link>);
}
/* ─── Why item with float animation ──────────────── */
function WhyItem({ item, index }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting)
            setVisible(true); }, { threshold: 0.3 });
        if (ref.current)
            obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (<div ref={ref} className="flex flex-col items-center gap-3 group cursor-pointer" style={{
            minWidth: '120px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
        }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md" style={{ border: `2px solid ${item.border}`, background: item.color }}>
        <span style={{ animation: 'float 3s ease-in-out infinite', display: 'inline-block', animationDelay: `${index * 0.4}s` }}>
          {item.icon}
        </span>
      </div>
      <span className="text-xs text-center text-gray-600 max-w-[110px] leading-snug font-medium whitespace-pre-line">
        {item.label}
      </span>
    </div>);
}
/* ─── Hero Carousel ──────────────────────────────── */
function HeroCarousel({ onShopNow }) {
    const [current, setCurrent] = useState(0);
    const [animKey, setAnimKey] = useState(0);
    const [direction, setDirection] = useState('right');
    const timerRef = useRef(null);
    function goTo(idx, dir = 'right') {
        setDirection(dir);
        setAnimKey(k => k + 1);
        setCurrent(idx);
    }
    function next() { goTo((current + 1) % SLIDES.length, 'right'); }
    function prev() { goTo((current - 1 + SLIDES.length) % SLIDES.length, 'left'); }
    useEffect(() => {
        timerRef.current = setInterval(next, 5000);
        return () => { if (timerRef.current)
            clearInterval(timerRef.current); };
    }, [current]);
    const slide = SLIDES[current];
    return (<section className={`relative bg-gradient-to-br ${slide.bg} overflow-hidden min-h-[520px] flex items-center transition-all duration-700`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full py-12 lg:py-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* Text side */}
          <div className="relative z-10">
            <span key={`tag-${animKey}`} className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 text-white ${direction === 'right' ? 'animate-slide-left' : 'animate-slide-right'}`} style={{ background: `linear-gradient(to right, ${slide.badgeBg.includes('C0392B') ? '#C0392B,#E8702A' : slide.badgeBg.includes('2D5A2E') ? '#2D5A2E,#4A8A4C' : '#C8952A,#E8B840'})` }}>
              {slide.tag}
            </span>

            <h1 key={`h1-${animKey}`} className={`text-4xl lg:text-5xl font-bold leading-tight mb-3 ${direction === 'right' ? 'animate-slide-left delay-100' : 'animate-slide-right delay-100'}`} style={{ fontFamily: 'Playfair Display, serif', color: '#C0392B' }}>
              {slide.headline}
            </h1>

            <p key={`sub-${animKey}`} className={`text-xl lg:text-2xl font-semibold text-[#2C1A0E] mb-8 ${direction === 'right' ? 'animate-slide-left delay-200' : 'animate-slide-right delay-200'}`}>
              {slide.sub}
            </p>

            <div key={`promo-${animKey}`} className={`inline-flex items-center gap-4 rounded-full px-6 py-4 shadow-xl mb-4 animate-pulse-glow ${direction === 'right' ? 'animate-slide-up delay-300' : 'animate-slide-up delay-300'}`} style={{ background: `linear-gradient(to right, ${slide.badgeBg.includes('C0392B') ? '#C0392B,#E8702A' : slide.badgeBg.includes('2D5A2E') ? '#2D5A2E,#4A8A4C' : '#C8952A,#E8B840'})` }}>
              <div className="text-white">
                <div className="text-xs font-semibold uppercase tracking-wide">UP TO</div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black leading-none">{slide.promo.pct}</span>
                  <div className="text-lg font-bold mb-1">%<br />Off</div>
                </div>
              </div>
              <div className="w-px h-12 bg-white opacity-40"/>
              <div className="text-white text-sm opacity-90 max-w-[140px]">{slide.promo.extra}</div>
            </div>

            <div key={`code-${animKey}`} className={`mt-3 mb-2 animate-fade-in delay-400`}>
              <span className="text-[#2C1A0E] text-sm">Use Code </span>
              <span className="inline-block border border-[#2C1A0E] rounded px-2 py-0.5 text-sm font-bold text-[#2C1A0E] tracking-widest">{slide.promo.code}</span>
            </div>
            <div className="flex items-center gap-2 text-[#2C1A0E] text-sm mb-8 animate-fade-in delay-400">
              <span className="w-8 h-px bg-[#C8952A]"/>
              <span>Valid till {slide.promo.valid}</span>
              <span className="w-8 h-px bg-[#C8952A]"/>
            </div>

            <button onClick={onShopNow} className="bg-[#2D5A2E] text-white font-bold px-8 py-3 rounded-full hover:bg-[#1e3d1f] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 animate-fade-in delay-500">
              Shop Now
            </button>
          </div>

          {/* Image side */}
          <div className="relative flex justify-center lg:justify-end">
            <button onClick={onShopNow} className="block w-full max-w-lg">
              <img key={`img-${animKey}`} src={slide.img} alt={slide.headline} className={`w-full object-cover rounded-2xl shadow-2xl animate-ken-burns ${direction === 'right' ? 'animate-slide-right' : 'animate-slide-left'}`} style={{ maxHeight: '420px' }}/>
            </button>
            {/* Badge */}
            <div className="absolute top-0 right-0 lg:-right-2">
              <div className="relative w-28 h-28 animate-pulse-glow rounded-full cursor-pointer">
                <div className="absolute inset-0 rounded-full border-4 border-[#C8952A] bg-white flex flex-col items-center justify-center shadow-xl hover:scale-105 transition-transform">
                  <div className="text-[#E8702A] text-base font-black leading-none">{slide.tag.split(' ')[0]}</div>
                  <div className="text-[#C8952A] text-xl font-black leading-none">SALE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center text-[#2C1A0E] hover:scale-110 transition-all z-20">
        ‹
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center text-[#2C1A0E] hover:scale-110 transition-all z-20">
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (<button key={i} onClick={() => goTo(i, i > current ? 'right' : 'left')} className={`rounded-full transition-all duration-300 ${i === current ? 'w-7 h-2.5 bg-[#2D5A2E]' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'}`}/>))}
      </div>
    </section>);
}
/* ─── Scrolling announcement text ────────────────── */
const ANNOUNCEMENTS = [
    '🌿 Get 30% off on your Organic Grocery',
    '🚚 Free shipping on orders above ₹599',
    '✅ Tested for 250+ Pesticides',
    '🎁 +3 Free products on every order',
    '🌿 Get 30% off on your Organic Grocery',
    '🚚 Free shipping on orders above ₹599',
    '✅ Tested for 250+ Pesticides',
    '🎁 +3 Free products on every order',
];
/* ─── Main Page ──────────────────────────────────── */
export default function HomePage() {
    const { addToCart } = useOutletContext();
    const navigate = useNavigate();
    const [sectionVisible, setSectionVisible] = useState(false);
    const certRef = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting)
            setSectionVisible(true); }, { threshold: 0.2 });
        if (certRef.current)
            obs.observe(certRef.current);
        return () => obs.disconnect();
    }, []);
    return (<>
      {/* Hero */}
      <HeroCarousel onShopNow={() => navigate('/products')}/>

      {/* Category Icons */}
      <section className="border-b border-gray-100 py-6 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto scrollbar-hide justify-start lg:justify-center pb-1">
            {CATEGORIES.map((cat, i) => <CategoryIcon key={cat.label} cat={cat} index={i}/>)}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Bestsellers</h2>
            <p className="text-gray-500 text-sm mt-2">Our most loved organic products</p>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTS.slice(0, 4).map((p) => (<ProductCard key={p.id} product={p} onAddToCart={addToCart}/>))}
          </div>
          <div className="text-center mt-10">
            <Link to="/products" className="inline-block border-2 border-[#2D5A2E] text-[#2D5A2E] font-bold px-8 py-3 rounded-full hover:bg-[#2D5A2E] hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-14 bg-[#FAFAF7] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Why Choose Organic Tattva</h2>
            <div className="w-16 h-1 bg-[#2D5A2E] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            {WHY_ITEMS.map((item, i) => <WhyItem key={item.label} item={item} index={i}/>)}
          </div>
        </div>
      </section>

      {/* Full-width Banner */}
      <section className="relative overflow-hidden" style={{ height: '300px' }}>
        <img src="https://images.unsplash.com/photo-1612869538502-b5baa439abd7?w=1600&h=500&fit=crop&auto=format" alt="Banner" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/20 flex items-center">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full">
            <h3 className="text-white text-3xl lg:text-4xl font-bold max-w-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
              Nothing to Hide,<br /><em>Everything</em> to Show.
            </h3>
            <p className="text-white/80 text-sm mt-3 max-w-sm">Scan the QR code on the packets to view over <strong>250 purity test reports</strong>.</p>
            <button onClick={() => navigate('/products')} className="mt-5 inline-block bg-[#C8952A] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#a87820] transition-all hover:-translate-y-0.5 shadow-lg">
              Shop Now →
            </button>
          </div>
        </div>
      </section>

      {/* Recipes */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Recipes</h2>
            <p className="text-gray-500 text-sm mt-2">Cook with the goodness of organic</p>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOGS.filter(b => b.category === 'Recipes').slice(0, 3).map((recipe) => (<Link key={recipe.id} to={`/blogs/${recipe.slug}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group block hover:-translate-y-1">
                <div className="overflow-hidden">
                  <img src={recipe.img} alt={recipe.title} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"/>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold text-[#2D5A2E] mb-1 leading-snug group-hover:underline">{recipe.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">On {recipe.date}</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{recipe.excerpt}</p>
                </div>
              </Link>))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section ref={certRef} className="py-14 bg-[#F5F1EB]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Organic Certifications</h2>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-20">
            {[
            { content: <><div className="text-xs font-bold text-blue-600">India</div><div className="text-xs font-bold text-green-700">Organic</div><div className="text-[9px] text-gray-500 mt-1">Jaivik Bharat</div></>, round: true },
            { content: <span className="text-xl font-black text-gray-800">Sedex<span className="text-[#E8202A]">®</span></span>, round: false },
            { content: <><div className="text-[10px] font-bold text-[#2D7A3A] uppercase tracking-wider">USDA</div><div className="text-sm font-black text-[#2D7A3A]">ORGANIC</div></>, round: true, border: '#2D7A3A' },
            { content: <svg viewBox="0 0 80 80" className="w-20 h-20"><polygon points="40,4 76,72 4,72" fill="none" stroke="#1a1a1a" strokeWidth="3"/><polygon points="40,76 76,8 4,8" fill="none" stroke="#1a1a1a" strokeWidth="3"/><text x="40" y="46" textAnchor="middle" fontSize="22" fontWeight="bold" fontFamily="serif" fill="#1a1a1a">K</text></svg>, round: false },
        ].map((cert, i) => (<div key={i} className={`${cert.round ? 'w-28 h-28 rounded-full' : 'w-28 h-20 rounded-lg'} bg-white shadow flex items-center justify-center p-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`} style={{
                border: cert.border ? `4px solid ${cert.border}` : undefined,
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s, box-shadow 0.2s, translate 0.2s`,
            }}>
                <div className="flex flex-col items-center">{cert.content}</div>
              </div>))}
          </div>
        </div>
      </section>

      {/* Blogs */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Blogs</h2>
            <p className="text-gray-500 text-sm mt-2">Stories, tips, and knowledge from our organic world</p>
            <div className="w-16 h-1 bg-[#2D5A2E] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOGS.filter(b => b.category !== 'Recipes').slice(0, 3).map((blog) => (<Link key={blog.id} to={`/blogs/${blog.slug}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group block hover:-translate-y-1">
                <div className="overflow-hidden">
                  <img src={blog.img} alt={blog.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"/>
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-wide">{blog.category}</span>
                  <h3 className="text-sm font-bold text-[#2C1A0E] mt-1 mb-2 leading-snug group-hover:text-[#2D5A2E] transition-colors line-clamp-2">{blog.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{blog.excerpt}</p>
                </div>
              </Link>))}
          </div>
          <div className="text-center mt-10">
            <Link to="/blogs" className="inline-block border-2 border-[#2D5A2E] text-[#2D5A2E] font-bold px-8 py-3 rounded-full hover:bg-[#2D5A2E] hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              View All Blogs
            </Link>
          </div>
        </div>
      </section>
    </>);
}
