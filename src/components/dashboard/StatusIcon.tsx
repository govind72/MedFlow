import { CheckCircle2, XCircle, Minus } from 'lucide-react'

interface StatusIconProps {
  value: boolean | null
  size?: 'sm' | 'md'
}

const SIZE_MAP = {
  sm: { container: 28, icon: 14 },
  md: { container: 32, icon: 16 },
}

export function StatusIcon({ value, size = 'md' }: StatusIconProps) {
  const { container, icon } = SIZE_MAP[size]

  if (value === true) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{
          width: container,
          height: container,
          background: 'var(--success-bg)',
          color: 'var(--success)',
        }}
        aria-label="Completed"
      >
        <CheckCircle2 size={icon} />
      </span>
    )
  }

  if (value === false) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{
          width: container,
          height: container,
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
        }}
        aria-label="Not completed"
      >
        <XCircle size={icon} />
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: container,
        height: container,
        background: 'var(--bg-subtle)',
        color: 'var(--text-muted)',
      }}
      aria-label="Not applicable"
    >
      <Minus size={icon} />
    </span>
  )
}
