import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

const CONFIG = {
  high:   { label: 'High Attention',   cls: 'badge-high',   Icon: AlertTriangle },
  medium: { label: 'Medium Attention', cls: 'badge-medium', Icon: AlertCircle   },
  low:    { label: 'Low Attention',    cls: 'badge-low',     Icon: CheckCircle  },
}

export default function AttentionBadge({ level, showLabel = true }) {
  const { label, cls, Icon } = CONFIG[level] || CONFIG.low
  return (
    <span className={cls} aria-label={label}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {showLabel && label}
    </span>
  )
}
