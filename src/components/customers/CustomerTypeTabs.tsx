'use client'

import {
  Pill, Building2, Stethoscope, Heart, Warehouse, Shield,
} from 'lucide-react'
import { CUSTOMER_TYPE_CONFIG, type CustomerType } from '@/lib/utils/format'

const TYPE_ICONS = {
  Pharmacy: Pill,
  Hospital: Building2,
  Clinic: Stethoscope,
  Rehab: Heart,
  Wholesaler: Warehouse,
  'De-Addiction': Shield,
} as const

const ALL_TYPES = Object.keys(CUSTOMER_TYPE_CONFIG) as CustomerType[]

interface CustomerTypeTabsProps {
  activeType: string
  onTypeChange: (type: string) => void
  counts: Record<string, number>
  loading: boolean
}

function SkeletonTab() {
  return (
    <div
      className="rounded-xl shrink-0"
      style={{
        width: 90,
        height: 68,
        background: 'var(--bg-subtle)',
        animation: 'ctab-shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function CustomerTypeTabs({
  activeType,
  onTypeChange,
  counts,
  loading,
}: CustomerTypeTabsProps) {
  return (
    <div>
      <style>{`
        @keyframes ctab-shimmer {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9;  }
        }
      `}</style>

      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading ? (
          <>
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonTab key={i} />
            ))}
          </>
        ) : (
          <>
            {/* ALL tab */}
            <button
              type="button"
              onClick={() => onTypeChange('ALL')}
              className="flex flex-col items-center rounded-xl transition-all duration-150 shrink-0"
              style={{
                padding: '14px 20px',
                minWidth: 'fit-content',
                border: `1.5px solid ${activeType === 'ALL' ? 'var(--navy-900)' : 'var(--border)'}`,
                background: activeType === 'ALL' ? 'var(--navy-900)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: activeType === 'ALL' ? '#ffffff' : 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {counts.all ?? 0}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: activeType === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                All
              </span>
            </button>

            {/* Type tabs */}
            {ALL_TYPES.map((type) => {
              const cfg = CUSTOMER_TYPE_CONFIG[type]
              const Icon = TYPE_ICONS[type]
              const isActive = activeType === type
              const count = counts[type] ?? 0

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onTypeChange(type)}
                  className="flex flex-col rounded-xl transition-all duration-150 shrink-0"
                  style={{
                    padding: '14px 20px',
                    minWidth: 'fit-content',
                    border: `1.5px solid ${isActive ? cfg.dot : 'var(--border)'}`,
                    background: isActive ? cfg.bg : 'var(--bg-card)',
                    cursor: 'pointer',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      color: isActive ? cfg.text : cfg.text + 'cc',
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </span>
                  <span
                    className="flex items-center gap-1 mt-1"
                    style={{
                      fontSize: '12px',
                      color: isActive ? cfg.text : cfg.text + 'cc',
                    }}
                  >
                    <Icon size={14} />
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
