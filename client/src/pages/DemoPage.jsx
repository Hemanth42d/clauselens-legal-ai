import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, GitCompare, ArrowRight, AlertCircle,
  Loader2, CheckCircle2, Info,
} from 'lucide-react'
import { loadDemoDocument } from '../services/api'

const DOCS = [
  {
    id: 'employment-v2',
    title: 'Employment Agreement — Version 2',
    subtitle: 'Revised terms · Effective 1 June 2024',
    description: 'Contains extended notice period (90 days), 5-year confidentiality, automatic renewal clause, and updated non-solicitation terms.',
    tag: 'Recommended',
    tagCls: 'badge-blue',
    highlights: [
      '90-day notice period',
      '5-year post-employment confidentiality',
      'Automatic annual renewal',
      '18-month non-solicitation',
    ],
  },
  {
    id: 'employment-v1',
    title: 'Employment Agreement — Version 1',
    subtitle: 'Original terms · Effective 1 March 2024',
    description: 'Original version with 30-day notice, 2-year confidentiality. Useful alongside Version 2 for the comparison feature.',
    tag: 'For comparison',
    tagCls: 'badge-gray',
    highlights: [
      '30-day notice period',
      '2-year post-employment confidentiality',
      'Standard IP clause',
    ],
  },
]

export default function DemoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error,   setError]   = useState(null)

  const open = async (id) => {
    setLoading(id); setError(null)
    try {
      await loadDemoDocument(id)
      navigate(`/analysis/${id}`)
    } catch (e) {
      setError(e.message || 'Failed to load document.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex items-start justify-center pt-12 pb-12 px-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sample Documents</h1>
          <p className="text-sm text-gray-600 mt-1">
            Analyse a sample document using the same pipeline used for uploaded files.
          </p>
        </div>

        {/* Info note */}
        <div className="alert-info text-xs">
          <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <p>
            These are fictional employment agreements provided for demonstration.
            The analysis interface is identical to what you see with an uploaded document.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-danger" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Document cards */}
        <div className="space-y-4">
          {DOCS.map(doc => (
            <div key={doc.id} className="surface-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-900 leading-snug">{doc.title}</h2>
                      <span className={doc.tagCls}>{doc.tag}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.subtitle}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{doc.description}</p>

              {/* Highlights */}
              <ul className="flex flex-wrap gap-2 mb-5" aria-label="Key provisions">
                {doc.highlights.map(h => (
                  <li key={h} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                    <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => open(doc.id)}
                disabled={!!loading}
                className="btn-primary w-full"
              >
                {loading === doc.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Opening…
                  </>
                ) : (
                  <>
                    Open and Analyse
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Compare CTA */}
        <div className="surface-card p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <GitCompare className="w-4 h-4 text-blue-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Compare both versions</p>
              <p className="text-sm text-gray-600 mt-0.5">
                See exactly how Version 1 and Version 2 differ — notice period,
                confidentiality, training recovery cap, and more.
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/comparison')} className="btn-secondary w-full">
            <GitCompare className="w-4 h-4" aria-hidden="true" />
            Go to Comparison
          </button>
        </div>

      </div>
    </div>
  )
}
