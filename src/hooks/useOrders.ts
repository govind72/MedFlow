'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessContext } from '@/contexts/BusinessContext'
import type { OrderManagement, OrdersSummaryCounts } from '@/lib/types/database'

// ── Types for create/update/payment inputs ────────────────────────────────────
export interface CreateOrderInput {
  business_id: string
  customer_id: string
  bill_number?: string | null
  order_date: string
  logistics_company_id?: string | null
  courier_details?: string | null
  total_amount: number
  order_form_received: boolean
  signed_bill_received: boolean
  created_by: string
}

export interface UpdateOrderInput {
  bill_number?: string | null
  order_date?: string
  logistics_company_id?: string | null
  courier_details?: string | null
  total_amount?: number
  order_form_received?: boolean
  signed_bill_received?: boolean
  delivered?: boolean
}

export interface RecordPaymentInput {
  order_id: string
  business_id: string
  customer_id: string
  payment_type: 'Full' | 'Partial'
  amount: number
  recorded_by: string
}

type OrderFlag = 'order_form_received' | 'signed_bill_received' | 'delivered'

interface OperationResult {
  success: boolean
  error?: string
  orderId?: string
}

export function useOrders(activeTab: 'Pending' | 'Completed', searchQuery: string) {
  const { businessId } = useBusinessContext()
  const [orders, setOrders] = useState<OrderManagement[]>([])
  const [counts, setCounts] = useState<OrdersSummaryCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const [ordersRes, countsRes] = await Promise.all([
      supabase
        .from('v_order_management')
        .select('*')
        .eq('business_id', businessId)
        .order('order_date', { ascending: false }),
      supabase
        .from('v_orders_summary_counts')
        .select('*')
        .eq('business_id', businessId)
        .single(),
    ])
    if (ordersRes.error) {
      setError(ordersRes.error.message)
    } else {
      setOrders((ordersRes.data ?? []) as OrderManagement[])
    }
    if (!countsRes.error && countsRes.data) {
      setCounts(countsRes.data as OrdersSummaryCounts)
    }
    setLoading(false)
  }, [businessId])

  const fetchCounts = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('v_orders_summary_counts')
      .select('*')
      .eq('business_id', businessId)
      .single()
    if (data) setCounts(data as OrdersSummaryCounts)
  }, [businessId])

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchOrders()
    })
    const supabase = createClient()
    const channel = supabase
      .channel('orders-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        () => {
          Promise.resolve().then(() => {
            fetchOrders()
          })
        }
      )
      .subscribe()
    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders, businessId])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const createOrder = useCallback(async (data: CreateOrderInput): Promise<OperationResult> => {
    const supabase = createClient()
    const { data: created, error: err } = await supabase
      .from('orders')
      .insert({
        business_id: data.business_id,
        customer_id: data.customer_id,
        bill_number: data.bill_number || null,
        order_date: data.order_date,
        logistics_company_id: data.logistics_company_id || null,
        courier_details: data.courier_details || null,
        total_amount: data.total_amount,
        order_form_received: data.order_form_received,
        signed_bill_received: data.signed_bill_received,
        bill_cleared: false,
        delivered: false,
        payment_status: 'Unpaid',
        order_status: 'Pending',
        created_by: data.created_by,
      })
      .select()
      .single()
    if (err) return { success: false, error: err.message }
    await fetchOrders()
    return { success: true, orderId: (created as { id: string }).id }
  }, [fetchOrders])

  const updateOrder = useCallback(async (id: string, data: UpdateOrderInput): Promise<OperationResult> => {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('orders')
      .update({
        ...(data.bill_number !== undefined && { bill_number: data.bill_number }),
        ...(data.order_date !== undefined && { order_date: data.order_date }),
        ...(data.logistics_company_id !== undefined && { logistics_company_id: data.logistics_company_id || null }),
        ...(data.courier_details !== undefined && { courier_details: data.courier_details || null }),
        ...(data.total_amount !== undefined && { total_amount: data.total_amount }),
        ...(data.order_form_received !== undefined && { order_form_received: data.order_form_received }),
        ...(data.signed_bill_received !== undefined && { signed_bill_received: data.signed_bill_received }),
        ...(data.delivered !== undefined && { delivered: data.delivered }),
      })
      .eq('id', id)
    if (err) return { success: false, error: err.message }
    await fetchOrders()
    return { success: true }
  }, [fetchOrders])

  const updateOrderFlag = useCallback(async (
    id: string,
    flag: OrderFlag,
    value: boolean
  ): Promise<OperationResult> => {
    // Optimistic update
    setOrders(prev =>
      prev.map(o => o.order_id === id ? { ...o, [flag]: value } : o)
    )
    const supabase = createClient()
    const { error: err } = await supabase
      .from('orders')
      .update({ [flag]: value })
      .eq('id', id)
    if (err) {
      // Revert
      setOrders(prev =>
        prev.map(o => o.order_id === id ? { ...o, [flag]: !value } : o)
      )
      return { success: false, error: err.message }
    }
    // Refetch to get computed is_completable
    const supabase2 = createClient()
    const { data: fresh } = await supabase2
      .from('v_order_management')
      .select('*')
      .eq('order_id', id)
      .single()
    if (fresh) {
      setOrders(prev => prev.map(o => o.order_id === id ? fresh as OrderManagement : o))
    }
    await fetchCounts()
    return { success: true }
  }, [fetchCounts])

  const completeOrder = useCallback(async (id: string): Promise<OperationResult> => {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('orders')
      .update({
        order_status: 'Completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (err) return { success: false, error: err.message }
    await fetchOrders()
    return { success: true }
  }, [fetchOrders])

  const deleteOrder = useCallback(async (id: string): Promise<OperationResult> => {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    if (err) return { success: false, error: err.message }
    setOrders(prev => prev.filter(o => o.order_id !== id))
    await fetchCounts()
    return { success: true }
  }, [fetchCounts])

  const recordPayment = useCallback(async (data: RecordPaymentInput): Promise<OperationResult> => {
    const supabase = createClient()

    // Insert the payment record
    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: data.order_id,
        business_id: data.business_id,
        customer_id: data.customer_id,
        payment_type: data.payment_type,
        amount: data.amount,
        payment_date: new Date().toISOString().split('T')[0],
        recorded_by: data.recorded_by,
      })
      .select()
      .single()
    if (payErr) return { success: false, error: payErr.message }

    // Sum all payments for this order to compute the true amount_received
    const { data: sumData } = await supabase
      .from('payments')
      .select('amount')
      .eq('order_id', data.order_id)
    const totalReceived = (sumData ?? []).reduce((acc, p) => acc + (p.amount as number), 0)

    // Get the order's total_amount so we know if it's fully paid
    const { data: orderRow } = await supabase
      .from('orders')
      .select('total_amount, amount_received')
      .eq('id', data.order_id)
      .single()

    if (orderRow) {
      const total = (orderRow as { total_amount: number; amount_received: number }).total_amount
      const newPaymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' =
        totalReceived >= total ? 'Paid' : totalReceived > 0 ? 'Partially Paid' : 'Unpaid'

      // The DB trigger may not be setting bill_cleared — do it explicitly here
      const patch: Record<string, unknown> = {
        amount_received: totalReceived,
        payment_status: newPaymentStatus,
      }
      if (totalReceived >= total) {
        patch.bill_cleared = true
      }

      await supabase.from('orders').update(patch).eq('id', data.order_id)
    }

    // Now refetch the view to get the updated is_completable and all computed fields
    const { data: fresh } = await supabase
      .from('v_order_management')
      .select('*')
      .eq('order_id', data.order_id)
      .single()

    if (fresh) {
      setOrders(prev =>
        prev.map(o => o.order_id === data.order_id ? fresh as OrderManagement : o)
      )
    }
    await fetchCounts()
    return { success: true }
  }, [fetchCounts])

  // ── Computed ──────────────────────────────────────────────────────────────
  const pendingOrders = useMemo(() => orders.filter(o => o.order_status === 'Pending'), [orders])
  const completedOrders = useMemo(() => orders.filter(o => o.order_status === 'Completed'), [orders])

  const filteredOrders = useMemo(() => {
    const source = activeTab === 'Pending' ? pendingOrders : completedOrders
    const q = searchQuery.trim().toLowerCase()
    if (!q) return source
    return source.filter(o =>
      o.bill_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_city?.toLowerCase().includes(q)
    )
  }, [activeTab, pendingOrders, completedOrders, searchQuery])

  return {
    orders,
    filteredOrders,
    pendingOrders,
    completedOrders,
    counts,
    loading,
    error,
    fetchOrders,
    fetchCounts,
    createOrder,
    updateOrder,
    updateOrderFlag,
    completeOrder,
    deleteOrder,
    recordPayment,
  }
}
