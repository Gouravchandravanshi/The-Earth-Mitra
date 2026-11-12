import { Link } from 'react-router';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { TEAM } from '../data/team';

function TeamPortrait({ person }) {
  const [failedPhoto, setFailedPhoto] = useState('');
  return (
    <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-[#EAF0E5] ring-4 ring-white shadow-sm">
      {person.photo && failedPhoto !== person.photo ? (
        <img src={person.photo} alt={person.name || person.role} onError={() => setFailedPhoto(person.photo)} className="h-full w-full object-cover" loading="lazy" />
      ) : <UserRound size={64} strokeWidth={1.25} className="text-[#2D5A2E]" aria-label={`${person.role} photo placeholder`} role="img" />}
    </div>
  );
}

const VALUES = [
  { title: 'Purity', text: 'Natural ingredients and authentic methods help bring the goodness of traditional Indian food back to everyday kitchens.' },
  { title: 'Trust', text: 'Careful sourcing, hygienic packaging, and thoughtful quality standards guide what we bring to your home.' },
  { title: 'Fairness', text: 'We want to build a stronger bridge between farmers and families, with fair value for farmers and food customers can trust.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <section className="bg-[#2D5A2E] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E1B85C]">Our story</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight lg:text-6xl">From farms to your home, with purity, heritage, and trust.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">THE EARTH MITRA FARMERS began with a simple vision: reconnect people with pure, natural, and honest food that comes directly from the farms of India.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#B27A20]">Khet Se Kitchen Tak - Aapka Sacha Mitra</p>
          <h2 className="mt-3 text-3xl font-bold text-[#2C1A0E]">Food rooted in Indian tradition</h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-[#51483F]">
            <p>In a fast-paced world where food can lose its authenticity through excessive processing, chemicals, and artificial additives, we set out to bring the purity of traditional Indian food back through natural ingredients, authentic methods, and responsible sourcing.</p>
            <p>Our range includes traditionally crafted A2 cow ghee, millets and millet products, wood-pressed oils, wellness products, jaggery, honey, pulses, makhana, nuts, seeds, and other wholesome foods. We carefully select raw materials from trusted farmers, follow hygienic packaging practices, and maintain quality standards so food reaches households nutritious, authentic, and closer to nature.</p>
            <p>Rooted in Madhya Pradesh, our brand carries the richness of Indian traditions and village farming. We believe lasting prosperity comes when farmers receive fair value for their work and families receive food they can trust.</p>
          </div>
        </div>
        <aside className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#E7E1D8]">
          <p className="text-sm font-bold uppercase tracking-widest text-[#B27A20]">Our promise</p>
          <blockquote className="mt-4 text-2xl font-semibold leading-snug text-[#2D5A2E]">"We are building more than a food brand - we are rebuilding trust in what India eats."</blockquote>
          <p className="mt-5 text-sm text-gray-500">The Earth Mitra Farmers</p>
          <Link to="/products" className="mt-8 inline-flex rounded-full bg-[#2D5A2E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e3d1f]">Explore our products</Link>
        </aside>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['Our mission', 'To deliver pure, natural, and traditionally crafted food products from the farms of India directly to modern kitchens while preserving Indian food heritage, empowering farmers, and building trust through quality and authenticity.'],
            ['Our vision', 'To become India’s most trusted natural FMCG brand by reconnecting families with authentic food, supporting sustainable farming, and preserving the richness of traditional Indian food culture for future generations. To take the purity of India’s farms and the wisdom of traditional food practices to every kitchen across the world.'],
            ['Our goal', 'To reconnect people with real food, real farmers, and real traditions while building a healthier and more trustworthy food ecosystem.'],
          ].map(([title, text]) => <article key={title} className="rounded-2xl border border-[#E7E1D8] bg-white p-7"><h2 className="text-2xl font-bold text-[#2D5A2E]">{title}</h2><p className="mt-4 text-sm leading-7 text-[#51483F]">{text}</p></article>)}
        </div>
        <p className="mt-8 text-center text-lg font-semibold text-[#2D5A2E]">From the heart of India, to the heart of your home.</p>
      </section>
      <section className="bg-[#F5F1EB] py-14">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#2C1A0E]">The people behind Earth Mitra</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((person, index) => <article key={`${person.role}-${index}`} className="rounded-2xl border border-[#E7E1D8] bg-white p-8 text-center"><TeamPortrait person={person} />{person.name && <h3 className="mt-5 text-xl font-bold text-[#2C1A0E]">{person.name}</h3>}<p className="mt-3 text-sm font-semibold text-[#2D5A2E]">{person.role}</p></article>)}
          </div>
        </div>
      </section>
      <section className="bg-white py-14 lg:py-18">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#2C1A0E]">What guides us</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {VALUES.map(value => <article key={value.title} className="rounded-2xl bg-[#FAFAF7] p-6 ring-1 ring-[#E7E1D8]"><h3 className="text-xl font-bold text-[#2D5A2E]">{value.title}</h3><p className="mt-3 text-sm leading-6 text-[#51483F]">{value.text}</p></article>)}
          </div>
          <div className="mt-10 rounded-2xl bg-[#F5F1EB] p-7 text-center">
            <h3 className="text-2xl font-bold">We would love to hear from you</h3>
            <p className="mt-2 text-sm text-gray-600">Questions about our products or our work with farmers?</p>
            <Link to="/contact" className="mt-5 inline-flex rounded-full border border-[#2D5A2E] px-6 py-3 text-sm font-semibold text-[#2D5A2E] hover:bg-[#2D5A2E] hover:text-white">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
