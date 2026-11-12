import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router';
import InstagramReels from '../components/InstagramReels';
import ProductCard from '../components/ProductCard';
import WhyChooseCarousel from '../components/WhyChooseCarousel';
import { ProductGridSkeleton, ContentGridSkeleton, Skeleton } from '../components/Skeleton';
import { BadgePercent, Bean, ChevronLeft, ChevronRight, Citrus, Clock3, Droplet, Flower2, HandHeart, Heart, Milk, Nut, Package, Sparkles, Soup, Tag, Wheat } from 'lucide-react';
import { getBanners, getCollection, getCollections, getContentList, getProducts, toDisplayProduct } from '../api';
import usdaLogo from '../assets/organic certifications/USDA-Logo.avif';
import jaivikBharatLogo from '../assets/organic certifications/a96f9d5db4cd26149505fef674fb262a.png';
import vikasBanner from '../assets/Banner Images/vk_1_resize_desktop_banner.webp';
// import jaggeryBanner from '../assets/Banner Images/jaggery_banner.png';
import riceBanner from '../assets/Banner Images/resize_desktop_banner.webp';
import oilBanner from '../assets/Banner Images/oil_desktop.webp';
import purityBanner from '../assets/Banner Images/Generic-Banner_Jan_2026_4.webp';
import journeyBanner from '../assets/Banner Images/Generic-Banner_Jan_2026_3.webp';
import diwaliBanner from '../assets/Banner Images/Diwali-Banner.webp';
import mobileDiwaliGheeBanner from '../assets/Banner Images/Mobile view/Diwali-Mobile-Banner-ghee.webp';
import mobileJaggeryBanner from '../assets/Banner Images/Mobile view/jaggery_powder.jpeg';
import mobileDiwaliOilBanner from '../assets/Banner Images/Mobile view/Diwali-Mobile-Banner-oil.webp';
import mobileJourneyBanner from '../assets/Banner Images/Mobile view/Generic-Banner_Jan_2026_Mobile-2.webp';
import mobilePurityBanner from '../assets/Banner Images/Mobile view/Generic-Banner_Jan_2026_Mobile-4.webp';
import mobileOilBanner from '../assets/Banner Images/Mobile view/oil_mobile.webp';
import mobileRiceBanner from '../assets/Banner Images/Mobile view/resize_mobile_banner.webp';
import giftBoxBanner from '../assets/Nothing to hide everything to show section/Gift-Box-Diwali-Banner-2.webp';
import giftBoxMobileBanner from '../assets/Nothing to hide everything to show section/For mobile/Gift-Box-Diwali-Mobile-Banner-2.webp';

/* â”€â”€â”€ Hero slides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
        promo: { pct: 20, extra: 'Free shipping above â‚¹599', code: 'ORGANIC20', valid: '30th Sept' },
        bg: 'from-[#f5f0e8] to-[#ede5d8]',
        img: 'https://images.unsplash.com/photo-1704916029292-ec7b5976204c?w=800&h=560&fit=crop&auto=format',
        badgeBg: 'from-[#C8952A] to-[#E8B840]',
    },
];
/* â”€â”€â”€ Category icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CATEGORIES = [
  { icon: Tag, accent: BadgePercent, label: 'Combo & Deals', path: '/collections/combo-deals', anim: 'wiggle' },
  { icon: Nut, accent: Droplet, label: 'Dry Fruits & Nuts', path: '/collections/tea-coffee-healthy', anim: 'bounce' },
  { icon: Package, accent: Wheat, label: 'Flour / Atta & Suji', path: '/collections/atta-rice-dal', anim: 'pop' },
  { icon: HandHeart, accent: Heart, label: 'Health Foods', path: '/collections/tea-coffee-healthy', anim: 'wiggle' },
  { icon: Bean, accent: Citrus, label: 'Pulses & Dal', path: '/collections/atta-rice-dal', anim: 'bounce' },
  { icon: Milk, accent: Droplet, label: 'Oils & Ghee', path: '/collections/masala-oil-more', anim: 'pop' },
  { icon: Clock3, accent: Sparkles, label: 'Ready To Cook', path: '/collections/combo-deals', anim: 'wiggle' },
  { icon: Soup, accent: Wheat, label: 'Rice & Rice Products', path: '/collections/atta-rice-dal', anim: 'bounce' },
  { icon: Milk, accent: Sparkles, label: 'Salts & Sugar', path: '/collections/masala-oil-more', anim: 'pop' },
  { icon: Flower2, accent: Citrus, label: 'Spices & Masalas', path: '/collections/masala-oil-more', anim: 'wiggle' },
];
/* â”€â”€â”€ Animated category icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CategoryIcon({ cat, index }) {
    const [hovered, setHovered] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const Icon = cat.icon;
    const Accent = cat.accent;
    const animationClass = cat.anim === 'wiggle'
        ? 'category-icon-wiggle'
        : cat.anim === 'bounce' ? 'category-icon-bounce' : 'category-icon-pop';
    return (<Link to={cat.path} className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer" onMouseEnter={() => { setHovered(true); setAnimKey(k => k + 1); }} onMouseLeave={() => setHovered(false)} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="relative flex h-16 w-16 items-center justify-center transition-transform duration-300 group-hover:scale-110">
        <Icon key={animKey} size={52} strokeWidth={2.1} className={`category-icon-main text-[#171717] ${hovered ? animationClass : ''}`} />
        <Accent size={23} strokeWidth={2.4} className="category-icon-accent absolute -right-0.5 top-0.5 text-[#E7A321] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
      </div>
      <span className={`text-center whitespace-nowrap text-xs font-medium transition-colors duration-200 lg:text-[13px] ${hovered ? 'text-[#2D5A2E]' : 'text-gray-600'}`}>
        {cat.label}
      </span>
    </Link>);
}

function CategoryCarousel() {
    const scrollRef = useRef(null);
    function scroll(dir) {
        const container = scrollRef.current;
        if (!container) return;
        const firstItem = container.querySelector('[data-category-item]');
        const step = (firstItem?.getBoundingClientRect().width || 80) + 16;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (dir < 0 && container.scrollLeft <= 4) {
            container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else if (dir > 0 && container.scrollLeft >= maxScroll - 4) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: dir * step, behavior: 'smooth' });
        }
    }
    useEffect(() => {
        const timer = setInterval(() => {
            if (window.matchMedia('(max-width: 639px)').matches) scroll(1);
        }, 3000);
        return () => clearInterval(timer);
    }, []);
    return (
      <div className="relative">
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous categories" className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-[#2C1A0E] sm:hidden">
          <ChevronLeft size={20} />
        </button>
        <div ref={scrollRef} className="flex items-start justify-start gap-4 overflow-x-auto scroll-smooth px-8 pb-1 scrollbar-hide lg:justify-center lg:gap-8 lg:px-0">
          {CATEGORIES.map((cat, i) => <div key={cat.label} data-category-item className="shrink-0"><CategoryIcon cat={cat} index={i}/></div>)}
        </div>
        <button type="button" onClick={() => scroll(1)} aria-label="Next categories" className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-[#2C1A0E] sm:hidden">
          <ChevronRight size={20} />
        </button>
      </div>
    );
}
/* â”€â”€â”€ Trusted By Millions reel carousel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
      <div className="max-w-[1680px] mx-auto px-5 lg:px-10 w-full py-12 lg:py-6">
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
        â€¹
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center text-[#2C1A0E] hover:scale-110 transition-all z-20">
        â€º
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (<button key={i} onClick={() => goTo(i, i > current ? 'right' : 'left')} className={`rounded-full transition-all duration-300 ${i === current ? 'w-7 h-2.5 bg-[#2D5A2E]' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'}`}/>))}
      </div>
    </section>);
}

const HOME_BANNERS = [
  { src: vikasBanner, alt: 'Stock up on certified organic goodness', href: '/products' },
  { src: riceBanner, alt: 'Long grain, aged and aromatic organic rice', href: '/collections/atta-rice-dal' },
  { src: oilBanner, alt: 'Get a free oil pourer with every oil bottle purchase', href: '/collections/masala-oil-more' },
  { src: purityBanner, alt: 'Scan the QR code to view product purity test reports', href: '/about' },
  { src: journeyBanner, alt: 'The journey from our farms to your plates', href: '/blogs/farm-to-fork-journey' },
  { src: diwaliBanner, alt: 'Diwali sale on organic essentials', href: '/collections/combo-deals' },
  // { src: jaggeryBanner, alt: 'New arrival: Organic essentials', href: '/collections/organic-essentials' }
];

const MOBILE_BANNERS = [
  { src: mobileRiceBanner, alt: 'Long grain, aged and aromatic organic rice', href: '/collections/atta-rice-dal' },
  { src: mobileOilBanner, alt: 'Get a free oil pourer with every oil bottle purchase', href: '/collections/masala-oil-more' },
  { src: mobilePurityBanner, alt: 'Scan the QR code to view product purity test reports', href: '/about' },
  { src: mobileJourneyBanner, alt: 'The journey from our farms to your plates', href: '/blogs/farm-to-fork-journey' },
  { src: mobileDiwaliOilBanner, alt: 'Diwali sale on organic oils', href: '/collections/combo-deals' },
  { src: mobileDiwaliGheeBanner, alt: 'Diwali sale on pure ghee', href: '/collections/combo-deals' },
  { src: mobileJaggeryBanner, alt: 'MobileJaggeryBanner', href: '/collections/combo-deals' },
];

function BannerImage({ src, alt }) {
  const [status, setStatus] = useState('loading');
  return <div className={`relative ${status === 'loading' ? 'min-h-[440px] sm:min-h-[300px] lg:min-h-[460px]' : ''}`}>
    {status === 'loading' && <div role="status" className="absolute inset-0"><span className="sr-only">Loading banner…</span><Skeleton className="h-full w-full rounded-none" /></div>}
    {status === 'error'
      ? <div className="grid min-h-[300px] place-items-center px-8 text-center text-[#2D5A2E]">{alt}</div>
      : <img src={src} alt={alt} className={`block h-auto w-full ${status === 'loading' ? 'opacity-0' : ''}`} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
  </div>;
}

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const [apiBanners, setApiBanners] = useState(null);
  const touchStartX = useRef(null);
  const suppressBannerClick = useRef(false);
  const banners = apiBanners?.length
    ? apiBanners.map(banner => ({ src: isMobile ? (banner.mobileImage || banner.desktopImage) : (banner.desktopImage || banner.mobileImage), alt: banner.altText || banner.title, href: banner.link || '/products' }))
    : (isMobile ? MOBILE_BANNERS : HOME_BANNERS);

  useEffect(() => {
    let active = true;
    getBanners('hero').then(records => { if (active && records?.length) { setApiBanners(records); setCurrent(0); } }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const handleViewportChange = event => {
      setIsMobile(event.matches);
      setCurrent(0);
    };
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(index => (index + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isMobile, banners.length]);

  function showSlide(index) {
    setCurrent((index + banners.length) % banners.length);
  }

  function handleTouchStart(event) {
    if (event.pointerType !== 'touch') return;
    touchStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTouchEnd(event) {
    if (event.pointerType !== 'touch' || touchStartX.current === null) return;
    const distance = touchStartX.current - event.clientX;
    touchStartX.current = null;
    if (Math.abs(distance) < 40) return;
    suppressBannerClick.current = true;
    showSlide(current + (distance > 0 ? 1 : -1));
  }

  return (
    <section
      className="group relative w-full touch-pan-y overflow-hidden bg-[#F5F1EB]"
      aria-label="Featured offers"
      onPointerDown={handleTouchStart}
      onPointerUp={handleTouchEnd}
      onPointerCancel={() => { touchStartX.current = null; }}
      onClickCapture={event => {
        if (!suppressBannerClick.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressBannerClick.current = false;
      }}
    >
      <div
        className="flex will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)`, transition: 'transform 700ms ease-in-out' }}
      >
        {banners.map((item, index) => (
          <Link
            key={item.src}
            to={item.href}
            aria-label={`Open: ${item.alt}`}
            aria-hidden={index !== current}
            tabIndex={index === current ? 0 : -1}
            className="block w-full shrink-0"
          >
            <BannerImage key={item.src} src={item.src} alt={item.alt} />
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => showSlide(current - 1)}
        aria-label="Previous banner"
        className="absolute left-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-[#2C1A0E] shadow-sm backdrop-blur-sm transition hover:bg-[#C8952A]/90 active:bg-[#C8952A] focus-visible:bg-[#C8952A] sm:left-8 sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <ChevronLeft size={26} />
      </button>
      <button
        type="button"
        onClick={() => showSlide(current + 1)}
        aria-label="Next banner"
        className="absolute right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-[#2C1A0E] shadow-sm backdrop-blur-sm transition hover:bg-[#C8952A]/90 active:bg-[#C8952A] focus-visible:bg-[#C8952A] sm:right-8 sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <ChevronRight size={26} />
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-4" aria-label="Choose banner">
        {banners.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => showSlide(index)}
            aria-label={`Show banner ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
            className={`h-2.5 rounded-full transition-all ${index === current ? 'w-7 bg-[#2D5A2E]' : 'w-2.5 bg-white/80 hover:bg-white'}`}
          />
        ))}
      </div>
    </section>
  );
}
/* â”€â”€â”€ Scrolling announcement text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ANNOUNCEMENTS = [
    'ðŸŒ¿ Get 30% off on your Organic Grocery',
    'ðŸšš Free shipping on orders above â‚¹599',
    'âœ… Tested for 250+ Pesticides',
    'ðŸŽ +3 Free products on every order',
    'ðŸŒ¿ Get 30% off on your Organic Grocery',
    'ðŸšš Free shipping on orders above â‚¹599',
    'âœ… Tested for 250+ Pesticides',
    'ðŸŽ +3 Free products on every order',
];
/* â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function HomePage() {
    const { addToCart } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productLoadError, setProductLoadError] = useState('');
    const [bestsellerProducts, setBestsellerProducts] = useState([]);
    const [bestsellersLoading, setBestsellersLoading] = useState(true);
    const [bestsellersError, setBestsellersError] = useState('');
    const [comboProducts, setComboProducts] = useState([]);
    const [comboLoadError, setComboLoadError] = useState('');
    const [comboLoading, setComboLoading] = useState(true);
    const [blogs, setBlogs] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [editorialLoading, setEditorialLoading] = useState(true);
    useEffect(() => {
        let active = true;
        Promise.all([getContentList('blog'), getContentList('recipe')]).then(([blogPosts, recipePosts]) => {
            if (active) { setBlogs(blogPosts); setRecipes(recipePosts); }
        }).catch(() => {}).finally(() => { if (active) setEditorialLoading(false); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        let active = true;
        getProducts({ limit: 4, sort: 'rating' })
            .then(result => {
                if (active) setProducts(result.products || []);
            })
            .catch(error => { if (active) setProductLoadError(error.message || 'Unable to load products.'); })
            .finally(() => { if (active) setProductsLoading(false); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        let active = true;
        const collectionKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        (async () => {
            const collections = await getCollections();
            const findCollection = names => collections.find(collection => names.includes(collectionKey(collection.name)) || names.includes(collectionKey(collection.slug)));
            const bestsellersCollection = findCollection(['bestseller', 'bestsellers']);
            const combosCollection = findCollection(['exclusivecombo', 'exclusivecombos']);
            const [best, combos] = await Promise.all([
                bestsellersCollection ? getCollection(bestsellersCollection.slug) : Promise.resolve({ products: [] }),
                combosCollection ? getCollection(combosCollection.slug) : Promise.resolve({ products: [] }),
            ]);
            if (active) {
                setBestsellerProducts((best.products || []).map(toDisplayProduct));
                setComboProducts((combos.products || []).map(toDisplayProduct));
            }
        })()
            .catch(error => {
                if (active) {
                    const message = error.message || 'Unable to load collection products.';
                    setBestsellersError(message);
                    setComboLoadError(message);
                }
            })
            .finally(() => { if (active) { setBestsellersLoading(false); setComboLoading(false); } });
        return () => { active = false; };
    }, []);
    const bestsellers = bestsellerProducts;
    const moreProducts = products.slice(0, 4);
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
      {/* Existing hero carousel retained for easy rollback: <HeroCarousel onShopNow={() => navigate('/products')}/> */}
      <BannerCarousel />

      {/* Category Icons */}
      <section className="border-b border-gray-100 py-6 bg-white shadow-sm">
        <div className="max-w-[1680px] mx-auto px-0 lg:px-10">
          <CategoryCarousel />
        </div>
      </section>

      <InstagramReels />

      {/* Bestsellers */}
      <section className="bg-white pt-2 pb-10">
        <div className="mx-auto w-full px-4 lg:px-0" style={{ maxWidth: '1392px' }}>
          <div className="text-center mb-8">
            <h2 className="text-[40px] font-bold leading-tight text-[#2C1A0E]">Bestsellers</h2>
          </div>
          {bestsellersLoading ? <ProductGridSkeleton home label="Loading bestseller products…" />
            : bestsellersError ? <p role="alert" className="py-8 text-center text-sm text-red-700">{bestsellersError}</p>
              : bestsellers.length ? <div className="grid justify-center gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 330px))' }}>
                {bestsellers.map((p) => (<ProductCard key={p.id || p._id || p.slug} product={p} onAddToCart={addToCart}/>))}
              </div>
                : <p className="py-8 text-center text-sm text-gray-500">Add products to your active “Bestsellers” collection to show them here.</p>}
          <div className="text-center mt-10">
            <Link to="/products" className="inline-block border-2 border-[#2D5A2E] text-[#2D5A2E] font-bold px-8 py-3 rounded-full hover:bg-[#2D5A2E] hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Exclusive Combos */}
      <section className="py-14 border-y border-gray-100 bg-[#FAFAF7]">
        <div className="mx-auto w-full px-4 lg:px-0" style={{ maxWidth: '1392px' }}>
          <div className="mb-10 text-center">
            <h2 className="section-heading font-bold text-[#2C1A0E]">Exclusive Combos</h2>
            <p className="mt-2 text-sm text-gray-500">Curated bundles, bigger savings</p>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#C8952A]"/>
          </div>
          {comboLoading ? <ProductGridSkeleton home label="Loading combo products…" />
            : comboLoadError ? <p role="alert" className="py-8 text-center text-sm text-red-700">{comboLoadError}</p>
              : comboProducts.length ? <div className="grid justify-center gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 330px))' }}>
                {comboProducts.map(product => <ProductCard key={product.id || product._id || product.slug} product={{ ...product, cardBadge: 'COMBO' }} onAddToCart={addToCart}/>)}
              </div>
                : <p className="py-8 text-center text-sm text-gray-500">Combo products will appear here when they are added to the catalog.</p>}
        </div>
      </section>

      {/* More products from the catalog API */}
      {(productsLoading || moreProducts.length > 0 || productLoadError) && <section className="py-14 bg-[#FAFAF7] border-y border-gray-100">
        <div className="mx-auto w-full px-4 lg:px-0" style={{ maxWidth: '1392px' }}>
          <div className="text-center mb-10">
            <h2 className="section-heading font-bold text-[#2C1A0E]">More to Explore</h2>
            <p className="text-gray-500 text-sm mt-2">More of our organic essentials</p>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          {productLoadError && <p role="alert" className="mb-5 text-center text-sm text-red-700">{productLoadError}</p>}
          {productsLoading ? <ProductGridSkeleton home label="Loading more products…" /> : <div className="grid justify-center gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 330px))' }}>
            {moreProducts.map(product => <ProductCard key={product.id || product._id || product.slug} product={product} onAddToCart={addToCart}/>)}
          </div>}
        </div>
      </section>}

      {/* Why Choose */}
      <section className="py-14 bg-[#FAFAF7] border-y border-gray-100">
        <div className="max-w-[1680px] mx-auto px-5 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="section-heading font-bold text-[#2C1A0E]">Why Choose Earth Mitra Farmers</h2>
            <div className="w-16 h-1 bg-[#2D5A2E] mx-auto mt-3 rounded-full"/>
          </div>
          <WhyChooseCarousel />
        </div>
      </section>

      {/* Diwali gifting banner */}
      <section aria-label="Diwali gifting" className="diwali-gifting-banner">
        <Link to="/collections/combo-deals" className="diwali-gifting-banner__link">
          <picture className="diwali-gifting-banner__picture">
            <source media="(max-width: 767px)" srcSet={giftBoxMobileBanner} />
            <img src={giftBoxBanner} alt="Elevate your Diwali gifting experience. Discover gift boxes." className="diwali-gifting-banner__image" loading="lazy" />
          </picture>
        </Link>
      </section>
      {/* Recipes */}
      <section className="py-14 bg-white">
        <div className="max-w-[1680px] mx-auto px-5 lg:px-10">
          <div className="text-center mb-10">
            <h2 className="section-heading font-bold text-[#2C1A0E]">Recipes</h2>
            <p className="text-gray-500 text-sm mt-2">Cook with the goodness of organic</p>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editorialLoading && <ContentGridSkeleton label="Loading recipes…" className="md:col-span-3" />}
            {recipes.slice(0, 3).map((recipe) => (<Link key={recipe._id || recipe.slug} to={`/recipes/${recipe.slug}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group block hover:-translate-y-1">
                <div className="overflow-hidden">
                  <img src={recipe.coverImage || vikasBanner} alt={recipe.title} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"/>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold text-[#2D5A2E] mb-1 leading-snug group-hover:underline">{recipe.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{recipe.readTime || 5} min read</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{recipe.excerpt}</p>
                </div>
              </Link>))}
            {!editorialLoading && recipes.length === 0 && <p className="py-8 text-center text-sm text-gray-500 md:col-span-3">No recipes have been published yet.</p>}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section ref={certRef} className="py-14 bg-[#F5F1EB]">
        <div className="max-w-[1680px] mx-auto px-5 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="section-heading font-bold text-[#2C1A0E]">Organic Certifications</h2>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-20">
            {[
              { name: 'Jaivik Bharat', src: jaivikBharatLogo },
              { name: 'USDA Organic', src: usdaLogo },
            ].map((cert, i) => (
              <div
                key={cert.name}
                className="flex h-36 w-36 items-center justify-center rounded-xl bg-white p-4 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  opacity: sectionVisible ? 1 : 0,
                  transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s, box-shadow 0.2s, translate 0.2s`,
                }}
              >
                <img src={cert.src} alt={cert.name} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blogs */}
      <section className="py-14 bg-white">
        <div className="max-w-[1680px] mx-auto px-5 lg:px-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Blogs</h2>
            <p className="text-gray-500 text-sm mt-2">Stories, tips, and knowledge from our organic world</p>
            <div className="w-16 h-1 bg-[#2D5A2E] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editorialLoading && <ContentGridSkeleton label="Loading blog posts…" className="md:col-span-3" />}
            {blogs.slice(0, 3).map((blog) => (<Link key={blog._id || blog.slug} to={`/blogs/${blog.slug}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group block hover:-translate-y-1">
                <div className="overflow-hidden">
                  <img src={blog.coverImage || vikasBanner} alt={blog.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"/>
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold text-[#C8952A] uppercase tracking-wide">{blog.category}</span>
                  <h3 className="text-sm font-bold text-[#2C1A0E] mt-1 mb-2 leading-snug group-hover:text-[#2D5A2E] transition-colors line-clamp-2">{blog.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{blog.excerpt}</p>
                </div>
              </Link>))}
            {!editorialLoading && blogs.length === 0 && <p className="py-8 text-center text-sm text-gray-500 md:col-span-3">No blog posts have been published yet.</p>}
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
