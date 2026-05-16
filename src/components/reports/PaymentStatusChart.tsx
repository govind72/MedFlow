'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

interface PaymentStatusChartProps {
  paid: number
  partiallyPaid: number
  unpaid: number
  loading: boolean
}

const SLICES = [
  { key: 'paid',         label: 'Paid',           color: '#10B981' },
  { key: 'partiallyPaid', label: 'Partially Paid', color: '#F97316' },
  { key: 'unpaid',       label: 'Unpaid',          color: '#EF4444' },
] as const

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.payload.color, flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
      </div>
      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{item.value} orders</p>
    </div>
  )
}

function CustomLabel({ cx, cy, total }: { cx?: number; cy?: number; total: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" style={{ fontSize: '22px', fontWeight: 700, fill: 'var(--text-primary)' }}>{total}</tspan>
      <tspan x={cx} dy="22" style={{ fontSize: '12px', fill: 'var(--text-muted)' }}>Orders</tspan>
    </text>
  )
}

export function PaymentStatusChart({ paid, partiallyPaid, unpaid, loading }: PaymentStatusChartProps) {
  const total = paid + partiallyPaid + unpaid
  const data = [
    { name: 'Paid',           value: paid,          color: '#10B981' },
    { name: 'Partially Paid', value: partiallyPaid,  color: '#F97316' },
    { name: 'Unpaid',         value: unpaid,         color: '#EF4444' },
  ].filter(d => d.value > 0)

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px 24px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Payment Status</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Breakdown of order payment states</p>
      </div>

      {loading ? (
        <div style={{ height: 260, background: 'var(--bg-subtle)', borderRadius: '8px', animation: 'rep-shimmer 1.5s ease-in-out infinite' }} />
      ) : total === 0 ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>No orders in this period</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={96}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={(props) => <CustomLabel {...props} total={total} />}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={9}
                wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
            {[
              { label: 'Paid', value: paid, color: '#10B981', bg: '#D1FAE5' },
              { label: 'Partial', value: partiallyPaid, color: '#F97316', bg: '#FFEDD5' },
              { label: 'Unpaid', value: unpaid, color: '#EF4444', bg: '#FEE2E2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color, margin: 0 }}>{value}</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
