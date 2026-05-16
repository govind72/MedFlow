'use client'

import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Truck, ShoppingCart, CheckCircle, CheckCircle2, Loader2, CreditCard } from 'lucide-react'
import type { OrderManagement } from '@/lib/types/database'
import { formatCurrency, formatDate, formatDateLong } from '@/lib/utils/format'
import { StatusIcon } from '@/components/dashboard/StatusIcon'
import { PaymentBadge } from '@/components/dashboard/PaymentBadge'
import { CustomerTypeBadge } from '@/components/customers/CustomerTypeBadge'
import type { CustomerType } from '@/lib/utils/format'

interface OrdersTableProps {
  orders: OrderManagement[]
  loading: boolean
  activeTab: 'Pending' | 'Completed'
  onEdit: (order: OrderManagement) => void
  onDelete: (order: OrderManagement) => void
  onSettlePayment: (order: OrderManagement) => void
  onToggleFlag: (orderId: string, flag: string, value: boolean) => void
  onCompleteOrder: (order: OrderManagement) => void
  updatingOrderId: string | null
}

const PENDING_HEADERS = ['Bill & Date', 'Customer', 'Logistics', 'Order Form', 'Signed Bill', 'Delivered', 'Clearance', 'Amount', 'Actions']
const COMPLETED_HEADERS = ['Bill & Date', 'Customer', 'Logistics', 'Completed On', 'Amount', 'Payment', 'Actions']

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ width: i === 1 ? '120px' : '70px', height: 14, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'ord-shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
          {(i === 0 || i === 1) && <div style={{ width: '60px', height: 11, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'ord-shimmer 1.5s ease-in-out infinite', marginTop: '6px' }} />}
        </td>
      ))}
    </tr>
  )
}

export function OrdersTable({ orders, loading, activeTab, onEdit, onDelete, onSettlePayment, onToggleFlag, onCompleteOrder, updatingOrderId }: OrdersTableProps) {
  const router = useRouter()
  const isEmpty = !loading && orders.length === 0
  const headers = activeTab === 'Pending' ? PENDING_HEADERS : COMPLETED_HEADERS
  const cols = headers.length

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <style>{`
        @keyframes ord-shimmer { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
        @keyframes pulse-complete {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: activeTab === 'Pending' ? '950px' : '750px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={cols} />)
            ) : isEmpty ? (
              <tr>
                <td colSpan={cols}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: '12px' }}>
                    {activeTab === 'Pending'
                      ? <ShoppingCart size={48} style={{ color: 'var(--text-muted)' }} />
                      : <CheckCircle2 size={48} style={{ color: 'var(--success)', opacity: 0.4 }} />}
                    <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                      {activeTab === 'Pending' ? 'No pending orders' : 'No completed orders yet'}
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                      {activeTab === 'Pending'
                        ? 'Create a new order using the button above'
                        : 'Orders will appear here once all steps are done and payment is received'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => {
                const isUpdating = updatingOrderId === order.order_id
                const rowBg = isUpdating ? 'var(--teal-50)' : 'transparent'
                return (
                  <tr key={order.order_id}
                    style={{ borderBottom: idx < orders.length - 1 ? '1px solid var(--border-color)' : 'none', background: rowBg, opacity: isUpdating ? 0.8 : 1, transition: 'background 150ms', verticalAlign: 'middle' }}
                    onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = rowBg }}>

                    {/* Col 1 — Bill & Date */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isUpdating && <Loader2 size={12} style={{ color: 'var(--teal-500)', animation: 'spin 1s linear infinite' }} />}
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{order.bill_number || 'N/A'}</p>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{formatDate(order.order_date)}</p>
                    </td>

                    {/* Col 2 — Customer */}
                    <td style={{ padding: '14px 16px' }}>
                      <button type="button" onClick={() => router.push(`/customers/${order.customer_id}`)}
                        style={{ fontSize: '14px', fontWeight: 500, color: 'var(--teal-500)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
                        {order.customer_name}
                      </button>
                      {(order.customer_city || order.customer_state) && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0' }}>
                          {order.customer_city}{order.customer_state ? `, ${order.customer_state}` : ''}
                        </p>
                      )}
                      {activeTab === 'Pending' && order.customer_type && (
                        <CustomerTypeBadge type={order.customer_type as CustomerType} size="sm" />
                      )}
                    </td>

                    {/* Col 3 — Logistics */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.logistics_company_name || 'N/A'}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', fontStyle: 'italic' }}>
                        {order.courier_details || 'Self Pickup'}
                      </p>
                    </td>

                    {activeTab === 'Pending' ? (
                      <>
                        {/* Col 4 — Order Form */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button type="button"
                            onClick={() => !isUpdating && onToggleFlag(order.order_id, 'order_form_received', !order.order_form_received)}
                            disabled={isUpdating}
                            title={order.order_form_received ? 'Click to mark as NOT received' : 'Click to mark as received'}
                            style={{ background: 'none', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', padding: '4px', borderRadius: '6px', display: 'inline-flex', transition: 'all 150ms' }}
                            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.15)' }}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            <StatusIcon value={order.order_form_received} size="sm" />
                          </button>
                        </td>

                        {/* Col 5 — Signed Bill */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button type="button"
                            onClick={() => !isUpdating && onToggleFlag(order.order_id, 'signed_bill_received', !order.signed_bill_received)}
                            disabled={isUpdating}
                            title={order.signed_bill_received ? 'Click to mark as NOT received' : 'Click to mark as received'}
                            style={{ background: 'none', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', padding: '4px', borderRadius: '6px', display: 'inline-flex', transition: 'all 150ms' }}
                            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.15)' }}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            <StatusIcon value={order.signed_bill_received} size="sm" />
                          </button>
                        </td>

                        {/* Col 6 — Delivered */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button type="button"
                            onClick={() => !isUpdating && onToggleFlag(order.order_id, 'delivered', !order.delivered)}
                            disabled={isUpdating}
                            title={order.delivered ? 'Click to mark as NOT delivered' : 'Click to mark as delivered'}
                            style={{ background: 'none', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', padding: '4px', borderRadius: '6px', display: 'inline-flex', transition: 'all 150ms' }}
                            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.15)' }}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            <StatusIcon value={order.delivered} size="sm" />
                          </button>
                        </td>

                        {/* Col 7 — Clearance (opens settlement modal) */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button type="button"
                            onClick={() => onSettlePayment(order)}
                            title={order.bill_cleared ? 'View payment details' : 'Click to record payment'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 150ms' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            <StatusIcon value={order.bill_cleared} size="sm" />
                            <PaymentBadge status={order.payment_status} />
                          </button>
                        </td>

                        {/* Col 8 — Amount */}
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{formatCurrency(order.total_amount)}</p>
                          {order.amount_received > 0 && order.amount_received < order.total_amount ? (
                            <>
                              <p style={{ fontSize: '12px', color: 'var(--success)', margin: '2px 0 0' }}>Rcvd: {formatCurrency(order.amount_received)}</p>
                              <p style={{ fontSize: '12px', color: 'var(--danger)', margin: '2px 0 0' }}>Due: {formatCurrency(order.balance_due)}</p>
                            </>
                          ) : order.amount_received === 0 ? (
                            <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>Unpaid</span>
                          ) : null}
                        </td>

                        {/* Col 9 — Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            {order.is_completable && (
                              <button type="button" onClick={() => onCompleteOrder(order)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', animation: 'pulse-complete 2s infinite' }}>
                                <CheckCircle size={14} />
                                Complete
                              </button>
                            )}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button type="button" onClick={() => onEdit(order)} title="Edit order"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 150ms' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-50)'; e.currentTarget.style.color = 'var(--teal-500)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                                <Pencil size={15} />
                              </button>
                              <button type="button" onClick={() => onDelete(order)} title="Delete order"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 150ms' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Col 4 — Completed On */}
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--success)' }}>
                              {order.completed_at ? formatDateLong(order.completed_at) : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Col 5 — Amount */}
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{formatCurrency(order.total_amount)}</p>
                        </td>

                        {/* Col 6 — Payment */}
                        <td style={{ padding: '14px 16px' }}>
                          <PaymentBadge status={order.payment_status} />
                        </td>

                        {/* Actions — delete only */}
                        <td style={{ padding: '14px 16px' }}>
                          <button type="button" onClick={() => onDelete(order)} title="Delete order"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </>
                    )}
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
