'use client'

import { useState } from 'react'
import { Trash2, AlertCircle, Loader2, UserX } from 'lucide-react'
import { createPortal } from 'react-dom'

interface DeleteCustomerDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  customerName: string
  loading: boolean
}

export function DeleteCustomerDialog({
  open,
  onClose,
  onConfirm,
  customerName,
  loading,
}: DeleteCustomerDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = loading || internalLoading

  async function handleConfirm() {
    setInternalLoading(true)
    await onConfirm()
    setInternalLoading(false)
  }

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

      {/* Dialog */}
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
            maxWidth: '448px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            pointerEvents: 'auto',
          }}
        >
          {/* Navy gradient header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            >
              <UserX size={20} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Remove Customer
            </h2>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                &ldquo;{customerName}&rdquo;
              </strong>
              ?
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                borderRadius: '8px',
                padding: '12px',
                background: 'var(--bg-subtle)',
              }}
            >
              <AlertCircle
                size={16}
                style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }}
              />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                This customer will be marked inactive. Their order history and data will be preserved.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              id="delete-customer-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid var(--border-md)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>

            <button
              id="delete-customer-confirm-btn"
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                background: 'var(--danger)',
                color: '#ffffff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Remove Customer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
