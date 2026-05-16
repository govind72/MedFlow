'use client'

import { PackageSearch, CheckCircle2, XCircle, Minus } from 'lucide-react'
import type { PendingOrderDashboard } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { StatusIcon } from './StatusIcon'
import { PaymentBadge } from './PaymentBadge'

interface PendingOrdersTableProps {
  orders: PendingOrderDashboard[]
  loading: boolean
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-[14px]">
          <div
            className="h-4 rounded"
            style={{
              width: i === 1 ? '80%' : i === 7 ? '60%' : '70%',
              background: 'var(--bg-subtle)',
              animation: 'table-shimmer 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.06}s`,
            }}
          />
          {(i === 0 || i === 1 || i === 6) && (
            <div
              className="h-3 rounded mt-1.5"
              style={{
                width: '50%',
                background: 'var(--bg-subtle)',
                animation: 'table-shimmer 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.06 + 0.1}s`,
              }}
            />
          )}
        </td>
      ))}
    </tr>
  )
}

const HEADERS = [
  { label: 'Bill No & Date', align: 'left' },
  { label: 'Party Name', align: 'left' },
  { label: 'Order Form', align: 'center' },
  { label: 'Signed Bill', align: 'center' },
  { label: 'Delivered', align: 'center' },
  { label: 'Clearance', align: 'center' },
  { label: 'Amount', align: 'right' },
  { label: 'Payment Status', align: 'left' },
]

export function PendingOrdersTable({ orders, loading }: PendingOrdersTableProps) {
  const isEmpty = !loading && orders.length === 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <style>{`
        @keyframes table-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          {/* Header */}
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
              {HEADERS.map((h) => (
                <th
                  key={h.label}
                  className="px-4 py-3 text-left font-semibold tracking-wider uppercase whitespace-nowrap"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                    textAlign: h.align as 'left' | 'center' | 'right',
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : isEmpty ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <PackageSearch
                      size={48}
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <p
                      className="text-base font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      No pending orders
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      All orders are completed or none created yet
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <tr
                  key={order.order_id}
                  className="transition-colors duration-100"
                  style={{
                    borderBottom:
                      idx < orders.length - 1
                        ? '1px solid var(--border-color)'
                        : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Col 1: Bill No & Date */}
                  <td className="px-4 py-[14px] whitespace-nowrap">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {order.bill_number || 'N/A'}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatDate(order.order_date)}
                    </p>
                  </td>

                  {/* Col 2: Party Name */}
                  <td className="px-4 py-[14px]">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {order.party_name}
                    </p>
                    {order.city && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {order.city}
                      </p>
                    )}
                  </td>

                  {/* Col 3: Order Form */}
                  <td className="px-4 py-[14px] text-center">
                    <StatusIcon value={order.order_form_received} />
                  </td>

                  {/* Col 4: Signed Bill */}
                  <td className="px-4 py-[14px] text-center">
                    <StatusIcon value={order.signed_bill_received} />
                  </td>

                  {/* Col 5: Delivered */}
                  <td className="px-4 py-[14px] text-center">
                    <StatusIcon value={order.delivered} />
                  </td>

                  {/* Col 6: Clearance */}
                  <td className="px-4 py-[14px] text-center">
                    <StatusIcon value={order.bill_cleared} />
                  </td>

                  {/* Col 7: Amount */}
                  <td className="px-4 py-[14px] text-right whitespace-nowrap">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatCurrency(order.total_amount)}
                    </p>
                    {order.amount_received > 0 && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Rcvd: {formatCurrency(order.amount_received)}
                      </p>
                    )}
                  </td>

                  {/* Col 8: Payment Status */}
                  <td className="px-4 py-[14px]">
                    <PaymentBadge
                      status={order.payment_status as 'Unpaid' | 'Partially Paid' | 'Paid'}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-6 px-4 py-3"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}
        >
          STATUS KEY:
        </span>

        {[
          {
            icon: <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />,
            label: 'Completed / Cleared',
          },
          {
            icon: <XCircle size={14} style={{ color: 'var(--danger)' }} />,
            label: 'Pending / Not cleared',
          },
          {
            icon: <Minus size={14} style={{ color: 'var(--text-muted)' }} />,
            label: 'Not applicable',
          },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            {icon}
            <span
              className="text-[13px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
