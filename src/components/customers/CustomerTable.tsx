'use client'

import { ExternalLink, Pencil, Trash2, Users } from 'lucide-react'
import type { Customer } from '@/lib/types/database'
import type { CustomerType } from '@/lib/utils/format'
import { formatCurrency, formatMobile } from '@/lib/utils/format'
import { CustomerTypeBadge } from './CustomerTypeBadge'

interface CustomerTableProps {
  customers: Customer[]
  loading: boolean
  pendingAmounts: Record<string, number>
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onView: (customer: Customer) => void
  searchQuery?: string
}

const HEADERS = ['#', 'Customer Name', 'Type', 'Contact Person', 'Mobile', 'City / State', 'Pending Amount', 'Actions']

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr>
      {[40, 120, 80, 100, 90, 90, 80, 60].map((w, i) => (
        <td key={i} className="px-4 py-[14px]">
          <div
            className="rounded"
            style={{
              width: w,
              height: 14,
              background: 'var(--bg-subtle)',
              animation: 'cust-shimmer 1.5s ease-in-out infinite',
              animationDelay: `${(index * 8 + i) * 0.04}s`,
            }}
          />
          {(i === 1 || i === 4) && (
            <div
              className="rounded mt-1.5"
              style={{
                width: w * 0.6,
                height: 11,
                background: 'var(--bg-subtle)',
                animation: 'cust-shimmer 1.5s ease-in-out infinite',
              }}
            />
          )}
        </td>
      ))}
    </tr>
  )
}

export function CustomerTable({
  customers,
  loading,
  pendingAmounts,
  onEdit,
  onDelete,
  onView,
  searchQuery = '',
}: CustomerTableProps) {
  const isEmpty = !loading && customers.length === 0

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
        @keyframes cust-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '860px' }}>
          <thead>
            <tr
              style={{
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold uppercase whitespace-nowrap"
                  style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} index={i} />
                ))}
              </>
            ) : isEmpty ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Users size={48} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                      No customers found
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      {searchQuery
                        ? 'Try a different search term or clear the filters'
                        : 'Add your first customer using the button above'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer, idx) => {
                const pending = pendingAmounts[customer.id]
                return (
                  <tr
                    key={customer.id}
                    className="transition-colors duration-100"
                    style={{
                      borderBottom: idx < customers.length - 1 ? '1px solid var(--border-color)' : 'none',
                      verticalAlign: 'middle',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* # */}
                    <td className="px-4 py-[14px] text-center" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {idx + 1}
                    </td>

                    {/* Customer Name */}
                    <td className="px-4 py-[14px]">
                      <button
                        id={`view-customer-${customer.id}`}
                        type="button"
                        onClick={() => onView(customer)}
                        className="font-medium hover:underline text-left"
                        style={{ fontSize: '14px', color: 'var(--teal-500)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      >
                        {customer.business_name}
                      </button>
                      {customer.city && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {customer.city}
                        </p>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-[14px]">
                      <CustomerTypeBadge type={customer.customer_type as CustomerType} size="sm" />
                    </td>

                    {/* Contact Person */}
                    <td className="px-4 py-[14px]" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {customer.contact_person ?? '—'}
                    </td>

                    {/* Mobile */}
                    <td className="px-4 py-[14px]">
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {formatMobile(customer.mobile)}
                      </p>
                      {customer.other_mobile && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {formatMobile(customer.other_mobile)}
                        </p>
                      )}
                    </td>

                    {/* City / State */}
                    <td className="px-4 py-[14px]">
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {customer.city ?? '—'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {customer.state ?? '—'}
                      </p>
                    </td>

                    {/* Pending Amount */}
                    <td className="px-4 py-[14px] whitespace-nowrap">
                      {pending === undefined ? (
                        <div style={{ width: 72, height: 14, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'cust-shimmer 1.5s ease-in-out infinite' }} />
                      ) : pending > 0 ? (
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>
                          {formatCurrency(pending)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--success)' }}>
                          ₹0
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-[14px]">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button
                          id={`view-btn-${customer.id}`}
                          type="button"
                          onClick={() => onView(customer)}
                          className="flex items-center justify-center rounded-lg transition-all duration-100"
                          style={{ padding: '8px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="View customer"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--teal-50)'; e.currentTarget.style.color = 'var(--teal-500)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          <ExternalLink size={16} />
                        </button>

                        {/* Edit */}
                        <button
                          id={`edit-customer-${customer.id}`}
                          type="button"
                          onClick={() => onEdit(customer)}
                          className="flex items-center justify-center rounded-lg transition-all duration-100"
                          style={{ padding: '8px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="Edit customer"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--teal-50)'; e.currentTarget.style.color = 'var(--teal-500)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Delete */}
                        <button
                          id={`delete-customer-${customer.id}`}
                          type="button"
                          onClick={() => onDelete(customer)}
                          className="flex items-center justify-center rounded-lg transition-all duration-100"
                          style={{ padding: '8px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="Remove customer"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
