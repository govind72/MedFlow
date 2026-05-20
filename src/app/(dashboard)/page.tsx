'use client'

import { useEffect, useCallback, useState } from 'react'
import {
  IndianRupee,
  Package,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type {
  DashboardSummary,
  PendingOrderDashboard,
} from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/format'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { PendingOrdersTable } from '@/components/dashboard/PendingOrdersTable'
import { RecentPaymentsSection } from '@/components/dashboard/RecentPaymentsSection'
import { useBusinessContext } from '@/contexts/BusinessContext'

export default function DashboardPage() {
  const { businessId } = useBusinessContext()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [pendingOrders, setPendingOrders] = useState<PendingOrderDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const [summaryRes, ordersRes] = await Promise.all([
      supabase.from('v_dashboard_summary').select('*').eq('business_id', businessId).maybeSingle(),
      supabase
        .from('v_pending_orders_dashboard')
        .select('*')
        .eq('business_id', businessId)
        .order('order_date', { ascending: false }),
    ])

    if (summaryRes.error) {
      const msg = summaryRes.error.message
      setError(msg)
      toast.error('Failed to load dashboard data')
      setLoading(false)
      return
    }

    // maybeSingle() returns null when no rows exist (e.g. business has no orders yet)
    // Treat that as all-zero values — not an error condition
    const emptySummary: DashboardSummary = {
      business_id: '',
      total_outstanding: 0,
      pending_orders_count: 0,
      completed_orders_count: 0,
      collected_revenue: 0,
      total_revenue: 0,
    }

    if (ordersRes.error) {
      const msg = ordersRes.error.message
      setError(msg)
      toast.error('Failed to load pending orders')
      setLoading(false)
      return
    }

    setSummary((summaryRes.data as DashboardSummary | null) ?? emptySummary)
    setPendingOrders((ordersRes.data ?? []) as PendingOrderDashboard[])
    setLoading(false)
  }, [businessId])

  // Initial fetch + realtime subscription
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboardData()
    })

    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        () => {
          Promise.resolve().then(() => {
            fetchDashboardData()
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDashboardData, businessId])

  // ── KPI card data ──────────────────────────────────────────────────────
  const kpiCards = [
    {
      title: 'Total Outstanding',
      value: summary ? formatCurrency(summary.total_outstanding) : '—',
      subtitle: 'Total pending from all parties',
      icon: (
        <IndianRupee
          size={20}
          style={{ color: 'var(--danger)' }}
        />
      ),
      iconBg: 'var(--danger-bg)',
      variant: 'default' as const,
    },
    {
      title: 'Pending Orders',
      value: summary ? summary.pending_orders_count : '—',
      subtitle: 'Orders in process',
      icon: (
        <Package
          size={20}
          style={{ color: 'var(--warning)' }}
        />
      ),
      iconBg: 'var(--warning-bg)',
      variant: 'default' as const,
    },
    {
      title: 'Completed Orders',
      value: summary ? summary.completed_orders_count : '—',
      subtitle: 'Successfully delivered',
      icon: (
        <CheckCircle
          size={20}
          style={{ color: 'var(--success)' }}
        />
      ),
      iconBg: 'var(--success-bg)',
      variant: 'default' as const,
    },
    {
      title: 'Collected Revenue',
      value: summary ? formatCurrency(summary.collected_revenue) : '—',
      subtitle: 'Total revenue received',
      icon: (
        <TrendingUp
          size={20}
          style={{ color: '#ffffff' }}
        />
      ),
      iconBg: 'rgba(255,255,255,0.20)',
      variant: 'highlight' as const,
    },
  ]

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>


      {/* ── Page title ─────────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Dashboard
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Next-gen wholesale medicine logistics &amp; intelligence
        </p>
      </div>

      {/* ── Error alert ────────────────────────────────────────── */}
      {error && (
        <div
          className="mt-5 flex items-start gap-3 rounded-xl p-4"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
          }}
        >
          <AlertCircle
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: 'var(--danger)' }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--danger-text)' }}
            >
              Failed to load dashboard data
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--danger-text)', opacity: 0.8 }}
            >
              {error}
            </p>
          </div>
          <button
            id="dashboard-retry-button"
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: 'var(--danger)',
              color: '#ffffff',
            }}
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ── KPI cards grid ─────────────────────────────────────── */}
      <div
        className="mt-6 grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        {kpiCards.map((card) => (
          <KpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={
              /* Wrap icon in a bg container for default variant */
              card.variant === 'default' ? (
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ background: card.iconBg }}
                >
                  {card.icon}
                </span>
              ) : (
                card.icon
              )
            }
            variant={card.variant}
            loading={loading}
          />
        ))}
      </div>

      {/* ── Live Pending Orders section ───────────────────────── */}
      <div className="mt-8">
        {/* Section header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Live Pending Orders
            </h2>
            <p
              className="mt-0.5 text-[13px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Real-time status of documentation and logistics for active orders
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 pt-1 shrink-0">
            <span
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: 'var(--success)',
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <span
              className="text-[13px] font-medium"
              style={{ color: 'var(--success)' }}
            >
              Live
            </span>
          </div>
        </div>

        <PendingOrdersTable orders={pendingOrders} loading={loading} />
      </div>

      {/* ── Recent Payments section ───────────────────────── */}
      <RecentPaymentsSection />
    </>
  )
}
