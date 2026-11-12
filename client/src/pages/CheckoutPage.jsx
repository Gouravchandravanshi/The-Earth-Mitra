import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { applyCheckoutCoupon, createGuestRazorpayOrder, verifyGuestPayment } from '../api';

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'];
const blankAddress = () => ({ firstName: '', lastName: '', company: '', street: '', apartment: '', city: '', state: 'Madhya Pradesh', pincode: '', phone: '' });
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

let razorpayScript;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScript) {
    razorpayScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { razorpayScript = null; reject(new Error('Could not load Razorpay. Check your internet connection and try again.')); };
      document.body.appendChild(script);
    });
  }
  return razorpayScript;
}

function AddressFields({ address, setAddress, prefix = 'shipping' }) {
  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2C1A0E]';
  const set = (field, value) => setAddress(current => ({ ...current, [field]: value }));
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <input aria-label={`${prefix} first name`} placeholder="First name" required maxLength={80} autoComplete="given-name" value={address.firstName} onChange={e => set('firstName', e.target.value)} className={inputClass}/>
      <input aria-label={`${prefix} last name`} placeholder="Last name" required maxLength={80} autoComplete="family-name" value={address.lastName} onChange={e => set('lastName', e.target.value)} className={inputClass}/>
    </div>
    <input placeholder="Company (optional)" maxLength={120} value={address.company} onChange={e => set('company', e.target.value)} className={inputClass}/>
    <input placeholder="Address" required maxLength={240} autoComplete="street-address" value={address.street} onChange={e => set('street', e.target.value)} className={inputClass}/>
    <input placeholder="Apartment, suite, etc. (optional)" maxLength={120} value={address.apartment} onChange={e => set('apartment', e.target.value)} className={inputClass}/>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <input placeholder="City" required maxLength={100} autoComplete="address-level2" value={address.city} onChange={e => set('city', e.target.value)} className={inputClass}/>
      <select aria-label={`${prefix} state`} value={address.state} onChange={e => set('state', e.target.value)} className={inputClass}>{STATES.map(state => <option key={state}>{state}</option>)}</select>
      <input placeholder="PIN code" required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength={6} value={address.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass}/>
    </div>
    <input placeholder="10 digit mobile number" required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} value={address.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClass}/>
  </div>;
}

export default function CheckoutPage() {
  const { cartItems, clearCart } = useOutletContext();
  const [email, setEmail] = useState('');
  const [delivery, setDelivery] = useState(blankAddress);
  const [billing, setBilling] = useState(blankAddress);
  const [billingMode, setBillingMode] = useState('same');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0), [cartItems]);
  const shipping = subtotal >= 599 ? 0 : (subtotal > 0 ? 49 : 0);
  const discount = coupon?.code ? Math.min(subtotal, Number(coupon.discount || 0)) : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  async function handleApplyCoupon() {
    setCouponMessage('');
    if (!couponInput.trim()) return setCouponMessage('Enter a coupon code first.');
    setCouponBusy(true);
    try {
      const result = await applyCheckoutCoupon(couponInput.trim(), subtotal);
      setCoupon(result);
      setCouponInput(result.code);
      setCouponMessage(`${result.code} applied. You save ${money(result.discount)}.`);
    } catch (err) {
      setCoupon(null);
      setCouponMessage(err.message || 'That coupon could not be applied.');
    } finally {
      setCouponBusy(false);
    }
  }

  async function handlePay(event) {
    event.preventDefault();
    if (!cartItems.length) return setError('Your cart is empty. Add a product before checkout.');
    setBusy(true);
    setError('');
    try {
      await loadRazorpay();
      const checkout = await createGuestRazorpayOrder({
        email,
        items: cartItems.map(item => ({ productId: item.id || item._id, qty: Number(item.qty) })),
        shippingAddress: delivery,
        billingAddress: billingMode === 'same' ? delivery : billing,
        couponCode: coupon?.code || '',
      });
      const options = {
        key: checkout.key_id,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'Earth Mitra',
        description: 'Your Earth Mitra order',
        order_id: checkout.razorpay_order_id,
        prefill: checkout.customer,
        theme: { color: '#3B2314' },
        handler: async payment => {
          try {
            const result = await verifyGuestPayment(payment);
            setPlacedOrder(result.order);
            clearCart?.();
          } catch (verificationError) {
            setError(verificationError.message || 'Payment could not be verified. If you were charged, contact support with your payment reference.');
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', response => {
        setError(response.error?.description || 'Payment did not complete. You can try again.');
        setBusy(false);
      });
      razorpay.open();
    } catch (err) {
      setError(err.message || 'Unable to start checkout. Please try again.');
      setBusy(false);
    }
  }

  if (placedOrder) return <main className="grid min-h-[75vh] place-items-center px-5 py-12">
    <section className="w-full max-w-xl rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-green-700 text-2xl text-white">✓</div>
      <h1 className="text-2xl font-bold text-[#2C1A0E]">Order placed successfully</h1>
      <p className="mt-3 text-sm text-gray-700">We’ll send order updates to <strong>{email}</strong>.</p>
      <p className="mt-2 text-sm text-gray-700">Order reference: <strong>{placedOrder._id}</strong></p>
      <p className="mt-2 text-lg font-bold text-[#2C1A0E]">Total paid: {money(placedOrder.totalAmount)}</p>
      <Link to="/" className="mt-7 inline-flex rounded-lg bg-[#3B2314] px-6 py-3 font-semibold text-white">Continue shopping</Link>
    </section>
  </main>;

  return <div className="min-h-screen bg-white">
    <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-8">
      <Link to="/" className="text-lg font-bold text-[#2C1A0E]">The Earth Mitra</Link>
      <span className="text-xs text-gray-500">Secure guest checkout · No account OTP required</span>
    </header>
    <form onSubmit={handlePay} className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-14">
      <section className="order-2 px-5 py-8 sm:px-8 lg:order-1 lg:pl-10">
        <div className="mb-8">
          <h1 className="mb-4 text-xl font-bold text-[#2C1A0E]">Contact</h1>
          <input type="email" required autoComplete="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2C1A0E]"/>
          <p className="mt-2 text-xs text-gray-500">We’ll email your order confirmation and delivery updates. No OTP is needed for this guest checkout.</p>
        </div>
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-[#2C1A0E]">Delivery · India</h2>
          <AddressFields address={delivery} setAddress={setDelivery}/>
        </div>
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-[#2C1A0E]">Shipping method</h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{shipping === 0 ? 'Free shipping on orders of ₹599 or more' : `Standard shipping · ${money(shipping)}`}</div>
        </div>
        <div className="mb-8">
          <h2 className="mb-1 text-lg font-bold text-[#2C1A0E]">Payment</h2>
          <p className="mb-3 text-xs text-gray-500">Pay securely by UPI, card, net banking, or other methods supported by Razorpay.</p>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-medium text-[#2C1A0E]">🔒 Razorpay Secure Checkout</div>
        </div>
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-[#2C1A0E]">Billing address</h2>
          <div className="overflow-hidden rounded-lg border border-gray-300">
            <label className="flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-3 text-sm"><input type="radio" name="billing" checked={billingMode === 'same'} onChange={() => setBillingMode('same')} className="accent-green-800"/> Same as delivery address</label>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm"><input type="radio" name="billing" checked={billingMode === 'different'} onChange={() => setBillingMode('different')} className="accent-green-800"/> Use a different billing address</label>
          </div>
          {billingMode === 'different' && <div className="mt-4"><AddressFields address={billing} setAddress={setBilling} prefix="billing"/></div>}
        </div>
        <button type="submit" disabled={busy || !cartItems.length} className="w-full rounded-lg bg-[#3B2314] py-4 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? <span className="inline-flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> Starting secure checkout…</span> : `Pay ${money(total)} now`}
        </button>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 text-center text-xs text-gray-500">Payment and order are confirmed only after the server verifies Razorpay.</p>
      </section>

      <aside className="order-1 border-b border-gray-200 bg-gray-50 px-5 py-8 sm:px-8 lg:order-2 lg:border-b-0 lg:border-l lg:px-7">
        <h2 className="mb-5 text-lg font-bold text-[#2C1A0E]">Order summary</h2>
        <div className="mb-6 space-y-4">
          {cartItems.length ? cartItems.map((item, index) => <div key={item.id || item._id || index} className="flex items-center gap-3">
            <div className="relative shrink-0"><img src={item.img || item.image || ''} alt={item.name} className="size-14 rounded-lg border border-gray-200 bg-white object-cover"/><span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gray-600 text-[10px] font-bold text-white">{item.qty}</span></div>
            <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium text-[#2C1A0E]">{item.name}</p>{item.weight && <p className="text-xs text-gray-500">{item.weight}</p>}</div>
            <span className="shrink-0 text-sm font-semibold">{money(Number(item.price) * Number(item.qty))}</span>
          </div>) : <p className="py-5 text-center text-sm text-gray-500">Your cart is empty.</p>}
        </div>
        <div className="mb-6 flex gap-2">
          <input aria-label="Discount code" placeholder="Discount code" value={couponInput} onChange={e => { setCouponInput(e.target.value); setCoupon(null); setCouponMessage(''); }} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2C1A0E]"/>
          <button type="button" onClick={handleApplyCoupon} disabled={couponBusy || !cartItems.length} className="rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-[#2C1A0E] hover:bg-gray-100 disabled:opacity-60">{couponBusy ? 'Applying…' : 'Apply'}</button>
        </div>
        {couponMessage && <p role="status" className={`-mt-4 mb-4 text-xs ${coupon?.code ? 'text-green-700' : 'text-red-700'}`}>{couponMessage}</p>}
        <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal · {cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)} items</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount ({coupon.code})</span><span>−{money(discount)}</span></div>}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4"><span className="font-bold text-[#2C1A0E]">Total</span><span className="text-2xl font-black text-[#2C1A0E]">{money(total)}</span></div>
        <Link to="/products" className="mt-6 inline-block text-sm text-[#3B2314] underline">Continue shopping</Link>
      </aside>
    </form>
  </div>;
}
