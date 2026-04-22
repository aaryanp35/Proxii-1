import React from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import { jobs } from '../data/jobs'

function Section({ title, items, color = 'emerald' }) {
  const iconColor = color === 'emerald' ? 'text-[#2D8E6F] bg-[#2D8E6F]/10' : 'text-violet-500 bg-violet-50'
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${iconColor} flex items-center justify-center`}>
              <svg className={`w-3 h-3 ${color === 'emerald' ? 'text-[#2D8E6F]' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function JobDetailPage() {
  const { id } = useParams()
  const job = jobs.find(j => j.id === id)

  if (!job) return <Navigate to="/careers" replace />

  const posted = new Date(job.postedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-50 w-full py-3 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2D8E6F] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D8E6F]/25">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4V3z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Proxii</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            Dashboard
          </Link>
          <Link to="/careers" className="text-sm text-[#2D8E6F] font-bold">
            Careers
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-10">
        {/* Back */}
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          All open roles
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main content */}
          <article className="flex-1 min-w-0 space-y-10">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 text-[11px] font-bold">
                  {job.type}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.duration}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-auto">
                  Posted {posted}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{job.title}</h1>
              <p className="text-sm font-semibold text-[#2D8E6F] mt-2">{job.department}</p>
            </div>

            <div className="w-full h-px bg-slate-100" />

            {/* About */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">About the role</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{job.about}</p>
            </div>

            <Section title="What you'll do" items={job.responsibilities} color="emerald" />
            <Section title="What we're looking for" items={job.requirements} color="emerald" />
            <Section title="Nice to have" items={job.niceToHave} color="violet" />
          </article>

          {/* Sticky sidebar CTA */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Position</p>
                  <p className="font-bold text-slate-900">{job.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Type</p>
                    <p className="text-sm font-semibold text-slate-700">{job.type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                    <p className="text-sm font-semibold text-slate-700">{job.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Location</p>
                    <p className="text-sm font-semibold text-slate-700">{job.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Department</p>
                    <p className="text-sm font-semibold text-slate-700">{job.department}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/careers/${job.id}/apply`}
                    className="w-full py-3 px-6 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    Apply Now
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mt-12">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">&copy; 2026 Proxii Analytics</p>
        <div className="flex gap-8">
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Market Terms</a>
        </div>
      </footer>
    </div>
  )
}
