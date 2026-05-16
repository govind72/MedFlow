'use client'

import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, ShieldAlert, Shield, Pill, Tag } from 'lucide-react'
import { CATEGORY_CONFIG } from '@/lib/utils/format'
import type { Product } from '@/lib/types/database'

// ── Zod schema ────────────────────────────────────────────────────────────────
// discount_pct is NOT a user input — computed from selling_price & mrp.
const ProductFormSchema = z
  .object({
    category: z.enum(['NRX', 'RX', 'SCH_H', 'OTHERS']),
    product_name: z.string().min(2, 'Product name required').max(100),
    salt: z.string().min(2, 'Salt / active ingredient required').max(100),
    manufacturer: z.string().min(2, 'Manufacturer required').max(100),
    company: z.string().min(2, 'Company required').max(100),
    cost_price: z.number({ error: 'Enter a valid number' }).min(0, 'Must be 0 or more'),
    selling_price: z.number({ error: 'Enter a valid number' }).min(0, 'Must be 0 or more'),
    mrp: z.number({ error: 'Enter a valid number' }).min(0, 'Must be 0 or more'),
    moq: z
      .number({ error: 'Enter a valid number' })
      .int('Must be a whole number')
      .min(1, 'Minimum order quantity must be at least 1'),
    min_stock: z
      .number({ error: 'Enter a valid number' })
      .int('Must be a whole number')
      .min(0),
  })
  .refine((d) => d.cost_price <= d.selling_price, {
    message: 'Cost price must be ≤ selling price',
    path: ['cost_price'],
  })
  .refine((d) => d.selling_price <= d.mrp, {
    message: 'Selling price must be ≤ MRP',
    path: ['selling_price'],
  })

type FormValues = z.infer<typeof ProductFormSchema>
export type ProductFormData = FormValues & { discount_pct: number }

// ── Category icon map ─────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  NRX: ShieldAlert,
  RX: Shield,
  SCH_H: Pill,
  OTHERS: Tag,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  return (
    <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>
      {message}
    </p>
  )
}

function FormInput({
  hasError,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className="w-full outline-none transition-all"
      style={{
        border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '14px',
        color: 'var(--text-primary)',
        background: 'var(--bg-card)',
        boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = hasError ? 'var(--danger)' : 'var(--teal-500)'
        if (!hasError) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.1)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = hasError ? 'var(--danger)' : 'var(--border-color)'
        e.currentTarget.style.boxShadow = hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
      }}
      {...props}
    />
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AddEditProductModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ProductFormData) => Promise<void>
  product?: Product | null
  loading: boolean
}

const EMPTY_DEFAULTS: FormValues = {
  category: 'OTHERS',
  product_name: '',
  salt: '',
  manufacturer: '',
  company: '',
  cost_price: 0,
  selling_price: 0,
  mrp: 0,
  moq: 1,
  min_stock: 0,
}

export function AddEditProductModal({
  open,
  onClose,
  onSave,
  product,
  loading,
}: AddEditProductModalProps) {
  const isEdit = !!product

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  // Live watch for auto-discount
  const sellingPrice = watch('selling_price')
  const mrp = watch('mrp')

  const computedDiscount = useMemo(() => {
    const sp = Number(sellingPrice) || 0
    const m = Number(mrp) || 0
    if (m <= 0 || sp <= 0 || sp >= m) return 0
    return Math.round(((m - sp) / m) * 100 * 100) / 100
  }, [sellingPrice, mrp])

  // Pre-fill / reset when modal opens
  useEffect(() => {
    if (product) {
      reset({
        category: product.category,
        product_name: product.product_name,
        salt: product.salt ?? '',
        manufacturer: product.manufacturer ?? '',
        company: product.company ?? '',
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        mrp: product.mrp,
        moq: product.moq,
        min_stock: product.min_stock,
      })
    } else {
      reset(EMPTY_DEFAULTS)
    }
  }, [product, reset, open])

  function onSubmit(formData: FormValues) {
    return onSave({ ...formData, discount_pct: computedDiscount })
  }

  const sectionLabel = (text: string, color = 'var(--text-secondary)') => (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}
    >
      {text}
    </p>
  )

  // ── Render: plain createPortal — no Radix Dialog, no scroll-lock ──────────
  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* Right-side drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: '520px',
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── FIXED HEADER ───────────────────────────────── */}
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
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
              Fill in the product details below
            </p>
          </div>
          <button
            id="modal-close-btn"
            type="button"
            onClick={onClose}
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
              color: 'rgba(255,255,255,0.85)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────── */}
        {/*
          Using inline style overflow-y:scroll (not auto) to guarantee
          the scrollable region is always active regardless of content height.
          flex:1 + minHeight:0 ensures this div fills remaining space.
        */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'scroll',
            overflowX: 'hidden',
          }}
        >
          <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* SECTION 1 — Category */}
              <div>
                {sectionLabel('Category')}
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      {(['NRX', 'RX', 'SCH_H', 'OTHERS'] as const).map((cat) => {
                        const cfg = CATEGORY_CONFIG[cat]
                        const Icon = CATEGORY_ICONS[cat]
                        const selected = field.value === cat
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => field.onChange(cat)}
                            className="flex items-center gap-3 rounded-xl text-left transition-all duration-150"
                            style={{
                              padding: '14px 16px',
                              border: `1.5px solid ${selected ? cfg.dot : 'var(--border-color)'}`,
                              background: selected ? cfg.bg : 'var(--bg-subtle)',
                              cursor: 'pointer',
                            }}
                          >
                            <Icon
                              size={20}
                              style={{ color: selected ? cfg.text : 'var(--text-muted)', flexShrink: 0 }}
                            />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: selected ? cfg.text : 'var(--text-primary)' }}>
                                {cfg.label}
                              </p>
                              <p className="text-xs" style={{ color: selected ? cfg.text : 'var(--text-muted)' }}>
                                {cfg.subtitle}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
                <FieldError message={errors.category?.message} />
              </div>

              {/* SECTION 2 — Product Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sectionLabel('Product Details')}

                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <FormInput {...register('product_name')} placeholder="e.g. Paracetamol 500mg" hasError={!!errors.product_name} />
                  <FieldError message={errors.product_name?.message} />
                </div>

                <div>
                  <label style={labelStyle}>Salt (Active Ingredient) *</label>
                  <FormInput {...register('salt')} placeholder="e.g. Paracetamol" hasError={!!errors.salt} />
                  <FieldError message={errors.salt?.message} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Manufacturer *</label>
                    <FormInput {...register('manufacturer')} placeholder="e.g. Cipla" hasError={!!errors.manufacturer} />
                    <FieldError message={errors.manufacturer?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company *</label>
                    <FormInput {...register('company')} placeholder="e.g. Cipla Ltd." hasError={!!errors.company} />
                    <FieldError message={errors.company?.message} />
                  </div>
                </div>
              </div>

              {/* SECTION 3 — Pricing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sectionLabel('Pricing', 'var(--teal-500)')}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>Cost Price (₹) *</label>
                    <FormInput type="number" min={0} step={0.01} hasError={!!errors.cost_price} {...register('cost_price', { valueAsNumber: true })} />
                    <FieldError message={errors.cost_price?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Selling Price (₹) *</label>
                    <FormInput type="number" min={0} step={0.01} hasError={!!errors.selling_price} {...register('selling_price', { valueAsNumber: true })} />
                    <FieldError message={errors.selling_price?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>MRP (₹) *</label>
                    <FormInput type="number" min={0} step={0.01} hasError={!!errors.mrp} {...register('mrp', { valueAsNumber: true })} />
                    <FieldError message={errors.mrp?.message} />
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Cost ≤ Selling ≤ MRP
                </p>
              </div>

              {/* SECTION 4 — Stock & Ordering */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sectionLabel('Stock & Ordering', 'var(--teal-500)')}

                <div className="grid grid-cols-3 gap-4">
                  {/* Auto-computed Discount — READ-ONLY */}
                  <div>
                    <label style={labelStyle}>Discount (%)</label>
                    <div
                      style={{
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        background: 'var(--bg-subtle)',
                        fontSize: '14px',
                        color: computedDiscount > 0 ? 'var(--success-text)' : 'var(--text-muted)',
                        fontWeight: computedDiscount > 0 ? '600' : '400',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{computedDiscount > 0 ? `${computedDiscount}%` : '0%'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Calculated from MRP &amp; Selling Price
                    </p>
                  </div>

                  {/* MOQ */}
                  <div>
                    <label style={labelStyle}>MOQ *</label>
                    <FormInput type="number" min={1} placeholder="Min. order quantity" hasError={!!errors.moq} {...register('moq', { valueAsNumber: true })} />
                    <FieldError message={errors.moq?.message} />
                  </div>

                  {/* Min Stock */}
                  <div>
                    <label style={labelStyle}>Min Stock</label>
                    <FormInput type="number" min={0} placeholder="Alert threshold" hasError={!!errors.min_stock} {...register('min_stock', { valueAsNumber: true })} />
                    <FieldError message={errors.min_stock?.message} />
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* ── FIXED FOOTER ───────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>

          <button
            id="product-save-btn"
            type="submit"
            form="product-form"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ minWidth: '140px', background: 'var(--teal-500)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--teal-400)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--teal-500)' }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              'Update Product'
            ) : (
              'Save Product'
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
