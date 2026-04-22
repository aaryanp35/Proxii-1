import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import { getNationalStats } from './utils/percentile'
import { NationalPercentileHover } from './components/NationalPercentileHover'
import { FactorHover } from './components/FactorHover'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { CareersPage } from './pages/CareersPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { ApplicationPage } from './pages/ApplicationPage'
import { AboutPage } from './pages/AboutPage'

function App() {
  const [toggleState, setToggleState] = useState('live')
  const [zipCode, setZipCode] = useState('')
  const [areaName, setAreaName] = useState('')
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const scoreValue = data?.score
  const nationalStats = scoreValue ? getNationalStats(scoreValue) : null
  const gaugeLabel = !scoreValue ? null : scoreValue >= 65 ? 'High Growth' : scoreValue >= 35 ? 'Balanced Growth' : 'High Risk'
  const gaugeClass = !scoreValue ? '' : scoreValue >= 65 ? 'text-emerald-400' : scoreValue >= 35 ? 'text-amber-400' : 'text-rose-400'
  const gaugeTextClass = !scoreValue ? '' : scoreValue >= 65 ? 'text-emerald-500' : scoreValue >= 35 ? 'text-amber-500' : 'text-rose-500'

  const drivers = useMemo(() => data?.drivers ?? [], [data])
  const risks = useMemo(() => data?.risks ?? [], [data])

  useEffect(() => {
    if (!scoreValue) return
    const gauge = document.getElementById('main-gauge')
    const circumference = 264
    const offset = circumference - (scoreValue / 100) * circumference
    const timer = setTimeout(() => {
      gauge?.style.setProperty('stroke-dashoffset', String(offset))
    }, 200)
    return () => clearTimeout(timer)
  }, [scoreValue])

  const handleSearch = async () => {
    const postalCodeRegex = /^([0-9]{5}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[0-9]{4,6}|[A-Z]{1,2}\d{1,2}[A-Z\d]?\s?\d[A-Z]{2})$/
    if (!postalCodeRegex.test(zipCode.trim())) {
      setStatus('error')
      setErrorMessage('Please enter a valid postal code (US, Canada, or Europe).')
      return
    }
    setStatus('loading')
    setErrorMessage('')
    try {
      const response = await fetch(`/api/score/${zipCode}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch score data')
      }
      const payload = await response.json()
      setData(payload)
      setAreaName(payload.areaName || '')
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to fetch score. Please try again.')
    }
  }

  // Center slot: Live/Historical toggle + search form
  const centerSlot = (
    <div className="flex items-center gap-3 w-full">
      {/* Toggle — only rendered on lg+ in the nav bar */}
      <div className="hidden lg:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner flex-shrink-0" role="group" aria-label="Data mode">
        <button
          type="button"
          onClick={() => setToggleState('live')}
          aria-pressed={toggleState === 'live'}
          className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all rounded-xl focus-ring ${
            toggleState === 'live' ? 'text-[#2D8E6F] bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D8E6F] animate-pulse" aria-hidden="true" />
          Live
        </button>
        <button
          type="button"
          onClick={() => setToggleState('historical')}
          aria-pressed={toggleState === 'historical'}
          className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl focus-ring ${
            toggleState === 'historical' ? 'text-[#2D8E6F] bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Historical
        </button>
      </div>

      {/* Search form */}
      <form
        role="search"
        className="relative group w-full sm:w-72 md:w-64 lg:flex-1 lg:max-w-xs"
        onSubmit={e => { e.preventDefault(); handleSearch() }}
      >
        <label htmlFor="zip-search" className="sr-only">Search by ZIP or postal code</label>
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="zip-search"
          type="search"
          inputMode="text"
          autoComplete="postal-code"
          maxLength={20}
          placeholder="ZIP / Postal Code"
          value={zipCode}
          onChange={e => {
            const value = e.target.value.toUpperCase()
            setZipCode(value)
            if (status === 'error') { setStatus('idle'); setErrorMessage('') }
          }}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8E6F]/20 transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
          aria-describedby={status === 'error' ? 'search-error' : undefined}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-900 text-white hover:bg-[#2D8E6F] transition-all focus-ring min-h-0"
        >
          Search
        </button>
      </form>
    </div>
  )

  const home = (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Navbar centerSlot={centerSlot} />

      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12">

        {/* Hero Section */}
        <section className="intro-hero mb-8 sm:mb-12 md:mb-20 flex flex-col items-center text-center reveal-node" aria-label="Neighborhood score">
          {/* Loading status announcement */}
          {status === 'loading' && (
            <div
              role="status"
              aria-live="polite"
              aria-label={`Loading results for ${zipCode}`}
              className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
            >
              <div className="w-12 h-12 border-4 border-[#2D8E6F]/20 border-t-[#2D8E6F] rounded-full animate-spin" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-600">Loading results for {zipCode}…</p>
            </div>
          )}

          {/* Gauge */}
          {scoreValue ? (
            <div className="gauge-container relative w-full max-w-[280px] sm:max-w-xs md:w-[420px] md:max-w-none aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-[#E8B34F]/10 blur-[120px] rounded-full" aria-hidden="true" />
              <span className="sparkle absolute" style={{ top: '10%', left: '20%', fontSize: '20px', animationDelay: '0.2s' }} aria-hidden="true">✨</span>
              <span className="sparkle absolute" style={{ top: '20%', right: '15%', fontSize: '16px', animationDelay: '0.8s' }} aria-hidden="true">✨</span>
              <span className="sparkle absolute" style={{ bottom: '25%', left: '10%', fontSize: '18px', animationDelay: '1.2s' }} aria-hidden="true">✨</span>

              <svg
                className="w-full h-full transform -rotate-90 filter drop-shadow-sm"
                aria-hidden="true"
              >
                <circle cx="50%" cy="50%" r="42%" className="stroke-current text-slate-100 fill-none" strokeWidth="12" />
                <circle
                  id="main-gauge"
                  cx="50%" cy="50%" r="42%"
                  className={`gauge-ring stroke-current ${gaugeClass} fill-none ${status === 'loading' ? 'animate-pulse' : ''}`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  style={{ strokeDasharray: 264, strokeDashoffset: 264 }}
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <NationalPercentileHover
                  percentile={nationalStats.percentile}
                  rankLabel={nationalStats.rankLabel}
                  topPercentage={nationalStats.topPercentage}
                >
                  <button
                    type="button"
                    className="text-6xl sm:text-7xl md:text-9xl font-bold text-slate-900 tracking-tighter cursor-pointer focus-ring rounded-lg"
                    aria-label={`Score ${scoreValue} — ${nationalStats.percentile}th national percentile. Click for details.`}
                  >
                    {scoreValue}
                  </button>
                </NationalPercentileHover>
                <span className={`${gaugeTextClass} font-bold tracking-[0.2em] text-xs md:text-sm uppercase mt-1`} aria-live="polite">
                  {gaugeLabel}
                </span>
              </div>
            </div>
          ) : (
            <div className="gauge-container relative w-full max-w-[280px] sm:max-w-xs md:w-[420px] md:max-w-none aspect-square flex items-center justify-center" aria-hidden="true">
              <div className="absolute inset-0 bg-[#E8B34F]/10 blur-[120px] rounded-full" />
              <span className="sparkle absolute" style={{ top: '10%', left: '20%', fontSize: '20px', animationDelay: '0.2s' }}>✨</span>
              <span className="sparkle absolute" style={{ top: '20%', right: '15%', fontSize: '16px', animationDelay: '0.8s' }}>✨</span>
              <span className="sparkle absolute" style={{ bottom: '25%', left: '10%', fontSize: '18px', animationDelay: '1.2s' }}>✨</span>
              <div className="absolute flex flex-col items-center">
                <svg className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-slate-300 mb-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.8" className="text-slate-200" fill="currentColor" fillOpacity="0.03" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-base sm:text-xl font-bold text-slate-400 px-4">Enter any ZIP/postal code to begin</p>
              </div>
            </div>
          )}

          <div className="mt-6 md:mt-10 max-w-2xl px-2">
            {scoreValue ? (
              <>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">Market Index Analysis</h1>
                {status === 'success' && areaName && (
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D8E6F] mb-4" aria-live="polite">{areaName}</p>
                )}
                <p className="text-slate-500 leading-relaxed text-base sm:text-lg">
                  Zip <span className="text-slate-900 font-semibold">({data.zipcode})</span> shows a {gaugeLabel?.toLowerCase()} profile.
                  Current investment signal is <span className={`${gaugeTextClass} font-bold underline decoration-2 underline-offset-4`}>{gaugeLabel}</span>.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">Neighborhood Growth Analysis</h1>
                <p className="text-slate-500 leading-relaxed text-base sm:text-lg">
                  Discover growth potential and development opportunities. Search by ZIP code to get a comprehensive market index for any neighborhood.
                </p>
              </>
            )}
            {status === 'error' && errorMessage && (
              <p id="search-error" role="alert" className="mt-3 text-sm text-rose-500 font-semibold">
                {errorMessage}
              </p>
            )}
          </div>
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          {/* Growth Drivers */}
          <section
            aria-label="Growth drivers"
            className="intro-card soft-card card-gradient-emerald hover-lift rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 flex flex-col border border-white reveal-node relative"
            style={{ animationDelay: '0.1s' }}
          >
            {status === 'loading' && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] z-20" aria-hidden="true" />
            )}
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#2D8E6F]/10 flex items-center justify-center" aria-hidden="true">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[#2D8E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Growth Drivers</h2>
                  <span className="text-[10px] text-[#2D8E6F] font-black uppercase tracking-widest badge-pulse" aria-live="polite">
                    +{drivers.length} trend{drivers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#2D8E6F]/10 text-[#2D8E6F] text-[10px] font-black uppercase tracking-widest rounded-full">Ascending</span>
            </div>

            <div className="space-y-3 relative z-10">
              {status === 'loading' ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse" aria-hidden="true" />
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse" aria-hidden="true" />
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse" aria-hidden="true" />
                </>
              ) : drivers.length === 0 ? (
                <p className="p-4 rounded-2xl bg-slate-50 text-sm text-slate-400">No drivers yet.</p>
              ) : (
                <ul role="list" className="space-y-3">
                  {drivers.map((item, idx) => (
                    <li key={`${item.label}-${idx}`}>
                      <FactorHover label={item.label} score={item.score} isDriver={true}>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-[#2D8E6F]/5 cursor-pointer transition-all duration-300 ease-out group/item min-h-[52px]">
                          <div className="flex items-center gap-3 md:gap-4">
                            <span className="text-lg opacity-80 text-[#2D8E6F]" aria-hidden="true">●</span>
                            <span className="text-sm font-semibold text-slate-700 group-hover/item:text-[#2D8E6F] transition-colors">{item.label}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-semibold ml-2 flex-shrink-0" aria-label={`score ${item.score.toFixed(1)} points`}>
                            +{item.score.toFixed(1)}
                          </span>
                        </div>
                      </FactorHover>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Risk Indicators */}
          <section
            aria-label="Risk indicators"
            className="intro-card soft-card card-gradient-rose hover-lift rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 flex flex-col border border-white reveal-node relative"
            style={{ animationDelay: '0.2s' }}
          >
            {status === 'loading' && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] z-20" aria-hidden="true" />
            )}
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#D4465E]/10 flex items-center justify-center" aria-hidden="true">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4465E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Risk Indicators</h2>
                  <span className="text-[10px] text-[#D4465E] font-black uppercase tracking-widest badge-pulse" aria-live="polite">
                    -{risks.length} signal{risks.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#D4465E]/10 text-[#D4465E] text-[10px] font-black uppercase tracking-widest rounded-full">Alert</span>
            </div>

            <div className="space-y-3 relative z-10">
              {status === 'loading' ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse" aria-hidden="true" />
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse" aria-hidden="true" />
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse" aria-hidden="true" />
                </>
              ) : risks.length === 0 ? (
                <p className="p-4 rounded-2xl bg-slate-50 text-sm text-slate-400">No risks yet.</p>
              ) : (
                <ul role="list" className="space-y-3">
                  {risks.map((item, idx) => (
                    <li key={`${item.label}-${idx}`}>
                      <FactorHover label={item.label} score={item.score} isDriver={false}>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-[#D4465E]/5 cursor-pointer transition-all duration-300 ease-out group/item min-h-[52px]">
                          <div className="flex items-center gap-3 md:gap-4">
                            <span className="text-lg opacity-80 text-[#D4465E]" aria-hidden="true">●</span>
                            <span className="text-sm font-semibold text-slate-700 group-hover/item:text-[#D4465E] transition-colors">{item.label}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-semibold ml-2 flex-shrink-0" aria-label={`score ${item.score.toFixed(1)} points`}>
                            {item.score.toFixed(1)}
                          </span>
                        </div>
                      </FactorHover>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Bottom Info Banner */}
        <div
          className="intro-footer mt-8 md:mt-16 p-5 sm:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 shadow-sm reveal-node"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0" aria-hidden="true">
              <div className="w-3.5 h-3.5 rounded-full bg-[#2D8E6F] animate-ping opacity-20" />
              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-[#2D8E6F] border-2 border-white" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Real-time data stream <span className="text-slate-900 font-bold">Active</span> — Last sync 4m ago.
            </p>
          </div>
          <button
            type="button"
            className="group flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-3.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 shadow-xl shadow-slate-900/10 uppercase tracking-widest w-full sm:w-auto justify-center focus-ring"
          >
            <span>Export Analytics</span>
            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="Add alert"
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-[#2D8E6F] text-white rounded-full shadow-2xl shadow-[#2D8E6F]/40 flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all duration-500 z-[60] group focus-ring"
      >
        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="absolute right-full mr-3 sm:mr-4 px-3 sm:px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
          Add Alert
        </span>
      </button>

      <Footer />
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={home} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/careers/:id" element={<JobDetailPage />} />
      <Route path="/careers/:id/apply" element={<ApplicationPage />} />
    </Routes>
  )
}

export default App
