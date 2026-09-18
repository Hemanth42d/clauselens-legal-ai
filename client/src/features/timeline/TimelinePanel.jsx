import { Calendar, Flag, DollarSign, Lock, AlertCircle } from 'lucide-react'
import SourceTag from '../../components/ui/SourceTag'

const TYPE_CONFIG = {
  milestone:   { Icon: Flag,        dot: 'bg-blue-500',   line: 'border-blue-200'   },
  obligation:  { Icon: AlertCircle, dot: 'bg-yellow-400', line: 'border-yellow-200' },
  financial:   { Icon: DollarSign,  dot: 'bg-green-500',  line: 'border-green-200'  },
  restriction: { Icon: Lock,        dot: 'bg-red-400',    line: 'border-red-200'    },
  deadline:    { Icon: Calendar,    dot: 'bg-orange-400', line: 'border-orange-200' },
}

function fmtDate(d) {
  if (!d || d === 'ongoing') return 'Ongoing'
  try {
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return d }
}

export default function TimelinePanel({ timeline }) {
  if (!timeline?.timeline?.length) {
    return (
      <div className="empty-state">
        <Calendar className="w-8 h-8 text-gray-300" aria-hidden="true" />
        <p className="text-sm">No timeline events extracted.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-5">{timeline.total} events from the document</p>
      <ol className="relative space-y-0" aria-label="Document timeline">
        {/* Vertical line */}
        <div className="absolute left-4 top-5 bottom-5 w-px bg-gray-200" aria-hidden="true" />

        {timeline.timeline.map((event, idx) => {
          const { Icon, dot } = TYPE_CONFIG[event.type] || TYPE_CONFIG.milestone
          return (
            <li key={event.id || idx} className="relative flex items-start gap-4 pb-6 last:pb-0">
              {/* Dot */}
              <div className={`relative z-10 w-8 h-8 rounded-full ${dot} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 min-w-0 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-600">{fmtDate(event.date)}</span>
                  <span className="text-xs text-gray-400 capitalize">{event.type}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 leading-snug mb-1">{event.label}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
                {event.sourceSection && (
                  <div className="mt-2">
                    <SourceTag section={event.sourceSection} />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
