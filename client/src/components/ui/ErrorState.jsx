import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message, onRetry, title }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center" role="alert">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-200">
        <AlertCircle className="w-6 h-6 text-red-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-base font-medium text-gray-800">{title || 'Something went wrong'}</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{message || 'An unexpected error occurred.'}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}
