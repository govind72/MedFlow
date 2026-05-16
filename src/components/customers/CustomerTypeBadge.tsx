import { CUSTOMER_TYPE_CONFIG, type CustomerType } from '@/lib/utils/format'

interface CustomerTypeBadgeProps {
  type: CustomerType
  size?: 'sm' | 'md'
}

export function CustomerTypeBadge({ type, size = 'md' }: CustomerTypeBadgeProps) {
  const cfg = CUSTOMER_TYPE_CONFIG[type]
  const fontSize = size === 'sm' ? '11px' : '12px'
  const padding = size === 'sm' ? '2px 8px' : '3px 10px'
  const dotSize = 5

  return (
    <span
      className="inline-flex items-center gap-[5px] font-medium whitespace-nowrap"
      style={{
        background: cfg.bg,
        color: cfg.text,
        fontSize,
        padding,
        borderRadius: '9999px',
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: dotSize, height: dotSize, background: cfg.dot, display: 'inline-block' }}
      />
      {cfg.label}
    </span>
  )
}
