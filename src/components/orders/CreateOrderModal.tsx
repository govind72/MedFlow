'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, ShoppingCart, CheckSquare, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LogisticsCompany } from '@/lib/types/database'
import { CustomerTypeBadge } from '@/components/customers/CustomerTypeBadge'
import type { CustomerType } from '@/lib/utils/format'

const CreateOrderFormSchema = z.object({
  customer_id: z.string().uuid('Select a customer'),
  bill_number: z.string().optional().or(z.literal('')),
  order_date: z.string().min(1, 'Order date required'),
  total_amount: z.number({ error: 'Enter a valid amount' }).min(0.01, 'Amount must be greater than 0'),
  logistics_company_id: z.string().uuid().optional().or(z.literal('')),
  courier_details: z.string().optional().or(z.literal('')),
  order_form_received: z.boolean(),
  signed_bill_received: z.boolean(),
})

type FormValues = z.infer<typeof CreateOrderFormSchema>
export type CreateOrderFormData = FormValues

type CustomerOption = { id: string; business_name: string; city: string | null; state: string | null; customer_type: string }

interface CreateOrderModalProps { open: boolean; onClose: () => void; onSave: (data: CreateOrderFormData) => Promise<void>; loading: boolean }

const labelSt: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '4px', textTransform: 'uppercase' as const }

function FErr({ msg }: { msg?: string }) { return msg ? <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{msg}</p> : null }

function FInput({ hasError, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return <input className="w-full outline-none" style={{ border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box' as const }}
    onFocus={e => { e.currentTarget.style.borderColor = 'var(--teal-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,160,0.1)' }}
    onBlur={e => { e.currentTarget.style.borderColor = hasError ? 'var(--danger)' : 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none' }} {...p} />
}

function Checkbox({ checked, onChange, title, sub }: { checked: boolean; onChange: (v: boolean) => void; title: string; sub: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%', borderRadius: '10px', padding: '14px 16px', border: `1.5px solid ${checked ? 'var(--success)' : 'var(--border-color)'}`, background: checked ? 'var(--success-bg)' : 'var(--bg-subtle)', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms' }}>
      {checked ? <CheckSquare size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '1px' }} /> : <Square size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }} />}
      <div>
        <p style={{ fontSize: '14px', fontWeight: 500, color: checked ? 'var(--success-text)' : 'var(--text-primary)', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '12px', color: checked ? 'var(--success-text)' : 'var(--text-muted)', margin: '2px 0 0' }}>{sub}</p>
      </div>
    </button>
  )
}

const EMPTY: CreateOrderFormData = { customer_id: '', bill_number: '', order_date: '', total_amount: 0, logistics_company_id: '', courier_details: '', order_form_received: false, signed_bill_received: false }

export function CreateOrderModal({ open, onClose, onSave, loading }: CreateOrderModalProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [logistics, setLogistics] = useState<LogisticsCompany[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [selectedCust, setSelectedCust] = useState<CustomerOption | null>(null)
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(CreateOrderFormSchema), defaultValues: EMPTY })
  const logisticsId = watch('logistics_company_id')

  useEffect(() => {
    if (!open) return
    reset({ ...EMPTY, order_date: new Date().toISOString().split('T')[0] })
    setSelectedCust(null)
    let cancelled = false
    async function load() {
      setLoadingData(true)
      const supabase = createClient()
      const [cR, lR] = await Promise.all([
        supabase.from('customers').select('id, business_name, city, state, customer_type').eq('status', 'Active').order('business_name'),
        supabase.from('logistics_companies').select('id, name, is_active, created_at').eq('is_active', true).order('name'),
      ])
      if (cancelled) return
      setCustomers((cR.data ?? []) as CustomerOption[])
      setLogistics((lR.data ?? []) as LogisticsCompany[])
      setLoadingData(false)
    }
    load()
    return () => { cancelled = true }
  }, [open, reset])

  if (!open) return null

  const selectSt = (hasError?: boolean): React.CSSProperties => ({ width: '100%', border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' })

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50, width: '540px', maxWidth: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '-8px 0 40px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'linear-gradient(135deg, var(--teal-500) 0%, var(--teal-400) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}><ShoppingCart size={20} color="#ffffff" /></div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Create New Order</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>Fill in the order details</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden' }}>
          <form id="create-order-form" onSubmit={handleSubmit(data => onSave(data as unknown as CreateOrderFormData))}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Customer */}
              <div>
                <label style={labelSt}>Customer Name *</label>
                <Controller name="customer_id" control={control} render={({ field }) => (
                  <select style={selectSt(!!errors.customer_id)} value={field.value} onChange={e => { field.onChange(e.target.value); setSelectedCust(customers.find(c => c.id === e.target.value) ?? null) }}>
                    <option value="">Select Customer...</option>
                    {loadingData ? <option disabled>Loading...</option> : customers.map(c => <option key={c.id} value={c.id}>{c.business_name}{c.city ? ` — ${c.city}` : ''}{c.state ? `, ${c.state}` : ''}</option>)}
                  </select>
                )} />
                <FErr msg={errors.customer_id?.message} />
                {selectedCust && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CustomerTypeBadge type={selectedCust.customer_type as CustomerType} size="sm" />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedCust.city}{selectedCust.state ? `, ${selectedCust.state}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Bill Info */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>Bill Info</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelSt}>Bill Number</label>
                    <FInput {...register('bill_number')} placeholder="e.g. BILL-990" hasError={!!errors.bill_number} />
                  </div>
                  <div>
                    <label style={labelSt}>Order Date *</label>
                    <FInput type="date" {...register('order_date')} hasError={!!errors.order_date} />
                    <FErr msg={errors.order_date?.message} />
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={labelSt}>Total Amount (₹) *</label>
                <input type="number" step="0.01" min="0.01" placeholder="0.00" className="w-full outline-none"
                  style={{ border: `1.5px solid ${errors.total_amount ? 'var(--danger)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '12px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box' as const }}
                  {...register('total_amount', { valueAsNumber: true })} />
                <FErr msg={errors.total_amount?.message} />
              </div>

              {/* Logistics */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>Logistics</p>
                <label style={labelSt}>Logistics Company</label>
                <Controller name="logistics_company_id" control={control} render={({ field }) => (
                  <select style={selectSt()} value={field.value ?? ''} onChange={e => { field.onChange(e.target.value); if (!e.target.value) setValue('courier_details', '') }}>
                    <option value="">Select Company...</option>
                    {logistics.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                )} />
                {!!logisticsId && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelSt}>Courier Details (AWB/Ref)</label>
                    <FInput {...register('courier_details')} placeholder="e.g. AWB-123456" />
                  </div>
                )}
              </div>

              {/* Status Checkboxes */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal-500)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>Initial Status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Controller name="order_form_received" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} title="Order Form Received" sub="Customer has submitted the purchase order form" />} />
                  <Controller name="signed_bill_received" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} title="Signed Bill Received" sub="Customer has returned the signed bill copy" />} />
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancel</button>
          <button id="create-order-submit-btn" type="submit" form="create-order-form" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'var(--teal-500)', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minWidth: 140, justifyContent: 'center' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--teal-400)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--teal-500)' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Creating…</> : <><ShoppingCart size={15} />Create Order</>}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
