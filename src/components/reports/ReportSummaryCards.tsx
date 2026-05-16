'use client'

import { TrendingUp, ShoppingCart, IndianRupee, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface SummaryData {
  totalOrders: number
  totalRevenue: number
  pendingPayment: number
  revenueReceived: number
}

interface ReportSummaryCardsProps {
  data: SummaryData | null
  loading: boolean
}

interface CardDef {
  label: string
  key: keyof SummaryData
  format: 'currency' | 'number'
  icon: React.ReactNode
  color: string
  bg: string
  borderLeft: string
  delta?: string
}

export function ReportSummaryCards({ data, loading }: ReportSummaryCardsProps) {
  const cards: CardDef[] = [
    {
      label: 'Total Orders',
      key: 'totalOrders',
      format: 'number',
      icon: <ShoppingCart size={22} />,
      color: 'var(--teal-500)',
      bg: 'var(--teal-50)',
      borderLeft: 'var(--teal-500)',
    },
    {
      label: 'Total Revenue',
      key: 'totalRevenue',
      format: 'currency',
      icon: <IndianRupee size={22} />,
      color: 'var(--navy-700)',
      bg: 'rgba(15,23,42,0.06)',
      borderLeft: 'var(--navy-700)',
    },
    {
      label: 'Revenue Received',
      key: 'revenueReceived',
      format: 'currency',
      icon: <TrendingUp size={22} />,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      borderLeft: 'var(--success)',
    },
    {
      label: 'Pending Payment',
      key: 'pendingPayment',
      format: 'currency',
      icon: <AlertCircle size={22} />,
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      borderLeft: 'var(--danger)',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <style>{`
        @keyframes rep-shimmer { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
      `}</style>
      {cards.map((c) => {
        const rawValue = data?.[c.key] ?? 0
        const displayValue =
          loading ? null
          : c.format === 'currency' ? formatCurrency(rawValue as number)
          : String(rawValue as number)

        return (
          <div key={c.label}
            style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: `3px solid ${c.borderLeft}`, padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', overflow: 'hidden' }}>
            {/* Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '10px', background: c.bg, color: c.color }}>
              {c.icon}
            </div>
            {/* Label */}
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{c.label}</p>
            {/* Value */}
            {loading ? (
              <div style={{ width: '80px', height: '28px', borderRadius: '6px', background: 'var(--bg-subtle)', animation: 'rep-shimmer 1.5s ease-in-out infinite' }} />
            ) : (
              <p style={{ fontSize: '26px', fontWeight: 700, color: c.color, margin: 0, lineHeight: 1 }}>{displayValue}</p>
            )}
            {/* Decorative circle */}
            <div style={{ position: 'absolute', right: '-16px', bottom: '-16px', width: 72, height: 72, borderRadius: '50%', background: c.bg, opacity: 0.5 }} />
          </div>
        )
      })}
    </div>
  )
}
