import { useEffect, useRef, useState } from 'react';
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
const TIMELINE = [
    { year: '2012', title: 'Founded', desc: 'Organic Tattva was born with a simple mission — bring 100% pure, tested organic food to every Indian household.' },
    { year: '2014', title: 'First Certification', desc: 'Received India Organic (Jaivik Bharat) certification, validating our commitment to pesticide-free farming.' },
    { year: '2016', title: 'USDA Organic', desc: 'Achieved USDA Organic and Kosher certifications, opening doors to global quality standards.' },
    { year: '2018', title: '250+ Pesticide Tests', desc: 'Launched our industry-first QR-based test report system — scan your pack to see every test result.' },
    { year: '2021', title: 'Sedex Member', desc: 'Joined the Sedex ethical trade network, committing to fair labor and sustainable supply chains.' },
    { year: '2024', title: '10,000+ Families', desc: 'Now trusted by over 10,000 families across India for everyday organic essentials.' },
];
const TEAM = [
    { name: 'Arjun Dalmia', role: 'Founder & CEO', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&auto=format' },
    { name: 'Priya Sharma', role: 'Head of Quality', img: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=300&h=300&fit=crop&auto=format' },
    { name: 'Rahul Gupta', role: 'Farm Relations', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&auto=format' },
    { name: 'Meena Patel', role: 'Product Innovation', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&auto=format' },
];
const STATS = [
    { stat: '10K+', label: 'Happy Families' },
    { stat: '250+', label: 'Pesticide Tests' },
    { stat: '50+', label: 'Organic Farmers' },
    { stat: '4', label: 'Certifications' },
];
export default function AboutPage() {
    const missionSection = useVisible();
    const statsSection = useVisible();
    const timelineSection = useVisible();
    const teamSection = useVisible();
    return (<div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#2D5A2E]">Home</Link>
          <span>›</span>
          <span className="text-[#2C1A0E] font-medium">About Us</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[420px] overflow-hidden flex items-center">
        <img src="https://images.unsplash.com/photo-1641301553499-9a0ff924fcb5?w=1600&h=700&fit=crop&auto=format" alt="About Organic Tattva" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C1A0E]/80 to-[#2C1A0E]/30"/>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 w-full">
          <span className="inline-block text-xs font-semibold text-[#C8952A] uppercase tracking-widest mb-3">Our Story</span>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 max-w-2xl animate-slide-left" style={{ fontFamily: 'Playfair Display, serif' }}>
            A Natural Way of Life
          </h1>
          <p className="text-white/80 text-base max-w-lg leading-relaxed animate-slide-left delay-200">
            We believe every family deserves access to pure, chemical-free food. Organic Tattva was founded to make that belief a reality for every Indian household.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div ref={missionSection.ref} className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-12 items-center" style={{
            opacity: missionSection.visible ? 1 : 0,
            transform: missionSection.visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#C8952A]">Our Mission</span>
            <h2 className="text-3xl font-bold text-[#2C1A0E] mt-2 mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>
              Pure Food For Every Indian Family
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              Organic Tattva exists to bridge the gap between India's rich organic farming heritage and the modern kitchen. We work directly with certified organic farmers, cutting out middlemen and ensuring fair prices for farmers while delivering the freshest, most tested products to you.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              Every product is tested for 250+ pesticides, certified by India Organic, USDA, Sedex, and Kosher authorities, and traceable from seed to shelf. We don't just claim organic — we prove it with every pack.
            </p>
            <div className="flex gap-4">
              <Link to="/products" className="bg-[#2D5A2E] text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-[#1e3d1f] transition-all hover:-translate-y-0.5 shadow-md">
                Shop Our Products
              </Link>
              <Link to="/contact" className="border-2 border-[#2D5A2E] text-[#2D5A2E] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#2D5A2E] hover:text-white transition-all hover:-translate-y-0.5">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1612869538502-b5baa439abd7?w=700&h=500&fit=crop&auto=format" alt="Organic farming" className="w-full rounded-2xl shadow-xl object-cover" style={{ maxHeight: '380px' }}/>
            <div className="absolute -bottom-4 -left-4 bg-[#C8952A] text-white rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-black">12+</div>
              <div className="text-xs font-semibold">Years of Organic Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-[#2D5A2E]">
        <div ref={statsSection.ref} className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (<div key={s.stat} className="text-center" style={{
                opacity: statsSection.visible ? 1 : 0,
                transform: statsSection.visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
            }}>
              <div className="text-4xl font-black text-[#C8952A] mb-1">{s.stat}</div>
              <div className="text-white/80 text-sm font-medium">{s.label}</div>
            </div>))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C8952A]">Our Journey</span>
            <h2 className="text-3xl font-bold text-[#2C1A0E] mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Milestones That Define Us
            </h2>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div ref={timelineSection.ref} className="relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#C8952A]/30 -translate-x-1/2 hidden lg:block"/>
            <div className="space-y-8 lg:space-y-0">
              {TIMELINE.map((item, i) => (<div key={item.year} className={`relative lg:flex items-center gap-8 lg:mb-12 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`} style={{
                opacity: timelineSection.visible ? 1 : 0,
                transform: timelineSection.visible ? 'translateX(0)' : `translateX(${i % 2 === 0 ? -30 : 30}px)`,
                transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
            }}>
                  <div className={`lg:w-1/2 ${i % 2 === 0 ? 'lg:text-right lg:pr-12' : 'lg:pl-12'}`}>
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow inline-block w-full text-left">
                      <span className="text-[#C8952A] font-black text-xl">{item.year}</span>
                      <h3 className="font-bold text-[#2C1A0E] mt-1 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  {/* Center dot */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#C8952A] border-4 border-white shadow-md z-10 items-center justify-center"/>
                  <div className="lg:w-1/2"/>
                </div>))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C8952A]">The Team</span>
            <h2 className="text-3xl font-bold text-[#2C1A0E] mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              People Behind the Purity
            </h2>
            <div className="w-16 h-1 bg-[#2D5A2E] mx-auto mt-3 rounded-full"/>
          </div>
          <div ref={teamSection.ref} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (<div key={member.name} className="text-center group cursor-pointer" style={{
                opacity: teamSection.visible ? 1 : 0,
                transform: teamSection.visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
            }}>
                <div className="relative mb-4 inline-block">
                  <img src={member.img} alt={member.name} className="w-32 h-32 rounded-full object-cover mx-auto shadow-md border-4 border-[#F5F1EB] group-hover:border-[#C8952A] transition-all duration-300 group-hover:scale-105"/>
                </div>
                <h3 className="font-bold text-[#2C1A0E] text-sm">{member.name}</h3>
                <p className="text-xs text-[#C8952A] font-semibold mt-0.5">{member.role}</p>
              </div>))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#F5F1EB]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: 'Playfair Display, serif' }}>Our Core Values</h2>
            <div className="w-16 h-1 bg-[#C8952A] mx-auto mt-3 rounded-full"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
            { icon: '🌱', title: 'Purity First', desc: 'Every product is tested for 250+ pesticides and chemicals before it reaches you. No shortcuts.' },
            { icon: '🤝', title: 'Farmer Fairness', desc: 'We pay fair prices to 50+ certified organic farmers across India, supporting livelihoods and sustainable practices.' },
            { icon: '🌍', title: 'Planet Positive', desc: 'Organic farming enriches the soil, protects biodiversity, and reduces chemical runoff into our water systems.' },
        ].map(v => (<div key={v.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="text-4xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>{v.icon}</div>
                <h3 className="font-bold text-[#2C1A0E] mb-3">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
              </div>))}
          </div>
        </div>
      </section>
    </div>);
}
