import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileText, List, AlertTriangle, CheckSquare, Clock,
  MessageSquare, BookOpen, ChevronLeft, Info, GitCompare,
  Scale, MapPin, ChevronDown, ChevronRight, X, LayoutGrid,
} from 'lucide-react'
import { useAnalysis } from '../features/analysis/useAnalysis'
import ClauseCard from '../features/analysis/ClauseCard'
import QAPanel from '../features/qa/QAPanel'
import ObligationsPanel from '../features/obligations/ObligationsPanel'
import TimelinePanel from '../features/timeline/TimelinePanel'
import ConsultationPanel from '../features/consultation/ConsultationPanel'
import AttentionBadge from '../components/ui/AttentionBadge'
import SourceTag from '../components/ui/SourceTag'
import ProgressLoader from '../components/ui/ProgressLoader'
import ErrorState from '../components/ui/ErrorState'
import Disclosure from '../components/ui/Disclosure'

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview',       Icon: FileText,      color: 'bg-blue-500'   },
  { id: 'attention',    label: 'Attention',      Icon: AlertTriangle, color: 'bg-red-400'    },
  { id: 'clauses',      label: 'Clauses',        Icon: List,          color: 'bg-yellow-400' },
  { id: 'obligations',  label: 'Obligations',    Icon: CheckSquare,   color: 'bg-green-500'  },
  { id: 'timeline',     label: 'Timeline',       Icon: Clock,         color: 'bg-orange-400' },
  { id: 'ask',          label: 'Ask Document',   Icon: MessageSquare, color: 'bg-blue-500'   },
  { id: 'consultation', label: 'Lawyer Prep',    Icon: BookOpen,      color: 'bg-purple-500' },
]

const CAT_LABELS = {
  financial:'Financial', termination:'Termination', restrictions:'Restrictions',
  ownership:'Ownership', disputes:'Disputes', time:'Time & Duration', general:'General',
}

// ── Section nav (desktop left sidebar) ───────────────────────────────────────
function SectionNav({ document, activeSectionId, onSelect }) {
  if (!document?.sections?.length) return null
  const grouped = document.sections.reduce((acc, s) => {
    const c = s.category || 'general';(acc[c] = acc[c] || []).push(s); return acc
  }, {})
  return (
    <nav aria-label="Document sections" className="space-y-4 text-sm">
      {Object.entries(grouped).map(([cat, secs]) => (
        <div key={cat}>
          <p className="overline mb-1.5 px-2">{CAT_LABELS[cat] || cat}</p>
          <ul className="space-y-0.5">
            {secs.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    activeSectionId === s.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  aria-current={activeSectionId === s.id ? 'true' : undefined}
                >
                  <span className="font-mono text-gray-400 mr-1.5">{s.sectionNumber}</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

// ── Document viewer ───────────────────────────────────────────────────────────
function DocumentViewer({ document, highlightedSectionId }) {
  const refs = useRef({})
  useEffect(() => {
    if (highlightedSectionId && refs.current[highlightedSectionId]) {
      refs.current[highlightedSectionId].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [highlightedSectionId])
  if (!document?.sections) return null
  return (
    <div className="space-y-4">
      <div className="alert-warning text-xs">
        <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <p>{document.disclaimer}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">{document.title}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {[
            ['Type', document.metadata?.documentType],
            ['Effective', document.metadata?.effectiveDate],
            ['Employer', document.metadata?.parties?.employer],
            ['Employee', document.metadata?.parties?.employee],
            ['Law', document.metadata?.governingLaw],
            ['Pages', document.metadata?.totalPages],
          ].filter(([,v]) => v).map(([label, value]) => (
            <div key={label} className="flex gap-1">
              <dt className="text-gray-500 font-medium flex-shrink-0">{label}:</dt>
              <dd className="text-gray-800 truncate">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {document.sections.map(section => (
        <article
          key={section.id}
          ref={el => { refs.current[section.id] = el }}
          id={`section-${section.id}`}
          className={`scroll-mt-20 transition-all duration-300 ${highlightedSectionId === section.id ? 'doc-section-highlighted' : 'doc-section'}`}
          aria-label={`Section ${section.sectionNumber}: ${section.title}`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              <span className="font-mono text-gray-400 mr-2 text-xs">{section.sectionNumber}.</span>
              {section.title}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0">p.{section.page}</span>
          </div>
          <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{section.text}</pre>
        </article>
      ))}
    </div>
  )
}

// ── Tab content components ────────────────────────────────────────────────────
function OverviewTab({ document, analysis, onSourceClick }) {
  if (!analysis) return null
  const { high = 0, medium = 0, low = 0 } = analysis.attentionCounts || {}
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Clauses',     value: analysis.clauseCount    },
          { label: 'Obligations', value: analysis.obligationCount },
          { label: 'Sections',    value: analysis.sectionCount   },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-gray-900">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="overline mb-3">Attention Summary</p>
        <div className="space-y-2">
          {[
            { level: 'high',   count: high,   bgCls: 'bg-red-50'    },
            { level: 'medium', count: medium, bgCls: 'bg-yellow-50' },
            { level: 'low',    count: low,    bgCls: 'bg-green-50'  },
          ].map(({ level, count, bgCls }) => (
            <div key={level} className={`flex items-center justify-between gap-3 px-3 py-2 rounded ${bgCls}`}>
              <AttentionBadge level={level} />
              <span className="text-sm font-semibold text-gray-700">{count}</span>
            </div>
          ))}
        </div>
      </div>
      {analysis.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="overline mb-3">Document Summary</p>
          <dl className="space-y-1.5 text-sm">
            {[['Type', analysis.summary.documentType],['Effective', analysis.summary.effectiveDate],['Duration', analysis.summary.duration]]
              .filter(([,v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-gray-500 font-medium w-20 flex-shrink-0">{k}:</dt>
                <dd className="text-gray-800">{v}</dd>
              </div>
            ))}
          </dl>
          {analysis.summary.keyTopics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {analysis.summary.keyTopics.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
            </div>
          )}
        </div>
      )}
      {analysis.attentionAreas?.filter(a => a.level === 'high').length > 0 && (
        <div className="space-y-2">
          <p className="overline">Key Findings</p>
          {analysis.attentionAreas.filter(a => a.level === 'high').map(area => (
            <div key={area.id} className="attention-card-high p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{area.title}</p>
                <AttentionBadge level="high" showLabel={false} />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{area.summary}</p>
              <SourceTag section={area.sourceSection} page={area.sourcePage}
                onClick={onSourceClick ? () => onSourceClick({ sectionId: area.clauseId }) : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AttentionTab({ analysis, clauses, onSourceClick }) {
  if (!analysis?.attentionAreas?.length) return (
    <div className="empty-state"><AlertTriangle className="w-8 h-8 text-gray-300" /><p className="text-sm">No attention areas detected.</p></div>
  )
  const clauseMap = (clauses?.clauses || []).reduce((acc, c) => { acc[c.id] = c; return acc }, {})
  const grouped = { high: [], medium: [], low: [] }
  for (const area of analysis.attentionAreas) { if (grouped[area.level]) grouped[area.level].push(area) }
  return (
    <div className="space-y-6">
      {['high', 'medium', 'low'].map(level => {
        const areas = grouped[level]; if (!areas.length) return null
        const containerCls = level === 'high' ? 'attention-card-high' : level === 'medium' ? 'attention-card-medium' : 'attention-card-low'
        return (
          <section key={level} aria-labelledby={`att-${level}`}>
            <div className="flex items-center gap-2 mb-3">
              <AttentionBadge level={level} />
              <span id={`att-${level}`} className="text-xs text-gray-500">{areas.length} area{areas.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {areas.map(area => {
                const clause = clauseMap[area.clauseId]
                return (
                  <div key={area.id} className={`${containerCls} p-4 space-y-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug">{area.title}</h3>
                      <AttentionBadge level={level} showLabel={false} />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{area.summary}</p>
                    {clause && (
                      <Disclosure title="Why was this highlighted?">
                        <div className="space-y-3 pt-1">
                          <div><p className="overline mb-1.5">Plain English</p><p className="text-sm text-gray-700 leading-relaxed">{clause.plainEnglish}</p></div>
                          <div><p className="overline mb-1.5">What the document says</p><blockquote className="doc-quote">{clause.originalText}</blockquote></div>
                          {clause.whatToVerify?.length > 0 && (
                            <div><p className="overline mb-1.5">What to verify</p>
                              <ul className="space-y-1.5">{clause.whatToVerify.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-blue-400 mt-0.5 flex-shrink-0">·</span>{item}</li>
                              ))}</ul>
                            </div>
                          )}
                        </div>
                      </Disclosure>
                    )}
                    <SourceTag section={area.sourceSection} page={area.sourcePage}
                      onClick={onSourceClick && clause ? () => onSourceClick(clause) : undefined} />
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ClausesTab({ clauses, onSourceClick }) {
  const [filter, setFilter] = useState('all')
  if (!clauses?.clauses?.length) return (
    <div className="empty-state"><List className="w-8 h-8 text-gray-300" /><p className="text-sm">No clauses extracted.</p></div>
  )
  const categories = ['all', ...Object.keys(clauses.grouped || {})]
  const displayed  = filter === 'all' ? clauses.clauses : (clauses.grouped[filter] || [])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} aria-pressed={filter === cat}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === cat ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {cat === 'all' ? `All (${clauses.total})` : `${CAT_LABELS[cat] || cat} (${(clauses.grouped[cat] || []).length})`}
          </button>
        ))}
      </div>
      <div className="space-y-3">{displayed.map(clause => <ClauseCard key={clause.id} clause={clause} onSourceClick={onSourceClick} />)}</div>
    </div>
  )
}

// ── Mobile FAB grid + full-screen panel ─────────────────────────────────────
function MobilePanelDrawer({ activeTab, setActiveTab, tabContent, onClose }) {
  const tab = TABS.find(t => t.id === activeTab)

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-50 flex flex-col bg-white" aria-modal="true" role="dialog" aria-label={tab?.label}>

      {/* Drawer top bar */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 flex-shrink-0 bg-white">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Close panel"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to document
        </button>
        <span className="w-px h-5 bg-gray-200 flex-shrink-0" />
        {tab && (
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg ${tab.color} flex items-center justify-center`}>
              <tab.Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">{tab.label}</span>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className={`flex-1 overflow-y-auto p-4 bg-gray-50 ${activeTab === 'ask' ? 'flex flex-col' : ''}`}>
        {tabContent[activeTab] || null}
      </div>

      {/* Tab switcher at bottom — horizontal scroll, no clipping */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Switch view</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(({ id, label, Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              className={`flex flex-col items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-2xl transition-all duration-150 min-w-[64px] active:scale-95 ${
                activeTab === id
                  ? 'bg-blue-50 ring-2 ring-blue-400 ring-offset-1'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                activeTab === id ? color : 'bg-white border border-gray-200'
              }`}>
                <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className={`text-[11px] font-semibold leading-tight text-center whitespace-nowrap ${
                activeTab === id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Mobile FAB button (floating action button grid trigger) ──────────────────
function MobileFAB({ onOpen }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      {/* Backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {/* FAB icon grid — shown when expanded */}
        {expanded && (
          <div className="grid grid-cols-3 gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-xl animate-scale-in w-72">
            {TABS.map(({ id, label, Icon, color }) => (
              <button
                key={id}
                onClick={() => { setExpanded(false); onOpen(id) }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                aria-label={`Open ${label}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setExpanded(o => !o)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95
            ${expanded ? 'bg-gray-700 hover:bg-gray-800 rotate-45' : 'bg-blue-500 hover:bg-blue-600'}`}
          aria-label={expanded ? 'Close analysis menu' : 'Open analysis tools'}
          aria-expanded={expanded}
        >
          {expanded
            ? <X className="w-6 h-6 text-white" />
            : <LayoutGrid className="w-6 h-6 text-white" />
          }
        </button>

        {/* Hint label — shown only when not expanded */}
        {!expanded && (
          <div className="absolute bottom-16 right-0 bg-gray-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap animate-fade-in pointer-events-none">
            Analysis tools
          </div>
        )}
      </div>
    </>
  )
}

// ── Main AnalysisPage ─────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { document, analysis, clauses, obligations, timeline, loading, error, reload } = useAnalysis(documentId)

  const [activeTab,       setActiveTab]       = useState('overview')
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [highlightedSec,  setHighlightedSec]  = useState(null)
  const [leftNavOpen,     setLeftNavOpen]      = useState(true)

  // Mobile: drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleSourceClick = (clause) => {
    const sid = clause?.sectionId || clause?.sectionNumber
    if (!sid) return
    setActiveSectionId(sid)
    setHighlightedSec(sid)
    setTimeout(() => setHighlightedSec(null), 3000)
    // On mobile, close drawer to show the highlighted section
    setMobileDrawerOpen(false)
  }

  const openMobilePanel = (tabId) => {
    setActiveTab(tabId)
    setMobileDrawerOpen(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm"><ProgressLoader /></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <ErrorState message={error} onRetry={reload} />
    </div>
  )

  if (!document) return null

  const tabContent = {
    overview:     <OverviewTab     document={document} analysis={analysis} onSourceClick={handleSourceClick} />,
    attention:    <AttentionTab    analysis={analysis} clauses={clauses}   onSourceClick={handleSourceClick} />,
    clauses:      <ClausesTab      clauses={clauses}                        onSourceClick={handleSourceClick} />,
    obligations:  <ObligationsPanel obligations={obligations} />,
    timeline:     <TimelinePanel   timeline={timeline} />,
    ask:          <QAPanel         documentId={documentId} />,
    consultation: <ConsultationPanel documentId={documentId} />,
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-2 px-3 sm:px-4 h-14 border-b border-gray-200 bg-white flex-shrink-0 z-20">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <span className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden="true" />

        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 flex-shrink-0"
          aria-label="Go to dashboard"
        >
          <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
            <Scale className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm hidden sm:inline">ClauseLens</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 hidden sm:block" aria-hidden="true" />

        {/* Title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{document.title}</h1>
            {analysis?.isDemo && <span className="badge badge-blue text-xs hidden sm:inline-flex">Sample</span>}
            {analysis?.isUploaded && <span className="badge badge-added text-xs hidden sm:inline-flex">Uploaded</span>}
          </div>
          {analysis && (
            <p className="text-xs text-gray-500 leading-none mt-0.5 hidden sm:block">
              {analysis.clauseCount} clauses · {analysis.obligationCount} obligations
              {analysis.attentionCounts?.high > 0 && <span className="text-red-500"> · {analysis.attentionCounts.high} high</span>}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link to="/comparison" className="btn-ghost btn-sm hidden md:inline-flex">
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Compare</span>
          </Link>
          <button onClick={() => { setActiveTab('consultation'); setMobileDrawerOpen(true) }} className="btn-secondary btn-sm">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lawyer Prep</span>
          </button>
        </div>
      </header>

      {/* ── 3-col workspace (md+) ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: section nav — desktop only */}
        <aside
          className={`${leftNavOpen ? 'w-52' : 'w-0'} flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto hidden lg:block transition-all duration-200`}
          aria-label="Document navigation"
        >
          <div className="p-3">
            <p className="overline mb-3 px-2">Sections</p>
            <SectionNav document={document} activeSectionId={activeSectionId}
              onSelect={id => { setActiveSectionId(id); setHighlightedSec(id); setTimeout(() => setHighlightedSec(null), 3000) }} />
          </div>
        </aside>

        {/* CENTRE: document text — full width on mobile */}
        <main className="flex-1 overflow-y-auto border-r border-gray-200 bg-gray-50 min-w-0" aria-label="Document content">
          <div className="max-w-2xl mx-auto p-4 sm:p-5 lg:p-6">
            <DocumentViewer document={document} highlightedSectionId={highlightedSec} />
            {/* Bottom padding so content isn't hidden behind mobile FAB */}
            <div className="h-24 md:hidden" aria-hidden="true" />
          </div>
        </main>

        {/* RIGHT: analysis panel — desktop only */}
        <aside
          className="w-80 xl:w-96 flex-shrink-0 bg-white overflow-hidden flex hidden md:flex"
          aria-label="Insights panel"
        >
          {/* Vertical icon tab rail */}
          <div className="w-12 flex-shrink-0 border-r border-gray-200 flex flex-col py-3 bg-gray-50">
            {TABS.map(({ id, label, Icon, color }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                title={label}
                className={`w-full flex flex-col items-center gap-1 py-3 px-1 text-center transition-colors relative ${
                  activeTab === id ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {activeTab === id && <span className="absolute left-0 top-1/4 h-1/2 w-0.5 bg-blue-500 rounded-r" />}
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium leading-tight">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div
            role="tabpanel"
            aria-label={TABS.find(t => t.id === activeTab)?.label}
            className={`flex-1 overflow-y-auto p-4 min-h-0 min-w-0 ${activeTab === 'ask' ? 'flex flex-col' : ''}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-gray-100">
              {TABS.find(t => t.id === activeTab)?.label}
            </p>
            {tabContent[activeTab] || null}
          </div>
        </aside>
      </div>

      {/* ── MOBILE: floating action button (hidden md+) ─────────────────── */}
      <div className="md:hidden">
        <MobileFAB onOpen={openMobilePanel} />
      </div>

      {/* ── MOBILE: full-screen drawer ──────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="md:hidden">
          <MobilePanelDrawer
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabContent={tabContent}
            onClose={() => setMobileDrawerOpen(false)}
          />
        </div>
      )}

    </div>
  )
}
