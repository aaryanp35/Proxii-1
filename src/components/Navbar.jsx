import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/about', label: 'About' },
  { to: '/careers', label: 'Careers' },
]

function isActive(to, pathname, exact) {
  if (exact) return pathname === to
  return pathname === to || pathname.startsWith(to + '/')
}

/**
 * Shared site-wide nav.
 * @param {React.ReactNode} centerSlot - Optional content (e.g. search form) rendered
 *   inline on sm+ and below the bar on mobile.
 */
export function Navbar({ centerSlot }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { pathname } = useLocation()
  const { user, signInWithGoogle, signOut } = useAuth()
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  return (
    <nav aria-label="Main navigation" className="glass-nav sticky top-0 z-50 w-full">
      {/* Primary bar */}
      <div className="flex items-center justify-between gap-3 py-3 px-4 sm:px-6 md:px-12 min-h-[60px]">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 flex-shrink-0 focus-ring rounded-lg"
          aria-label="Proxii — go to dashboard"
        >
          <div
            className="w-9 h-9 bg-[#2D8E6F] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D8E6F]/25"
            aria-hidden="true"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4V3z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Proxii</span>
        </Link>

        {/* Center slot — inline on sm+ */}
        {centerSlot && (
          <div className="hidden sm:flex flex-1 mx-4 md:mx-8 max-w-2xl">
            {centerSlot}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-6 lg:gap-8">
          {/* Desktop nav links */}
          {NAV_LINKS.map(({ to, label, exact }) => {
            const active = isActive(to, pathname, exact)
            return (
              <Link
                key={to}
                to={to}
                className={`hidden md:block text-sm font-medium transition-colors focus-ring rounded px-1 ${
                  active ? 'text-[#2D8E6F] font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}

          {/* Auth */}
          {user ? (
            <div className="hidden md:block relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                aria-label="Open user menu"
                aria-expanded={dropdownOpen}
                className="w-9 h-9 rounded-2xl border-2 border-white shadow-md overflow-hidden focus-ring flex-shrink-0"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2D8E6F] to-[#45B08C] flex items-center justify-center text-white text-xs font-bold">
                    {(user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                  <div className="px-4 py-2 text-xs text-slate-400 font-semibold truncate border-b border-slate-50 mb-1">
                    {user.email}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Saved ZIPs
                  </Link>
                  <button
                    type="button"
                    onClick={() => { signOut(); setDropdownOpen(false) }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl bg-slate-900 text-white hover:bg-[#2D8E6F] transition-all focus-ring flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-100 transition-colors focus-ring flex-shrink-0"
          >
            <span
              className={`block w-5 h-0.5 bg-slate-700 rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
              aria-hidden="true"
            />
            <span
              className={`block w-5 h-0.5 bg-slate-700 rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}
              aria-hidden="true"
            />
            <span
              className={`block w-5 h-0.5 bg-slate-700 rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Mobile center slot (search bar) — shown below bar on xs */}
      {centerSlot && (
        <div className="sm:hidden px-4 pb-3 border-t border-slate-50 pt-2">
          {centerSlot}
        </div>
      )}

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-sm"
        >
          <ul className="px-4 py-3 space-y-1" role="list">
            {NAV_LINKS.map(({ to, label, exact }) => {
              const active = isActive(to, pathname, exact)
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center py-3 px-4 rounded-xl text-sm font-semibold transition-colors focus-ring min-h-[44px] ${
                      active
                        ? 'bg-[#2D8E6F]/10 text-[#2D8E6F]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
            <li className="pt-1 border-t border-slate-100">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-ring min-h-[44px]"
                  >
                    Saved ZIPs
                  </Link>
                  <button
                    type="button"
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="w-full text-left flex items-center py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-ring min-h-[44px]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { signInWithGoogle(); setMenuOpen(false) }}
                  className="w-full text-left flex items-center py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-ring min-h-[44px]"
                >
                  Sign in with Google
                </button>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
