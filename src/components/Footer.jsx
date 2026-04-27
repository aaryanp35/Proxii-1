import React from 'react'

export function Footer({ className = '' }) {
  return (
    <footer
      className={`py-8 px-4 sm:px-6 md:px-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}
    >
      <p className="text-xs font-bold text-slate-400 tracking-wider uppercase text-center sm:text-left">
        &copy; 2026 Proxii Analytics — Built for Fintech
      </p>
      <nav aria-label="Footer links" className="flex gap-6 sm:gap-8 md:gap-10">
        <a
          href="#"
          className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest focus-ring rounded"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest focus-ring rounded"
        >
          Market Terms
        </a>
      </nav>
    </footer>
  )
}
