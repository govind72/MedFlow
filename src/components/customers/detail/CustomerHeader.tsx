import { Pencil, Trash2, UserCheck, User, Phone, Mail, MapPin } from 'lucide-react'
import type { Customer } from '@/lib/types/database'
import type { CustomerType } from '@/lib/utils/format'
import { CUSTOMER_TYPE_CONFIG, formatMobile, getInitials } from '@/lib/utils/format'
import { CustomerTypeBadge } from '@/components/customers/CustomerTypeBadge'

interface CustomerHeaderProps {
  customer: Customer
  onEdit: () => void
  onDelete: () => void
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: '14px', color: '#ffffff', margin: 0, paddingLeft: '22px' }}>
        {value}
      </p>
    </div>
  )
}

export function CustomerHeader({ customer, onEdit, onDelete }: CustomerHeaderProps) {
  const cfg = CUSTOMER_TYPE_CONFIG[customer.customer_type as CustomerType]
  const initials = getInitials(customer.business_name)
  const isActive = customer.status === 'Active'

  const mobileDisplay = [
    formatMobile(customer.mobile),
    customer.other_mobile ? formatMobile(customer.other_mobile) : null,
  ]
    .filter(Boolean)
    .join(' / ')

  const addressDisplay = [
    customer.full_address,
    customer.city,
    `${customer.state}${customer.pincode ? ' — ' + customer.pincode : ''}`,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)',
        padding: '28px 32px',
        position: 'relative',
      }}
    >
      {/* Top-right action buttons */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          id="customer-detail-edit-btn"
          type="button"
          onClick={onEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            transition: 'all 150ms',
          }}
          title="Edit customer"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
        >
          <Pencil size={16} />
        </button>
        <button
          id="customer-detail-delete-btn"
          type="button"
          onClick={onDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            transition: 'all 150ms',
          }}
          title="Remove customer"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#FCA5A5' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `${cfg.dot}33`,
            border: `2px solid ${cfg.dot}66`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 600, color: '#ffffff' }}>{initials}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            {customer.business_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <CustomerTypeBadge type={customer.customer_type as CustomerType} />
            {/* Status badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.2)',
                color: isActive ? '#ffffff' : '#FCA5A5',
                border: `1px solid ${isActive ? 'rgba(255,255,255,0.3)' : 'rgba(239,68,68,0.4)'}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isActive ? '#10B981' : '#EF4444',
                  display: 'inline-block',
                }}
              />
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '24px',
        }}
      >
        <InfoItem icon={<UserCheck size={16} />} label="Incharge" value={customer.incharge ?? '—'} />
        <InfoItem icon={<User size={16} />} label="Contact" value={customer.contact_person ?? '—'} />
        <InfoItem icon={<Phone size={16} />} label="Mobile" value={mobileDisplay || '—'} />
        <InfoItem icon={<Mail size={16} />} label="Email" value={customer.email ?? '—'} />
        <InfoItem icon={<MapPin size={16} />} label="Address" value={addressDisplay || '—'} />
      </div>
    </div>
  )
}
