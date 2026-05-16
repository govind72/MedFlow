'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Pill, Building2, Stethoscope, Heart, Warehouse, Shield } from 'lucide-react'
import { CUSTOMER_TYPE_CONFIG } from '@/lib/utils/format'
import type { Customer } from '@/lib/types/database'

// ── Schema ────────────────────────────────────────────────────────────────────
const CustomerFormSchema = z.object({
  customer_type: z.enum(['Pharmacy', 'Hospital', 'Clinic', 'Rehab', 'Wholesaler', 'De-Addiction']),
  business_name: z.string().min(2, 'Business name required').max(150),
  incharge: z.string().min(2, 'Incharge required').max(100),
  contact_person: z.string().min(2, 'Contact person required').max(100),
  mobile: z
    .string()
    .length(10, 'Must be exactly 10 digits')
    .regex(/^\d+$/, 'Numbers only'),
  other_mobile: z
    .string()
    .regex(/^\d*$/, 'Numbers only')
    .refine((v) => v === '' || v.length === 10, 'Must be 10 digits or empty')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gst_number: z.string().optional().or(z.literal('')),
  drug_license_no: z.string().optional().or(z.literal('')),
  state: z.string().min(2, 'State required'),
  district: z.string().min(2, 'District required'),
  city: z.string().min(2, 'City required'),
  pincode: z
    .string()
    .length(6, '6-digit pincode required')
    .regex(/^\d+$/, '6-digit pincode'),
  full_address: z.string().min(5, 'Address required').max(300),
  status: z.enum(['Active', 'Inactive']),
})

type FormValues = z.infer<typeof CustomerFormSchema>
export type CustomerFormData = FormValues

// ── Icon map ──────────────────────────────────────────────────────────────────
const TYPE_ICONS = {
  Pharmacy: Pill,
  Hospital: Building2,
  Clinic: Stethoscope,
  Rehab: Heart,
  Wholesaler: Warehouse,
  'De-Addiction': Shield,
} as const

const ALL_TYPES = Object.keys(CUSTOMER_TYPE_CONFIG) as Array<keyof typeof CUSTOMER_TYPE_CONFIG>

// ── Shared styles ─────────────────────────────────────────────────────────────
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
        width: '100%',
        boxSizing: 'border-box' as const,
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

function SectionLabel({ children, color = 'var(--text-secondary)' }: { children: string; color?: string }) {
  return (
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
      {children}
    </p>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AddEditCustomerModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: CustomerFormData) => Promise<void>
  customer?: Customer | null
  loading: boolean
}

const EMPTY_DEFAULTS: FormValues = {
  customer_type: 'Pharmacy',
  business_name: '',
  incharge: '',
  contact_person: '',
  mobile: '',
  other_mobile: '',
  email: '',
  gst_number: '',
  drug_license_no: '',
  state: '',
  district: '',
  city: '',
  pincode: '',
  full_address: '',
  status: 'Active',
}

export function AddEditCustomerModal({
  open,
  onClose,
  onSave,
  customer,
  loading,
}: AddEditCustomerModalProps) {
  const isEdit = !!customer

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  useEffect(() => {
    if (customer) {
      reset({
        customer_type: customer.customer_type,
        business_name: customer.business_name,
        incharge: customer.incharge ?? '',
        contact_person: customer.contact_person ?? '',
        mobile: customer.mobile,
        other_mobile: customer.other_mobile ?? '',
        email: customer.email ?? '',
        gst_number: customer.gst_number ?? '',
        drug_license_no: customer.drug_license_no ?? '',
        state: customer.state ?? '',
        district: customer.district ?? '',
        city: customer.city ?? '',
        pincode: customer.pincode ?? '',
        full_address: customer.full_address ?? '',
        status: customer.status,
      })
    } else {
      reset(EMPTY_DEFAULTS)
    }
  }, [customer, reset, open])

  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Right-side drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: '560px',
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
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
            background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              {isEdit ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
              Fill in all the customer details
            </p>
          </div>
          <button
            id="customer-modal-close-btn"
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
              color: 'rgba(255,255,255,0.8)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden' }}>
          <form id="customer-form" onSubmit={handleSubmit((data) => onSave(data as unknown as CustomerFormData))}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* SECTION 1 — Customer Type */}
              <div>
                <SectionLabel>Customer Type</SectionLabel>
                <Controller
                  name="customer_type"
                  control={control}
                  render={({ field }) => (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {ALL_TYPES.map((type) => {
                        const cfg = CUSTOMER_TYPE_CONFIG[type]
                        const Icon = TYPE_ICONS[type]
                        const selected = field.value === type
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              borderRadius: '12px',
                              padding: '12px 16px',
                              border: `1.5px solid ${selected ? cfg.dot : 'var(--border-color)'}`,
                              background: selected ? cfg.bg : 'var(--bg-subtle)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 150ms',
                            }}
                          >
                            <Icon
                              size={20}
                              style={{ color: selected ? cfg.text : 'var(--text-muted)', flexShrink: 0 }}
                            />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: selected ? cfg.text : 'var(--text-primary)', margin: 0 }}>
                                {cfg.label}
                              </p>
                              <p style={{ fontSize: '11px', color: selected ? cfg.text : 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                                {cfg.subtitle}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
                <FieldError message={errors.customer_type?.message} />
              </div>

              {/* SECTION 2 — Business Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SectionLabel>Business Details</SectionLabel>

                <div>
                  <label style={labelStyle}>Business Name *</label>
                  <FormInput {...register('business_name')} placeholder="e.g. Apollo Pharmacy" hasError={!!errors.business_name} />
                  <FieldError message={errors.business_name?.message} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Incharge *</label>
                    <FormInput {...register('incharge')} placeholder="e.g. Dr. Suresh Iyer" hasError={!!errors.incharge} />
                    <FieldError message={errors.incharge?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Person *</label>
                    <FormInput {...register('contact_person')} placeholder="e.g. Rahul Sharma" hasError={!!errors.contact_person} />
                    <FieldError message={errors.contact_person?.message} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Mobile Number *</label>
                    <FormInput {...register('mobile')} placeholder="10-digit number" hasError={!!errors.mobile} maxLength={10} />
                    <FieldError message={errors.mobile?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Other Mobile</label>
                    <FormInput {...register('other_mobile')} placeholder="Alternate number (optional)" hasError={!!errors.other_mobile} maxLength={10} />
                    <FieldError message={errors.other_mobile?.message} />
                  </div>
                </div>
              </div>

              {/* SECTION 3 — License & Tax */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SectionLabel color="var(--teal-500)">License &amp; Tax</SectionLabel>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>GST Number</label>
                    <FormInput {...register('gst_number')} placeholder="e.g. 27AADCB2230M1Z2" hasError={!!errors.gst_number} />
                    <FieldError message={errors.gst_number?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Drug License No.</label>
                    <FormInput {...register('drug_license_no')} placeholder="e.g. MH-MZ1-123456" hasError={!!errors.drug_license_no} />
                    <FieldError message={errors.drug_license_no?.message} />
                  </div>
                </div>
              </div>

              {/* SECTION 4 — Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SectionLabel color="var(--teal-500)">Location</SectionLabel>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <FormInput {...register('state')} placeholder="e.g. Maharashtra" hasError={!!errors.state} />
                    <FieldError message={errors.state?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>District *</label>
                    <FormInput {...register('district')} placeholder="e.g. Mumbai" hasError={!!errors.district} />
                    <FieldError message={errors.district?.message} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <FormInput {...register('city')} placeholder="e.g. Andheri" hasError={!!errors.city} />
                    <FieldError message={errors.city?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode *</label>
                    <FormInput {...register('pincode')} placeholder="e.g. 400053" hasError={!!errors.pincode} maxLength={6} />
                    <FieldError message={errors.pincode?.message} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Full Address *</label>
                  <textarea
                    {...register('full_address')}
                    rows={3}
                    placeholder="Street / Area / Locality"
                    style={{
                      width: '100%',
                      border: `1.5px solid ${errors.full_address ? 'var(--danger)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-card)',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = errors.full_address ? 'var(--danger)' : 'var(--border-color)')}
                  />
                  <FieldError message={errors.full_address?.message} />
                </div>
              </div>

              {/* SECTION 5 — Other */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SectionLabel>Other</SectionLabel>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <FormInput type="email" {...register('email')} placeholder="email@example.com" hasError={!!errors.email} />
                    <FieldError message={errors.email?.message} />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          style={{
                            width: '100%',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            background: 'var(--bg-card)',
                            outline: 'none',
                            cursor: 'pointer',
                            boxSizing: 'border-box' as const,
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
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
            background: 'var(--bg-card)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>

          <button
            id="customer-save-btn"
            type="submit"
            form="customer-form"
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
              minWidth: '150px',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--teal-400)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--teal-500)' }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              'Update Customer'
            ) : (
              'Save Customer'
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
