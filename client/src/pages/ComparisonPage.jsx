import { useState, useRef, useCallback } from 'react'
import {
  GitCompare, Upload, X, CheckCircle2, AlertCircle,
  FileText, Plus, Minus, Edit3, ArrowRight,
  ChevronDown, Filter, Loader2,
} from 'lucide-react'
import { uploadDocument, compareDocuments } from '../services/api'
import AttentionBadge from '../components/ui/AttentionBadge'
import ProgressLoader from '../components/ui/ProgressLoader'
import ErrorState from '../components/ui/ErrorState'


const MAX_MB    = 10
const MAX_BYTES = MAX_MB * 1024 * 1024

function validateFile(f) {
  if (!f) return 'Please select a file.'
  const ok = f.type === 'application/pdf' || f.type === 'application/x-pdf' ||
             f.name.toLowerCase().endsWith('.pdf') || f.type === 'text/plain' ||
             f.name.toLowerCase().endsWith('.txt')
  if (!ok) return 'Please upload a PDF or text file.'
  if (f.size > MAX_BYTES) return `File exceeds ${MAX_MB} MB.`
  return null
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

function DropZone({ side, file, docId, uploading, error, onFile, onClear }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  const pick = useCallback((files) => {
    const f = files?.[0]
    if (!f) return
    const err = validateFile(f)
    if (err) { onFile(null, null, err); return }
    onFile(f, null, null)
  }, [onFile])

  const isDone = !!docId
  const borderCls = isDone
    ? 'border-green-300 bg-green-50'
    : drag
      ? 'border-blue-400 bg-blue-50'
      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'

  return (
    <div className={`border-2 border-dashed rounded-xl transition-colors cursor-pointer ${borderCls} ${isDone ? 'cursor-default' : ''}`}
      onClick={() => !isDone && !uploading && inputRef.current?.click()}
      onKeyDown={e => e.key === 'Enter' && !isDone && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={e => { e.preventDefault(); setDrag(false) }}
      onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }}
      role="button" tabIndex={isDone ? -1 : 0}
      aria-label={`Upload document ${side}`}
    >
      <div className="py-8 px-5 flex flex-col items-center gap-3 text-center min-h-[160px] justify-center">
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm text-gray-600">Processing…</p>
          </>
        ) : isDone ? (
          <>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{file?.name}</p>
              {file && <p className="text-xs text-gray-400 mt-0.5">{fmtBytes(file.size)}</p>}
              <p className="text-xs text-green-600 font-medium mt-1">Ready to compare</p>
            </div>
            <button onClick={e => { e.stopPropagation(); onClear() }}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </>
        ) : (
          <>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${drag ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`w-5 h-5 ${drag ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {drag ? 'Drop here' : `Upload Document ${side}`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF · max {MAX_MB} MB</p>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
              className="btn-secondary btn-sm">
              <FileText className="w-3.5 h-3.5" /> Choose File
            </button>
          </>
        )}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain"
        onChange={e => pick(e.target.files)} className="sr-only" />
    </div>
  )
}

const CHANGE_TYPE = {
  added:    { label: 'Added',    cls: 'badge-added',    Icon: Plus  },
  modified: { label: 'Modified', cls: 'badge-modified', Icon: Edit3 },
  removed:  { label: 'Removed',  cls: 'badge-removed',  Icon: Minus },
}

function ChangeTypeBadge({ type }) {
  const { label, cls, Icon } = CHANGE_TYPE[type] || CHANGE_TYPE.modified
  return <span className={cls} aria-label={type}><Icon className="w-3 h-3" />{label}</span>
}

const ATTENTION_COLORS = {
  high:   { bg: 'bg-red-50',    border: 'border-red-200',    bar: 'bg-red-400'    },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-400' },
  low:    { bg: 'bg-gray-50',   border: 'border-gray-200',   bar: 'bg-gray-300'   },
}

function ChangeCard({ change, index }) {
  const [open, setOpen] = useState(false)
  const isAdded   = change.changeType === 'added'
  const isRemoved = change.changeType === 'removed'
  const ac        = ATTENTION_COLORS[change.attentionLevel] || ATTENTION_COLORS.low

  return (
    <article className={`bg-white border ${ac.border} rounded-xl overflow-hidden`}>
      {/* Accent bar at top */}
      <div className={`h-1 ${ac.bar}`} />

      <div className="p-5">
        {/* Row 1 — metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
            {change.section}
          </span>
          <ChangeTypeBadge type={change.changeType} />
          <AttentionBadge level={change.attentionLevel} />
        </div>

        <h3 className="text-base font-semibold text-gray-900 mb-3">{change.clauseTitle}</h3>

        {!isAdded && !isRemoved && change.valueBefore && change.valueAfter && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-0 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-0.5">Before</p>
              <p className="text-sm font-semibold text-red-700 line-through">{change.valueBefore}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-0.5">After</p>
              <p className="text-sm font-semibold text-green-700">{change.valueAfter}</p>
            </div>
          </div>
        )}
        {isAdded && change.valueAfter && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-0.5">New Provision</p>
            <p className="text-sm font-medium text-blue-800">{change.valueAfter}</p>
          </div>
        )}
        {isRemoved && change.valueBefore && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-0.5">Removed</p>
            <p className="text-sm font-medium text-red-700 line-through">{change.valueBefore}</p>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          aria-expanded={open}
        >
          {open ? 'Show less' : 'Why this matters & clause detail'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5 bg-gray-50">

          {change.whyItMatters && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Why this change matters</p>
              <p className="text-sm text-gray-700 leading-relaxed">{change.whyItMatters}</p>
            </div>
          )}

          {/* Plain English side by side */}
          {(change.plainEnglishBefore || change.plainEnglishAfter) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {change.plainEnglishBefore && (
                <div className="bg-white border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1.5">Version A said</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{change.plainEnglishBefore}</p>
                </div>
              )}
              {change.plainEnglishAfter && (
                <div className="bg-white border border-green-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">Version B says</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{change.plainEnglishAfter}</p>
                </div>
              )}
            </div>
          )}

          {/* Raw text */}
          {(change.textBefore || change.textAfter) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {change.textBefore && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Original text</p>
                  <blockquote className="doc-quote border-l-red-300 text-gray-600">{change.textBefore}</blockquote>
                </div>
              )}
              {change.textAfter && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Revised text</p>
                  <blockquote className="doc-quote border-l-green-400 text-gray-600">{change.textAfter}</blockquote>
                </div>
              )}
            </div>
          )}

          {/* Page refs */}
          {(change.page?.v1 || change.page?.v2) && (
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-200">
              {change.page?.v1 && <span>Version A: Page {change.page.v1}</span>}
              {change.page?.v2 && <span>Version B: Page {change.page.v2}</span>}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function ComparisonPage() {
  // Doc A state
  const [fileA,      setFileA]      = useState(null)
  const [docIdA,     setDocIdA]     = useState(null)
  const [errorA,     setErrorA]     = useState(null)
  const [uploadingA, setUploadingA] = useState(false)

  // Doc B state
  const [fileB,      setFileB]      = useState(null)
  const [docIdB,     setDocIdB]     = useState(null)
  const [errorB,     setErrorB]     = useState(null)
  const [uploadingB, setUploadingB] = useState(false)

  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('all')

  /* Upload a file and store the returned documentId */
  const handleFile = async (side, file, docId, err) => {
    if (err) {
      side === 'A' ? (setErrorA(err), setFileA(null)) : (setErrorB(err), setFileB(null))
      return
    }
    if (!file) return

    if (side === 'A') { setFileA(file); setDocIdA(null); setErrorA(null); setUploadingA(true) }
    else              { setFileB(file); setDocIdB(null); setErrorB(null); setUploadingB(true) }

    try {
      const res = await uploadDocument(file)
      side === 'A' ? setDocIdA(res.documentId) : setDocIdB(res.documentId)
    } catch (e) {
      const msg = e.message || 'Upload failed.'
      side === 'A' ? (setErrorA(msg), setFileA(null)) : (setErrorB(msg), setFileB(null))
    } finally {
      side === 'A' ? setUploadingA(false) : setUploadingB(false)
    }
  }

  const clearA = () => { setFileA(null); setDocIdA(null); setErrorA(null); setResult(null) }
  const clearB = () => { setFileB(null); setDocIdB(null); setErrorB(null); setResult(null) }

  const canCompare = !!docIdA && !!docIdB
  const bothUploading = uploadingA || uploadingB

  const run = async () => {
    if (!canCompare) return
    setLoading(true); setError(null); setResult(null); setFilter('all')
    try {
      setResult(await compareDocuments(docIdA, docIdB))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const changes  = result?.changes || []
  const filtered = filter === 'all'    ? changes
                 : filter === 'high'   ? changes.filter(c => c.attentionLevel === 'high')
                 : filter === 'medium' ? changes.filter(c => c.attentionLevel === 'medium')
                 : filter === 'added'  ? changes.filter(c => c.changeType === 'added')
                 : changes

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-7">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compare Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload two documents to identify what changed between versions.
          </p>
        </div>

        {/* ── Upload zones ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Step 1 — Upload both documents</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Version A */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">A</div>
                <span className="text-sm font-medium text-gray-700">Document A (Original)</span>
              </div>
              <DropZone side="A" file={fileA} docId={docIdA} uploading={uploadingA} error={errorA}
                onFile={(f, id, err) => handleFile('A', f, id, err)} onClear={clearA} />
            </div>

            {/* Version B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">B</div>
                <span className="text-sm font-medium text-gray-700">Document B (Revised)</span>
              </div>
              <DropZone side="B" file={fileB} docId={docIdB} uploading={uploadingB} error={errorB}
                onFile={(f, id, err) => handleFile('B', f, id, err)} onClear={clearB} />
            </div>
          </div>

          {/* Edge case messages */}
          {(docIdA || docIdB) && !(docIdA && docIdB) && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {docIdA ? 'Now upload Document B to compare.' : 'Now upload Document A to compare.'}
            </div>
          )}

          {/* Compare button — Step 2 */}
          <div className="pt-1">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Step 2 — Run comparison</p>
            <button
              onClick={run}
              disabled={!canCompare || loading || bothUploading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Comparing…</>
              ) : (
                <><GitCompare className="w-4 h-4" />Compare Documents</>
              )}
            </button>
            {!canCompare && !bothUploading && (
              <p className="text-xs text-center text-gray-400 mt-2">
                {!docIdA && !docIdB ? 'Upload both documents above first' :
                 !docIdA ? 'Upload Document A to continue' :
                           'Upload Document B to continue'}
              </p>
            )}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12">
            <ProgressLoader label="Comparing document versions…" />
          </div>
        )}

        {/* ── Error ── */}
        {error && <ErrorState message={error} onRetry={run} />}

        {/* ── Results ── */}
        {result && (
          <div className="space-y-6">

            {/* Summary header — two-column doc titles */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="grid sm:grid-cols-2">
                <div className="p-5 border-b sm:border-b-0 sm:border-r border-gray-200 bg-red-50/40">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">A</div>
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Original</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{result.documentATitle || fileA?.name || 'Document A'}</p>
                </div>
                <div className="p-5 bg-green-50/40">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">B</div>
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Revised</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{result.documentBTitle || fileB?.name || 'Document B'}</p>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-200 space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
                {result.overallAssessment && (
                  <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">{result.overallAssessment}</p>
                )}

                {/* Stat chips */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {[
                    { label: 'Total',         value: result.changeCounts?.total,    color: 'bg-gray-100 text-gray-700'  },
                    { label: 'High attention', value: result.changeCounts?.high,    color: 'bg-red-100 text-red-700'    },
                    { label: 'New clauses',    value: result.changeCounts?.added,   color: 'bg-blue-100 text-blue-700'  },
                    { label: 'Modified',       value: result.changeCounts?.modified, color: 'bg-yellow-100 text-yellow-700'},
                    { label: 'Removed',        value: result.changeCounts?.removed, color: 'bg-red-50 text-red-500'     },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}>
                      <span className="text-base font-bold">{value ?? 0}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-xl px-4 py-3">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 mr-1">Filter:</span>
              {[
                { id: 'all',    label: `All (${changes.length})` },
                { id: 'high',   label: `High (${result.changeCounts?.high ?? 0})` },
                { id: 'medium', label: `Medium (${result.changeCounts?.medium ?? 0})` },
                { id: 'added',  label: `New (${result.changeCounts?.added ?? 0})` },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filter === f.id ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-auto">{filtered.length} change{filtered.length !== 1 ? 's' : ''} shown</span>
            </div>

            {/* Change cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No changes match this filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((c, i) => <ChangeCard key={c.id} change={c} index={i} />)}
              </div>
            )}

            {/* Re-run */}
            <div className="text-center pt-2">
              <button onClick={() => { clearA(); clearB(); setResult(null) }} className="btn-secondary btn-sm">
                <GitCompare className="w-4 h-4" /> Compare new documents
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
