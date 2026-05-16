'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface RecentPayment extends Payment {
  customer_name?: string
  bill_number?: string | null
}

function ShimmerRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ width: 120, height: 13, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'pay-shimmer 1.5s ease-in-out infinite' }} />
        <div style={{ width: 80, height: 11, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'pay-shimmer 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
      </div>
      <div style={{ width: 70, height: 18, borderRadius: 6, background: 'var(--bg-subtle)', animation: 'pay-shimmer 1.5s ease-in-out infinite', animationDelay: '0.15s' }} />
    </div>
  )
}

export function RecentPaymentsSection() {
  const [payments, setPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [todayTotal, setTodayTotal] = useState(0)

  const fetchTodayPayments = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        orders!inner(bill_number),
        customers!inner(business_name)
      `)
      .eq('payment_date', today)
      .order('created_at', { ascending: false })

    if (data) {
      const enriched = data.map((p) => ({
        ...(p as Payment),
        bill_number: (p as unknown as { orders?: { bill_number?: string } }).orders?.bill_number ?? null,
        customer_name: (p as unknown as { customers?: { business_name?: string } }).customers?.business_name ?? undefined,
      }))
      setPayments(enriched)
      setTodayTotal(enriched.reduce((sum, p) => sum + p.amount, 0))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTodayPayments()

    // Subscribe to payment inserts so dashboard updates in real-time
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-payments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, () => {
        fetchTodayPayments()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchTodayPayments])

  return (
    <div style={{ marginTop: '32px' }}>
      <style>{`
        @keyframes pay-shimmer { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
      `}</style>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Recent Payments
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {loading ? 'Loading…' : `${payments.length} payment${payments.length !== 1 ? 's' : ''} received today`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!loading && payments.length > 0 && (
            <div style={{ background: 'var(--success-bg)', borderRadius: '10px', padding: '8px 16px', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Today&apos;s Total</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', margin: 0 }}>{formatCurrency(todayTotal)}</p>
            </div>
          )}
          <button type="button" onClick={fetchTodayPayments} title="Refresh"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-50)'; e.currentTarget.style.color = 'var(--teal-500)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '0 20px' }}>
            {Array.from({ length: 4 }).map((_, i) => <ShimmerRow key={i} />)}
          </div>
        ) : payments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-subtle)' }}>
              <CreditCard size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>No payments today</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Payments recorded today will appear here</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 100px 110px', gap: '8px', padding: '10px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
              {['Customer / Bill', 'Time', 'Type', 'Amount'].map(h => (
                <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            {payments.map((p, idx) => {
              const timeStr = new Date(p.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
              return (
                <div key={p.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 100px 110px', gap: '8px', padding: '12px 20px', borderBottom: idx < payments.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 120ms', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Customer / Bill */}
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                      {p.customer_name ?? '—'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Bill: {p.bill_number ?? 'N/A'} &nbsp;·&nbsp; {formatDate(p.payment_date)}
                    </p>
                  </div>

                  {/* Time */}
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{timeStr}</p>

                  {/* Type badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {p.payment_type === 'Full'
                      ? <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      : <Clock size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    }
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: p.payment_type === 'Full' ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: p.payment_type === 'Full' ? 'var(--success-text)' : 'var(--warning-text)',
                    }}>
                      {p.payment_type}
                    </span>
                  </div>

                  {/* Amount */}
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)', margin: 0 }}>
                    {formatCurrency(p.amount)}
                  </p>
                </div>
              )
            })}

            {/* Footer total */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 100px 110px', gap: '8px', padding: '12px 20px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, gridColumn: '1 / 4' }}>Total collected today</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)', margin: 0 }}>{formatCurrency(todayTotal)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
