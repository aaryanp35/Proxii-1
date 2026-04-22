import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { jobs } from '../data/jobs'

const DEPARTMENTS = ['All', ...new Set(jobs.map(j => j.department))]
const LOCATIONS = ['All', ...new Set(jobs.map(j => j.location))]
const TYPES = ['All', ...new Set(jobs.map(j => j.type))]

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      to={`/careers/${job.id}`}
      className="group block bg-white border border-slate-100 rounded-3xl p-6 hover:border-[#2D8E6F]/30 hover:shadow-lg hover:shadow-[#2D8E6F]/5 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#2D8E6F] transition-colors leading-tight mb-2">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${typeColor}`}>
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
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{job.about}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end justify-between h-full gap-4 pt-0.5">
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Posted {posted}</span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#2D8E6F] group-hover:gap-2.5 transition-all">
            View role
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#2D8E6F]/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-[#2D8E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </span>
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{job.department}</span>
      </div>
    </Link>
  )
}

export function CareersPage() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [location, setLocation] = useState('All')
  const [type, setType] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount = [dept, location, type].filter(v => v !== 'All').length + (search ? 1 : 0)

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = j.title.toLowerCase().includes(search.toLowerCase())
      const matchDept = dept === 'All' || j.department === dept
      const matchLoc = location === 'All' || j.location === location
      const matchType = type === 'All' || j.type === type
      return matchSearch && matchDept && matchLoc && matchType
    })
  }, [search, dept, location, type])

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

      {/* Hero */}
      <section className="w-full bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#2D8E6F] uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D8E6F] animate-pulse inline-block"></span>
                Now hiring
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
                Build the future of<br className="hidden md:block" /> real estate intelligence.
              </h1>
              <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
                We're a small, high-output team working on tools that help investors understand neighbourhoods before anyone else. Come do meaningful work.
              </p>
            </div>
            <div className="flex gap-8 flex-shrink-0">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{jobs.length}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Open role{jobs.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">100%</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Remote</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-12">
        {/* Mobile filter toggle */}
        <div className="md:hidden mb-4 flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 shadow-sm hover:border-[#2D8E6F]/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-[#2D8E6F] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setDept('All'); setLocation('All'); setType('All'); setSearch('') }}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar filters */}
          <aside className={`md:w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
            <div className="sticky top-24 space-y-8">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search roles…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8E6F]/20 placeholder:text-slate-400 text-slate-900 shadow-sm"
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Department</p>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map(d => (
                    <FilterChip key={d} label={d} active={dept === d} onClick={() => setDept(d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Location</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(l => (
                    <FilterChip key={l} label={l} active={location === l} onClick={() => setLocation(l)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <FilterChip key={t} label={t} active={type === t} onClick={() => setType(t)} />
                  ))}
                </div>
              </div>

              {(dept !== 'All' || location !== 'All' || type !== 'All' || search) && (
                <button
                  onClick={() => { setDept('All'); setLocation('All'); setType('All'); setSearch('') }}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Job listings */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-slate-500">
                <span className="text-slate-900 font-bold">{filtered.length}</span> position{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-bold text-slate-400">No roles match your filters</p>
                <p className="text-sm text-slate-400 mt-1">Try clearing some filters to see more results.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">&copy; 2026 Proxii Analytics</p>
        <div className="flex gap-8">
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Market Terms</a>
        </div>
      </footer>
    </div>
  )
}
