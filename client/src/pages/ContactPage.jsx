import { useState } from 'react';
import { Link } from 'react-router';

const EMAIL = 'customercare@theearthmitrafarmers.com';
const PHONE = '+91 76919 09306';
const ADDRESS = '2/160/2 A.N. Rajharsh Colony, Nayapura, Bhopal, Madhya Pradesh 462042, India';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleSubmit(event) {
    event.preventDefault();
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <section className="bg-[#2D5A2E] text-white">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E1B85C]">Get in touch</p>
          <h1 className="mt-3 text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 max-w-2xl text-white/80">Questions about an order, our products, or working with our farmers? We are here to help.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-16">
        <div>
          <h2 className="text-2xl font-bold text-[#2C1A0E]">Contact information</h2>
          <div className="mt-5 space-y-4">
            <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E7E1D8]"><h3 className="font-bold text-[#2D5A2E]">Customer care</h3><a className="mt-2 block text-sm text-gray-700 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a><a className="mt-1 block text-sm text-gray-700 underline" href="tel:+917691909306">{PHONE}</a></article>
            <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E7E1D8]"><h3 className="font-bold text-[#2D5A2E]">Registered address</h3><p className="mt-2 text-sm leading-6 text-gray-700">THE EARTH MITRA FARMERS<br />{ADDRESS}</p></article>
            <p className="px-1 text-xs leading-5 text-gray-500">For privacy questions, contact us at the same customer care email. See our <Link to="/pages/privacy-policy" className="underline">Privacy Policy</Link>.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E7E1D8] sm:p-8">
          <h2 className="text-2xl font-bold text-[#2C1A0E]">Send us a message</h2>
          <p className="mt-2 text-sm text-gray-600">This form opens an email draft in your mail application.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#2D5A2E]" /></label>
            <label className="block text-sm font-medium text-gray-700">Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#2D5A2E]" /></label>
            <label className="block text-sm font-medium text-gray-700">Subject<input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#2D5A2E]" /></label>
            <label className="block text-sm font-medium text-gray-700">Message<textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="mt-1 w-full resize-y rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#2D5A2E]" /></label>
            <button type="submit" className="rounded-full bg-[#2D5A2E] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1e3d1f]">Create email</button>
          </form>
        </div>
      </section>
    </div>
  );
}
