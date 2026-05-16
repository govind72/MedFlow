'use client'

import { PackageSearch, Pencil, Trash2 } from 'lucide-react'
import type { Product } from '@/lib/types/database'
import type { ProductCategory } from '@/lib/utils/format'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { CategoryBadge } from './CategoryBadge'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  searchQuery?: string
}

const HEADERS = [
  'Category',
  'Product Name',
  'Salt',
  'Manufacturer / Company',
  'Cost (₹)',
  'Selling (₹)',
  'MRP (₹)',
  'Disc %',
  'MOQ',
  'Min Stock',
  'Actions',
]

// Realistic skeleton widths per column
const SKELETON_WIDTHS = [
  '64px', '120px', '80px', '100px', '52px', '52px', '52px', '36px', '36px', '48px', '52px',
]

function SkeletonRow() {
  return (
    <tr>
      {SKELETON_WIDTHS.map((w, i) => (
        <td key={i} className="px-4 py-[14px]">
          <div
            className="rounded"
            style={{
              width: w,
              height: 14,
              background: 'var(--bg-subtle)',
              animation: 'prod-shimmer 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.05}s`,
            }}
          />
          {i === 3 && (
            <div
              className="rounded mt-1.5"
              style={{
                width: '70px',
                height: 11,
                background: 'var(--bg-subtle)',
                animation: 'prod-shimmer 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.05 + 0.1}s`,
              }}
            />
          )}
        </td>
      ))}
    </tr>
  )
}

export function ProductTable({
  products,
  loading,
  onEdit,
  onDelete,
  searchQuery = '',
}: ProductTableProps) {
  const isEmpty = !loading && products.length === 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <style>{`
        @keyframes prod-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
          {/* Header */}
          <thead>
            <tr
              style={{
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold uppercase whitespace-nowrap"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            ) : isEmpty ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <PackageSearch size={48} style={{ color: 'var(--text-muted)' }} />
                    <p
                      className="text-base font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      No products found
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      {searchQuery
                        ? 'Try a different search term or clear the filter'
                        : 'Add your first product using the button above'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product, idx) => (
                <tr
                  key={product.id}
                  className="transition-colors duration-100"
                  style={{
                    borderBottom:
                      idx < products.length - 1
                        ? '1px solid var(--border-color)'
                        : 'none',
                    verticalAlign: 'middle',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Col 1: Category */}
                  <td className="px-4 py-[14px]">
                    <CategoryBadge category={product.category as ProductCategory} />
                  </td>

                  {/* Col 2: Product Name */}
                  <td
                    className="px-4 py-[14px] font-medium whitespace-nowrap"
                    style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                  >
                    {product.product_name}
                  </td>

                  {/* Col 3: Salt */}
                  <td
                    className="px-4 py-[14px]"
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}
                  >
                    {product.salt ?? '—'}
                  </td>

                  {/* Col 4: Manufacturer / Company */}
                  <td className="px-4 py-[14px]">
                    <p
                      className="font-medium"
                      style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                    >
                      {product.manufacturer ?? '—'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {product.company ?? ''}
                    </p>
                  </td>

                  {/* Col 5: Cost */}
                  <td
                    className="px-4 py-[14px] whitespace-nowrap"
                    style={{ fontSize: '14px', color: 'var(--text-secondary)' }}
                  >
                    {formatCurrency(product.cost_price)}
                  </td>

                  {/* Col 6: Selling */}
                  <td
                    className="px-4 py-[14px] font-medium whitespace-nowrap"
                    style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                  >
                    {formatCurrency(product.selling_price)}
                  </td>

                  {/* Col 7: MRP */}
                  <td
                    className="px-4 py-[14px] whitespace-nowrap"
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatCurrency(product.mrp)}
                  </td>

                  {/* Col 8: Discount % */}
                  <td className="px-4 py-[14px]">
                    {product.discount_pct > 0 ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: 'var(--success-bg)',
                          color: 'var(--success-text)',
                        }}
                      >
                        {product.discount_pct}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>—</span>
                    )}
                  </td>

                  {/* Col 9: MOQ */}
                  <td className="px-4 py-[14px]">
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {formatNumber(product.moq)}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginLeft: '3px',
                      }}
                    >
                      units
                    </span>
                  </td>

                  {/* Col 10: Min Stock */}
                  <td
                    className="px-4 py-[14px]"
                    style={{ fontSize: '14px', color: 'var(--text-secondary)' }}
                  >
                    {formatNumber(product.min_stock)}
                  </td>

                  {/* Col 11: Actions */}
                  <td className="px-4 py-[14px]">
                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-product-${product.id}`}
                        onClick={() => onEdit(product)}
                        className="flex items-center justify-center rounded-lg transition-all duration-100"
                        style={{ padding: '8px', color: 'var(--text-muted)' }}
                        title="Edit product"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--teal-50)'
                          e.currentTarget.style.color = 'var(--teal-500)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        id={`delete-product-${product.id}`}
                        onClick={() => onDelete(product)}
                        className="flex items-center justify-center rounded-lg transition-all duration-100"
                        style={{ padding: '8px', color: 'var(--text-muted)' }}
                        title="Delete product"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--danger-bg)'
                          e.currentTarget.style.color = 'var(--danger)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
