'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, PackageSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { OrderManagement } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { StatusIcon } from '@/components/dashboard/StatusIcon'
import { PaymentBadge } from '@/components/dashboard/PaymentBadge'

interface OrderHistoryTabProps {
  customerId: string
}

type ActiveTab = 'Pending' | 'Completed'

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-[14px]">
          <div
            style={{
              width: i === 0 || i === 1 ? '90px' : i === 7 ? '60px' : '50px',
              height: 14,
              borderRadius: 4,
              background: 'var(--bg-subtle)',
              animation: 'oh-shimmer 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

const HEADERS = ['Bill & Date', 'Logistics', 'Order Form', 'Signed Bill', 'Delivered', 'Clearance', 'Amount', 'Action']

export function OrderHistoryTab({ customerId }: OrderHistoryTabProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderManagement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('Pending')

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('v_order_management')
        .select('*')
        .eq('customer_id', customerId)
        .order('order_date', { ascending: false })
      if (!cancelled) {
        setOrders((data ?? []) as OrderManagement[])
        setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [customerId])

  const pendingOrders = orders.filter((o) => o.order_status === 'Pending')
  const completedOrders = orders.filter((o) => o.order_status === 'Completed')
  const displayed = activeTab === 'Pending' ? pendingOrders : completedOrders

  return (
    <div>
      <style>{`
        @keyframes oh-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      {/* Tab toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
        {(['Pending', 'Completed'] as ActiveTab[]).map((tab) => {
          const count = tab === 'Pending' ? pendingOrders.length : completedOrders.length
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--navy-900)' : 'var(--bg-subtle)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 150ms',
              }}
            >
              {tab} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                </>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
                      <PackageSearch size={40} style={{ color: 'var(--text-muted)' }} />
                      <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        {activeTab === 'Pending' ? 'No pending orders for this customer' : 'No completed orders yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((order, idx) => (
                  <tr
                    key={order.order_id}
                    style={{
                      borderBottom: idx < displayed.length - 1 ? '1px solid var(--border-color)' : 'none',
                      verticalAlign: 'middle',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Bill & Date */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        {order.bill_number || 'N/A'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {formatDate(order.order_date)}
                      </p>
                    </td>

                    {/* Logistics */}
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        {order.logistics_company_name || 'N/A'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {order.courier_details || 'Self Pickup'}
                      </p>
                    </td>

                    {/* Order Form */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusIcon value={order.order_form_received} size="sm" />
                    </td>

                    {/* Signed Bill */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusIcon value={order.signed_bill_received} size="sm" />
                    </td>

                    {/* Delivered */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusIcon value={order.delivered} size="sm" />
                    </td>

                    {/* Clearance */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusIcon value={order.bill_cleared} size="sm" />
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {formatCurrency(order.total_amount)}
                      </p>
                      <div style={{ marginTop: '4px' }}>
                        <PaymentBadge status={order.payment_status} />
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        type="button"
                        onClick={() => router.push('/orders')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--teal-50)',
                          color: 'var(--teal-500)',
                          cursor: 'pointer',
                          transition: 'all 150ms',
                        }}
                        title="View in orders"
                      >
                        <ExternalLink size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
