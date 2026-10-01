import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router';
/* ADDED (new flow): Checkout page — contact, delivery address, payment, billing, discount code and order summary.
   Payment is mocked: "Pay now" shows an order-placed screen, then redirects to /pages/account. */
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'];
export default function CheckoutPage() {
    const { cartItems } = useOutletContext();
    const navigate = useNavigate();
    const [contact, setContact] = useState({ email: '', notify: true });
    const [delivery, setDelivery] = useState({ country: 'India', firstName: '', lastName: '', company: '', address: '', apt: '', city: '', state: 'Madhya Pradesh', pin: '', phone: '', save: false });
    const [payment, setPayment] = useState('razorpay');
    const [billing, setBilling] = useState('same');
    const [discount, setDiscount] = useState('');
    const [placed, setPlaced] = useState(false);
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    function handlePay(e) {
        e.preventDefault();
        setPlaced(true);
        setTimeout(() => navigate('/pages/account'), 2500);
    }
    if (placed)
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-sm mx-4 animate-slide-up">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#2C1A0E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Order Placed!</h2>
        <p className="text-sm text-gray-500 mb-2">Thank you for choosing Organic Tattva.</p>
        <p className="text-xs text-gray-400">Redirecting to your account…</p>
      </div>
    </div>);
    return (<div className="min-h-screen bg-white">
      {/* Minimal checkout header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border-2 border-[#C8952A] bg-amber-50 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-6 h-6">
              <path d="M20 8 Q28 14 28 22 Q28 30 20 34 Q12 30 12 22 Q12 14 20 8Z" fill="#2D5A2E"/>
              <circle cx="20" cy="20" r="4" fill="#C8952A"/>
            </svg>
          </div>
          <span className="font-bold text-lg text-[#2C1A0E]">organic tattva</span>
        </Link>
        <Link to="/products">
          <svg className="w-6 h-6 text-[#2C1A0E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </Link>
      </header>

      <form onSubmit={handlePay}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_420px] gap-0">

          {/* ── LEFT: Form ─────────────────────────────────── */}
          <div className="px-6 py-8 lg:pr-10 order-2 lg:order-1">

            {/* Contact */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[#2C1A0E]">Contact</h2>
                <Link to="/" className="text-sm text-blue-500 hover:underline">Sign in</Link>
              </div>
              <input type="text" placeholder="Email or mobile phone number" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] focus:ring-1 focus:ring-[#2C1A0E]/20 transition-all"/>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={contact.notify} onChange={e => setContact(c => ({ ...c, notify: e.target.checked }))} className="w-4 h-4 rounded accent-[#2D5A2E]"/>
                <span className="text-sm text-gray-600">Email me with news and offers</span>
              </label>
            </div>

            {/* Delivery */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Delivery</h2>
              <div className="space-y-3">
                {/* Country */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <label className="block text-[10px] text-gray-500 px-4 pt-2">Country/Region</label>
                  <select value={delivery.country} onChange={e => setDelivery(d => ({ ...d, country: e.target.value }))} className="w-full px-4 pb-3 text-sm outline-none bg-white">
                    <option>India</option>
                  </select>
                </div>

                {/* First + Last name */}
                <div className="grid grid-cols-2 gap-3">
                  {[
            { placeholder: 'First name', key: 'firstName' },
            { placeholder: 'Last name', key: 'lastName' },
        ].map(f => (<input key={f.key} placeholder={f.placeholder} value={delivery[f.key]} onChange={e => setDelivery(d => ({ ...d, [f.key]: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all"/>))}
                </div>

                {/* Company */}
                <input placeholder="Company (optional)" value={delivery.company} onChange={e => setDelivery(d => ({ ...d, company: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all"/>

                {/* Address */}
                <div className="relative">
                  <input placeholder="Address" required value={delivery.address} onChange={e => setDelivery(d => ({ ...d, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all pr-10"/>
                  <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>

                {/* Apt */}
                <input placeholder="Apartment, suite, etc. (optional)" value={delivery.apt} onChange={e => setDelivery(d => ({ ...d, apt: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all"/>

                {/* City / State / PIN */}
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="City" required value={delivery.city} onChange={e => setDelivery(d => ({ ...d, city: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all"/>
                  <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                    <label className="block text-[9px] text-gray-500 px-3 pt-1.5">State</label>
                    <select value={delivery.state} onChange={e => setDelivery(d => ({ ...d, state: e.target.value }))} className="w-full px-3 pb-2 text-sm outline-none bg-white text-[#2C1A0E]">
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <input placeholder="PIN code" required value={delivery.pin} onChange={e => setDelivery(d => ({ ...d, pin: e.target.value }))} className="border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all"/>
                </div>

                {/* Phone */}
                <div className="relative">
                  <input placeholder="Phone" required value={delivery.phone} onChange={e => setDelivery(d => ({ ...d, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2C1A0E] transition-all pr-10"/>
                  <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={delivery.save} onChange={e => setDelivery(d => ({ ...d, save: e.target.checked }))} className="w-4 h-4 rounded accent-[#2D5A2E]"/>
                  <span className="text-sm text-gray-600">Save this information for next time</span>
                </label>
              </div>
            </div>

            {/* Shipping method */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Shipping method</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 text-sm text-gray-500 text-center">
                Enter your shipping address to view available shipping methods.
              </div>
            </div>

            {/* Payment */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-1">Payment</h2>
              <p className="text-xs text-green-600 mb-4 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                </svg>
                All transactions are secure and encrypted.
              </p>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Razorpay */}
                <label className={`flex items-center justify-between px-4 py-4 cursor-pointer ${payment === 'razorpay' ? 'bg-blue-50 border-b border-blue-200' : 'border-b border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="razorpay" checked={payment === 'razorpay'} onChange={() => setPayment('razorpay')} className="accent-[#2D5A2E]"/>
                    <span className="text-sm font-medium text-[#2C1A0E]">Razorpay Secure (UPI, Card, Int'l Card, Apple Pay)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">VISA</span>
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MC</span>
                    <span className="text-xs text-gray-400 font-medium">+12</span>
                  </div>
                </label>

                {payment === 'razorpay' && (<div className="px-4 py-3 bg-blue-50 text-xs text-gray-600 border-b border-blue-200">
                    You'll be redirected to Razorpay Secure (UPI, Card, Int'l Card, Apple Pay) to complete your purchase
                  </div>)}

                {/* PayU */}
                <label className={`flex items-center justify-between px-4 py-4 cursor-pointer ${payment === 'payu' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="payu" checked={payment === 'payu'} onChange={() => setPayment('payu')} className="accent-[#2D5A2E]"/>
                    <span className="text-sm text-[#2C1A0E]">Cards, UPI, NB, Wallets, BNPL, EMI by PayU India</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">VISA</span>
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MC</span>
                    <span className="text-xs text-gray-400 font-medium">+11</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Billing address */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-3">Billing address</h2>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <label className={`flex items-center gap-3 px-4 py-4 cursor-pointer border-b border-gray-200 ${billing === 'same' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="billing" value="same" checked={billing === 'same'} onChange={() => setBilling('same')} className="accent-[#2D5A2E]"/>
                  <span className="text-sm font-medium text-[#2C1A0E]">Same as shipping address</span>
                </label>
                <label className={`flex items-center gap-3 px-4 py-4 cursor-pointer ${billing === 'different' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="billing" value="different" checked={billing === 'different'} onChange={() => setBilling('different')} className="accent-[#2D5A2E]"/>
                  <span className="text-sm text-[#2C1A0E]">Use a different billing address</span>
                </label>
              </div>
            </div>

            {/* Pay now button */}
            <button type="submit" className="w-full py-4 rounded-lg text-white font-bold text-base transition-all hover:opacity-90" style={{ backgroundColor: '#3B2314' }}>
              Pay now
            </button>

            {/* Footer links */}
            <div className="flex gap-4 mt-6 text-xs text-gray-400">
              <a href="#" className="hover:underline">Refund policy</a>
              <a href="#" className="hover:underline">Privacy policy</a>
              <a href="#" className="hover:underline">Terms of service</a>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ────────────────────────── */}
          <div className="bg-gray-50 border-l border-gray-200 px-6 py-8 order-1 lg:order-2">
            {/* Items */}
            <div className="space-y-4 mb-6">
              {cartItems.length === 0 ? (<p className="text-sm text-gray-400 text-center py-4">No items in cart</p>) : (cartItems.map(item => (<div key={item.id} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={item.img} alt={item.name} className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-white"/>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2C1A0E] line-clamp-2">{item.name}</p>
                      {item.weight && <p className="text-xs text-gray-500">{item.weight}</p>}
                    </div>
                    <span className="text-sm font-semibold text-[#2C1A0E] flex-shrink-0">
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}.00
                    </span>
                  </div>)))}
            </div>

            {/* Discount code */}
            <div className="flex gap-2 mb-6">
              <input placeholder="Discount code or gift card" value={discount} onChange={e => setDiscount(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2C1A0E] bg-white transition-all"/>
              <button type="button" className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-[#2C1A0E] hover:bg-gray-100 transition-colors bg-white">
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal · {cartItems.reduce((s, i) => s + i.qty, 0)} items</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                  </svg>
                  Calculated at next step
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-[#2C1A0E]">Total</span>
              <div className="text-right">
                <span className="text-xs text-gray-500 mr-1">INR</span>
                <span className="text-2xl font-black text-[#2C1A0E]">₹{subtotal.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>);
}
