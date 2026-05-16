'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Pencil, CheckSquare, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LogisticsCompany, OrderManagement } from '@/lib/types/database'
import { CustomerTypeBadge } from '@/components/customers/CustomerTypeBadge'
import { StatusIcon } from '@/components/dashboard/StatusIcon'
import type { CustomerType } from '@/lib/utils/format'

const EditOrderFormSchema = z.object({
  bill_number: z.string().optional().or(z.literal('')),
  order_date: z.string().min(1, 'Order date required'),
  total_amount: z.number({ error: 'Enter a valid amount' }).min(0.01, 'Amount required'),
  logistics_company_id: z.string().uuid().optional().or(z.literal('')),
  courier_details: z.string().optional().or(z.literal('')),
  order_form_received: z.boolean(),
  signed_bill_received: z.boolean(),
  delivered: z.boolean(),
})

export type EditOrderFormData = z.infer<typeof EditOrderFormSchema>

interface EditOrderModalProps { open: boolean; onClose: () => void; onSave: (data: EditOrderFormData) => Promise<void>; order: OrderManagement | null; loading: boolean }

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

export function EditOrderModal({ open, onClose, onSave, order, loading }: EditOrderModalProps) {
  const [logistics, setLogistics] = useState<LogisticsCompany[]>([])
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<EditOrderFormData>({
    resolver: zodResolver(EditOrderFormSchema),
    defaultValues: { bill_number: '', order_date: '', total_amount: 0, logistics_company_id: '', courier_details: '', order_form_received: false, signed_bill_received: false, delivered: false },
  })
  const logisticsId = watch('logistics_company_id')

  useEffect(() => {
    if (!open || !order) return
    reset({
      bill_number: order.bill_number ?? '',
      order_date: order.order_date,
      total_amount: order.total_amount,
      logistics_company_id: '',
      courier_details: order.courier_details ?? '',
      order_form_received: order.order_form_received,
      signed_bill_received: order.signed_bill_received,
      delivered: order.delivered,
    })
    const supabase = createClient()
    supabase.from('logistics_companies').select('id, name, is_active, created_at').eq('is_active', true).order('name')
      .then(({ data }) => {
        setLogistics((data ?? []) as LogisticsCompany[])
      })
  }, [open, order, reset])

  if (!open || !order) return null

  const selectSt: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50, width: '540px', maxWidth: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '-8px 0 40px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}><Pencil size={20} color="#ffffff" /></div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Edit Order</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>{order.bill_number || 'No bill number'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden' }}>
          <form id="edit-order-form" onSubmit={handleSubmit(data => onSave(data as unknown as EditOrderFormData))}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Customer — READ ONLY */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Customer</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle)', borderRadius: '10px', padding: '12px 14px' }}>
                  <CustomerTypeBadge type={order.customer_type as CustomerType} size="sm" />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{order.customer_name}</p>
                    {(order.customer_city || order.customer_state) && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{order.customer_city}{order.customer_state ? `, ${order.customer_state}` : ''}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bill Info */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>Bill Info</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelSt}>Bill Number</label>
                    <FInput {...register('bill_number')} placeholder="e.g. BILL-990" />
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
                  <select style={selectSt} value={field.value ?? ''} onChange={e => { field.onChange(e.target.value); if (!e.target.value) setValue('courier_details', '') }}>
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

              {/* Status flags */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal-500)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>Order Status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Controller name="order_form_received" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} title="Order Form Received" sub="Customer has submitted the purchase order form" />} />
                  <Controller name="signed_bill_received" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} title="Signed Bill Received" sub="Customer has returned the signed bill copy" />} />
                  <Controller name="delivered" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} title="Delivered" sub="Order has been physically delivered to customer" />} />
                  {/* bill_cleared — read-only */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px', padding: '14px 16px', border: '1.5px solid var(--border-color)', background: 'var(--bg-subtle)', opacity: 0.7 }}>
                    <StatusIcon value={order.bill_cleared} size="sm" />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>Bill Cleared</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Managed via payment settlement — not editable here</p>
                    </div>
                  </div>
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
          <button id="edit-order-submit-btn" type="submit" form="edit-order-form" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'var(--teal-500)', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minWidth: 140, justifyContent: 'center' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--teal-400)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--teal-500)' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Saving…</> : 'Update Order'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
