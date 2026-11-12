import { Link } from 'react-router';

import POLICIES from '../data/policies.json';

function PolicyPage({ policy }) {
  const content = POLICIES[policy];
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="bg-[#2D5A2E] text-white">
        <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="mb-3 text-sm text-white/70"><Link to="/" className="hover:text-white">Home</Link> <span aria-hidden="true">/</span> Policies</div>
          <h1 className="text-3xl font-bold lg:text-4xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl leading-relaxed text-white/80">{content.intro}</p>
          {content.effectiveDate && <p className="mt-4 text-sm text-white/70">Effective date: {content.effectiveDate}</p>}
        </div>
      </div>
      <article className="mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
        {(policy === 'refund' || policy === 'cancellation') && <p className="mb-6 text-sm leading-6 text-[#51483F]">Our Cancellation, Return &amp; Refund Policy covers both <Link to="/pages/cancellation-policy" className="text-[#2D5A2E] underline">order cancellation</Link> and <Link to="/pages/refund-policy" className="text-[#2D5A2E] underline">returns, replacements, and refunds</Link>.</p>}
        <div className="divide-y divide-[#E7E1D8] rounded-2xl border border-[#E7E1D8] bg-white px-6 shadow-sm sm:px-9">
          {content.sections.map(([heading, body]) => (
            <section key={heading} className="py-6">
              <h2 className="text-lg font-bold text-[#2D5A2E]">{heading}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#51483F]">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-6 text-xs text-gray-500">For questions about these policies, contact <a className="font-medium text-[#2D5A2E] underline" href="mailto:customercare@theearthmitrafarmers.com">customercare@theearthmitrafarmers.com</a>.</p>
      </article>
    </div>
  );
}

export function PrivacyPolicyPage() { return <PolicyPage policy="privacy" />; }
export function RefundPolicyPage() { return <PolicyPage policy="refund" />; }
export function ShippingPolicyPage() { return <PolicyPage policy="shipping" />; }
export function TermsPage() { return <PolicyPage policy="terms" />; }
export function CancellationPolicyPage() { return <PolicyPage policy="cancellation" />; }
