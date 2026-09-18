import { MapPin } from 'lucide-react'

export default function SourceTag({ section, page, onClick }) {
  const content = [section, page ? `Page ${page}` : null].filter(Boolean).join(' · ')
  if (!content) return null

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="source-chip"
        aria-label={`View source: ${content}`}
      >
        <MapPin className="w-3 h-3" aria-hidden="true" />
        {content}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <MapPin className="w-3 h-3" aria-hidden="true" />
      {content}
    </span>
  )
}
