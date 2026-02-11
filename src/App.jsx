import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

function App() {
  const [toggleState, setToggleState] = useState('live');
  const [zipCode, setZipCode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const scoreValue = data?.score ?? 65;
  const gaugeLabel = scoreValue >= 70 ? 'High Growth' : scoreValue >= 40 ? 'Balanced Growth' : 'High Risk';
  const gaugeClass = scoreValue >= 70 ? 'text-emerald-400' : scoreValue >= 40 ? 'text-amber-400' : 'text-rose-400';
  const gaugeTextClass = scoreValue >= 70 ? 'text-emerald-500' : scoreValue >= 40 ? 'text-amber-500' : 'text-rose-500';

  const drivers = useMemo(() => data?.drivers ?? [], [data]);
  const risks = useMemo(() => data?.risks ?? [], [data]);

  useEffect(() => {
    const gauge = document.getElementById('main-gauge');
    const circumference = 264;
    const offset = circumference - (scoreValue / 100) * circumference;
    setTimeout(() => {
      gauge?.style.setProperty('stroke-dashoffset', String(offset));
    }, 200);
  }, [scoreValue]);

  const handleSearch = async () => {
    // Supports: US (5-digit), Canada (A1A 1A1), and European formats
    const postalCodeRegex = /^([0-9]{5}|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[0-9]{4,6}|[A-Z]{1,2}\d{1,2}[A-Z\d]?\s?\d[A-Z]{2})$/;
    if (!postalCodeRegex.test(zipCode.trim())) {
      setStatus('error');
      setErrorMessage('Please enter a valid postal code (US, Canada, or Europe).');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await fetch(`/api/score/${zipCode}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch score data');
      }
      const payload = await response.json();
      setData(payload);
      setAreaName(payload.areaName || '');
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Unable to fetch score. Please try again.');
    }
  };

  const handleToggle = (mode) => {
    setToggleState(mode);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 w-full py-3 px-6 md:py-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 bg-[#2D8E6F] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D8E6F]/25">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4V3z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Proxii</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 lg:gap-6 flex-1 md:flex-none">
          <div className="hidden lg:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => handleToggle('live')}
              className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all rounded-xl ${
                toggleState === 'live'
                  ? 'text-[#2D8E6F] bg-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D8E6F] animate-pulse"></span>
              Live
            </button>
            <button
              onClick={() => handleToggle('historical')}
              className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                toggleState === 'historical'
                  ? 'text-[#2D8E6F] bg-white rounded-xl shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Historical
            </button>
          </div>

          <form
            className="w-full sm:w-80 md:w-64 lg:w-[320px] relative group"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              maxLength={20}
              placeholder="Zip/Postal Code"
              value={zipCode}
              onChange={(event) => {
                const value = event.target.value.toUpperCase().trim();
                setZipCode(value);
                if (status === 'error') {
                  setStatus('idle');
                  setErrorMessage('');
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8E6F]/20 transition-all duration-300 placeholder:text-slate-400 text-slate-900 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-900 text-white hover:bg-[#2D8E6F] transition-all"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 md:gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm text-[#2D8E6F] font-bold">Dashboard</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Market Intel</a>
          </div>
          <div className="w-10 h-10 rounded-2xl border-2 border-white shadow-md bg-gradient-to-br from-[#2D8E6F] to-[#45B08C] relative">
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-12">
        
        {/* Hero Section */}
        <section className="mb-20 flex flex-col items-center text-center reveal-node">
          {status === 'loading' && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
              <div className="w-12 h-12 border-4 border-[#2D8E6F]/20 border-t-[#2D8E6F] rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-600">Loading results for {zipCode}...</p>
            </div>
          )}
          <div className="relative w-80 h-80 md:w-[420px] md:h-[420px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#E8B34F]/10 blur-[120px] rounded-full"></div>
            
            {/* Sparkles */}
            <div className="sparkle absolute" style={{ top: '10%', left: '20%', fontSize: '24px', animationDelay: '0.2s' }}>✨</div>
            <div className="sparkle absolute" style={{ top: '20%', right: '15%', fontSize: '18px', animationDelay: '0.8s' }}>✨</div>
            <div className="sparkle absolute" style={{ bottom: '25%', left: '10%', fontSize: '20px', animationDelay: '1.2s' }}>✨</div>

            {/* Gauge */}
            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                className="stroke-current text-slate-100 fill-none"
                strokeWidth="12"
              />
              <circle
                id="main-gauge"
                cx="50%"
                cy="50%"
                r="42%"
                className={`gauge-ring stroke-current ${gaugeClass} fill-none ${status === 'loading' ? 'animate-pulse' : ''}`}
                strokeWidth="12"
                strokeLinecap="round"
                style={{ strokeDasharray: 264, strokeDashoffset: 264 }}
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-7xl md:text-9xl font-bold text-slate-900 tracking-tighter">{scoreValue}</span>
              <span className={`${gaugeTextClass} font-bold tracking-[0.2em] text-xs md:text-sm uppercase mt-1`}>{gaugeLabel}</span>
            </div>
          </div>

          <div className="mt-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">Market Index Analysis</h1>
            {status === 'success' && areaName && (
              <p className="text-2xl md:text-3xl font-bold text-[#2D8E6F] mb-4">{areaName}</p>
            )}
            <p className="text-slate-500 leading-relaxed text-lg">
              {status === 'success' && data?.zipcode ? (
                <>Zip <span className="text-slate-900 font-semibold">({data.zipcode})</span> shows a {gaugeLabel.toLowerCase()} profile. Current investment signal is <span className={`${gaugeTextClass} font-bold underline decoration-2 underline-offset-4`}>{gaugeLabel}</span>.</>
              ) : (
                <>Enter a zip code to load a live score. The gauge will update once results are available.</>
              )}
            </p>
            {status === 'error' && errorMessage && (
              <p className="mt-3 text-sm text-rose-500 font-semibold">{errorMessage}</p>
            )}
          </div>
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Growth Drivers Card */}
          <div className="soft-card card-gradient-emerald hover-lift rounded-[2.5rem] p-8 flex flex-col border border-white reveal-node relative" style={{ animationDelay: '0.1s' }}>
            {status === 'loading' && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[2.5rem] z-20"></div>}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#2D8E6F]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#2D8E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Growth Drivers</h3>
                  <span className="text-[10px] text-[#2D8E6F] font-black uppercase tracking-widest badge-pulse">+4 new trends</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#2D8E6F]/10 text-[#2D8E6F] text-[10px] font-black uppercase tracking-widest rounded-full">Ascending</span>
            </div>

            <div className="space-y-3 relative z-10">
              {status === 'loading' ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse"></div>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse"></div>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse"></div>
                </>
              ) : drivers.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-sm text-slate-400">No drivers yet.</div>
              ) : (
                drivers.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-[#2D8E6F]/5 cursor-pointer transition-all group/item">
                    <div className="flex items-center gap-4">
                      <span className="text-xl opacity-80">●</span>
                      <span className="text-sm font-semibold text-slate-700 group-hover/item:text-[#2D8E6F] transition-colors">{item.label}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">x{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Risk Indicators Card */}
          <div className="soft-card card-gradient-rose hover-lift rounded-[2.5rem] p-8 flex flex-col border border-white reveal-node relative" style={{ animationDelay: '0.2s' }}>
            {status === 'loading' && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[2.5rem] z-20"></div>}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#D4465E]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#D4465E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Risk Indicators</h3>
                  <span className="text-[10px] text-[#D4465E] font-black uppercase tracking-widest badge-pulse">-2 signals</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#D4465E]/10 text-[#D4465E] text-[10px] font-black uppercase tracking-widest rounded-full">Alert</span>
            </div>

            <div className="space-y-3 relative z-10">
              {status === 'loading' ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse"></div>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse"></div>
                  <div className="p-4 rounded-2xl bg-slate-50 h-12 animate-pulse"></div>
                </>
              ) : risks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-sm text-slate-400">No risks yet.</div>
              ) : (
                risks.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-[#D4465E]/5 cursor-pointer transition-all group/item">
                    <div className="flex items-center gap-4">
                      <span className="text-xl opacity-80">●</span>
                      <span className="text-sm font-semibold text-slate-700 group-hover/item:text-[#D4465E] transition-colors">{item.label}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">x{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Info Banner */}
        <div className="mt-16 p-8 rounded-[2.5rem] bg-white border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm reveal-node" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full bg-[#2D8E6F] animate-ping opacity-20"></div>
              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-[#2D8E6F] border-2 border-white"></div>
            </div>
            <p className="text-sm font-medium text-slate-500">Real-time data stream <span className="text-slate-900 font-bold">Active</span> — Last sync 4m ago.</p>
          </div>
          <button className="group flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 shadow-xl shadow-slate-900/10 uppercase tracking-widest">
            <span>Export Analytics</span>
            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-[#2D8E6F] text-white rounded-full shadow-2xl shadow-[#2D8E6F]/40 flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all duration-500 z-[60] group">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">Add Alert</span>
      </button>

      {/* Footer */}
      <footer className="py-10 px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 reveal-node" style={{ animationDelay: '0.5s' }}>
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">&copy; 2024 Proxii Analytics — Built for Fintech</p>
        <div className="flex gap-10">
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Market Terms</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
