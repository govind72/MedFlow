import { Wallet } from 'lucide-react'
import type { CustomerFinancialSummary } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/format'

interface FinancialSummaryCardProps {
  summary: CustomerFinancialSummary | null
  loading: boolean
}

function StatColumn({
  label,
  value,
  valueColor,
  loading,
}: {
  label: string
  value: string
  valueColor: string
  loading: boolean
}) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0 16px' }}>
      {loading ? (
        <div
          style={{
            width: '80px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            margin: '0 auto 6px',
            animation: 'fin-shimmer 1.5s ease-in-out infinite',
          }}
        />
      ) : (
        <p style={{ fontSize: '20px', fontWeight: 700, color: valueColor, margin: '0 0 6px' }}>
          {value}
        </p>
      )}
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{label}</p>
    </div>
  )
}

export function FinancialSummaryCard({ summary, loading }: FinancialSummaryCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '20px',
      }}
    >
      <style>{`
        @keyframes fin-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Wallet size={18} style={{ color: 'var(--teal-500)', flexShrink: 0 }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Financial Summary
        </h3>
      </div>

      {/* 3 columns */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <StatColumn
          label="Pending Amount"
          value={summary ? formatCurrency(summary.pending_amount) : '—'}
          valueColor={
            summary && summary.pending_amount > 0 ? 'var(--danger)' : 'var(--text-primary)'
          }
          loading={loading}
        />
        <div style={{ width: '1px', background: 'var(--border-color)', flexShrink: 0 }} />
        <StatColumn
          label="Total Received"
          value={summary ? formatCurrency(summary.total_received) : '—'}
          valueColor="var(--success)"
          loading={loading}
        />
        <div style={{ width: '1px', background: 'var(--border-color)', flexShrink: 0 }} />
        <StatColumn
          label="Total Ordered"
          value={summary ? formatCurrency(summary.total_ordered) : '—'}
          valueColor="var(--text-primary)"
          loading={loading}
        />
      </div>
    </div>
  )
}
