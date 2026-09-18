import { useState } from 'react'
import { User, Building2, Clock, Zap, AlertCircle } from 'lucide-react'
import SourceTag from '../../components/ui/SourceTag'

function ObligationRow({ ob }) {
  const isEmployee = (ob.who || '').toLowerCase().includes('employee')
  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Who */}
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isEmployee ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
        }`}>
          {isEmployee
            ? <User className="w-3.5 h-3.5" aria-hidden="true" />
            : <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
          }
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${
          isEmployee ? 'text-blue-600' : 'text-purple-600'
        }`}>
          {ob.who}
        </span>
      </div>

      {/* Action */}
      <p className="text-sm font-medium text-gray-900 leading-snug">{ob.action}</p>

      {/* Meta */}
      <div className="grid gap-1.5 text-xs">
        {ob.trigger && (
          <div className="flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span><span className="font-medium text-gray-600">Trigger: </span><span className="text-gray-700">{ob.trigger}</span></span>
          </div>
        )}
        {ob.deadline && (
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span><span className="font-medium text-gray-600">Deadline: </span><span className="text-gray-700">{ob.deadline}</span></span>
          </div>
        )}
        {ob.consequence && (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span><span className="font-medium text-gray-600">Consequence: </span><span className="text-gray-500">{ob.consequence}</span></span>
          </div>
        )}
      </div>

      <SourceTag section={ob.sourceSection} page={ob.sourcePage} />
    </article>
  )
}

export default function ObligationsPanel({ obligations }) {
  const [filter, setFilter] = useState('all')

  if (!obligations?.obligations?.length) {
    return (
      <div className="empty-state">
        <User className="w-8 h-8 text-gray-300" aria-hidden="true" />
        <p className="text-sm">No obligations extracted.</p>
      </div>
    )
  }

  const employee = obligations.byParty?.employee || []
  const company  = obligations.byParty?.company  || []
  const all      = obligations.obligations

  const shown = filter === 'employee' ? employee
              : filter === 'company'  ? company
              : all

  return (
    <div className="space-y-4">
      {/* Summary + filter */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-gray-500">{obligations.total} obligations</p>
        <div className="flex gap-1.5" role="group" aria-label="Filter obligations">
          {[
            { id: 'all',      label: `All (${all.length})` },
            { id: 'employee', label: `Employee (${employee.length})` },
            { id: 'company',  label: `Company (${company.length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === f.id
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Obligation cards */}
      <div className="space-y-3">
        {shown.map(ob => <ObligationRow key={ob.id} ob={ob} />)}
      </div>
    </div>
  )
}
