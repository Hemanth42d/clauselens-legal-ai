import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Disclosure({ title, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={className}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left py-1 group"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  )
}
