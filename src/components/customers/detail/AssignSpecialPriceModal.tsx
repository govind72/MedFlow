'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/format'
import { CategoryBadge } from '@/components/products/CategoryBadge'

// ── Schema ────────────────────────────────────────────────────────────────────
const SpecialPriceSchema = z.object({
  product_id: z.string().uuid('Select a product'),
  special_price: z.number({ error: 'Enter a valid price' }).min(0.01, 'Price must be greater than 0'),
  moq: z.number({ error: 'Enter a valid number' }).int().min(1, 'MOQ must be at least 1'),
})

export type SpecialPriceFormData = z.infer<typeof SpecialPriceSchema>

interface AssignSpecialPriceModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: SpecialPriceFormData) => Promise<void>
  existingProductIds: string[]
  loading: boolean
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  letterSpacing: '0.05em',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{message}</p>
}

function NumInput({
  hasError,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className="w-full outline-none"
      style={{
        border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '14px',
        color: 'var(--text-primary)',
        background: 'var(--bg-card)',
        width: '100%',
        boxSizing: 'border-box' as const,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.1)' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = hasError ? 'var(--danger)' : 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none' }}
      {...props}
    />
  )
}

export function AssignSpecialPriceModal({
  open,
  onClose,
  onSave,
  existingProductIds,
  loading,
}: AssignSpecialPriceModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SpecialPriceFormData>({
    resolver: zodResolver(SpecialPriceSchema),
    defaultValues: { product_id: '', special_price: 0, moq: 1 },
  })

  const specialPriceVal = watch('special_price')

  // Savings % calculation
  const savingsPct =
    selectedProduct && specialPriceVal > 0 && selectedProduct.selling_price > 0
      ? Math.round((1 - specialPriceVal / selectedProduct.selling_price) * 100)
      : 0

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function fetchProducts() {
      setLoadingProducts(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, product_name, salt, mrp, selling_price, category')
        .eq('is_active', true)
        .order('product_name')
      if (!cancelled && data) {
        const filtered = (data as Product[]).filter(
          (p) => !existingProductIds.includes(p.id)
        )
        setProducts(filtered)
      }
      if (!cancelled) setLoadingProducts(false)
    }
    fetchProducts()
    reset({ product_id: '', special_price: 0, moq: 1 })
    setSelectedProduct(null)
    return () => { cancelled = true }
  }, [open, existingProductIds, reset])

  function handleProductChange(productId: string) {
    setValue('product_id', productId)
    const found = products.find((p) => p.id === productId) ?? null
    setSelectedProduct(found)
    if (found) {
      setValue('moq', found.moq)
    }
  }

  if (!open) return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.35)' }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }}
        >
          {/* Header */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, var(--teal-500) 0%, var(--teal-400) 100%)',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                Assign Special Price
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
                Set custom rate for this customer
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll' }}>
            <form id="special-price-form" onSubmit={handleSubmit(onSave)}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Product select */}
                <div>
                  <label style={labelStyle}>Select Product *</label>
                  {loadingProducts ? (
                    <div style={{ height: 42, borderRadius: '8px', background: 'var(--bg-subtle)', animation: 'fin-shimmer 1.5s ease-in-out infinite' }} />
                  ) : (
                    <select
                      value={watch('product_id')}
                      onChange={(e) => handleProductChange(e.target.value)}
                      style={{
                        width: '100%',
                        border: `1.5px solid ${errors.product_id ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: watch('product_id') ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: 'var(--bg-card)',
                        cursor: 'pointer',
                        outline: 'none',
                        boxSizing: 'border-box' as const,
                      }}
                    >
                      <option value="">— Select a product —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name}{p.salt ? ` (${p.salt})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {/* hidden input to register in form */}
                  <input type="hidden" {...register('product_id')} />
                  <FieldError message={errors.product_id?.message} />
                </div>

                {/* Product info card */}
                {selectedProduct && (
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CategoryBadge category={selectedProduct.category} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedProduct.product_name}
                      </span>
                    </div>
                    {selectedProduct.salt && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                        {selectedProduct.salt}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        MRP: {formatCurrency(selectedProduct.mrp)}
                      </span>
                      <span>Standard: {formatCurrency(selectedProduct.selling_price)}</span>
                    </div>
                  </div>
                )}

                {/* Special price */}
                <div>
                  <label style={labelStyle}>Special Price (₹) *</label>
                  <NumInput
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    hasError={!!errors.special_price}
                    {...register('special_price', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.special_price?.message} />
                  {selectedProduct && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Standard: {formatCurrency(selectedProduct.selling_price)}</span>
                      {savingsPct > 0 && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'var(--success-bg)',
                            color: 'var(--success-text)',
                          }}
                        >
                          Save {savingsPct}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* MOQ */}
                <div>
                  <label style={labelStyle}>MOQ (Min. Order Qty) *</label>
                  <NumInput
                    type="number"
                    min={1}
                    placeholder="Minimum quantity for this price"
                    hasError={!!errors.moq}
                    {...register('moq', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.moq?.message} />
                  {selectedProduct && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Standard MOQ: {selectedProduct.moq}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              id="assign-price-btn"
              type="submit"
              form="special-price-form"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                background: 'var(--teal-500)',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--teal-400)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--teal-500)' }}
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Assign Price'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
