import { useState } from 'react';
import { Link } from 'react-router';
const EXPLORE = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'Collections', to: '/collections' },
    { label: 'Blogs', to: '/blogs' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
];
const POLICIES = [
    { label: 'Privacy Policy', to: '/' },
    { label: 'Refund Policy', to: '/' },
    { label: 'Shipping Policy', to: '/' },
    { label: 'Terms of Service', to: '/' },
    { label: 'Cancellation Policy', to: '/' },
];
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'];
const SOCIALS = [
    {
        name: 'Facebook',
        icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>),
    },
    {
        name: 'Instagram',
        icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>),
    },
    {
        name: 'YouTube',
        icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM10 15.5l.01-7 6 3.5-6.01 3.5z"/>
      </svg>),
    },
    {
        name: 'LinkedIn',
        icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
      </svg>),
    },
];
const PAYMENT_ICONS = [
    { label: 'Visa', bg: '#1A1F71', text: 'white', abbr: 'VISA', style: { fontStyle: 'italic', fontSize: '9px', fontWeight: 700 } },
    { label: 'Mastercard', bg: '#EB001B', text: 'white', abbr: 'MC', style: { fontSize: '9px', fontWeight: 700 } },
    { label: 'RuPay', bg: '#008C44', text: 'white', abbr: 'RuPay', style: { fontSize: '7px', fontWeight: 700 } },
    { label: 'UPI', bg: '#6B3FA0', text: 'white', abbr: 'UPI', style: { fontSize: '9px', fontWeight: 700 } },
    { label: 'PayTM', bg: '#00BAF2', text: 'white', abbr: 'Paytm', style: { fontSize: '7px', fontWeight: 700 } },
    { label: 'Amazon Pay', bg: '#FF9900', text: 'white', abbr: 'APay', style: { fontSize: '7px', fontWeight: 700 } },
    { label: 'LazyPay', bg: '#F15A29', text: 'white', abbr: 'Lazy', style: { fontSize: '7px', fontWeight: 700 } },
];
export default function Footer() {
    const [email, setEmail] = useState('');
    const [subbed, setSubbed] = useState(false);
    function handleSubscribe(e) {
        e.preventDefault();
        if (email) {
            setSubbed(true);
            setEmail('');
        }
    }
    return (<footer style={{ backgroundColor: '#2D3B2E' }} className="text-white">
      {/* Top strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-[#C8952A] bg-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-7 h-7">
                    <path d="M20 8 Q28 14 28 22 Q28 30 20 34 Q12 30 12 22 Q12 14 20 8Z" fill="#C8952A" opacity="0.9"/>
                    <circle cx="20" cy="20" r="4" fill="#fff"/>
                  </svg>
                </div>
                <span className="font-bold text-base tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>organic tattva</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-5">
                A natural way of life. Pure, organic, and ethically sourced food products for a healthier you and a healthier planet.
              </p>
              <div className="flex gap-2">
                {SOCIALS.map(s => (<a key={s.name} href="#" aria-label={s.name} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/15 hover:text-white hover:border-white/40 transition-all">
                    {s.icon}
                  </a>))}
              </div>
            </div>

            {/* Explore */}
            <div>
              <div className="text-sm font-semibold text-[#C8952A] mb-4 uppercase tracking-wider">Explore</div>
              <ul className="space-y-2.5">
                {EXPLORE.map(l => (<li key={l.label}>
                    <Link to={l.to} className="text-xs text-white/60 hover:text-white transition-colors">{l.label}</Link>
                  </li>))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <div className="text-sm font-semibold text-[#C8952A] mb-4 uppercase tracking-wider">Policies</div>
              <ul className="space-y-2.5">
                {POLICIES.map(l => (<li key={l.label}>
                    <a href="#" className="text-xs text-white/60 hover:text-white transition-colors">{l.label}</a>
                  </li>))}
              </ul>
            </div>

            {/* Cities */}
            <div>
              <div className="text-sm font-semibold text-[#C8952A] mb-4 uppercase tracking-wider">Cities We Serve</div>
              <ul className="space-y-2.5">
                {CITIES.map(city => (<li key={city}>
                    <span className="text-xs text-white/60">{city}</span>
                  </li>))}
              </ul>
            </div>

            {/* Subscribe */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <div className="text-sm font-semibold text-[#C8952A] mb-4 uppercase tracking-wider">Subscribe</div>
              <p className="text-xs text-white/60 leading-relaxed mb-4">
                Get exclusive offers, recipes, and organic living tips straight to your inbox.
              </p>
              {subbed ? (<p className="text-xs text-green-400 font-medium">✓ You're subscribed!</p>) : (<form onSubmit={handleSubscribe} className="flex gap-2">
                  <input type="email" value={email} placeholder="Your email" onChange={e => setEmail(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#C8952A] transition-all"/>
                  <button type="submit" className="bg-[#C8952A] hover:bg-[#b07e22] text-white rounded-lg px-3 py-2.5 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </form>)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© 2026 Organic Tattva Pvt. Ltd. All rights reserved.</p>

          {/* We Accept */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 mr-1">We Accept</span>
            {PAYMENT_ICONS.map(p => (<span key={p.label} className="h-6 min-w-[36px] rounded flex items-center justify-center px-1" style={{ backgroundColor: p.bg, color: p.text, ...p.style }}>
                {p.abbr}
              </span>))}
          </div>
        </div>
      </div>
    </footer>);
}
