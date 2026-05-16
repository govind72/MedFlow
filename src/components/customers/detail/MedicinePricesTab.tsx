'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { CustomerSpecialPrice, Product } from '@/lib/types/database'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { CategoryBadge } from '@/components/products/CategoryBadge'
import { AssignSpecialPriceModal, type SpecialPriceFormData } from './AssignSpecialPriceModal'

type SpecialPriceWithProduct = CustomerSpecialPrice & { product: Product }

interface MedicinePricesTabProps {
  customerId: string
  businessId: string
}

const HEADERS = ['Medicine Name', 'Salt', 'MRP', 'Special Price', 'MOQ', 'Actions']

export function MedicinePricesTab({ customerId, businessId }: MedicinePricesTabProps) {
  const [specialPrices, setSpecialPrices] = useState<SpecialPriceWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchSpecialPrices = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('customer_special_prices')
      .select(`
        *,
        product:products(id, product_name, salt, mrp, selling_price, category, moq, is_active, business_id, cost_price, discount_pct, min_stock, manufacturer, company, created_at, updated_at)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    setSpecialPrices((data ?? []) as SpecialPriceWithProduct[])
    setLoading(false)
  }, [customerId])

  useEffect(() => {
    fetchSpecialPrices()
  }, [fetchSpecialPrices])

  async function handleAssign(data: SpecialPriceFormData) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('customer_special_prices')
      .insert({ business_id: businessId, customer_id: customerId, ...data })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Special price assigned')
      setAssignModalOpen(false)
      await fetchSpecialPrices()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this special price?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('customer_special_prices')
      .delete()
      .eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Special price removed')
      setSpecialPrices((prev) => prev.filter((sp) => sp.id !== id))
    }
  }

  const existingProductIds = specialPrices.map((sp) => sp.product_id)

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Specialized Medicine Pricing
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Custom rates assigned to this customer
          </p>
        </div>
        <button
          id="assign-special-price-btn"
          type="button"
          onClick={() => setAssignModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'var(--teal-500)',
            color: '#ffffff',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-400)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--teal-500)')}
        >
          <Tag size={14} />
          Assign Special Price
        </button>
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
        {loading ? (
          <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 100, height: 14, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'fin-shimmer 1.5s ease-in-out infinite' }} />
          </div>
        ) : specialPrices.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: '12px' }}>
            <Tag size={48} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
              No special prices assigned
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              Click &quot;Assign Special Price&quot; to set custom rates for this customer
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                {specialPrices.map((sp, idx) => {
                  const savingsPct = Math.round((1 - sp.special_price / sp.product.mrp) * 100)
                  return (
                    <tr
                      key={sp.id}
                      style={{
                        borderBottom: idx < specialPrices.length - 1 ? '1px solid var(--border-color)' : 'none',
                        verticalAlign: 'middle',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Medicine Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CategoryBadge category={sp.product.category} />
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {sp.product.product_name}
                          </span>
                        </div>
                      </td>

                      {/* Salt */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {sp.product.salt ?? '—'}
                      </td>

                      {/* MRP */}
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {formatCurrency(sp.product.mrp)}
                      </td>

                      {/* Special Price */}
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--teal-500)', margin: 0 }}>
                          {formatCurrency(sp.special_price)}
                        </p>
                        {savingsPct > 0 && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'var(--success-bg)',
                              color: 'var(--success-text)',
                            }}
                          >
                            Save {savingsPct}%
                          </span>
                        )}
                      </td>

                      {/* MOQ */}
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {formatNumber(sp.moq)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(sp.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              transition: 'all 150ms',
                            }}
                            title="Remove special price"
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignSpecialPriceModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSave={handleAssign}
        existingProductIds={existingProductIds}
        loading={saving}
      />
    </div>
  )
}
