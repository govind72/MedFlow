'use client'

import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface TopCustomer {
  customer_id: string
  customer_name: string
  city: string | null
  total_ordered: number
  amount_received: number
  pending_amount: number
  order_count: number
}

interface TopCustomersTableProps {
  customers: TopCustomer[]
  loading: boolean
}

function ShimmerRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ width: i === 1 ? '130px' : '80px', height: 13, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'rep-shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.06}s` }} />
          {i === 1 && <div style={{ width: '70px', height: 11, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'rep-shimmer 1.5s ease-in-out infinite', marginTop: '5px' }} />}
        </td>
      ))}
    </tr>
  )
}

export function TopCustomersTable({ customers, loading }: TopCustomersTableProps) {
  const router = useRouter()

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Top Customers by Outstanding</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Customers with highest pending payments in selected period</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['#', 'Customer', 'Orders', 'Total Ordered', 'Received', 'Outstanding'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === '#' ? 'center' : 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} />)
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No outstanding balances in this period
                </td>
              </tr>
            ) : (
              customers.map((c, idx) => {
                const pendingPct = c.total_ordered > 0 ? Math.round((c.pending_amount / c.total_ordered) * 100) : 0
                return (
                  <tr key={c.customer_id}
                    style={{ borderTop: '1px solid var(--border-color)', transition: 'background 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Rank */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: '50%', fontSize: '12px', fontWeight: 700,
                        background: idx === 0 ? '#FEF3C7' : idx === 1 ? '#F3F4F6' : idx === 2 ? '#FEE2E2' : 'var(--bg-subtle)',
                        color: idx === 0 ? '#B45309' : idx === 1 ? '#374151' : idx === 2 ? '#991B1B' : 'var(--text-secondary)',
                      }}>{idx + 1}</span>
                    </td>

                    {/* Customer name */}
                    <td style={{ padding: '14px 16px' }}>
                      <button type="button" onClick={() => router.push(`/customers/${c.customer_id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--teal-500)', margin: 0 }}>{c.customer_name}</p>
                          {c.city && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{c.city}</p>}
                        </div>
                        <ExternalLink size={12} style={{ color: 'var(--teal-500)', opacity: 0.6, flexShrink: 0 }} />
                      </button>
                    </td>

                    {/* Orders */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{c.order_count}</span>
                    </td>

                    {/* Total ordered */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(c.total_ordered)}</span>
                    </td>

                    {/* Received */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--success)' }}>{formatCurrency(c.amount_received)}</span>
                    </td>

                    {/* Outstanding */}
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>{formatCurrency(c.pending_amount)}</p>
                      {/* Mini progress bar */}
                      <div style={{ marginTop: '5px', height: 4, borderRadius: 9999, background: 'var(--border-color)', width: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, pendingPct)}%`, background: pendingPct > 66 ? '#EF4444' : pendingPct > 33 ? '#F97316' : '#10B981', borderRadius: 9999, transition: 'width 0.4s ease' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{pendingPct}% pending</p>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
