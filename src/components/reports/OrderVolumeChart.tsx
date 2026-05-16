'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'

interface OrderVolumeDataPoint {
  label: string
  pending: number
  completed: number
}

interface OrderVolumeChartProps {
  data: OrderVolumeDataPoint[]
  loading: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = (payload[0]?.value ?? 0) + (payload[1]?.value ?? 0)
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '3px', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{p.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</span>
      </div>
    </div>
  )
}

export function OrderVolumeChart({ data, loading }: OrderVolumeChartProps) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px 24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Order Volume</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Orders placed per period — pending vs completed</p>
      </div>

      {loading ? (
        <div style={{ height: 260, background: 'var(--bg-subtle)', borderRadius: '8px', animation: 'rep-shimmer 1.5s ease-in-out infinite' }} />
      ) : data.length === 0 ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>No data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={14} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)', radius: 6 }} />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            <Bar dataKey="pending" name="Pending" fill="#F97316" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill="#F97316" fillOpacity={0.85} />)}
            </Bar>
            <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill="#10B981" fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
