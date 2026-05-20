'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, X, CheckCircle2, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { OrderManagement, Payment } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface BillSettlementModalProps {
  open: boolean
  onClose: () => void
  order: OrderManagement | null
  onPaymentDone: () => void
  loading: boolean
  onConfirm: (type: 'Full' | 'Partial', amount: number) => Promise<void>
}

export function BillSettlementModal({ open, onClose, order, onPaymentDone, loading, onConfirm }: BillSettlementModalProps) {
  const [paymentMode, setPaymentMode] = useState<'Full' | 'Partial'>('Full')
  const [partialAmount, setPartialAmount] = useState(0)
  const [partialError, setPartialError] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const balanceDue = order ? order.total_amount - order.amount_received : 0
  const progressPct = order && order.total_amount > 0
    ? Math.min(100, Math.round((order.amount_received / order.total_amount) * 100))
    : 0

  const fetchHistory = useCallback(async () => {
    if (!order) return
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order.order_id)
      .order('created_at', { ascending: false })
    setPaymentHistory((data ?? []) as Payment[])
    setLoadingHistory(false)
  }, [order])

  useEffect(() => {
    if (open && order) {
      Promise.resolve().then(() => {
        setPaymentMode('Full')
        setPartialAmount(0)
        setPartialError('')
        setHistoryOpen(false)
        setShowSuccess(false)
        fetchHistory()
      })

      // Auto-repair: if payment_status is already Paid but bill_cleared is false,
      // the DB trigger didn't fire — patch it now and refresh the parent
      if (order.payment_status === 'Paid' && !order.bill_cleared) {
        const supabase = createClient()
        supabase
          .from('orders')
          .update({ bill_cleared: true })
          .eq('id', order.order_id)
          .then(() => {
            // Give the DB a moment then refresh so is_completable recomputes
            setTimeout(() => onPaymentDone(), 600)
          })
      }
    }
  }, [open, order, fetchHistory, onPaymentDone])

  async function handleConfirm() {
    if (!order) return
    if (paymentMode === 'Partial') {
      if (partialAmount <= 0) { setPartialError('Amount must be greater than 0'); return }
      if (partialAmount > balanceDue) { setPartialError(`Cannot exceed balance due: ${formatCurrency(balanceDue)}`); return }
    }
    await onConfirm(paymentMode, partialAmount)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      onPaymentDone()
    }, 1500)
  }

  if (!open || !order) return null

  const isAlreadyPaid = order.payment_status === 'Paid'
  // Stuck state: paid but bill_cleared not set (trigger didn't fire)
  const isStuck = isAlreadyPaid && !order.bill_cleared

  const cardSt = (active: boolean, activeColor: string, activeBg: string): React.CSSProperties => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', borderRadius: '12px', border: `1.5px solid ${active ? activeColor : 'var(--border-color)'}`, background: active ? activeBg : 'var(--bg-card)', cursor: 'pointer', transition: 'all 150ms', gap: '4px',
  })

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

          {/* Header */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', background: 'linear-gradient(135deg, #0F766E 0%, var(--teal-500) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}><CreditCard size={20} color="#ffffff" /></div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Bill Settlement</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
                  Order: {order.bill_number || 'N/A'} • Total: {formatCurrency(order.total_amount)}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={18} /></button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll' }}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Success overlay */}
              {showSuccess && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '12px' }}>
                  <CheckCircle2 size={64} style={{ color: 'var(--success)' }} />
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', margin: 0 }}>Payment Recorded!</p>
                </div>
              )}

              {!showSuccess && (
                <>
                  {/* Already paid state */}
                  {isAlreadyPaid ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px' }}>
                      <CheckCircle2 size={48} style={{ color: 'var(--success)' }} />
                      <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)', margin: 0 }}>This order is fully paid</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{formatCurrency(order.total_amount)}</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary card */}
                      <div style={{ background: 'var(--bg-subtle)', borderRadius: '12px', padding: '16px' }}>
                        {[
                          { label: 'Customer', value: order.customer_name, valueStyle: { fontWeight: 500 } },
                          { label: 'Total Amount', value: formatCurrency(order.total_amount), valueStyle: { fontWeight: 700 } },
                          { label: 'Paid So Far', value: formatCurrency(order.amount_received), valueStyle: { fontWeight: 600, color: 'var(--success)' } },
                          { label: 'Balance Due', value: formatCurrency(balanceDue), valueStyle: { fontWeight: 700, color: 'var(--danger)' } },
                        ].map(({ label, value, valueStyle }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: label !== 'Balance Due' ? '1px solid var(--border-color)' : 'none' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}:</span>
                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', ...valueStyle }}>{value}</span>
                          </div>
                        ))}
                        {/* Progress bar */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ height: '8px', borderRadius: '9999px', background: 'var(--border-color)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--success)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px', fontWeight: 500 }}>{progressPct}% paid</p>
                        </div>
                      </div>

                      {/* Payment mode selector */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setPaymentMode('Full')} style={cardSt(paymentMode === 'Full', 'var(--success)', 'var(--success-bg)')}>
                          <CheckCircle2 size={24} style={{ color: paymentMode === 'Full' ? 'var(--success)' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: paymentMode === 'Full' ? 'var(--success-text)' : 'var(--text-primary)' }}>FULL</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>COMPLETE PAY</span>
                          {paymentMode === 'Full' && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)', marginTop: '4px' }}>{formatCurrency(balanceDue)}</span>}
                        </button>
                        <button type="button" onClick={() => setPaymentMode('Partial')} style={cardSt(paymentMode === 'Partial', 'var(--warning)', 'var(--warning-bg)')}>
                          <Clock size={24} style={{ color: paymentMode === 'Partial' ? 'var(--warning)' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: paymentMode === 'Partial' ? 'var(--warning-text)' : 'var(--text-primary)' }}>PART</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PARTIAL PAY</span>
                        </button>
                      </div>

                      {/* Partial amount input */}
                      {paymentMode === 'Partial' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' as const }}>
                            Enter Amount Received (₹)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={balanceDue}
                            value={partialAmount || ''}
                            onChange={e => { setPartialAmount(Number(e.target.value)); setPartialError('') }}
                            placeholder="0.00"
                            className="w-full outline-none"
                            style={{ border: `1.5px solid ${partialError ? 'var(--danger)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '16px', color: 'var(--text-primary)', background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box' as const }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--teal-500)'}
                            onBlur={e => e.currentTarget.style.borderColor = partialError ? 'var(--danger)' : 'var(--border-color)'}
                          />
                          {partialError && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{partialError}</p>}
                          {partialAmount > 0 && partialAmount <= balanceDue && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Remaining after: {formatCurrency(balanceDue - partialAmount)}
                            </p>
                          )}
                          {/* Quick amount buttons */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {[25, 50, 75].map(pct => (
                              <button key={pct} type="button"
                                onClick={() => { setPartialAmount(Math.round(balanceDue * pct / 100 * 100) / 100); setPartialError('') }}
                                style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--border-md)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-50)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}>
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Payment history */}
                  <div>
                    <button type="button" onClick={() => setHistoryOpen(!historyOpen)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      <span>Payment History ({paymentHistory.length})</span>
                      {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {historyOpen && (
                      <div style={{ marginTop: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        {loadingHistory ? (
                          <p style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Loading...</p>
                        ) : paymentHistory.length === 0 ? (
                          <p style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No payments recorded yet</p>
                        ) : paymentHistory.map((p, i) => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < paymentHistory.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: p.payment_type === 'Full' ? 'var(--success-bg)' : 'var(--warning-bg)', color: p.payment_type === 'Full' ? 'var(--success-text)' : 'var(--warning-text)' }}>{p.payment_type}</span>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!isAlreadyPaid ? (
                <button type="button" onClick={handleConfirm} disabled={loading || balanceDue <= 0 || (paymentMode === 'Partial' && partialAmount <= 0)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: 'none', background: paymentMode === 'Full' ? 'var(--success)' : 'var(--warning)', color: '#ffffff', cursor: (loading || balanceDue <= 0 || (paymentMode === 'Partial' && partialAmount <= 0)) ? 'not-allowed' : 'pointer', opacity: (loading || (paymentMode === 'Partial' && partialAmount <= 0)) ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" />Processing…</> :
                    paymentMode === 'Full' ? `Confirm Full Payment — ${formatCurrency(balanceDue)}` : 'Confirm Partial Payment'}
                </button>
              ) : (
                <>
                  <button type="button" onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'var(--success)', color: '#ffffff', cursor: 'pointer' }}>Close</button>
                  {isStuck && (
                    <button type="button" onClick={() => {
                      const supabase = createClient()
                      supabase.from('orders').update({ bill_cleared: true }).eq('id', order.order_id)
                        .then(() => setTimeout(() => onPaymentDone(), 400))
                    }} style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--teal-500)', background: 'var(--teal-50)', color: 'var(--teal-500)', cursor: 'pointer' }}>
                      Mark as Cleared & Enable Completion
                    </button>
                  )}
                </>
              )}
              {!isAlreadyPaid && (
                <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Cancel Settlement
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
