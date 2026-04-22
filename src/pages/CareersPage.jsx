import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { jobs } from '../data/jobs'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

const DEPARTMENTS = ['All', ...new Set(jobs.map(j => j.department))]
const LOCATIONS = ['All', ...new Set(jobs.map(j => j.location))]
const TYPES = ['All', ...new Set(jobs.map(j => j.type))]

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border min-h-[36px] focus-ring ${
        active
          ? 'bg-[#2D8E6F] text-white border-[#2D8E6F] shadow-sm shadow-[#2D8E6F]/20'
          : 'bg-white text-slate-500 border-slate-200 hover:border-[#2D8E6F]/40 hover:text-[#2D8E6F]'
      }`}
    >
      {label}
    </button>
  )
}

function JobCard({ job }) {
  const typeColor =
    job.type === 'Internship'
      ? 'bg-violet-50 text-violet-600 border-violet-100'
      : 'bg-emerald-50 text-emerald-600 border-emerald-100'

  const posted = new Date(job.postedDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <article>
      <Link
        to={`/careers/${job.id}`}
        className="group block bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 hover:border-[#2D8E6F]/30 hover:shadow-lg hover:shadow-[#2D8E6F]/5 transition-all duration-300 hover:-translate-y-0.5 focus-ring"
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#2D8E6F] transition-colors leading-tight mb-2">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${typeColor}`}>
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
            </div>
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{job.about}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end justify-between gap-4 pt-0.5">
            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap hidden sm:block">Posted {posted}</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#2D8E6F] group-hover:gap-2.5 transition-all whitespace-nowrap">
              View role
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#2D8E6F]/10 flex items-center justify-center" aria-hidden="true">
              <svg className="w-3.5 h-3.5 text-[#2D8E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{job.department}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium sm:hidden">Posted {posted}</span>
        </div>
      </Link>
    </article>
  )
}

export function CareersPage() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [location, setLocation] = useState('All')
  const [type, setType] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = j.title.toLowerCase().includes(search.toLowerCase())
      const matchDept = dept === 'All' || j.department === dept
      const matchLoc = location === 'All' || j.location === location
      const matchType = type === 'All' || j.type === type
      return matchSearch && matchDept && matchLoc && matchType
    })
  }, [search, dept, location, type])

  const activeFilterCount = [dept !== 'All', location !== 'All', type !== 'All', !!search].filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Navbar />

      {/* Hero */}
      <header className="w-full bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#2D8E6F] uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D8E6F] animate-pulse inline-block" aria-hidden="true" />
                Now hiring
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
                Build the future of<br className="hidden sm:block" /> real estate intelligence.
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed">
                We're a small, high-output team working on tools that help investors understand neighbourhoods before anyone else.
              </p>
            </div>
            <div className="flex gap-8 flex-shrink-0">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{jobs.length}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Open role{jobs.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">100%</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Remote</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-12 py-8 md:py-12">

        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-5 md:hidden">
          <p className="text-sm font-semibold text-slate-500">
            <span className="text-slate-900 font-bold">{filtered.length}</span> position{filtered.length !== 1 ? 's' : ''} found
          </p>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="job-filters"
            onClick={() => setFiltersOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 transition-colors focus-ring min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-[#2D8E6F] text-white text-[10px] font-black rounded-full flex items-center justify-center" aria-label={`${activeFilterCount} active filters`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          {/* Sidebar filters */}
          <aside
            id="job-filters"
            aria-label="Job filters"
            className={`${filtersOpen ? 'block' : 'hidden'} md:block md:w-56 flex-shrink-0`}
          >
            <div className="md:sticky md:top-24 space-y-6 md:space-y-8 bg-white md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border border-slate-100 md:border-0 mb-6 md:mb-0">
              {/* Search */}
              <div className="relative" role="search">
                <label htmlFor="job-search" className="sr-only">Search job titles</label>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="job-search"
                  type="search"
                  placeholder="Search roles…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8E6F]/20 placeholder:text-slate-400 text-slate-900 shadow-sm"
                />
              </div>

              <fieldset>
                <legend className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Department</legend>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map(d => (
                    <FilterChip key={d} label={d} active={dept === d} onClick={() => setDept(d)} />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Location</legend>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(l => (
                    <FilterChip key={l} label={l} active={location === l} onClick={() => setLocation(l)} />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Type</legend>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <FilterChip key={t} label={t} active={type === t} onClick={() => setType(t)} />
                  ))}
                </div>
              </fieldset>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setDept('All'); setLocation('All'); setType('All'); setSearch('') }}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 focus-ring rounded min-h-[44px]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Job listings */}
          <section className="flex-1 min-w-0" aria-label="Job listings">
            <p className="hidden md:block text-sm font-semibold text-slate-500 mb-6" aria-live="polite">
              <span className="text-slate-900 font-bold">{filtered.length}</span> position{filtered.length !== 1 ? 's' : ''} found
            </p>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4" aria-hidden="true">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-bold text-slate-400">No roles match your filters</p>
                <p className="text-sm text-slate-400 mt-1">Try clearing some filters to see more results.</p>
              </div>
            ) : (
              <ul role="list" className="space-y-4">
                {filtered.map(job => (
                  <li key={job.id}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
