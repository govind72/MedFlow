'use client'

import { createPortal } from 'react-dom'
import { Trash2, AlertCircle, Loader2 } from 'lucide-react'
import type { OrderManagement } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface DeleteOrderDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  order: OrderManagement | null
  loading: boolean
}

export function DeleteOrderDialog({ open, onClose, onConfirm, order, loading }: DeleteOrderDialogProps) {
  if (!open || !order) return null

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div style={{ width: '100%', maxWidth: '448px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', pointerEvents: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', background: 'linear-gradient(135deg, var(--danger) 0%, #DC2626 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
              <Trash2 size={20} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Delete Order</h2>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Are you sure you want to delete this order?
            </p>

            {/* Order info card */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Customer</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{order.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Bill Number</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{order.bill_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Order Date</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{formatDate(order.order_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            {/* Warning */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', borderRadius: '8px', padding: '12px', background: 'var(--danger-bg)' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: 'var(--danger-text)', lineHeight: 1.5, margin: 0 }}>
                This action cannot be undone. All payment records for this order will also be permanently deleted.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} disabled={loading}
              style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: '1px solid var(--border-md)', color: 'var(--text-secondary)', background: 'var(--bg-card)', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              Cancel
            </button>
            <button id="delete-order-confirm-btn" type="button" onClick={onConfirm} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'var(--danger)', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : <><Trash2 size={14} />Delete Order</>}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
