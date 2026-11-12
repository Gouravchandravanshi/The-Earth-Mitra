import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronDown, ChevronLeft, ChevronRight, Menu, Search, X } from 'lucide-react';
import { PDF_CATEGORIES, categoryPath } from '../data/categories';
import { phoneTestLogin, requestEmailOtp, verifyEmailOtp } from '../api';
import earthMitraLogo from '../assets/logo/IMG_0530.JPG.jpeg';
const HEADER_CATEGORIES = PDF_CATEGORIES.filter(category => ![
    'Wellness', 'Dals & Pulses', 'Salt & Spices', 'Nuts & Seeds',
].includes(category.name));
/* ADDED (new flow): login popup — left-panel feature slides ─────────────────── */
const LOGIN_FEATURES = [
    { icon: '⭐', title: 'Customer-first', sub: 'Putting you in the center' },
    { icon: '🔍', title: 'Transparent', sub: 'Honest from the inside out' },
    { icon: '🌿', title: '100% Organic', sub: 'Tested for 250+ pesticides' },
];
const ANNOUNCEMENTS = [
    'Next Day Delivery Available* | Shop Now',
    'Free Shipping on Orders Above ₹599',
    '100% Organic | Tested for 250+ Pesticides',
];
export default function Navbar({ cartItems, onRemoveCart, user, onLogin, onLogout }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [mobileCategory, setMobileCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const [loginStep, setLoginStep] = useState('email');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [authMessage, setAuthMessage] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [authBusy, setAuthBusy] = useState(false);
    const [featureSlide, setFeatureSlide] = useState(0);
    const [announcementSlide, setAnnouncementSlide] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    useEffect(() => {
        const timer = setInterval(() => setAnnouncementSlide(index => (index + 1) % ANNOUNCEMENTS.length), 4000);
        return () => clearInterval(timer);
    }, []);
    /* Auto-advance left-panel carousel */
    useEffect(() => {
        if (!loginOpen)
            return;
        const t = setInterval(() => setFeatureSlide(s => (s + 1) % LOGIN_FEATURES.length), 3000);
        return () => clearInterval(t);
    }, [loginOpen]);
    function openLogin() { setLoginOpen(true); setLoginStep('email'); setPhone(''); setEmail(''); setOtp(['', '', '', '', '', '']); setAuthMessage(''); setFeatureSlide(0); }
    function closeLogin() { setLoginOpen(false); }
    function handlePhoneSubmit(e) {
        e.preventDefault();
        if (!phone.trim()) return;
        setAuthMessage('');
        setOtp(['', '', '', '']);
        setLoginStep('phone-otp');
    }
    async function handleEmailSubmit(e) {
        e.preventDefault();
        setAuthBusy(true);
        setAuthMessage('');
        try {
            await requestEmailOtp(email.trim());
            setOtp(['', '', '', '', '', '']);
            setLoginStep('email-otp');
        } catch (error) {
            setAuthMessage(error.message);
        } finally {
            setAuthBusy(false);
        }
    }
    function handleOtpChange(i, val) {
        if (!/^\d?$/.test(val))
            return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < otp.length - 1) {
            const el = document.getElementById(`otp-${i + 1}`);
            el?.focus();
        }
    }
    async function handleVerify(e) {
        e.preventDefault();
        const code = otp.join('');
        if (loginStep === 'email-otp' && code.length !== 6) {
            setAuthMessage('Enter the six-digit code sent to your email.');
            return;
        }
        if (loginStep === 'phone-otp' && !code) {
            setAuthMessage('Enter any OTP to continue in test mode.');
            return;
        }
        setAuthBusy(true);
        setAuthMessage('');
        try {
            const signedInUser = loginStep === 'email-otp'
                ? await verifyEmailOtp(email.trim(), code)
                : await phoneTestLogin(`+91${phone}`, code);
            onLogin?.(signedInUser);
            closeLogin();
            navigate('/pages/account');
        } catch (error) {
            setAuthMessage(error.message);
        } finally {
            setAuthBusy(false);
        }
    }
    const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
    return (<>
      {/* Announcement Bar */}
      <div className="bg-[#111111] text-white min-h-[32px] px-2 sm:min-h-[36px] sm:px-5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous announcement"
          onClick={() => setAnnouncementSlide(index => (index - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
          className="hidden h-8 w-8 shrink-0 items-center justify-center text-gray-300 hover:text-white transition-colors sm:flex"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1 overflow-hidden text-center" aria-live="polite">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${announcementSlide * 100}%)` }}
          >
            {ANNOUNCEMENTS.map((announcement) => (
              <span key={announcement} className="w-full shrink-0 whitespace-nowrap px-1 text-[11px] font-normal tracking-wide sm:px-2 sm:text-[14px]">
                {announcement}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Next announcement"
            onClick={() => setAnnouncementSlide(index => (index + 1) % ANNOUNCEMENTS.length)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center text-gray-300 hover:text-white transition-colors sm:flex"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
          <div className="hidden sm:flex items-center gap-3 ml-2 text-gray-400">
            <a href="#" aria-label="Facebook" className="hover:text-white" title="Facebook"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z"/></svg></a>
            <a href="#" aria-label="Instagram" className="hover:text-white" title="Instagram"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/></svg></a>
            <a href="#" aria-label="YouTube" className="hover:text-white" title="YouTube"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.3V8.7l5.8 3.3-5.8 3.3Z"/></svg></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-white" title="LinkedIn"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M5.2 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.5 9h3.4v11.5H3.5V9Zm5.5 0h3.3v1.6h.1A3.6 3.6 0 0 1 15.7 8c3.5 0 4.2 2.3 4.2 5.2v7.3h-3.4V14c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3v6.6H9V9Z"/></svg></a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="relative w-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 h-16 sm:h-[88px] lg:h-auto lg:min-h-[88px] lg:py-3">

          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2 lg:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(open => !open)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} className="text-black">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="text-black">
              <Search size={22} strokeWidth={2.2} />
            </button>
          </div>

          {/* Logo */}
          <Link to="/" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 flex-shrink-0 lg:static lg:translate-x-0 lg:translate-y-0">
            <img src={earthMitraLogo} alt="Earth Mitra Farmers" className="h-14 w-14 object-contain sm:h-20 sm:w-20" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-1 text-base font-medium text-[#2C1A0E] lg:flex" aria-label="Product categories">
            {HEADER_CATEGORIES.map((category, index) => (<div key={category.slug} className="relative" onMouseEnter={() => setActiveDropdown(category.slug)} onMouseLeave={() => setActiveDropdown(null)} onFocus={() => setActiveDropdown(category.slug)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropdown(null); }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setActiveDropdown(null); } }}>
                <div className="flex items-center">
                  <Link to={categoryPath(category)} onClick={() => setActiveDropdown(null)} className="whitespace-nowrap py-3 hover:text-[#2D5A2E]">{category.name}</Link>
                  <button type="button" aria-label={`Show ${category.name} subcategories`} aria-expanded={activeDropdown === category.slug} aria-controls={`category-${category.slug}`} onClick={() => setActiveDropdown(current => current === category.slug ? null : category.slug)} className="rounded px-1 py-3 hover:text-[#2D5A2E]"><ChevronDown size={12} className={`transition-transform duration-200 motion-reduce:transition-none ${activeDropdown === category.slug ? 'rotate-180' : ''}`} /></button>
                </div>
                <div id={`category-${category.slug}`} inert={activeDropdown !== category.slug} aria-hidden={activeDropdown !== category.slug} data-open={activeDropdown === category.slug} className={`category-dropdown absolute top-full z-50 max-h-[65vh] w-52 overflow-y-auto rounded-b-xl border border-[#E7E1D8] bg-white py-2 shadow-xl ${index >= 6 ? 'right-0' : 'left-0'}`}>
                  {category.items.map(item => <Link key={item.label} to={categoryPath(category, item)} onClick={() => setActiveDropdown(null)} className="block px-4 py-3 text-sm font-normal hover:bg-[#F5F1EB] hover:text-[#2D5A2E] focus:bg-[#F5F1EB]">{item.label}</Link>)}
                </div>
              </div>))}
          </div>

          {/* Icons */}
          <div className="hidden items-center gap-2 lg:flex">
            <button onClick={() => setSearchOpen(true)} className="px-1.5 text-black hover:text-[#2D5A2E] transition-colors">
              <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* ADDED (new flow): user icon — opens login popup, or account dropdown after login */}
            {user ? (<div className="relative">
                <button onClick={() => setAccountOpen(o => !o)} className="w-10 h-10 rounded-full bg-[#3B6FE8] text-white text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity">
                  {user.name[0].toUpperCase()}
                </button>
                {accountOpen && (<div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 shadow-xl rounded-xl py-2 w-52 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-[#2C1A0E]">Hey, {user.name}</p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    </div>
                    {[
                    { label: 'Overview', to: '/pages/account' },
                    { label: 'My Orders', to: '/pages/account/orders' },
                    { label: 'Address', to: '/pages/account/address' },
                    { label: 'Profile', to: '/pages/account/profile' },
                ].map(item => (<Link key={item.label} to={item.to} onClick={() => setAccountOpen(false)} className="block px-4 py-2 text-sm text-[#2C1A0E] hover:bg-gray-50 hover:text-[#2D5A2E]">
                        {item.label}
                      </Link>))}
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={() => { onLogout(); setAccountOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                        Logout
                      </button>
                    </div>
                  </div>)}
              </div>) : (<button onClick={openLogin} className="px-1.5 text-black hover:text-[#2D5A2E] transition-colors">
                <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </button>)}

            <button onClick={() => setCartOpen(true)} className="relative px-1.5 text-black hover:text-[#2D5A2E] transition-colors">
              <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {cartCount > 0 && (<span className="absolute -top-1.5 -right-1.5 bg-[#C0392B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>)}
            </button>
          </div>

          <button onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`} className="absolute right-3 top-1/2 -translate-y-1/2 text-black lg:hidden">
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#C0392B] text-[10px] font-bold text-white">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && <div className="fixed inset-0 z-[70] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
        <button type="button" className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu overlay" />
        <aside className="relative flex h-full w-full max-w-[370px] animate-slide-left flex-col bg-[#F8F3EF] shadow-2xl">
          <div className="flex h-12 shrink-0 items-center justify-between px-4">
            <span className="text-xs font-medium tracking-wide text-[#2C1A0E]">MENU</span>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7DED7] text-[#2C1A0E]">
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {HEADER_CATEGORIES.map(category => (
              <div key={category.slug} className="border-b border-[#E4DCD6] text-sm text-[#171717]">
                <button type="button" aria-expanded={mobileCategory === category.slug} aria-controls={`mobile-category-${category.slug}`} onClick={() => setMobileCategory(current => current === category.slug ? null : category.slug)} className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold">{category.name}<ChevronDown size={16} className={`transition-transform duration-200 motion-reduce:transition-none ${mobileCategory === category.slug ? 'rotate-180' : ''}`} /></button>
                <div id={`mobile-category-${category.slug}`} inert={mobileCategory !== category.slug} aria-hidden={mobileCategory !== category.slug} className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${mobileCategory === category.slug ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden">
                <Link to={categoryPath(category)} onClick={() => setMobileMenuOpen(false)} className="block bg-white/50 px-7 py-3 font-medium text-[#2D5A2E]">View all {category.name}</Link>
                {category.items.map(item => <Link key={item.label} to={categoryPath(category, item)} onClick={() => setMobileMenuOpen(false)} className="block bg-white/50 px-7 py-3 hover:bg-white">{item.label}</Link>)}
                </div></div>
              </div>
            ))}
            {user ? <Link to="/pages/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 border-b border-[#E4DCD6] px-4 py-3 text-sm text-[#171717]">{user.name} / My Account</Link> : <button onClick={() => { setMobileMenuOpen(false); openLogin(); }} className="flex w-full items-center gap-3 border-b border-[#E4DCD6] px-4 py-3 text-left text-sm text-[#171717]"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Log in</button>}
          </nav>
          <div className="flex h-16 shrink-0 items-center justify-center gap-6 border-b border-[#E4DCD6] text-[#888]">
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/></svg></a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.3V8.7l5.8 3.3-5.8 3.3Z"/></svg></a>
            <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M5.2 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.5 9h3.4v11.5H3.5V9Zm5.5 0h3.3v1.6h.1A3.6 3.6 0 0 1 15.7 8c3.5 0 4.2 2.3 4.2 5.2v7.3h-3.4V14c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3v6.6H9V9Z"/></svg></a>
          </div>
          <a href="#" onClick={() => setMobileMenuOpen(false)} className="mb-5 ml-5 mt-12 inline-flex w-fit items-center gap-2 rounded bg-[#075B4B] px-3 py-2.5 text-xs font-semibold text-white shadow-sm">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.347-.57-.347"/></svg>
            Order From WhatsApp
          </a>
        </aside>
      </div>}

      {/* Rewards Tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button className="bg-[#2D5A2E] text-white text-xs font-semibold flex flex-col items-center gap-1 px-2 py-4 rounded-l-lg shadow-lg">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          </svg>
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.08em' }}>Rewards</span>
        </button>
      </div>

      {/* WhatsApp */}
      <a href="#" className="fixed bottom-6 left-4 z-40 flex items-center gap-2 bg-[#2D5A2E] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:bg-[#1e3d1f] transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="hidden sm:inline">Order From WhatsApp</span>
      </a>

      {/* ADDED (new flow): ═══ LOGIN MODAL (phone number -> OTP verification) ═══ */}
      {loginOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeLogin}/>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex animate-slide-up">

            {/* LEFT PANEL */}
            <div className="hidden sm:flex flex-col w-[45%] bg-gray-50 border-r border-gray-100 p-8">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-full border-2 border-[#C8952A] bg-amber-50 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-7 h-7">
                    <path d="M20 8 Q28 14 28 22 Q28 30 20 34 Q12 30 12 22 Q12 14 20 8Z" fill="#2D5A2E"/>
                    <circle cx="20" cy="20" r="4" fill="#C8952A"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 tracking-widest">TM</div>
                  <div className="font-bold text-base text-[#2C1A0E] leading-tight">organic tattva</div>
                </div>
              </div>

              <p className="text-lg font-semibold text-[#2C1A0E] mb-8 leading-snug">
                Login now to avail best offers!
              </p>

              {/* Feature carousel */}
              <div className="mt-auto">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-h-[72px] flex items-center gap-3 transition-all duration-500">
                  <span className="text-2xl">{LOGIN_FEATURES[featureSlide].icon}</span>
                  <div>
                    <div className="font-semibold text-[#2C1A0E] text-sm">{LOGIN_FEATURES[featureSlide].title}</div>
                    <div className="text-xs text-gray-500">{LOGIN_FEATURES[featureSlide].sub}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 justify-center mt-3">
                  {LOGIN_FEATURES.map((_, i) => (<button key={i} onClick={() => setFeatureSlide(i)} className={`rounded-full transition-all duration-300 ${i === featureSlide ? 'w-5 h-2 bg-[#2C1A0E]' : 'w-2 h-2 bg-gray-300'}`}/>))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 p-8 relative">
              <button onClick={closeLogin} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors text-xl">
                ×
              </button>

              {loginStep === 'email' || loginStep === 'phone' ? (<>
                  <h2 className="text-2xl font-bold text-[#2C1A0E] mb-5 text-center">Login here!</h2>
                  <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
                    <button type="button" onClick={() => { setLoginStep('email'); setAuthMessage(''); }} className={`flex-1 py-2 text-sm rounded-md ${loginStep === 'email' ? 'bg-white shadow font-semibold' : 'text-gray-500'}`}>Email OTP</button>
                    <button type="button" onClick={() => { setLoginStep('phone'); setAuthMessage(''); }} className={`flex-1 py-2 text-sm rounded-md ${loginStep === 'phone' ? 'bg-white shadow font-semibold' : 'text-gray-500'}`}>Phone test login</button>
                  </div>
                  {loginStep === 'email' ? <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <input type="email" autoFocus autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#2C1A0E]" required/>
                    <button type="submit" disabled={authBusy} className="w-full bg-[#4A4A4A] text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60">{authBusy ? 'Sending code...' : 'Send email code'}</button>
                    <p className="text-center text-xs text-gray-500">We will email you a one-time sign-in code.</p>
                  </form> : <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#2C1A0E]">
                      <span className="px-3 py-3 text-sm border-r border-gray-300">+91</span>
                      <input type="tel" autoFocus value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="Enter Mobile Number" className="flex-1 px-3 py-3 text-sm outline-none" required/>
                    </div>
                    <button type="submit" className="w-full bg-[#4A4A4A] text-white font-semibold py-3 rounded-lg text-sm">Continue</button>
                    <p className="text-center text-xs text-amber-700">Test login: any number and any OTP work.</p>
                  </form>}
                  {authMessage && <p role="alert" className="text-xs text-red-600 mt-3">{authMessage}</p>}
                </>) : (<>
                  <h2 className="text-2xl font-bold text-[#2C1A0E] mb-2 text-center">OTP Verification</h2>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    {loginStep === 'email-otp' ? <>Enter the code sent to <strong className="text-[#2C1A0E]">{email}</strong></> : <>Enter any code for <strong className="text-[#2C1A0E]">+91 {phone}</strong></>}{' '}
                    <button type="button" onClick={() => { setLoginStep(loginStep === 'email-otp' ? 'email' : 'phone'); setAuthMessage(''); }} className="text-blue-500">Edit</button>
                  </p>
                  <form onSubmit={handleVerify} className="space-y-5">
                    <div className="flex gap-2 justify-center">
                      {otp.slice(0, loginStep === 'email-otp' ? 6 : 4).map((digit, i) => (<input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0)
                            document.getElementById(`otp-${i - 1}`)?.focus();
                    }} className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-[#2C1A0E] transition-colors" autoFocus={i === 0}/>))}
                    </div>
                    <button type="submit" disabled={authBusy} className="w-full bg-[#4A4A4A] text-white font-semibold py-3 rounded-lg text-sm hover:bg-[#333] transition-colors disabled:opacity-60">{authBusy ? 'Signing in...' : 'Verify'}</button>
                    {authMessage && <p role="alert" className="text-xs text-red-600">{authMessage}</p>}
                    {loginStep === 'email-otp' && <button type="button" disabled={authBusy} onClick={handleEmailSubmit} className="w-full text-sm text-blue-600 disabled:opacity-60">Resend code</button>}
                  </form>
                </>)}
            </div>
          </div>
        </div>)}

      {/* ═══ SEARCH OVERLAY ════════════════════════════════ */}
      {searchOpen && (<div className="fixed inset-0 z-50 bg-white/96 backdrop-blur-sm flex flex-col">
          <div className="max-w-3xl mx-auto w-full px-4 pt-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-500 tracking-widest uppercase">Switch to Purity, Switch to Organic</span>
              <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="flex items-center border-b-2 border-[#2D5A2E] pb-3 gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') {
            navigate(searchQuery.trim() ? `/products?search=${encodeURIComponent(searchQuery.trim())}` : '/products');
            setSearchOpen(false);
          } }} placeholder="Search products" className="flex-1 text-lg outline-none bg-transparent text-[#2C1A0E] placeholder-gray-400"/>
            </div>
          </div>
        </div>)}

      {/* ═══ CART DRAWER ═══════════════════════════════════ */}
      {cartOpen && (<div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)}/>
          <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#2C1A0E]">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            {cartItems.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
                <svg className="w-20 h-20 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <p className="text-sm font-medium">Your Cart is Empty</p>
                <button onClick={() => { setCartOpen(false); navigate('/products'); }} className="text-xs text-[#2D5A2E] font-semibold border border-[#2D5A2E] px-4 py-2 rounded hover:bg-[#2D5A2E] hover:text-white transition-colors">
                  CONTINUE SHOPPING
                </button>
              </div>) : (<>
                <div className="bg-amber-50 px-5 py-2 text-xs text-amber-800 font-medium">
                  Unlock 5 FREE Gifts on Orders Above ₹3,999
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {cartItems.map(item => (<div key={item.id} className="flex items-center gap-3">
                      <img src={item.img} alt={item.name} className="w-14 h-14 object-cover rounded border border-gray-100"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2C1A0E] line-clamp-2">{item.name}</p>
                        {item.weight && <p className="text-xs text-gray-400">{item.weight}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-[#2D5A2E]">₹{item.price * item.qty}</span>
                          <span className="text-xs text-gray-400">× {item.qty}</span>
                        </div>
                      </div>
                      <button onClick={() => onRemoveCart(item.id)} className="text-gray-300 hover:text-red-400 transition-colors text-xl">×</button>
                    </div>))}
                </div>
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Subtotal · {cartItems.length} items</span>
                    <span className="font-bold">₹{cartTotal}</span>
                  </div>
                  {/* ADDED (new flow): Checkout button now opens the checkout page */}
                  <button onClick={() => { setCartOpen(false); navigate('/checkout'); }} className="w-full bg-[#2C1A0E] text-white font-bold py-3 rounded mt-3 hover:bg-black transition-colors tracking-wide text-sm">
                    CHECKOUT NOW
                  </button>
                </div>
              </>)}
          </div>
        </div>)}
    </>);
}
