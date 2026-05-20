'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Calendar, CalendarRange } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ReportsDaily, CustomerFinancialSummary } from '@/lib/types/database'
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { OrderVolumeChart } from '@/components/reports/OrderVolumeChart'
import { PaymentStatusChart } from '@/components/reports/PaymentStatusChart'
import { TopCustomersTable } from '@/components/reports/TopCustomersTable'
import { formatCurrency } from '@/lib/utils/format'
import { useBusinessContext } from '@/contexts/BusinessContext'

type TimeFilter = 'daily' | 'monthly' | 'custom'

interface TopCustomer {
  customer_id: string
  customer_name: string
  city: string | null
  total_ordered: number
  amount_received: number
  pending_amount: number
  order_count: number
}

interface SummaryData {
  totalOrders: number
  totalRevenue: number
  pendingPayment: number
  revenueReceived: number
}

interface RevenuePoint { label: string; revenue: number; received: number; pending: number }
interface VolumePoint  { label: string; pending: number; completed: number }

type FilterBtnProps = { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; id: string }
function FilterBtn({ active, onClick, icon, label, id }: FilterBtnProps) {
  return (
    <button id={id} type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '9px', border: `1.5px solid ${active ? 'var(--teal-500)' : 'var(--border-color)'}`, background: active ? 'var(--teal-500)' : 'var(--bg-card)', color: active ? '#ffffff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms' }}>
      {icon}{label}
    </button>
  )
}

export default function ReportsPage() {
  const { businessId } = useBusinessContext()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly')
  // Monthly mode: which year to display
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  // Custom range dates
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0])

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])
  const [volumeData, setVolumeData] = useState<VolumePoint[]>([])
  const [paidCount, setPaidCount] = useState(0)
  const [partialCount, setPartialCount] = useState(0)
  const [unpaidCount, setUnpaidCount] = useState(0)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])


  const fetchReports = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    if (timeFilter === 'monthly') {
      const yearStart = `${selectedYear}-01-01`
      const yearEnd   = `${selectedYear}-12-31`

      // Query raw orders + payments for the year — no view dependency
      const [{ data: ordersData }, { data: paymentsData }] = await Promise.all([
        supabase
          .from('orders')
          .select('order_date, total_amount, order_status')
          .eq('business_id', businessId)
          .gte('order_date', yearStart)
          .lte('order_date', yearEnd),
        supabase
          .from('payments')
          .select('payment_date, amount')
          .eq('business_id', businessId)
          .gte('payment_date', yearStart)
          .lte('payment_date', yearEnd),
      ])

      // Build a per-month accumulator (months 1–12)
      type MonthEntry = { orders: number; revenue: number; received: number; pendingOrders: number; completedOrders: number }
      const monthMap = new Map<number, MonthEntry>()
      for (let m = 1; m <= 12; m++) {
        monthMap.set(m, { orders: 0, revenue: 0, received: 0, pendingOrders: 0, completedOrders: 0 })
      }

      for (const o of (ordersData ?? []) as { order_date: string; total_amount: number; order_status: string }[]) {
        const m = new Date(o.order_date + 'T00:00:00Z').getUTCMonth() + 1
        const e = monthMap.get(m)!
        e.orders++
        e.revenue += o.total_amount
        if (o.order_status === 'Pending') e.pendingOrders++
        else e.completedOrders++
      }

      for (const p of (paymentsData ?? []) as { payment_date: string; amount: number }[]) {
        const m = new Date(p.payment_date + 'T00:00:00Z').getUTCMonth() + 1
        const e = monthMap.get(m)!
        e.received += p.amount
      }

      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      // Show months up to current month if displaying current year
      const maxMonth = selectedYear === new Date().getFullYear() ? new Date().getMonth() + 1 : 12

      const rev: RevenuePoint[] = []
      const vol: VolumePoint[]  = []
      let totalOrders = 0, totalRevenue = 0, totalReceived = 0

      for (let m = 1; m <= maxMonth; m++) {
        const e = monthMap.get(m)!
        const label = `${MONTHS[m - 1]} ${selectedYear}`
        const pending = Math.max(0, e.revenue - e.received)
        rev.push({ label, revenue: e.revenue, received: e.received, pending })
        vol.push({ label, pending: e.pendingOrders, completed: e.completedOrders })
        totalOrders   += e.orders
        totalRevenue  += e.revenue
        totalReceived += e.received
      }

      setRevenueData(rev)
      setVolumeData(vol)
      setSummary({
        totalOrders,
        totalRevenue,
        revenueReceived: totalReceived,
        pendingPayment: Math.max(0, totalRevenue - totalReceived),
      })

    } else {
      // Daily — use v_reports_daily, optionally filtered by date range
      let query = supabase.from('v_reports_daily').select('*').eq('business_id', businessId).order('day', { ascending: true })
      if (timeFilter === 'daily') {
        const today = new Date().toISOString().split('T')[0]
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
        query = query.gte('day', thirtyDaysAgo).lte('day', today)
      } else {
        query = query.gte('day', customFrom).lte('day', customTo)
      }
      const { data } = await query
      const rows = (data ?? []) as ReportsDaily[]

      const rev: RevenuePoint[] = rows.map(r => ({
        label: new Date(r.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
        revenue: r.total_revenue,
        received: r.revenue_received,
        pending: r.pending_payment,
      }))
      const vol: VolumePoint[] = rows.map(r => ({
        label: new Date(r.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
        pending: 0,
        completed: r.total_orders,
      }))
      setRevenueData(rev)
      setVolumeData(vol)

      const totals = rows.reduce((acc, r) => ({
        totalOrders: acc.totalOrders + r.total_orders,
        totalRevenue: acc.totalRevenue + r.total_revenue,
        revenueReceived: acc.revenueReceived + r.revenue_received,
        pendingPayment: acc.pendingPayment + r.pending_payment,
      }), { totalOrders: 0, totalRevenue: 0, revenueReceived: 0, pendingPayment: 0 })
      setSummary(totals)
    }

    // Payment status breakdown from orders table directly
    const { data: orderStatusData } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('business_id', businessId)
    const orders = (orderStatusData ?? []) as { payment_status: string }[]
    setPaidCount(orders.filter(o => o.payment_status === 'Paid').length)
    setPartialCount(orders.filter(o => o.payment_status === 'Partially Paid').length)
    setUnpaidCount(orders.filter(o => o.payment_status === 'Unpaid').length)

    // Top customers by outstanding — from v_customer_financial_summary
    const { data: custData } = await supabase
      .from('v_customer_financial_summary')
      .select('*')
      .eq('business_id', businessId)
      .order('pending_amount', { ascending: false })
      .gt('pending_amount', 0)
      .limit(8)
    const custs = (custData ?? []) as CustomerFinancialSummary[]
    setTopCustomers(custs.map(c => ({
      customer_id: c.customer_id,
      customer_name: c.business_name,
      city: null,
      total_ordered: c.total_ordered,
      amount_received: c.total_received,
      pending_amount: c.pending_amount,
      order_count: c.pending_orders + c.completed_orders,
    })))

    setLoading(false)
  }, [timeFilter, customFrom, customTo, selectedYear, businessId])

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchReports()
    })
  }, [fetchReports])

  const inputStyle: React.CSSProperties = {
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    background: 'var(--bg-card)',
    outline: 'none',
  }

  return (
    <div>
      <style>{`
        @keyframes rep-shimmer { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.9; } }
      `}</style>


      {/* ── Page Header ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '10px', background: 'var(--teal-500)' }}>
              <BarChart2 size={20} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reports &amp; Analytics</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Business intelligence — revenue, orders, and payment insights</p>
        </div>
      </div>

      {/* ── Time Filter Bar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
        <FilterBtn id="filter-monthly" active={timeFilter === 'monthly'} onClick={() => setTimeFilter('monthly')} icon={<Calendar size={14} />} label="Monthly" />
        <FilterBtn id="filter-daily"   active={timeFilter === 'daily'}   onClick={() => setTimeFilter('daily')}   icon={<Calendar size={14} />} label="Last 30 Days" />
        <FilterBtn id="filter-custom"  active={timeFilter === 'custom'}  onClick={() => setTimeFilter('custom')}  icon={<CalendarRange size={14} />} label="Custom Range" />

        {/* Year picker — only shown in monthly mode */}
        {timeFilter === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Year:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1.5px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)' }}>
              <button type="button"
                onClick={() => setSelectedYear(y => y - 1)}
                style={{ padding: '7px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                ‹
              </button>
              <span style={{ padding: '7px 4px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '44px', textAlign: 'center' }}>{selectedYear}</span>
              <button type="button"
                onClick={() => setSelectedYear(y => Math.min(y + 1, new Date().getFullYear()))}
                disabled={selectedYear >= new Date().getFullYear()}
                style={{ padding: '7px 12px', border: 'none', background: 'transparent', cursor: selectedYear >= new Date().getFullYear() ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, color: selectedYear >= new Date().getFullYear() ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1, opacity: selectedYear >= new Date().getFullYear() ? 0.4 : 1 }}
                onMouseEnter={e => { if (selectedYear < new Date().getFullYear()) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                ›
              </button>
            </div>
          </div>
        )}

        {/* Custom date range pickers */}
        {timeFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input id="custom-from" type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>to</span>
            <input id="custom-to" type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inputStyle} />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Summary text */}
        {!loading && summary && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0 }}>
            {formatCurrency(summary.totalRevenue)} total &nbsp;·&nbsp; {summary.totalOrders} orders
          </p>
        )}
      </div>

      {/* ── Summary Cards ─── */}
      <div style={{ marginTop: '20px' }}>
        <ReportSummaryCards data={summary} loading={loading} />
      </div>

      {/* ── Charts row — Revenue (2/3) + Payment Status (1/3) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '20px' }}>
        <RevenueChart data={revenueData} loading={loading} />
        <PaymentStatusChart paid={paidCount} partiallyPaid={partialCount} unpaid={unpaidCount} loading={loading} />
      </div>

      {/* ── Order Volume (full width) ─── */}
      <div style={{ marginTop: '16px' }}>
        <OrderVolumeChart data={volumeData} loading={loading} />
      </div>

      {/* ── Top Customers ─── */}
      <div style={{ marginTop: '16px' }}>
        <TopCustomersTable customers={topCustomers} loading={loading} />
      </div>
    </div>
  )
}
