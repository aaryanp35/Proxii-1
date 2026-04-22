import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

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
  const { pathname } = useLocation()

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

          {/* Avatar (decorative) */}
          <div
            className="hidden md:block w-9 h-9 rounded-2xl border-2 border-white shadow-md bg-gradient-to-br from-[#2D8E6F] to-[#45B08C] relative flex-shrink-0"
            aria-hidden="true"
          >
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
          </div>

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
          </ul>
        </div>
      )}
    </nav>
  )
}
