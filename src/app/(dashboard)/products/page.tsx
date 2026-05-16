'use client'

import { useState } from 'react'
import { Plus, Search, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useProducts } from '@/hooks/useProducts'
import { CATEGORY_CONFIG } from '@/lib/utils/format'
import type { Product } from '@/lib/types/database'
import type { ProductFormData } from '@/components/products/AddEditProductModal'
import { CategoryTabs } from '@/components/products/CategoryTabs'
import { ProductTable } from '@/components/products/ProductTable'
import { AddEditProductModal } from '@/components/products/AddEditProductModal'
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog'

export default function ProductsPage() {
  // UI state
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Data hook
  const {
    filteredProducts,
    counts,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProducts(activeCategory, searchQuery)

  // ── Handlers ──────────────────────────────────────────────────────────

  async function handleAddProduct(data: ProductFormData) {
    setSaving(true)
    const { success, error } = await addProduct(data)
    if (success) {
      toast.success('Product added successfully')
      setAddModalOpen(false)
    } else {
      toast.error(error ?? 'Failed to add product')
    }
    setSaving(false)
  }

  async function handleUpdateProduct(data: ProductFormData) {
    if (!selectedProduct) return
    setSaving(true)
    const { success, error } = await updateProduct(selectedProduct.id, data)
    if (success) {
      toast.success('Product updated')
      setEditModalOpen(false)
      setSelectedProduct(null)
    } else {
      toast.error(error ?? 'Failed to update product')
    }
    setSaving(false)
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return
    setSaving(true)
    const { success, error } = await deleteProduct(selectedProduct.id)
    if (success) {
      toast.success('Product removed from catalog')
      setDeleteDialogOpen(false)
      setSelectedProduct(null)
    } else {
      toast.error(error ?? 'Failed to delete product')
    }
    setSaving(false)
  }

  function handleEditClick(product: Product) {
    setSelectedProduct(product)
    setEditModalOpen(true)
  }

  function handleDeleteClick(product: Product) {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  // ── Derived label ──────────────────────────────────────────────────────
  const resultLabel = (() => {
    const n = filteredProducts.length
    const noun = n === 1 ? 'product' : 'products'
    if (activeCategory !== 'ALL') {
      const catLabel =
        CATEGORY_CONFIG[activeCategory as keyof typeof CATEGORY_CONFIG]?.label
      return `${n} ${noun} in ${catLabel}`
    }
    return `${n} ${noun}`
  })()

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Product Catalog
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Manage medicines and pricing across all categories
          </p>
        </div>

        <button
          id="add-product-btn"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all shrink-0"
          style={{ background: 'var(--teal-500)', color: '#ffffff' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-400)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--teal-500)')}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* ── Category tabs ──────────────────────────────────────── */}
      <div className="mt-6">
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          counts={counts}
          loading={loading}
        />
      </div>

      {/* ── Search + results info ──────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative" style={{ width: '320px' }}>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="product-search"
            type="text"
            placeholder="Search by name, salt, brand..."
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
              style={{ color: 'var(--text-muted)' }}
              aria-label="Clear search"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {resultLabel}
          </p>
        )}
      </div>

      {/* ── Product table ──────────────────────────────────────── */}
      <div className="mt-4">
        <ProductTable
          products={filteredProducts}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          searchQuery={searchQuery}
        />
      </div>

      {/* ── Add modal ─────────────────────────────────────────── */}
      <AddEditProductModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddProduct}
        product={null}
        loading={saving}
      />

      {/* ── Edit modal ─────────────────────────────────────────── */}
      <AddEditProductModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedProduct(null)
        }}
        onSave={handleUpdateProduct}
        product={selectedProduct}
        loading={saving}
      />

      {/* ── Delete dialog ─────────────────────────────────────── */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setSelectedProduct(null)
        }}
        onConfirm={handleDeleteProduct}
        productName={selectedProduct?.product_name ?? ''}
        loading={saving}
      />
    </div>
  )
}
