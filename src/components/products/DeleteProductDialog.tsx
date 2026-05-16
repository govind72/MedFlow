'use client'

import { useState } from 'react'
import { Trash2, AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'

interface DeleteProductDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  productName: string
  loading: boolean
}

export function DeleteProductDialog({
  open,
  onClose,
  onConfirm,
  productName,
  loading,
}: DeleteProductDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = loading || internalLoading

  async function handleConfirm() {
    setInternalLoading(true)
    await onConfirm()
    setInternalLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              maxWidth: '448px',
              pointerEvents: 'auto',
              background: 'var(--bg-card)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
          >
            {/* ── Red header ──────────────────────────────────── */}
            <div
              className="flex items-center gap-3 px-6 py-5"
              style={{
                background: 'linear-gradient(135deg, var(--danger) 0%, #DC2626 100%)',
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Trash2 size={20} style={{ color: '#ffffff' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: '#ffffff' }}>
                Delete Product
              </h2>
            </div>

            {/* ── Body ────────────────────────────────────────── */}
            <div className="px-6 py-5 space-y-4">
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Are you sure you want to delete{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  &ldquo;{productName}&rdquo;
                </strong>
                ?
              </p>

              {/* Warning note */}
              <div
                className="flex items-start gap-3 rounded-lg p-3"
                style={{ background: 'var(--bg-subtle)' }}
              >
                <AlertCircle
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--warning)' }}
                />
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  This product will be hidden from your catalog. Any existing orders
                  with this product will not be affected.
                </p>
              </div>
            </div>

            {/* ── Footer ──────────────────────────────────────── */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
              <button
                id="delete-cancel-btn"
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                style={{
                  borderColor: 'var(--border-md)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-card)',
                }}
              >
                Cancel
              </button>

              <button
                id="delete-confirm-btn"
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: 'var(--danger)', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.background = '#DC2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--danger)'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
}
