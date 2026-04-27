import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-50 w-full">
        <div className="py-3 px-6 md:py-4 md:px-12 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2D8E6F] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D8E6F]/25">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4V3z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Proxii</span>
          </Link>
          <div className="hidden sm:flex items-center gap-8">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Dashboard</Link>
            <span className="text-sm text-[#2D8E6F] font-bold">About</span>
            <Link to="/careers" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Careers</Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 px-6 py-4 flex flex-col gap-1">
            <Link to="/" className="py-2.5 text-sm text-slate-500 font-medium">Dashboard</Link>
            <span className="py-2.5 text-sm text-[#2D8E6F] font-bold border-t border-slate-50">About</span>
            <Link to="/careers" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-sm text-slate-500 font-medium border-t border-slate-50">Careers</Link>
          </div>
        )}
      </nav>

      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-20">

        {/* Hero */}
        <section className="mb-12 md:mb-20 text-center" aria-labelledby="about-heading">
          <span className="inline-block px-4 py-1.5 bg-[#2D8E6F]/10 text-[#2D8E6F] text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
            Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Neighborhood intelligence,<br className="hidden sm:block" />
            <span className="text-[#2D8E6F]"> quantified.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Proxii turns real-world signals — the coffee shops, yoga studios, and lending predators in your neighborhood — into a single, actionable market index. Built for investors, analysts, and anyone who wants to know where growth is actually happening.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-12 md:mb-20" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 md:mb-10 text-center">
            How the score is built
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                step: '01',
                title: 'Places Data',
                body: 'We query Google Maps for 40+ amenity categories within a 1.5 km radius of your ZIP code — from fine dining to payday loans.',
                color: '#2D8E6F',
              },
              {
                step: '02',
                title: 'Weighted Scoring',
                body: 'Each amenity carries a tier weight. Premium anchors like Whole Foods or an Apple Store get a 1.2× multiplier. Risk indicators apply a 1.3× hard penalty.',
                color: '#E8B34F',
              },
              {
                step: '03',
                title: 'ML Refinement',
                body: 'A Ridge Regression model trained on labeled neighborhoods blends with the rule-based score, correcting systematic biases as new data arrives.',
                color: '#2D8E6F',
              },
            ].map(({ step, title, body, color }) => (
              <div key={step} className="soft-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-white bg-white">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{step}</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-3 mb-3">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats strip */}
        <section className="mb-12 md:mb-20 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900 text-white" aria-label="Key statistics">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: '40+', label: 'Amenity categories' },
              { value: '1.5 km', label: 'Search radius' },
              { value: '0–100', label: 'Score range' },
              { value: 'Real-time', label: 'Data freshness' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D8E6F] mb-1">{value}</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Score categories */}
        <section className="mb-12 md:mb-20" aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 md:mb-10 text-center">
            Score categories
          </h2>
          <ul role="list" className="space-y-3">
            {[
              { range: '90 – 100', label: 'Global Elite', desc: 'World-class amenity density. Consistently outperforms national benchmarks.', color: '#2D8E6F' },
              { range: '80 – 89', label: 'Prime', desc: 'Very high growth signals. Strong anchor presence and low risk exposure.', color: '#45B08C' },
              { range: '60 – 79', label: 'Strong', desc: 'Above-average growth trajectory. Solid fundamentals with manageable risk.', color: '#E8B34F' },
              { range: '40 – 59', label: 'Developing', desc: 'Mixed signals. Emerging drivers offset by legacy risk factors.', color: '#F5A623' },
              { range: '25 – 39', label: 'Struggling', desc: 'Risk indicators dominate. Limited amenity density and investment signals.', color: '#D4465E' },
              { range: '0 – 24', label: 'Under-invested', desc: 'Severe deficiency in growth indicators. High concentration of negative factors.', color: '#B03050' },
            ].map(({ range, label, desc, color }) => (
              <li
                key={label}
                className="flex items-start gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <span className="text-sm font-black tabular-nums w-16 sm:w-20 shrink-0 pt-0.5" style={{ color }}>{range}</span>
                <div>
                  <span className="text-sm font-bold text-slate-900">{label}</span>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            See your neighborhood's score
          </h2>
          <p className="text-slate-500 mb-8">Enter any US, Canadian, or European postal code to get started.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 uppercase tracking-widest shadow-xl shadow-slate-900/10 focus-ring"
          >
            Open Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </section>
      </main>

      <footer className="py-10 px-6 md:px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">&copy; 2026 Proxii Analytics — Built for Fintech</p>
        <div className="flex gap-10">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Privacy Policy</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Market Terms</span>
        </div>
      </footer>
    </div>
  )
}
