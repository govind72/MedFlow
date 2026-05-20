'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, XCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { useCustomers } from '@/hooks/useCustomers'
import { CUSTOMER_TYPE_CONFIG } from '@/lib/utils/format'
import type { Customer, CustomerFinancialSummary } from '@/lib/types/database'
import type { CustomerFormData } from '@/components/customers/AddEditCustomerModal'
import { CustomerTypeTabs } from '@/components/customers/CustomerTypeTabs'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { AddEditCustomerModal } from '@/components/customers/AddEditCustomerModal'
import { DeleteCustomerDialog } from '@/components/customers/DeleteCustomerDialog'

export default function CustomersPage() {
  const router = useRouter()
  const { businessName, businessId } = useBusinessContext()

  // Filter state
  const [activeType, setActiveType] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeState, setActiveState] = useState('')
  const [activeDistrict, setActiveDistrict] = useState('')

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)

  // Pending amounts map
  const [pendingAmounts, setPendingAmounts] = useState<Record<string, number>>({})

  const {
    customers,
    filteredCustomers,
    counts,
    states,
    districts,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers(activeType, searchQuery, activeState, activeDistrict)

  // Fetch pending amounts in a single batch query
  const fetchPendingAmounts = useCallback(async () => {
    if (customers.length === 0) return
    const supabase = createClient()
    const { data } = await supabase
      .from('v_customer_financial_summary')
      .select('customer_id, pending_amount')
      .eq('business_id', businessId)
    if (data) {
      const map: Record<string, number> = {}
      data.forEach((row: Pick<CustomerFinancialSummary, 'customer_id' | 'pending_amount'>) => {
        map[row.customer_id] = row.pending_amount
      })
      setPendingAmounts(map)
    }
  }, [customers.length, businessId])

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPendingAmounts()
    })
  }, [fetchPendingAmounts])

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleAddCustomer(data: CustomerFormData) {
    setSaving(true)
    const payload = {
      ...data,
      other_mobile: data.other_mobile || null,
      email: data.email || null,
      gst_number: data.gst_number || null,
      drug_license_no: data.drug_license_no || null,
    }
    const { success, error } = await addCustomer(payload as Parameters<typeof addCustomer>[0])
    if (success) {
      toast.success('Customer added successfully')
      setAddModalOpen(false)
    } else {
      toast.error(error ?? 'Failed to add customer')
    }
    setSaving(false)
  }

  async function handleUpdateCustomer(data: CustomerFormData) {
    if (!selectedCustomer) return
    setSaving(true)
    const payload = {
      ...data,
      other_mobile: data.other_mobile || null,
      email: data.email || null,
      gst_number: data.gst_number || null,
      drug_license_no: data.drug_license_no || null,
    }
    const { success, error } = await updateCustomer(selectedCustomer.id, payload as Parameters<typeof updateCustomer>[1])
    if (success) {
      toast.success('Customer updated')
      setEditModalOpen(false)
      setSelectedCustomer(null)
    } else {
      toast.error(error ?? 'Failed to update customer')
    }
    setSaving(false)
  }

  async function handleDeleteCustomer() {
    if (!selectedCustomer) return
    setSaving(true)
    const { success, error } = await deleteCustomer(selectedCustomer.id)
    if (success) {
      toast.success('Customer removed')
      setDeleteDialogOpen(false)
      setSelectedCustomer(null)
    } else {
      toast.error(error ?? 'Failed to remove customer')
    }
    setSaving(false)
  }

  function handleEditClick(customer: Customer) {
    setSelectedCustomer(customer)
    setEditModalOpen(true)
  }

  function handleDeleteClick(customer: Customer) {
    setSelectedCustomer(customer)
    setDeleteDialogOpen(true)
  }

  function handleViewClick(customer: Customer) {
    router.push(`/customers/${customer.id}`)
  }

  // ── Result label ─────────────────────────────────────────────────────────────
  const n = filteredCustomers.length
  const noun = n === 1 ? 'customer' : 'customers'
  let resultLabel = `${n} ${noun}`
  if (activeType !== 'ALL') {
    resultLabel += ` — ${CUSTOMER_TYPE_CONFIG[activeType as keyof typeof CUSTOMER_TYPE_CONFIG]?.label ?? activeType}`
  }
  if (activeState) resultLabel += ` in ${activeState}`
  if (activeDistrict) resultLabel += ` (${activeDistrict})`

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Client Intelligence Center
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {businessName} Partner Network
          </p>
        </div>

        <button
          id="add-customer-btn"
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all shrink-0"
          style={{ background: 'var(--teal-500)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-400)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--teal-500)')}
        >
          <UserPlus size={18} />
          Add Customer
        </button>
      </div>

      {/* Type tabs */}
      <div className="mt-6">
        <CustomerTypeTabs
          activeType={activeType}
          onTypeChange={setActiveType}
          counts={counts}
          loading={loading}
        />
      </div>

      {/* Filters + Search */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        {/* State + District dropdowns */}
        <div className="flex items-center gap-3">
          <select
            id="state-filter"
            value={activeState}
            onChange={(e) => {
              setActiveState(e.target.value)
              setActiveDistrict('')
            }}
            style={{
              width: '160px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '14px',
              color: activeState ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            id="district-filter"
            value={activeDistrict}
            onChange={(e) => setActiveDistrict(e.target.value)}
            disabled={activeState === ''}
            style={{
              width: '160px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '14px',
              color: activeDistrict ? 'var(--text-primary)' : 'var(--text-muted)',
              background: activeState === '' ? 'var(--bg-subtle)' : 'var(--bg-card)',
              cursor: activeState === '' ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: activeState === '' ? 0.6 : 1,
            }}
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative" style={{ width: '280px' }}>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="customer-search"
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 14px 10px 38px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              paddingRight: searchQuery ? '36px' : '14px',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Clear search"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mt-2 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {resultLabel}
        </p>
      )}

      {/* Table */}
      <div className="mt-2">
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          pendingAmounts={pendingAmounts}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onView={handleViewClick}
          searchQuery={searchQuery}
        />
      </div>

      {/* Add modal */}
      <AddEditCustomerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddCustomer}
        customer={null}
        loading={saving}
      />

      {/* Edit modal */}
      <AddEditCustomerModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedCustomer(null) }}
        onSave={handleUpdateCustomer}
        customer={selectedCustomer}
        loading={saving}
      />

      {/* Delete dialog */}
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedCustomer(null) }}
        onConfirm={handleDeleteCustomer}
        customerName={selectedCustomer?.business_name ?? ''}
        loading={saving}
      />
    </div>
  )
}
