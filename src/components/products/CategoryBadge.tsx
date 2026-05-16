import { CATEGORY_CONFIG, type ProductCategory } from '@/lib/utils/format'

interface CategoryBadgeProps {
  category: ProductCategory
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const cfg = CATEGORY_CONFIG[category]

  return (
    <span
      className="inline-flex items-center gap-[5px] font-medium whitespace-nowrap"
      style={{
        background: cfg.bg,
        color: cfg.text,
        fontSize: '12px',
        padding: '3px 10px',
        borderRadius: '9999px',
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 5, height: 5, background: cfg.dot, display: 'inline-block' }}
      />
      {cfg.label}
    </span>
  )
}
