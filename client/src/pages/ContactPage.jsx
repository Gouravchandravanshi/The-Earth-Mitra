import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
function useVisible(threshold = 0.2) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting)
            setVisible(true); }, { threshold });
        if (ref.current)
            obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}
const CONTACT_INFO = [
    {
        icon: '📍',
        title: 'Our Address',
        lines: ['Organic Tattva Foods Pvt. Ltd.', '4th Floor, Tower B, DLF Cyber City', 'Gurugram, Haryana 122002, India'],
    },
    {
        icon: '📞',
        title: 'Call Us',
        lines: ['+91 9667 446 688', 'Mon – Sat: 9 AM – 6 PM IST'],
    },
    {
        icon: '✉️',
        title: 'Email Us',
        lines: ['support@organictattva.com', 'partnerships@organictattva.com'],
    },
    {
        icon: '⏰',
        title: 'Business Hours',
        lines: ['Monday – Saturday', '9:00 AM – 6:00 PM IST', 'Closed on Sundays & Holidays'],
    },
];
const FAQ = [
    { q: 'Are all Organic Tattva products certified organic?', a: 'Yes. Every product carries India Organic (Jaivik Bharat) certification at minimum, with most also holding USDA Organic and Kosher certifications.' },
    { q: 'How do I track my order?', a: 'You will receive an SMS and email with your tracking link once your order is shipped. You can also check your order status by logging into your account.' },
    { q: 'What is your return policy?', a: 'We offer a 7-day return policy for damaged or incorrect products. Please contact our support team with your order number and photos of the issue.' },
    { q: 'Do you ship across India?', a: 'Yes, we ship to all major cities and towns across India. Free shipping is available on orders above ₹599.' },
];
export default function ContactPage() {
    const formSection = useVisible();
    const infoSection = useVisible();
    const faqSection = useVisible();
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    function handleSubmit(e) {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">Contact Us</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-64 overflow-hidden flex items-center bg-gradient-to-br from-[#2D5A2E] to-[#1e3d1f]">
        <img src="https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=1600&h=500&fit=crop&auto=format" alt="Contact" className="absolute inset-0 w-full h-full object-cover opacity-20"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 w-full">
          <span className="text-[#C8952A] text-xs font-bold uppercase tracking-widest">Get In Touch</span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mt-2 mb-2 animate-slide-left" style={{ fontFamily: 'Playfair Display, serif' }}>
            We'd Love to Hear From You
          </h1>
          <p className="text-white/70 text-sm animate-slide-left delay-200">Questions, feedback, or just want to say hello — we're here.</p>
        </div>
      </section>

      {/* Main Grid: Form + Info */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-3 gap-10">

          {/* Contact Info cards */}
          <div ref={infoSection.ref} className="space-y-4">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Contact Information</h2>
            {CONTACT_INFO.map((item, i) => (<div key={item.title} className="bg-[#FAFAF7] border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5" style={{
                opacity: infoSection.visible ? 1 : 0,
                transform: infoSection.visible ? 'translateX(0)' : 'translateX(-20px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s, box-shadow 0.2s, translate 0.2s`,
            }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#2D5A2E]/10 flex items-center justify-center text-xl flex-shrink-0" style={{ animation: `float 3s ease-in-out ${i * 0.5}s infinite` }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2C1A0E] text-sm mb-1">{item.title}</h3>
                    {item.lines.map(l => <p key={l} className="text-xs text-gray-600 leading-relaxed">{l}</p>)}
                  </div>
                </div>
              </div>))}

            {/* Social links */}
            <div className="bg-[#2D5A2E] rounded-xl p-5 mt-2">
              <h3 className="font-bold text-white text-sm mb-3">Follow Us</h3>
              <div className="flex gap-3">
                {[
            { label: 'Facebook', color: '#1877F2' },
            { label: 'Instagram', color: '#E4405F' },
            { label: 'YouTube', color: '#FF0000' },
            { label: 'WhatsApp', color: '#25D366' },
        ].map(s => (<a key={s.label} href="#" className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform" style={{ backgroundColor: s.color }}>
                    {s.label[0]}
                  </a>))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div ref={formSection.ref} className="lg:col-span-2" style={{
            opacity: formSection.visible ? 1 : 0,
            transform: formSection.visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
        }}>
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Send Us a Message</h2>

            {submitted && (<div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slide-up">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-800 text-sm">Message sent successfully!</p>
                  <p className="text-xs text-green-600 mt-0.5">We'll get back to you within 24 hours.</p>
                </div>
              </div>)}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2D5A2E] focus:ring-2 focus:ring-[#2D5A2E]/10 transition-all placeholder-gray-400"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2D5A2E] focus:ring-2 focus:ring-[#2D5A2E]/10 transition-all placeholder-gray-400"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2D5A2E] focus:ring-2 focus:ring-[#2D5A2E]/10 transition-all placeholder-gray-400"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject *</label>
                  <select required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2D5A2E] focus:ring-2 focus:ring-[#2D5A2E]/10 transition-all bg-white text-gray-600">
                    <option value="">Select a subject</option>
                    <option>Order Support</option>
                    <option>Product Enquiry</option>
                    <option>Wholesale / B2B</option>
                    <option>Partnership</option>
                    <option>Feedback</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us how we can help you..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2D5A2E] focus:ring-2 focus:ring-[#2D5A2E]/10 transition-all placeholder-gray-400 resize-none"/>
              </div>
              <button type="submit" className="w-full bg-[#2D5A2E] text-white font-bold py-4 rounded-xl hover:bg-[#1e3d1f] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg tracking-wide">
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-[#FAFAF7]">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Frequently Asked Questions</h2>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div ref={faqSection.ref} className="space-y-3">
            {FAQ.map((item, i) => (<div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm" style={{
                opacity: faqSection.visible ? 1 : 0,
                transform: faqSection.visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-[#2C1A0E] text-sm pr-4">{item.q}</span>
                  <span className={`text-[#C8952A] text-lg font-bold flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : 'rotate-0'}`}>
                    +
                  </span>
                </button>
                <div style={{
                maxHeight: openFaq === i ? '200px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}>
                  <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              </div>))}
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="h-72 bg-gray-100 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1578129377420-4795675e892e?w=1600&h=500&fit=crop&auto=format" alt="Location" className="w-full h-full object-cover opacity-30"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center max-w-sm mx-4">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-bold text-[#2C1A0E] mb-1">Visit Our Office</h3>
            <p className="text-xs text-gray-600 leading-relaxed">4th Floor, Tower B, DLF Cyber City<br />Gurugram, Haryana 122002</p>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 bg-[#2D5A2E] text-white text-xs font-bold px-5 py-2 rounded-full hover:bg-[#1e3d1f] transition-colors">
              Get Directions →
            </a>
          </div>
        </div>
      </section>
    </div>);
}
