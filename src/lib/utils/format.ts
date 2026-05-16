/**
 * Format a number as Indian Rupee currency.
 * e.g. 12500 → "₹12,500"   100000 → "₹1,00,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date as DD-MM-YYYY.
 * Accepts ISO string or Date object.
 * e.g. "2026-05-16" → "16-05-2026"
 */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}-${month}-${year}`
}

/**
 * Format a date as "16 May 2026".
 */
export function formatDateLong(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/**
 * Generate up-to-2-character uppercase initials from a name.
 * e.g. "Rahul Sharma" → "RS"   "Apollo Pharmacy" → "AP"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format a plain number using Indian number system (no currency symbol).
 * e.g. 1000 → "1,000"   100000 → "1,00,000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

/**
 * Single source of truth for product category display config.
 * Use everywhere: badges, tabs, form selectors.
 */
export const CATEGORY_CONFIG = {
  NRX: {
    label: 'NRX',
    subtitle: 'Narcotic & Controlled',
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#EF4444',
  },
  RX: {
    label: 'RX',
    subtitle: 'Prescription Only',
    bg: '#DBEAFE',
    text: '#1E40AF',
    dot: '#3B82F6',
  },
  SCH_H: {
    label: 'Schedule H',
    subtitle: 'Regulated Medicines',
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
  },
  OTHERS: {
    label: 'Others',
    subtitle: 'OTC & General',
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
  },
} as const

export type ProductCategory = keyof typeof CATEGORY_CONFIG

/**
 * Single source of truth for customer type display config.
 */
export const CUSTOMER_TYPE_CONFIG = {
  Pharmacy: {
    label: 'Pharmacy',
    subtitle: 'Retail pharmacy / medical store',
    bg: '#EDE9FE',
    text: '#5B21B6',
    dot: '#7C3AED',
    icon: 'Pill',
  },
  Hospital: {
    label: 'Hospital',
    subtitle: 'Hospital or nursing home',
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#EF4444',
    icon: 'Building2',
  },
  Clinic: {
    label: 'Clinic',
    subtitle: "Doctor's clinic",
    bg: '#DBEAFE',
    text: '#1E40AF',
    dot: '#3B82F6',
    icon: 'Stethoscope',
  },
  Rehab: {
    label: 'Rehab',
    subtitle: 'Rehabilitation center',
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
    icon: 'Heart',
  },
  Wholesaler: {
    label: 'Wholesaler',
    subtitle: 'Wholesale distributor',
    bg: '#F3F4F6',
    text: '#374151',
    dot: '#6B7280',
    icon: 'Warehouse',
  },
  'De-Addiction': {
    label: 'De-Addiction',
    subtitle: 'De-addiction center',
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
    icon: 'Shield',
  },
} as const

export type CustomerType = keyof typeof CUSTOMER_TYPE_CONFIG

/**
 * Format a 10-digit mobile number with a space after 5 digits.
 * e.g. "9876543210" → "98765 43210"
 */
export function formatMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return mobile
}
