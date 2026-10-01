import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { NAV_LINKS } from '../data';
/* ADDED (new flow): login popup — left-panel feature slides ─────────────────── */
const LOGIN_FEATURES = [
    { icon: '⭐', title: 'Customer-first', sub: 'Putting you in the center' },
    { icon: '🔍', title: 'Transparent', sub: 'Honest from the inside out' },
    { icon: '🌿', title: '100% Organic', sub: 'Tested for 250+ pesticides' },
];
export default function Navbar({ cartItems, onRemoveCart, user, onLogin, onLogout }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    /* ADDED (new flow): login popup state (phone -> OTP steps) */
    const [loginStep, setLoginStep] = useState('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [resendSecs, setResendSecs] = useState(14);
    const [featureSlide, setFeatureSlide] = useState(0);
    /* Auto-advance left-panel carousel */
    useEffect(() => {
        if (!loginOpen)
            return;
        const t = setInterval(() => setFeatureSlide(s => (s + 1) % LOGIN_FEATURES.length), 3000);
        return () => clearInterval(t);
    }, [loginOpen]);
    /* Resend OTP countdown */
    useEffect(() => {
        if (loginStep !== 'otp')
            return;
        setResendSecs(14);
        const t = setInterval(() => setResendSecs(s => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [loginStep]);
    // ADDED (new flow): open/close login popup, phone submit, OTP input and verify handlers
    function openLogin() { setLoginOpen(true); setLoginStep('phone'); setPhone(''); setOtp(['', '', '', '']); setFeatureSlide(0); }
    function closeLogin() { setLoginOpen(false); }
    function handlePhoneSubmit(e) {
        e.preventDefault();
        if (phone.length < 10)
            return;
        setLoginStep('otp');
    }
    function handleOtpChange(i, val) {
        if (!/^\d?$/.test(val))
            return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 3) {
            const el = document.getElementById(`otp-${i + 1}`);
            el?.focus();
        }
    }
    function handleVerify(e) {
        e.preventDefault();
        // NOTE: mock login (any OTP works). Replace with a real verify-OTP API call when the backend is ready.
        onLogin({ name: 'Gourav', phone: `+91${phone}`, email: '' });
        closeLogin();
        navigate('/pages/account');
    }
    const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
    return (<>
      {/* Announcement Bar */}
      <div className="bg-[#111111] text-white text-sm py-2 px-4 flex items-center justify-between">
        <button className="text-gray-400 hover:text-white">‹</button>
        <span className="tracking-wide text-xs sm:text-sm">Next Day Delivery Available* | Shop Now</span>
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white">›</button>
          <div className="hidden sm:flex items-center gap-3 ml-2 text-gray-400 text-xs">
            <a href="#" className="hover:text-white">f</a>
            <a href="#" className="hover:text-white">in</a>
            <a href="#" className="hover:text-white">yt</a>
            <a href="#" className="hover:text-white">li</a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-11 h-11 rounded-full border-2 border-[#C8952A] flex items-center justify-center bg-amber-50">
              <svg viewBox="0 0 40 40" className="w-8 h-8">
                <circle cx="20" cy="20" r="18" fill="#C8952A" opacity="0.15"/>
                <path d="M20 8 Q28 14 28 22 Q28 30 20 34 Q12 30 12 22 Q12 14 20 8Z" fill="#2D5A2E"/>
                <circle cx="20" cy="20" r="4" fill="#C8952A"/>
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 tracking-widest uppercase leading-none">TM</div>
              <div className="font-bold text-lg text-[#2C1A0E] leading-tight">organic tattva</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#2C1A0E]">
            {NAV_LINKS.map((link) => (<div key={link.label} className="relative group" onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)} onMouseLeave={() => setActiveDropdown(null)}>
                <Link to={link.path} className="flex items-center gap-1 py-1 hover:text-[#2D5A2E] transition-colors whitespace-nowrap">
                  {link.label}
                  {link.dropdown && (<svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 4 L6 8 L10 4"/>
                    </svg>)}
                </Link>
                {link.dropdown && activeDropdown === link.label && link.items && (<div className="absolute top-full left-0 bg-white border border-gray-100 shadow-lg rounded-b-lg min-w-[210px] py-2 z-50">
                    {link.items.map(item => (<Link key={item} to={link.path} className="block px-4 py-2 text-sm text-[#2C1A0E] hover:bg-gray-50 hover:text-[#2D5A2E]">
                        {item}
                      </Link>))}
                  </div>)}
              </div>))}
            <Link to="/about" className="py-1 hover:text-[#2D5A2E] transition-colors whitespace-nowrap">About</Link>
            <Link to="/contact" className="py-1 hover:text-[#2D5A2E] transition-colors whitespace-nowrap">Contact</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(true)} className="text-[#2C1A0E] hover:text-[#2D5A2E] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* ADDED (new flow): user icon — opens login popup, or account dropdown after login */}
            {user ? (<div className="relative">
                <button onClick={() => setAccountOpen(o => !o)} className="w-8 h-8 rounded-full bg-[#3B6FE8] text-white text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity">
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
              </div>) : (<button onClick={openLogin} className="text-[#2C1A0E] hover:text-[#2D5A2E] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </button>)}

            <button onClick={() => setCartOpen(true)} className="relative text-[#2C1A0E] hover:text-[#2D5A2E] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {cartCount > 0 && (<span className="absolute -top-1.5 -right-1.5 bg-[#C0392B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>)}
            </button>
          </div>
        </div>
      </nav>

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

              {loginStep === 'phone' ? (<>
                  <h2 className="text-2xl font-bold text-[#2C1A0E] mb-6 text-center">Login here!</h2>
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="flex gap-0 border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#2C1A0E] focus-within:ring-1 focus-within:ring-[#2C1A0E] transition-all">
                      <span className="bg-white px-3 py-3 text-sm font-medium text-[#2C1A0E] border-r border-gray-300 flex-shrink-0 flex items-center">
                        +91
                      </span>
                      <input type="tel" autoFocus maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="Enter Mobile Number" className="flex-1 px-3 py-3 text-sm outline-none bg-white" required/>
                    </div>
                    <button type="submit" className="w-full bg-[#4A4A4A] text-white font-semibold py-3 rounded-lg text-sm hover:bg-[#333] transition-colors">
                      Submit
                    </button>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="mt-0.5 accent-[#2D5A2E]"/>
                      <span className="text-xs text-gray-500">
                        Notify me with offers &amp; updates&nbsp;
                        <button type="button" className="text-blue-500 hover:underline">Read details</button>
                      </span>
                    </label>
                    <div className="text-center text-xs text-gray-400 mt-4">
                      Powered by&nbsp;
                      <span className="font-bold text-gray-700">Kwik<span className="text-yellow-500">⚡</span>Pass</span>
                    </div>
                  </form>
                </>) : (<>
                  <h2 className="text-2xl font-bold text-[#2C1A0E] mb-2 text-center">OTP Verification</h2>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    Verification code sent to{' '}
                    <strong className="text-[#2C1A0E]">+91 {phone}</strong>{' '}
                    <button onClick={() => setLoginStep('phone')} className="text-blue-500">✏️</button>
                  </p>
                  <form onSubmit={handleVerify} className="space-y-5">
                    {/* OTP boxes */}
                    <div className="flex gap-3 justify-center">
                      {otp.map((digit, i) => (<input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0)
                            document.getElementById(`otp-${i - 1}`)?.focus();
                    }} className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-[#2C1A0E] transition-colors" autoFocus={i === 0}/>))}
                    </div>
                    {/* Resend */}
                    <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                      </svg>
                      {resendSecs > 0 ? (<span>Resend OTP in {resendSecs} Sec</span>) : (<button type="button" onClick={() => setResendSecs(14)} className="text-blue-500 hover:underline">Resend OTP</button>)}
                    </div>
                    <button type="submit" className="w-full bg-[#4A4A4A] text-white font-semibold py-3 rounded-lg text-sm hover:bg-[#333] transition-colors">
                      Verify
                    </button>
                    <div className="text-center text-xs text-gray-400">
                      Powered by&nbsp;
                      <span className="font-bold text-gray-700">Kwik<span className="text-yellow-500">⚡</span>Pass</span>
                    </div>
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
            navigate('/products');
            setSearchOpen(false);
        } }} placeholder="Search for articles" className="flex-1 text-lg outline-none bg-transparent text-[#2C1A0E] placeholder-gray-400"/>
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
