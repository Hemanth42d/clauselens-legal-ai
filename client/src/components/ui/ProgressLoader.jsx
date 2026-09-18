import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const STEPS = [
  'Reading document…',
  'Identifying sections…',
  'Detecting important clauses…',
  'Extracting obligations…',
  'Building document map…',
  'Preparing insights…',
]

export default function ProgressLoader({ label }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (stepIndex >= STEPS.length - 1) return
    const t = setTimeout(() => setStepIndex(i => i + 1), 650)
    return () => clearTimeout(t)
  }, [stepIndex])

  return (
    <div className="flex flex-col items-center gap-6 py-16" role="status" aria-live="polite">
      {/* Spinner */}
      <div
        className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"
        aria-hidden="true"
      />

      {/* Current step */}
      <div className="text-center">
        <p className="text-base font-medium text-gray-800">Analyzing your document</p>
        <p className="text-sm text-gray-500 mt-1">{label || STEPS[stepIndex]}</p>
      </div>

      {/* Steps list */}
      <div className="w-full max-w-xs space-y-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5 text-sm">
            {i < stepIndex ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
            ) : i === stepIndex ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" aria-hidden="true" />
            )}
            <span className={i <= stepIndex ? 'text-gray-800' : 'text-gray-400'}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
