'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessContext } from '@/contexts/BusinessContext'
import type { Customer } from '@/lib/types/database'
import type { CustomerType } from '@/lib/utils/format'

type CustomerInput = Omit<Customer, 'id' | 'business_id' | 'created_at' | 'updated_at'>

interface OperationResult {
  success: boolean
  error?: string
}

export function useCustomers(
  activeType: string,
  searchQuery: string,
  activeState: string,
  activeDistrict: string
) {
  const { businessId } = useBusinessContext()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'Active')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCustomers((data ?? []) as Customer[])
    }
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchCustomers()
    })
  }, [fetchCustomers])

  const addCustomer = useCallback(
    async (data: CustomerInput): Promise<OperationResult> => {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('customers')
        .insert({ ...data, business_id: businessId })
        .select()
        .single()
      if (insertError) return { success: false, error: insertError.message }
      await fetchCustomers()
      return { success: true }
    },
    [businessId, fetchCustomers]
  )

  const updateCustomer = useCallback(
    async (id: string, data: Partial<CustomerInput>): Promise<OperationResult> => {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
      if (updateError) return { success: false, error: updateError.message }
      await fetchCustomers()
      return { success: true }
    },
    [fetchCustomers]
  )

  const deleteCustomer = useCallback(
    async (id: string): Promise<OperationResult> => {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('customers')
        .update({ status: 'Inactive' })
        .eq('id', id)
      if (deleteError) return { success: false, error: deleteError.message }
      await fetchCustomers()
      return { success: true }
    },
    [fetchCustomers]
  )

  // ── Computed ────────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      all: customers.length,
      Pharmacy: customers.filter((c) => c.customer_type === 'Pharmacy').length,
      Hospital: customers.filter((c) => c.customer_type === 'Hospital').length,
      Clinic: customers.filter((c) => c.customer_type === 'Clinic').length,
      Rehab: customers.filter((c) => c.customer_type === 'Rehab').length,
      Wholesaler: customers.filter((c) => c.customer_type === 'Wholesaler').length,
      'De-Addiction': customers.filter((c) => c.customer_type === 'De-Addiction').length,
    }
  }, [customers])

  const states = useMemo(() => {
    const raw = customers.map((c) => c.state).filter((s): s is string => !!s)
    return [...new Set(raw)].sort()
  }, [customers])

  const districts = useMemo(() => {
    const source = activeState
      ? customers.filter((c) => c.state === activeState)
      : customers
    const raw = source.map((c) => c.district).filter((d): d is string => !!d)
    return [...new Set(raw)].sort()
  }, [customers, activeState])

  const filteredCustomers = useMemo(() => {
    let result = customers

    if (activeType !== 'ALL') {
      result = result.filter((c) => c.customer_type === (activeType as CustomerType))
    }
    if (activeState !== '') {
      result = result.filter((c) => c.state === activeState)
    }
    if (activeDistrict !== '') {
      result = result.filter((c) => c.district === activeDistrict)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q.length > 0) {
      result = result.filter(
        (c) =>
          c.business_name.toLowerCase().includes(q) ||
          (c.contact_person?.toLowerCase().includes(q) ?? false) ||
          c.mobile.includes(q) ||
          (c.city?.toLowerCase().includes(q) ?? false)
      )
    }

    return result
  }, [customers, activeType, activeState, activeDistrict, searchQuery])

  return {
    customers,
    filteredCustomers,
    counts,
    states,
    districts,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
