'use client'

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

interface RevenueDataPoint {
  label: string
  revenue: number
  received: number
  pending: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  loading: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{p.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px 24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Revenue Performance</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Total revenue vs received vs outstanding over time</p>
      </div>

      {loading ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-subtle)', borderRadius: '8px', animation: 'rep-shimmer 1.5s ease-in-out infinite' }} />
        </div>
      ) : data.length === 0 ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>No data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.20} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={58}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#0F766E" strokeWidth={2.5} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: '#0F766E' }} />
            <Area type="monotone" dataKey="received" name="Received" stroke="#10B981" strokeWidth={2} fill="url(#gradReceived)" dot={false} activeDot={{ r: 5, fill: '#10B981' }} />
            <Area type="monotone" dataKey="pending" name="Outstanding" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 3" fill="url(#gradPending)" dot={false} activeDot={{ r: 5, fill: '#EF4444' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
