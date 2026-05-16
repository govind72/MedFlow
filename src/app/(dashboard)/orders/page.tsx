'use client'

import { useState } from 'react'
import { ShoppingCart, CheckCircle2, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrders } from '@/hooks/useOrders'
import { useBusinessContext } from '@/contexts/BusinessContext'
import type { OrderManagement } from '@/lib/types/database'
import type { CreateOrderFormData } from '@/components/orders/CreateOrderModal'
import type { EditOrderFormData } from '@/components/orders/EditOrderModal'
import { OrderStatCards } from '@/components/orders/OrderStatCards'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { CreateOrderModal } from '@/components/orders/CreateOrderModal'
import { EditOrderModal } from '@/components/orders/EditOrderModal'
import { BillSettlementModal } from '@/components/orders/BillSettlementModal'
import { DeleteOrderDialog } from '@/components/orders/DeleteOrderDialog'

export default function OrdersPage() {
  const { businessId, userId, businessName } = useBusinessContext()

  // Tabs & search
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [settlementModalOpen, setSettlementModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null)
  const [saving, setSaving] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const {
    filteredOrders,
    pendingOrders,
    completedOrders,
    counts,
    loading,
    fetchOrders,
    createOrder,
    updateOrder,
    updateOrderFlag,
    completeOrder,
    deleteOrder,
    recordPayment,
  } = useOrders(activeTab, searchQuery)

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleCreateOrder(data: CreateOrderFormData) {
    setSaving(true)
    const { success, error } = await createOrder({
      ...data,
      bill_number: data.bill_number || null,
      logistics_company_id: data.logistics_company_id || null,
      courier_details: data.courier_details || null,
      business_id: businessId,
      created_by: userId,
    })
    if (success) {
      toast.success('Order created successfully')
      setCreateModalOpen(false)
    } else {
      toast.error(error ?? 'Failed to create order')
    }
    setSaving(false)
  }

  async function handleUpdateOrder(data: EditOrderFormData) {
    if (!selectedOrder) return
    setSaving(true)
    const { success, error } = await updateOrder(selectedOrder.order_id, {
      ...data,
      bill_number: data.bill_number || null,
      logistics_company_id: data.logistics_company_id || null,
      courier_details: data.courier_details || null,
    })
    if (success) {
      toast.success('Order updated')
      setEditModalOpen(false)
      setSelectedOrder(null)
    } else {
      toast.error(error ?? 'Failed to update order')
    }
    setSaving(false)
  }

  async function handleToggleFlag(orderId: string, flag: string, value: boolean) {
    setUpdatingOrderId(orderId)
    const { error } = await updateOrderFlag(
      orderId,
      flag as 'order_form_received' | 'signed_bill_received' | 'delivered',
      value
    )
    if (error) {
      toast.error(`Failed to update ${flag.replace(/_/g, ' ')}`)
    }
    setUpdatingOrderId(null)
  }

  async function handleRecordPayment(type: 'Full' | 'Partial', amount: number) {
    if (!selectedOrder) return
    setSaving(true)
    const paymentAmount = type === 'Full'
      ? selectedOrder.total_amount - selectedOrder.amount_received
      : amount
    const { success, error } = await recordPayment({
      order_id: selectedOrder.order_id,
      business_id: businessId,
      customer_id: selectedOrder.customer_id,
      payment_type: type,
      amount: paymentAmount,
      recorded_by: userId,
    })
    if (success) {
      toast.success(type === 'Full' ? '✅ Full payment recorded!' : '💰 Partial payment recorded')
    } else {
      toast.error(error ?? 'Failed to record payment')
    }
    setSaving(false)
  }

  function handlePaymentDone() {
    setSettlementModalOpen(false)
    setSelectedOrder(null)
    fetchOrders()
  }

  async function handleCompleteOrder(order: OrderManagement) {
    if (!order.is_completable) return
    setUpdatingOrderId(order.order_id)
    const { success, error } = await completeOrder(order.order_id)
    if (success) {
      toast.success('🎉 Order completed successfully!')
      fetchOrders()
    } else {
      toast.error(error ?? 'Failed to complete order')
    }
    setUpdatingOrderId(null)
  }

  async function handleDeleteOrder() {
    if (!selectedOrder) return
    setSaving(true)
    const { success, error } = await deleteOrder(selectedOrder.order_id)
    if (success) {
      toast.success('Order deleted')
      setDeleteDialogOpen(false)
      setSelectedOrder(null)
    } else {
      toast.error(error ?? 'Failed to delete order')
    }
    setSaving(false)
  }

  const pendingCount = counts?.total_pending ?? pendingOrders.length
  const completedCount = completedOrders.length
  const noun = filteredOrders.length === 1 ? 'order' : 'orders'

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Order Management</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{businessName} Wholesale Operations</p>
        </div>
        <button
          id="new-order-btn"
          type="button"
          onClick={() => setCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--teal-500)', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-400)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--teal-500)'}>
          <ShoppingCart size={18} />
          New Order
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ marginTop: '24px' }}>
        <OrderStatCards counts={counts} loading={loading} />
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        {/* Pending tab */}
        <button
          id="tab-pending"
          type="button"
          onClick={() => setActiveTab('Pending')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', border: `1.5px solid ${activeTab === 'Pending' ? 'var(--danger)' : 'var(--border-color)'}`, background: activeTab === 'Pending' ? 'var(--danger)' : 'var(--bg-card)', color: activeTab === 'Pending' ? '#ffffff' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms' }}>
          <ShoppingCart size={16} />
          Pending Orders ({pendingCount})
        </button>

        {/* Completed tab */}
        <button
          id="tab-completed"
          type="button"
          onClick={() => setActiveTab('Completed')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', border: `1.5px solid ${activeTab === 'Completed' ? 'var(--success)' : 'var(--border-color)'}`, background: activeTab === 'Completed' ? 'var(--success)' : 'var(--bg-card)', color: activeTab === 'Completed' ? '#ffffff' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms' }}>
          <CheckCircle2 size={16} />
          Completed Orders ({completedCount})
        </button>
      </div>

      {/* Search + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            id="order-search"
            type="text"
            placeholder="Search by order ID, customer or bill..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px 10px 38px', fontSize: '14px', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box', paddingRight: searchQuery ? '36px' : '14px' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--teal-500)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <XCircle size={16} />
            </button>
          )}
        </div>
        {!loading && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', flexShrink: 0 }}>
            {filteredOrders.length} {noun}
          </p>
        )}
      </div>

      {/* Table */}
      <div style={{ marginTop: '16px' }}>
        <OrdersTable
          orders={filteredOrders}
          loading={loading}
          activeTab={activeTab}
          onEdit={order => { setSelectedOrder(order); setEditModalOpen(true) }}
          onDelete={order => { setSelectedOrder(order); setDeleteDialogOpen(true) }}
          onSettlePayment={order => { setSelectedOrder(order); setSettlementModalOpen(true) }}
          onToggleFlag={handleToggleFlag}
          onCompleteOrder={handleCompleteOrder}
          updatingOrderId={updatingOrderId}
        />
      </div>

      {/* Modals */}
      <CreateOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateOrder}
        loading={saving}
      />
      <EditOrderModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedOrder(null) }}
        onSave={handleUpdateOrder}
        order={selectedOrder}
        loading={saving}
      />
      <BillSettlementModal
        open={settlementModalOpen}
        onClose={() => { setSettlementModalOpen(false); setSelectedOrder(null) }}
        order={selectedOrder}
        onPaymentDone={handlePaymentDone}
        loading={saving}
        onConfirm={handleRecordPayment}
      />
      <DeleteOrderDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedOrder(null) }}
        onConfirm={handleDeleteOrder}
        order={selectedOrder}
        loading={saving}
      />
    </div>
  )
}
