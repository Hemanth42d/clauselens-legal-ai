import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, GitCompare, AlertTriangle,
  CheckSquare, ArrowRight, Loader2, Clock,
  Search, BookOpen, Sparkles, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listDocuments, loadDemoDocument } from '../services/api'
import ErrorState from '../components/ui/ErrorState'
import InlineLegalChat from '../components/InlineLegalChat'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const QUICK_ACTIONS = [
  { Icon: Upload,     label: 'Upload Document', desc: 'Analyse any legal PDF',  to: '/upload',     bg: 'bg-blue-500',  ring: 'ring-blue-200'  },
  { Icon: GitCompare, label: 'Compare Versions', desc: 'See what changed',       to: '/comparison', bg: 'bg-green-500', ring: 'ring-green-200' },
]

const TIPS = [
  { Icon: Search,    color: 'text-blue-500',   bg: 'bg-blue-50',   title: 'Check attention areas first',   desc: 'High-attention clauses are most worth reviewing with a lawyer.'         },
  { Icon: BookOpen,  color: 'text-yellow-600', bg: 'bg-yellow-50', title: 'Ask document questions',         desc: 'The Q&A tab answers questions grounded in your actual document text.'   },
  { Icon: Clock,     color: 'text-green-600',  bg: 'bg-green-50',  title: 'Review the timeline',            desc: 'Key dates and obligations are laid out chronologically.'                },
  { Icon: Sparkles,  color: 'text-orange-500', bg: 'bg-orange-50', title: 'Prepare for your lawyer',        desc: 'The Lawyer Prep tab generates a consultation brief with questions.'     },
]

export default function DashboardPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [opening, setOpening] = useState(null)

  useEffect(() => {
    listDocuments()
      .then(d => setDocs(d.documents || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const openDemo = async (id) => {
    setOpening(id)
    try {
      await loadDemoDocument(id)
      navigate(`/analysis/${id}`)
    } catch { setOpening(null) }
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex h-full">

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto px-6 py-8 space-y-7">

        {/* Greeting */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{greeting()}, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 mt-1">Here's your document workspace.</p>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-primary">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(({ Icon, label, desc, to, bg, ring }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
            >
              <div className={`w-11 h-11 rounded-xl ${bg} ring-4 ${ring} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { Icon: FileText,      value: docs.length || '2', label: 'Documents',      iconCls: 'text-blue-500',   bg: 'bg-blue-50'   },
            { Icon: AlertTriangle, value: '5+',               label: 'High attention', iconCls: 'text-red-400',    bg: 'bg-red-50'    },
            { Icon: CheckSquare,   value: '11+',              label: 'Obligations',    iconCls: 'text-green-500',  bg: 'bg-green-50'  },
            { Icon: Clock,         value: '< 30s',            label: 'Analysis time',  iconCls: 'text-orange-500', bg: 'bg-orange-50' },
          ].map(({ Icon, value, label, iconCls, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${iconCls}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Sample documents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sample Documents</h2>
              <p className="text-xs text-gray-500 mt-0.5">Fictional employment agreements to explore</p>
            </div>
            <button onClick={() => navigate('/comparison')} className="btn-tertiary btn-sm">
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </button>
          </div>

          {loading && (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          )}
          {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
          {!loading && !error && (
            <div className="space-y-3">
              {docs.map(doc => {
                const high = doc.attentionCounts?.high || 0
                return (
                  <div
                    key={doc.documentId}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{doc.clauseCount} clauses</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{doc.obligationCount} obligations</span>
                        {high > 0 && (
                          <><span className="text-gray-200">·</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertTriangle className="w-3 h-3" />{high} high
                          </span></>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openDemo(doc.documentId)}
                      disabled={!!opening}
                      className="btn-primary btn-sm flex-shrink-0"
                    >
                      {opening === doc.documentId
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <><span>Open</span><ArrowRight className="w-3.5 h-3.5" /></>
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tips for getting the most out of ClauseLens</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TIPS.map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-gray-400 text-center pb-2 border-t border-gray-100 pt-4">
          ClauseLens provides educational assistance only — not legal advice.
        </p>
      </div>

      {/* ── Right: Legal Chat sidebar ───────────────────────────────────── */}
      <div className="hidden xl:flex flex-shrink-0 w-80 border-l border-gray-200 bg-white h-full overflow-hidden flex-col">
        <InlineLegalChat />
      </div>

    </div>
  )
}
