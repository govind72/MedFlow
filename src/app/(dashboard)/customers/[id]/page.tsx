'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Tag, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useBusinessContext } from '@/contexts/BusinessContext'
import type { Customer, CustomerFinancialSummary } from '@/lib/types/database'
import type { CustomerFormData } from '@/components/customers/AddEditCustomerModal'
import { CustomerHeader } from '@/components/customers/detail/CustomerHeader'
import { LicenseCard } from '@/components/customers/detail/LicenseCard'
import { FinancialSummaryCard } from '@/components/customers/detail/FinancialSummaryCard'
import { OrderHistoryTab } from '@/components/customers/detail/OrderHistoryTab'
import { MedicinePricesTab } from '@/components/customers/detail/MedicinePricesTab'
import { PaymentHistoryTab } from '@/components/customers/detail/PaymentHistoryTab'
import { AddEditCustomerModal } from '@/components/customers/AddEditCustomerModal'
import { DeleteCustomerDialog } from '@/components/customers/DeleteCustomerDialog'
import React from 'react'

type ActiveTab = 'orders' | 'prices' | 'payments'

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonBlock({ h = 140 }: { h?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: h,
        borderRadius: '12px',
        background: 'var(--bg-subtle)',
        animation: 'detail-shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+: params is a Promise — must be unwrapped with React.use()
  const { id } = React.use(params)

  const router = useRouter()
  const { businessId } = useBusinessContext()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [financial, setFinancial] = useState<CustomerFinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Initial data load
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const supabase = createClient()

      // Fetch customer first — financial summary may not exist yet (no orders)
      const custRes = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (cancelled) return

      if (custRes.error || !custRes.data) {
        toast.error('Customer not found')
        router.push('/customers')
        return
      }
      setCustomer(custRes.data as Customer)

      // Financial summary is optional — may not exist for new customers
      const finRes = await supabase
        .from('v_customer_financial_summary')
        .select('*')
        .eq('customer_id', id)
        .single()

      if (!cancelled && !finRes.error && finRes.data) {
        setFinancial(finRes.data as CustomerFinancialSummary)
      }

      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, router])

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleUpdateCustomer(data: CustomerFormData) {
    if (!customer) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', customer.id)
    if (error) {
      toast.error(error.message ?? 'Failed to update customer')
    } else {
      toast.success('Customer updated')
      setEditModalOpen(false)
      // Refetch
      const { data: fresh } = await supabase.from('customers').select('*').eq('id', customer.id).single()
      if (fresh) setCustomer(fresh as Customer)
    }
    setSaving(false)
  }

  async function handleDeleteCustomer() {
    if (!customer) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .update({ status: 'Inactive' })
      .eq('id', customer.id)
    if (error) {
      toast.error(error.message ?? 'Failed to remove customer')
    } else {
      toast.success('Customer removed')
      router.push('/customers')
    }
    setSaving(false)
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading && !customer) {
    return (
      <div>
        <style>{`
          @keyframes detail-shimmer {
            0%, 100% { opacity: 0.45; }
            50%       { opacity: 0.9;  }
          }
        `}</style>
        <div style={{ marginBottom: '16px', width: 140, height: 20, borderRadius: 6, background: 'var(--bg-subtle)', animation: 'detail-shimmer 1.5s ease-in-out infinite' }} />
        <SkeletonBlock h={180} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <SkeletonBlock h={120} />
          <SkeletonBlock h={120} />
        </div>
        <SkeletonBlock h={300} />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div>
      <style>{`
        @keyframes detail-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      {/* Back nav */}
      <button
        type="button"
        onClick={() => router.push('/customers')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '16px',
          transition: 'color 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal-500)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={16} />
        Back to Customers
      </button>

      {/* Header card */}
      <CustomerHeader
        customer={customer}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* License + Financial row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}
        className="sm:grid-cols-1"
      >
        <LicenseCard gst_number={customer.gst_number} drug_license_no={customer.drug_license_no} />
        <FinancialSummaryCard summary={financial} loading={loading} />
      </div>

      {/* Tab toggle */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '4px',
        }}
      >
        {([
          { key: 'orders' as ActiveTab, label: 'Order History', Icon: ShoppingBag },
          { key: 'prices' as ActiveTab, label: 'Medicine Prices', Icon: Tag },
          { key: 'payments' as ActiveTab, label: 'Payment History', Icon: CreditCard },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: activeTab === key ? 600 : 400,
              border: 'none',
              background: activeTab === key ? 'var(--navy-900)' : 'transparent',
              color: activeTab === key ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginTop: '16px' }}>
        {activeTab === 'orders' ? (
          <OrderHistoryTab customerId={customer.id} />
        ) : activeTab === 'prices' ? (
          <MedicinePricesTab customerId={customer.id} businessId={businessId} />
        ) : (
          <PaymentHistoryTab customerId={customer.id} />
        )}
      </div>

      {/* Modals */}
      <AddEditCustomerModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateCustomer}
        customer={customer}
        loading={saving}
      />
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCustomer}
        customerName={customer.business_name}
        loading={saving}
      />
    </div>
  )
}
