import { ShoppingCart, Truck, FileText, FileCheck, CreditCard } from 'lucide-react'
import type { OrdersSummaryCounts } from '@/lib/types/database'

interface OrderStatCardsProps {
  counts: OrdersSummaryCounts | null
  loading: boolean
}

interface StatCardProps {
  label: string
  value: number | undefined
  loading: boolean
  numberColor: string
  borderLeftColor: string
  icon: React.ReactNode
}

function StatCard({ label, value, loading, numberColor, borderLeftColor, icon }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${borderLeftColor}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: 0,
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes stat-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          margin: 0,
        }}
      >
        {label}
      </p>

      {loading ? (
        <div
          style={{
            width: '60px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            animation: 'stat-shimmer 1.5s ease-in-out infinite',
            margin: '4px 0',
          }}
        />
      ) : (
        <p
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: numberColor,
            margin: '4px 0 0',
            lineHeight: 1,
          }}
        >
          {value ?? 0}
        </p>
      )}

      <div
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '18px',
          color: borderLeftColor,
          opacity: 0.4,
        }}
      >
        {icon}
      </div>
    </div>
  )
}

export function OrderStatCards({ counts, loading }: OrderStatCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
      }}
    >
      <StatCard
        label="Total Pending"
        value={counts?.total_pending}
        loading={loading}
        numberColor="var(--text-primary)"
        borderLeftColor="var(--navy-700)"
        icon={<ShoppingCart size={24} />}
      />
      <StatCard
        label="Pending Delivery"
        value={counts?.pending_delivery}
        loading={loading}
        numberColor="var(--warning)"
        borderLeftColor="var(--warning)"
        icon={<Truck size={24} />}
      />
      <StatCard
        label="Pending Forms"
        value={counts?.pending_forms}
        loading={loading}
        numberColor="#3B82F6"
        borderLeftColor="#3B82F6"
        icon={<FileText size={24} />}
      />
      <StatCard
        label="Pending Signed"
        value={counts?.pending_signed}
        loading={loading}
        numberColor="#8B5CF6"
        borderLeftColor="#8B5CF6"
        icon={<FileCheck size={24} />}
      />
      <StatCard
        label="Pending Payments"
        value={counts?.pending_payments}
        loading={loading}
        numberColor="var(--danger)"
        borderLeftColor="var(--danger)"
        icon={<CreditCard size={24} />}
      />
    </div>
  )
}
