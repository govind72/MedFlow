import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: ReactNode
  variant?: 'default' | 'highlight'
  loading?: boolean
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  loading = false,
}: KpiCardProps) {
  const isHighlight = variant === 'highlight'

  return (
    <div
      className="rounded-xl p-6 flex flex-col"
      style={{
        background: isHighlight
          ? 'linear-gradient(135deg, var(--teal-500) 0%, var(--teal-400) 100%)'
          : 'var(--bg-card)',
        border: isHighlight ? 'none' : '1px solid var(--border-color)',
        boxShadow: isHighlight
          ? '0 4px 24px rgba(14,165,160,0.25)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top row: title + icon */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: isHighlight ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}
        >
          {title}
        </span>

        {/* Icon container */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: isHighlight ? 'rgba(255,255,255,0.20)' : undefined,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="mt-3 space-y-2">
          <div
            className="h-8 rounded-lg"
            style={{
              width: '65%',
              background: isHighlight ? 'rgba(255,255,255,0.20)' : 'var(--bg-subtle)',
              animation: 'kpi-shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            className="h-4 rounded"
            style={{
              width: '80%',
              background: isHighlight ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)',
              animation: 'kpi-shimmer 1.5s ease-in-out infinite 0.2s',
            }}
          />
        </div>
      ) : (
        <>
          <p
            className="mt-3 text-3xl font-bold leading-none tracking-tight"
            style={{ color: isHighlight ? '#ffffff' : 'var(--text-primary)' }}
          >
            {value}
          </p>
          <p
            className="mt-1.5 text-[13px]"
            style={{ color: isHighlight ? 'rgba(255,255,255,0.70)' : 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        </>
      )}

      <style>{`
        @keyframes kpi-shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
