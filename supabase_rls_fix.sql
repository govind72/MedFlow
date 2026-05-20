-- ============================================================================
-- CORRECTED RLS Policies for MedFlow Multi-Tenant Isolation
-- ============================================================================
-- Run this in your Supabase Dashboard SQL Editor.
--
-- IMPORTANT: If you already ran the previous RLS script, first drop those
-- policies before running this one. The DROP statements below handle that.
-- ============================================================================

-- ── Step 1: Drop any existing policies (safe if they don't exist) ──────────

DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow owners and admins to manage profiles in their business" ON public.profiles;
  -- businesses
  DROP POLICY IF EXISTS "Allow users to view their own business" ON public.businesses;
  -- products
  DROP POLICY IF EXISTS "Allow users to manage products of their own business" ON public.products;
  -- customers
  DROP POLICY IF EXISTS "Allow users to manage customers of their own business" ON public.customers;
  -- orders
  DROP POLICY IF EXISTS "Allow users to manage orders of their own business" ON public.orders;
  -- order_items
  DROP POLICY IF EXISTS "Allow users to manage order items of their own business" ON public.order_items;
  -- payments
  DROP POLICY IF EXISTS "Allow users to manage payments of their own business" ON public.payments;
  -- customer_special_prices
  DROP POLICY IF EXISTS "Allow users to manage customer special prices of their own business" ON public.customer_special_prices;
  -- logistics_companies
  DROP POLICY IF EXISTS "Allow authenticated users to read logistics companies" ON public.logistics_companies;
END $$;


-- ── Step 2: Enable RLS on all tables ───────────────────────────────────────

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_special_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_companies ENABLE ROW LEVEL SECURITY;


-- ── Step 3: Create a SECURITY DEFINER helper function ──────────────────────
-- This function bypasses RLS when called, avoiding the circular dependency
-- problem where profiles -> businesses -> profiles subqueries get blocked.

CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$;


-- ── Step 4: Profiles Policies ──────────────────────────────────────────────
-- Users can read their own profile (needed for dashboard layout to load)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── Step 5: Businesses Policies ────────────────────────────────────────────
-- Users can view the business they belong to
CREATE POLICY "businesses_select_own"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (id = public.get_my_business_id());


-- ── Step 6: Products Policies ──────────────────────────────────────────────
CREATE POLICY "products_all_own_business"
  ON public.products FOR ALL
  TO authenticated
  USING (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── Step 7: Customers Policies ─────────────────────────────────────────────
CREATE POLICY "customers_all_own_business"
  ON public.customers FOR ALL
  TO authenticated
  USING (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── Step 8: Orders Policies ────────────────────────────────────────────────
CREATE POLICY "orders_all_own_business"
  ON public.orders FOR ALL
  TO authenticated
  USING (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── Step 9: Order Items Policies ───────────────────────────────────────────
CREATE POLICY "order_items_all_own_business"
  ON public.order_items FOR ALL
  TO authenticated
  USING (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── Step 10: Payments Policies ─────────────────────────────────────────────
CREATE POLICY "payments_all_own_business"
  ON public.payments FOR ALL
  TO authenticated
  USING (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── Step 11: Customer Special Prices Policies ──────────────────────────────
CREATE POLICY "customer_special_prices_all_own_business"
  ON public.customer_special_prices FOR ALL
  TO authenticated
  USING (business_id = public.get_my_business_id())
  WITH CHECK (business_id = public.get_my_business_id());


-- ── Step 12: Logistics Companies (shared lookup table) ─────────────────────
CREATE POLICY "logistics_select_authenticated"
  ON public.logistics_companies FOR SELECT
  TO authenticated
  USING (true);
