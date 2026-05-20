'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/lib/types/database'
import { formatCurrency, formatDate, formatDateLong } from '@/lib/utils/format'
import { useBusinessContext } from '@/contexts/BusinessContext'

interface PaymentHistoryTabProps {
  customerId: string
}

interface PaymentWithOrder extends Payment {
  bill_number?: string | null
  order_id_short?: string
}

function ShimmerRow() {
  return (
    <tr>
      {[80, 100, 60, 80].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ width: w, height: 13, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'pay-shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
        </td>
      ))}
    </tr>
  )
}

export function PaymentHistoryTab({ customerId }: PaymentHistoryTabProps) {
  const router = useRouter()
  const { businessId } = useBusinessContext()
  const [payments, setPayments] = useState<PaymentWithOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch payments for this customer, join order bill_number via order_id
    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        orders!inner(bill_number)
      `)
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (data) {
      setPayments(
        data.map((p) => ({
          ...(p as Payment),
          bill_number: (p as unknown as { orders?: { bill_number?: string } }).orders?.bill_number ?? null,
        }))
      )
    }
    setLoading(false)
  }, [customerId, businessId])

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPayments()
    })
  }, [fetchPayments])

  const displayed = showAll ? payments : payments.slice(0, 10)

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0)
  const fullPayments = payments.filter(p => p.payment_type === 'Full').length
  const partialPayments = payments.filter(p => p.payment_type === 'Partial').length

  return (
    <div>
      <style>{`
        @keyframes pay-shimmer { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
      `}</style>

      {/* Summary strip */}
      {!loading && payments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Total Received', value: formatCurrency(totalReceived), color: 'var(--success)', bg: 'var(--success-bg)' },
            { label: 'Full Payments', value: String(fullPayments), color: 'var(--teal-500)', bg: 'var(--teal-50)' },
            { label: 'Partial Payments', value: String(partialPayments), color: 'var(--warning)', bg: 'var(--warning-bg)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color, margin: '4px 0 0' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
              {['Date', 'Bill / Order', 'Type', 'Amount'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} />)
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: '10px' }}>
                    <CreditCard size={44} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>No payments yet</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Payments will appear here once recorded</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayed.map((p, idx) => (
                <tr key={p.id}
                  style={{ borderBottom: idx < displayed.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Date */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{formatDate(p.payment_date)}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{formatDateLong(p.payment_date)}</p>
                  </td>

                  {/* Bill */}
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/orders`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--teal-500)' }}>
                        {p.bill_number || 'N/A'}
                      </span>
                      <ExternalLink size={12} style={{ color: 'var(--teal-500)', opacity: 0.7 }} />
                    </button>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'monospace' }}>{p.order_id.slice(0, 8)}…</p>
                  </td>

                  {/* Type badge */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.payment_type === 'Full'
                        ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                        : <Clock size={14} style={{ color: 'var(--warning)' }} />
                      }
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: p.payment_type === 'Full' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: p.payment_type === 'Full' ? 'var(--success-text)' : 'var(--warning-text)',
                      }}>
                        {p.payment_type}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)', margin: 0 }}>
                      {formatCurrency(p.amount)}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Show more / less */}
        {!loading && payments.length > 10 && (
          <div style={{ borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <button type="button" onClick={() => setShowAll(!showAll)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              {showAll ? <><ChevronUp size={14} />Show less</> : <><ChevronDown size={14} />Show all {payments.length} payments</>}
            </button>
          </div>
        )}
      </div>

      {!loading && payments.length > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
          {payments.length} payment{payments.length !== 1 ? 's' : ''} total
        </p>
      )}
    </div>
  )
}
