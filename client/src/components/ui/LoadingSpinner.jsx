export default function LoadingSpinner({ size = 'md', label = 'Loading…' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div
        className={`${sizes[size]} border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  )
}
