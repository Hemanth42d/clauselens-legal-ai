import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import AttentionBadge from '../../components/ui/AttentionBadge'
import SourceTag from '../../components/ui/SourceTag'

const CATEGORY_LABELS = {
  financial:    'Financial',
  termination:  'Termination',
  restrictions: 'Restrictions',
  ownership:    'Ownership',
  disputes:     'Disputes',
  time:         'Time & Duration',
  general:      'General',
}

export default function ClauseCard({ clause, onSourceClick }) {
  const [open, setOpen] = useState(false)

  const borderCls = {
    high:   'border-red-200',
    medium: 'border-yellow-200',
    low:    'border-gray-200',
  }[clause.attentionLevel] || 'border-gray-200'

  return (
    <article
      className={`bg-white border rounded-lg overflow-hidden transition-shadow hover:shadow-sm ${borderCls}`}
      aria-label={clause.title}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="overline text-gray-400">{CATEGORY_LABELS[clause.category] || clause.category}</span>
            <AttentionBadge level={clause.attentionLevel} />
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{clause.title}</p>
          {!open && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{clause.summary}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">

          <div className="pt-4">
            <p className="overline mb-1.5">Plain English</p>
            <p className="text-sm text-gray-700 leading-relaxed">{clause.plainEnglish}</p>
          </div>

          <div>
            <p className="overline mb-1.5">Why it matters</p>
            <p className="text-sm text-gray-600 leading-relaxed">{clause.whyItMatters}</p>
          </div>

          {clause.whatToVerify?.length > 0 && (
            <div>
              <p className="overline mb-1.5">What to verify</p>
              <ul className="space-y-1.5">
                {clause.whatToVerify.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {clause.originalText && (
            <div>
              <p className="overline mb-1.5">Document text</p>
              <blockquote className="doc-quote">
                {clause.originalText}
              </blockquote>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <SourceTag
              section={clause.sourceSection}
              page={clause.sourcePage}
              onClick={onSourceClick ? () => onSourceClick(clause) : undefined}
            />
            <span className="text-xs text-gray-400">
              {CATEGORY_LABELS[clause.category] || clause.category}
            </span>
          </div>
        </div>
      )}
    </article>
  )
}
