'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessContext } from '@/contexts/BusinessContext'
import type { Product } from '@/lib/types/database'
import type { ProductCategory } from '@/lib/utils/format'

type ProductInput = Omit<
  Product,
  'id' | 'business_id' | 'is_active' | 'created_at' | 'updated_at'
>

interface OperationResult {
  success: boolean
  error?: string
}

export function useProducts(activeCategory: string, searchQuery: string) {
  const { businessId } = useBusinessContext()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setProducts((data ?? []) as Product[])
    }
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addProduct = useCallback(
    async (data: ProductInput): Promise<OperationResult> => {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('products')
        .insert({ ...data, business_id: businessId })
        .select()
        .single()

      if (insertError) return { success: false, error: insertError.message }
      await fetchProducts()
      return { success: true }
    },
    [businessId, fetchProducts]
  )

  const updateProduct = useCallback(
    async (id: string, data: Partial<ProductInput>): Promise<OperationResult> => {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)

      if (updateError) return { success: false, error: updateError.message }
      await fetchProducts()
      return { success: true }
    },
    [fetchProducts]
  )

  const deleteProduct = useCallback(
    async (id: string): Promise<OperationResult> => {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

      if (deleteError) return { success: false, error: deleteError.message }
      await fetchProducts()
      return { success: true }
    },
    [fetchProducts]
  )

  // ── Computed values ────────────────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      all: products.length,
      NRX: products.filter((p) => p.category === 'NRX').length,
      RX: products.filter((p) => p.category === 'RX').length,
      SCH_H: products.filter((p) => p.category === 'SCH_H').length,
      OTHERS: products.filter((p) => p.category === 'OTHERS').length,
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = products

    // Category filter
    if (activeCategory !== 'ALL') {
      result = result.filter((p) => p.category === activeCategory)
    }

    // Search filter (client-side, instant)
    const q = searchQuery.trim().toLowerCase()
    if (q.length > 0) {
      result = result.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          (p.salt?.toLowerCase().includes(q) ?? false) ||
          (p.manufacturer?.toLowerCase().includes(q) ?? false) ||
          (p.company?.toLowerCase().includes(q) ?? false)
      )
    }

    return result
  }, [products, activeCategory, searchQuery])

  return {
    products,
    filteredProducts,
    counts,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  } as {
    products: Product[]
    filteredProducts: Product[]
    counts: { all: number; NRX: number; RX: number; SCH_H: number; OTHERS: number }
    loading: boolean
    error: string | null
    fetchProducts: () => Promise<void>
    addProduct: (data: ProductInput) => Promise<OperationResult>
    updateProduct: (id: string, data: Partial<ProductInput>) => Promise<OperationResult>
    deleteProduct: (id: string) => Promise<OperationResult>
  }
}

export type { ProductCategory }
