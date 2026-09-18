import { useState } from 'react'
import {
  BookOpen, HelpCircle, FileStack, Calendar,
  AlertTriangle, ChevronDown, Loader2, Shield, Info,
} from 'lucide-react'
import { generateConsultationBrief } from '../../services/api'
import AttentionBadge from '../../components/ui/AttentionBadge'
import SourceTag from '../../components/ui/SourceTag'

function Section({ icon: Icon, title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  )
}

export default function ConsultationPanel({ documentId }) {
  const [brief,   setBrief]   = useState(null)
  const [concern, setConcern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const generate = async () => {
    setLoading(true); setError(null)
    try {
      setBrief(await generateConsultationBrief(documentId, concern.trim() || undefined))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!brief && !loading && !error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Prepare for Legal Consultation</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Generate a personalised brief with questions to ask your lawyer,
            documents to bring, and key dates to track.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="concern">Your main concern (optional)</label>
          <textarea
            id="concern"
            value={concern}
            onChange={e => setConcern(e.target.value)}
            placeholder="e.g. Understanding what happens if I resign before the contract ends…"
            rows={3}
            maxLength={500}
            className="input resize-none"
          />
        </div>

        <button onClick={generate} className="btn-primary w-full">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Generate Consultation Brief
        </button>

        <div className="alert-warning text-xs">
          <Shield className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <p>This brief helps prepare for a professional legal consultation. It is not legal advice.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" aria-hidden="true" />
        <p className="text-sm text-gray-600">Preparing your consultation brief…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="alert-danger text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
        <button onClick={generate} className="btn-secondary btn-sm">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Consultation Brief</h2>
          <p className="text-xs text-gray-500 mt-0.5">{brief.documentTitle}</p>
        </div>
        <button onClick={() => setBrief(null)} className="btn-tertiary btn-sm">Regenerate</button>
      </div>

      {/* Concern */}
      {brief.concern && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="overline mb-1 text-blue-600">Main Concern</p>
          <p className="text-sm text-gray-800">{brief.concern}</p>
        </div>
      )}

      {/* Relevant clauses */}
      {brief.relevantClauses?.length > 0 && (
        <Section icon={AlertTriangle} title="Relevant Clauses">
          <ul className="space-y-2" role="list">
            {brief.relevantClauses.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <AttentionBadge level={c.attentionLevel} showLabel={false} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900">{c.title}</p>
                  <SourceTag section={c.section} />
                  {c.summary && <p className="text-xs text-gray-500 mt-0.5">{c.summary}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Questions */}
      {brief.questionsForLawyer?.length > 0 && (
        <Section icon={HelpCircle} title="Questions to Ask Your Lawyer">
          <ol className="space-y-2" role="list">
            {brief.questionsForLawyer.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-xs font-mono text-blue-400 flex-shrink-0 mt-0.5 w-5 text-right">{i + 1}.</span>
                <p className="text-sm text-gray-700 leading-relaxed">{q}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Documents to gather */}
      {brief.documentsToGather?.length > 0 && (
        <Section icon={FileStack} title="Documents to Bring">
          <ul className="space-y-1.5" role="list">
            {brief.documentsToGather.map((d, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-400 mt-1 flex-shrink-0" aria-hidden="true">·</span>
                {d}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Key dates */}
      {brief.keyDates?.length > 0 && (
        <Section icon={Calendar} title="Key Dates">
          <ul className="space-y-3" role="list">
            {brief.keyDates.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-gray-900">{d.label}</p>
                  {d.date && d.date !== 'ongoing' && <p className="text-xs text-gray-500">{d.date}</p>}
                  <p className="text-xs text-gray-600 mt-0.5">{d.description}</p>
                  {d.sourceSection && <SourceTag section={d.sourceSection} />}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Disclaimer */}
      <div className="alert-warning text-xs">
        <Shield className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <p>{brief.disclaimer}</p>
      </div>
    </div>
  )
}
