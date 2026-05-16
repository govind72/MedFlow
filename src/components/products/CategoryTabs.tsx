'use client'

import { CATEGORY_CONFIG } from '@/lib/utils/format'

interface CategoryTabsProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  counts: { all: number; NRX: number; RX: number; SCH_H: number; OTHERS: number }
  loading: boolean
}

const TABS = [
  { key: 'ALL', label: 'All Products', subtitle: null },
  { key: 'NRX', label: CATEGORY_CONFIG.NRX.label, subtitle: CATEGORY_CONFIG.NRX.subtitle },
  { key: 'RX', label: CATEGORY_CONFIG.RX.label, subtitle: CATEGORY_CONFIG.RX.subtitle },
  { key: 'SCH_H', label: CATEGORY_CONFIG.SCH_H.label, subtitle: CATEGORY_CONFIG.SCH_H.subtitle },
  { key: 'OTHERS', label: CATEGORY_CONFIG.OTHERS.label, subtitle: CATEGORY_CONFIG.OTHERS.subtitle },
] as const

function getCount(
  key: string,
  counts: CategoryTabsProps['counts']
): number {
  if (key === 'ALL') return counts.all
  return counts[key as keyof typeof counts] ?? 0
}

function SkeletonCount() {
  return (
    <span
      className="inline-block h-7 w-8 rounded"
      style={{
        background: 'var(--bg-subtle)',
        animation: 'tab-shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  counts,
  loading,
}: CategoryTabsProps) {
  return (
    <>
      <style>{`
        @keyframes tab-shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
      `}</style>

      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => {
          const isActive = activeCategory === tab.key
          const isCategoryTab = tab.key !== 'ALL'
          const cfg = isCategoryTab
            ? CATEGORY_CONFIG[tab.key as keyof typeof CATEGORY_CONFIG]
            : null
          const count = getCount(tab.key, counts)

          // Compute styles
          let bg = 'var(--bg-card)'
          let border = 'var(--border-color)'
          let countColor = 'var(--text-primary)'
          let labelColor = 'var(--text-muted)'
          let subtitleColor = 'var(--text-muted)'

          if (isActive) {
            if (tab.key === 'ALL') {
              bg = 'var(--navy-900)'
              border = 'var(--navy-900)'
              countColor = '#ffffff'
              labelColor = '#ffffff'
            } else if (cfg) {
              bg = cfg.bg
              border = cfg.dot
              countColor = cfg.text
              labelColor = cfg.text
              subtitleColor = cfg.text
            }
          } else if (isCategoryTab && cfg) {
            countColor = cfg.text + 'cc' // 80% opacity via hex alpha
            labelColor = cfg.text + 'cc'
          }

          return (
            <button
              key={tab.key}
              id={`category-tab-${tab.key.toLowerCase()}`}
              onClick={() => onCategoryChange(tab.key)}
              className="shrink-0 flex flex-col items-start rounded-xl transition-all duration-150"
              style={{
                padding: '16px 24px',
                background: bg,
                border: `1.5px solid ${border}`,
                cursor: 'pointer',
                minWidth: '110px',
              }}
            >
              {/* Count */}
              {loading ? (
                <SkeletonCount />
              ) : (
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: countColor }}
                >
                  {count}
                </span>
              )}

              {/* Label */}
              <span
                className="mt-1.5 text-[13px] font-medium"
                style={{ color: labelColor }}
              >
                {tab.label}
              </span>

              {/* Subtitle (category tabs only) */}
              {tab.subtitle && (
                <span
                  className="mt-0.5 text-[11px]"
                  style={{
                    color: subtitleColor,
                    opacity: isActive ? 0.75 : 0.7,
                  }}
                >
                  {tab.subtitle}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
