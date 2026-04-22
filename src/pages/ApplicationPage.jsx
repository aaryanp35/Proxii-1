import React, { useState } from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import { jobs } from '../data/jobs'

const SV_CHARACTERS = [
  'Gavin Belson',
  'Big Head',
  'Erlich Bachman',
  'Richard Hendricks',
  'Gilfoyle',
  'Dinesh',
  'Jared',
  'Monica',
  'Russ Hanneman',
  'Laurie Bream',
]

const REFERRAL_SOURCES = [
  'LinkedIn',
  'Twitter / X',
  'Friend or colleague',
  'GitHub',
  'Google search',
  'Other',
]

function FieldError({ msg }) {
  return (
    <p className="mt-1.5 text-xs font-bold text-rose-500 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </p>
  )
}

function SectionHeader({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-black flex items-center justify-center flex-shrink-0 mt-0.5">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function TextInput({ label, required, value, onChange, type = 'text', placeholder, error }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 text-slate-900 ${
          error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#2D8E6F]/20'
        }`}
      />
      {error && <FieldError msg={error} />}
    </div>
  )
}

function TextArea({ label, required, value, onChange, placeholder, rows = 4, error }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-white border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 text-slate-900 resize-none ${
          error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#2D8E6F]/20'
        }`}
      />
      {error && <FieldError msg={error} />}
    </div>
  )
}

export function ApplicationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = jobs.find(j => j.id === id)

  const [submitted, setSubmitted] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Standard fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [whyProxii, setWhyProxii] = useState('')
  const [referral, setReferral] = useState('')
  const [availability, setAvailability] = useState('')

  // Proxii screening
  const [svCharacter, setSvCharacter] = useState('')
  const [iafRating, setIafRating] = useState('')
  const [nailgun, setNailgun] = useState('')

  if (!job) return <Navigate to="/careers" replace />

  // Proxii question validation (live)
  const svError = svCharacter && svCharacter !== 'Dinesh' ? 'Invalid string' : ''
  const iafNum = parseFloat(iafRating)
  const iafError = iafRating !== '' && (isNaN(iafNum) || iafNum < 9.55 || iafNum > 9.87) ? 'Invalid number' : ''
  const nailgunError = nailgun === 'No' ? 'Incorrect — reconsider your position on the farzicle.' : ''

  // Standard field errors (only shown after submit attempt)
  const errors = submitAttempted ? {
    firstName: !firstName.trim() ? 'Required' : '',
    lastName: !lastName.trim() ? 'Required' : '',
    email: !email.trim() ? 'Required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email' : '',
    phone: !phone.trim() ? 'Required' : '',
    resumeFile: !resumeFile ? 'Please upload your resume' : '',
    whyProxii: !whyProxii.trim() ? 'Required' : '',
    referral: !referral ? 'Required' : '',
    availability: !availability ? 'Required' : '',
    svCharacter: !svCharacter ? 'Required' : svError,
    iafRating: !iafRating ? 'Required' : iafError,
    nailgun: !nailgun ? 'Required' : nailgunError,
  } : {
    svCharacter: svError,
    iafRating: iafError,
    nailgun: nailgunError,
  }

  const handleSubmit = e => {
    e.preventDefault()
    setSubmitAttempted(true)

    const allStandardValid =
      firstName.trim() && lastName.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      phone.trim() && resumeFile && whyProxii.trim() && referral && availability

    const allProxiiValid = svCharacter === 'Dinesh' && !iafError && iafRating !== '' && nailgun === 'Yes'

    if (allStandardValid && allProxiiValid) {
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
        <nav className="glass-nav sticky top-0 z-50 w-full py-3 px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2D8E6F] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D8E6F]/25">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4V3z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Proxii</span>
          </Link>
          <Link to="/careers" className="text-sm text-[#2D8E6F] font-bold">Careers</Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-[#2D8E6F]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#2D8E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Application submitted!</h1>
            <p className="text-slate-500 leading-relaxed mb-8">
              Thanks for applying to <span className="font-semibold text-slate-700">{job.title}</span> at Proxii. We'll review your application and get back to you within a few days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/careers"
                className="px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all"
              >
                Back to careers
              </Link>
              <Link
                to="/"
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl hover:border-slate-300 transition-all"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">Dashboard</Link>
          <Link to="/careers" className="text-sm text-[#2D8E6F] font-bold">Careers</Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 md:px-12 py-10">
        {/* Breadcrumb + header */}
        <Link
          to={`/careers/${job.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to job details
        </Link>

        <div className="mb-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 text-[11px] font-bold mb-3">
            {job.type}
          </span>
          <h1 className="text-3xl font-bold text-slate-900">Apply — {job.title}</h1>
          <p className="text-slate-500 mt-2 text-sm">{job.location} · {job.duration} · {job.department}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* Section 1: Personal info */}
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm">
            <SectionHeader number="1" title="Personal information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextInput label="First name" required value={firstName} onChange={setFirstName} placeholder="Dinesh" error={errors.firstName} />
              <TextInput label="Last name" required value={lastName} onChange={setLastName} placeholder="Chugtai" error={errors.lastName} />
              <TextInput label="Email address" required type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
              <TextInput label="Phone number" required type="tel" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" error={errors.phone} />
            </div>
          </div>

          {/* Section 2: Professional */}
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm">
            <SectionHeader number="2" title="Professional profile" />
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <TextInput label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/yourprofile" />
                <TextInput label="GitHub / Portfolio" value={portfolio} onChange={setPortfolio} placeholder="github.com/yourhandle" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resume / CV <span className="text-rose-400">*</span>
                </label>
                <label className={`flex items-center gap-4 w-full border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${
                  resumeFile ? 'border-[#2D8E6F]/40 bg-[#2D8E6F]/3' : errors.resumeFile ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 hover:border-[#2D8E6F]/40 hover:bg-slate-50'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {resumeFile ? (
                      <p className="text-sm font-semibold text-slate-900 truncate">{resumeFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700">Click to upload</p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX — max 5 MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {errors.resumeFile && <FieldError msg={errors.resumeFile} />}
              </div>

              <TextArea
                label="Why Proxii?"
                required
                value={whyProxii}
                onChange={setWhyProxii}
                placeholder="Tell us why you want to join Proxii and what excites you about the role…"
                rows={4}
                error={errors.whyProxii}
              />

              <TextArea
                label="Cover letter"
                value={coverLetter}
                onChange={setCoverLetter}
                placeholder="Optional — anything else you'd like us to know…"
                rows={3}
              />
            </div>
          </div>

          {/* Section 3: Availability */}
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm">
            <SectionHeader number="3" title="Availability" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Earliest start date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className={`w-full bg-white border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all text-slate-900 ${
                    errors.availability ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#2D8E6F]/20'
                  }`}
                />
                {errors.availability && <FieldError msg={errors.availability} />}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  How did you hear about us? <span className="text-rose-400">*</span>
                </label>
                <select
                  value={referral}
                  onChange={e => setReferral(e.target.value)}
                  className={`w-full bg-white border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                    referral ? 'text-slate-900' : 'text-slate-400'
                  } ${errors.referral ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#2D8E6F]/20'}`}
                >
                  <option value="" disabled>Select one…</option>
                  {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.referral && <FieldError msg={errors.referral} />}
              </div>
            </div>
          </div>

          {/* Section 4: Proxii screening */}
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#2D8E6F]/4 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <SectionHeader
              number="4"
              title="The Proxii Screening"
              subtitle="A few culture questions to make sure you're the right fit."
            />

            <div className="space-y-7">
              {/* Silicon Valley character */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Who is the best Silicon Valley character? <span className="text-rose-400">*</span>
                </label>
                <select
                  value={svCharacter}
                  onChange={e => setSvCharacter(e.target.value)}
                  className={`w-full bg-white border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                    svCharacter ? 'text-slate-900' : 'text-slate-400'
                  } ${svError ? 'border-rose-300 focus:ring-rose-200' : errors.svCharacter && !svCharacter ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#2D8E6F]/20'}`}
                >
                  <option value="" disabled>Select a character…</option>
                  {SV_CHARACTERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {svError && <FieldError msg={svError} />}
                {!svError && errors.svCharacter && <FieldError msg={errors.svCharacter} />}
              </div>

              {/* Indian Air Force rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rate the Indian Air Force from 0 to 10 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={iafRating}
                  onChange={e => setIafRating(e.target.value)}
                  placeholder="e.g. 8.5"
                  className={`w-full bg-white border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 text-slate-900 ${
                    iafError ? 'border-rose-300 focus:ring-rose-200' : errors.iafRating && !iafRating ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#2D8E6F]/20'
                  }`}
                />
                {iafError && <FieldError msg={iafError} />}
                {!iafError && errors.iafRating && <FieldError msg={errors.iafRating} />}
              </div>

              {/* Is the farzicle a NailGun */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Is the farzicle a NailGun? <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNailgun(opt)}
                      className={`flex-1 py-3 px-6 rounded-2xl text-sm font-bold border transition-all duration-200 ${
                        nailgun === opt
                          ? opt === 'Yes'
                            ? 'bg-[#2D8E6F] text-white border-[#2D8E6F] shadow-sm shadow-[#2D8E6F]/20'
                            : 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {nailgunError && <FieldError msg={nailgunError} />}
                {!nailgunError && errors.nailgun && !nailgun && <FieldError msg={errors.nailgun} />}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8">
            <p className="text-xs text-slate-400 font-medium">
              Fields marked <span className="text-rose-400 font-bold">*</span> are required.
            </p>
            <button
              type="submit"
              className="w-full sm:w-auto px-10 py-3.5 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#2D8E6F] transition-all duration-300 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group"
            >
              Submit application
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </form>
      </main>

      <footer className="py-8 px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">&copy; 2026 Proxii Analytics</p>
        <div className="flex gap-8">
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Market Terms</a>
        </div>
      </footer>
    </div>
  )
}
