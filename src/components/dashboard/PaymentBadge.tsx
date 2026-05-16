type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid'

interface PaymentBadgeProps {
  status: PaymentStatus
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  Unpaid: {
    bg: 'var(--danger-bg)',
    text: 'var(--danger-text)',
    dot: 'var(--danger-text)',
    label: 'Unpaid',
  },
  'Partially Paid': {
    bg: 'var(--warning-bg)',
    text: 'var(--warning-text)',
    dot: 'var(--warning-text)',
    label: 'Partial',
  },
  Paid: {
    bg: 'var(--success-bg)',
    text: 'var(--success-text)',
    dot: 'var(--success-text)',
    label: 'Paid',
  },
}

export function PaymentBadge({ status }: PaymentBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className="inline-flex items-center gap-[5px] font-medium"
      style={{
        background: config.bg,
        color: config.text,
        fontSize: '12px',
        padding: '3px 10px',
        borderRadius: '9999px',
      }}
    >
      {/* Dot */}
      <span
        className="rounded-full shrink-0"
        style={{
          width: 6,
          height: 6,
          background: config.dot,
          display: 'inline-block',
        }}
      />
      {config.label}
    </span>
  )
}
