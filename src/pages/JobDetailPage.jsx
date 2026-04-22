import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { jobs } from '../data/jobs'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

function Section({ title, items, color = 'emerald' }) {
  const iconColor = color === 'emerald' ? 'text-[#2D8E6F] bg-[#2D8E6F]/10' : 'text-violet-500 bg-violet-50'
  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <ul role="list" className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${iconColor} flex items-center justify-center`} aria-hidden="true">
              <svg className={`w-3 h-3 ${color === 'emerald' ? 'text-[#2D8E6F]' : 'text-violet-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Navbar />

      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-12 py-8 md:py-10">
        {/* Back */}
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6 md:mb-8 group focus-ring rounded min-h-[44px]"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          All open roles
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Main content */}
          <article className="flex-1 min-w-0 space-y-8 md:space-y-10">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 text-[11px] font-bold">
                  {job.type}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.duration}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-auto">
                  Posted {posted}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{job.title}</h1>
              <p className="text-sm font-semibold text-[#2D8E6F] mt-2">{job.department}</p>
            </div>

            {/* Mobile Apply CTA — shown before content on small screens */}
            <div className="lg:hidden">
              <Link
                to={`/careers/${job.id}/apply`}
                className="w-full py-3 px-6 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 flex items-center justify-center gap-2 group focus-ring min-h-[52px]"
              >
                Apply Now
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="w-full h-px bg-slate-100" role="separator" />

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">About the role</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{job.about}</p>
            </div>

            <Section title="What you'll do" items={job.responsibilities} color="emerald" />
            <Section title="What we're looking for" items={job.requirements} color="emerald" />
            <Section title="Nice to have" items={job.niceToHave} color="violet" />
          </article>

          {/* Sticky sidebar CTA — desktop only */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0" aria-label="Apply for this role">
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
                    className="w-full py-3 px-6 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 flex items-center justify-center gap-2 group focus-ring min-h-[52px]"
                  >
                    Apply Now
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer className="mt-8 md:mt-12" />
    </div>
  )
}
