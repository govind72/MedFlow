import { ShieldCheck } from 'lucide-react'

interface LicenseCardProps {
  gst_number: string | null
  drug_license_no: string | null
}

export function LicenseCard({ gst_number, drug_license_no }: LicenseCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <ShieldCheck size={18} style={{ color: 'var(--teal-500)', flexShrink: 0 }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          License Details
        </h3>
      </div>

      {/* GST Number */}
      <div style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          GST Number
        </p>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: gst_number ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: gst_number ? 'monospace' : 'inherit',
            margin: 0,
          }}
        >
          {gst_number || '—'}
        </p>
      </div>

      {/* Drug License */}
      <div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          Drug License No.
        </p>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: drug_license_no ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: drug_license_no ? 'monospace' : 'inherit',
            margin: 0,
          }}
        >
          {drug_license_no || '—'}
        </p>
      </div>
    </div>
  )
}
