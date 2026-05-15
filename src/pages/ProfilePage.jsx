import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

function scoreLabel(score) {
  if (!score) return null
  if (score >= 65) return { label: 'High Growth', cls: 'text-emerald-600 bg-emerald-50' }
  if (score >= 35) return { label: 'Balanced', cls: 'text-amber-600 bg-amber-50' }
  return { label: 'High Risk', cls: 'text-rose-600 bg-rose-50' }
}

export function ProfilePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [savedZips, setSavedZips] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
      return
    }
    if (!user) return
    supabase
      .from('saved_zips')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })
      .then(({ data }) => {
        setSavedZips(data ?? [])
        setFetching(false)
      })
  }, [user, loading, navigate])

  const handleDelete = async (id) => {
    await supabase.from('saved_zips').delete().eq('id', id)
    setSavedZips(prev => prev.filter(z => z.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
          {user && <p className="text-slate-500 mt-1 text-sm">{user.email}</p>}
        </div>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Saved ZIP Codes</h2>

          {fetching ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : savedZips.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-base font-medium">No saved ZIP codes yet.</p>
              <p className="text-sm mt-1">Search a ZIP and click the bookmark to save it.</p>
              <Link
                to="/"
                className="mt-6 inline-block px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-[#2D8E6F] transition-all"
              >
                Search ZIPs
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {savedZips.map(z => {
                const badge = scoreLabel(z.score)
                return (
                  <li key={z.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <button
                      type="button"
                      onClick={() => navigate('/', { state: { autoSearch: z.zip_code } })}
                      className="flex items-center gap-4 flex-1 text-left focus-ring rounded-xl"
                    >
                      <div className="w-10 h-10 bg-[#2D8E6F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#2D8E6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{z.zip_code}</span>
                          {badge && (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        {z.area_name && <p className="text-xs text-slate-500 mt-0.5">{z.area_name}</p>}
                      </div>
                    </button>

                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      {z.score != null && (
                        <span className="text-2xl font-bold text-slate-900">{z.score}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(z.id)}
                        aria-label={`Remove ${z.zip_code}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all focus-ring"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
