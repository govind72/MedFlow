// ─────────────────────────────────────────────────────────────────────────────
// MedFlow Database Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Tables ────────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  gst_number: string | null
  drug_license_no: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  business_id: string
  full_name: string
  role: 'owner' | 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  category: 'NRX' | 'RX' | 'SCH_H' | 'OTHERS'
  product_name: string
  salt: string | null
  manufacturer: string | null
  company: string | null
  cost_price: number
  selling_price: number
  mrp: number
  discount_pct: number
  moq: number
  min_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  business_id: string
  customer_type:
    | 'Pharmacy'
    | 'Hospital'
    | 'Clinic'
    | 'Rehab'
    | 'Wholesaler'
    | 'De-Addiction'
  business_name: string
  incharge: string | null
  contact_person: string | null
  mobile: string
  other_mobile: string | null
  email: string | null
  gst_number: string | null
  drug_license_no: string | null
  state: string | null
  district: string | null
  city: string | null
  pincode: string | null
  full_address: string | null
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CustomerSpecialPrice {
  id: string
  business_id: string
  customer_id: string
  product_id: string
  special_price: number
  moq: number
  created_at: string
  updated_at: string
}

export interface LogisticsCompany {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  business_id: string
  customer_id: string
  bill_number: string
  order_date: string
  logistics_company_id: string | null
  courier_details: string | null
  total_amount: number
  amount_received: number
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid'
  order_form_received: boolean
  signed_bill_received: boolean
  delivered: boolean
  bill_cleared: boolean
  order_status: 'Pending' | 'Completed'
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  business_id: string
  product_id: string
  product_name: string
  salt: string | null
  quantity: number
  unit_price: number
  mrp: number
  discount_pct: number
  line_total: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  business_id: string
  customer_id: string
  payment_type: 'Full' | 'Partial'
  amount: number
  payment_date: string
  notes: string | null
  recorded_by: string
  created_at: string
}

// ── Views ─────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  business_id: string
  total_outstanding: number
  pending_orders_count: number
  completed_orders_count: number
  collected_revenue: number
  total_revenue: number
}

export interface PendingOrderDashboard {
  order_id: string
  business_id: string
  bill_number: string
  order_date: string
  party_name: string
  city: string | null
  order_form_received: boolean
  signed_bill_received: boolean
  delivered: boolean
  bill_cleared: boolean
  total_amount: number
  amount_received: number
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid'
  order_status: 'Pending' | 'Completed'
}

export interface CustomerFinancialSummary {
  customer_id: string
  business_id: string
  business_name: string
  pending_amount: number
  total_received: number
  total_ordered: number
  pending_orders: number
  completed_orders: number
}

export interface OrderManagement {
  order_id: string
  business_id: string
  bill_number: string
  order_date: string
  order_status: 'Pending' | 'Completed'
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid'
  total_amount: number
  amount_received: number
  balance_due: number
  order_form_received: boolean
  signed_bill_received: boolean
  delivered: boolean
  bill_cleared: boolean
  completed_at: string | null
  created_at: string
  customer_id: string
  customer_name: string
  customer_city: string | null
  customer_state: string | null
  customer_type: string
  logistics_company_name: string | null
  courier_details: string | null
  is_completable: boolean
}

export interface OrdersSummaryCounts {
  business_id: string
  total_pending: number
  pending_delivery: number
  pending_forms: number
  pending_signed: number
  pending_payments: number
}

export interface ReportsMonthly {
  business_id: string
  month: string
  total_orders: number
  total_revenue: number
  revenue_received: number
  pending_payment: number
  completed_orders: number
  pending_orders: number
}

export interface ReportsDaily {
  business_id: string
  day: string
  total_orders: number
  total_revenue: number
  revenue_received: number
  pending_payment: number
}

// ── Shared ────────────────────────────────────────────────────────────────────

export type BusinessContext = {
  businessId: string
  businessName: string
  businessSlug: string
  logoUrl: string | null
  userId: string
  userRole: 'owner' | 'admin' | 'staff'
  fullName: string
}
