import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessProvider } from '@/contexts/BusinessContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { NumberScrollFix } from '@/components/ui/NumberScrollFix'
import type { BusinessContext as BusinessContextType } from '@/lib/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      business:businesses(id, name, slug, logo_url)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || !profile.business) {
    redirect('/login')
  }

  // business is returned as an object (single join)
  const business = Array.isArray(profile.business)
    ? profile.business[0]
    : profile.business

  if (!business) {
    redirect('/login')
  }

  const contextValue: BusinessContextType = {
    businessId: business.id as string,
    businessName: business.name as string,
    businessSlug: business.slug as string,
    logoUrl: (business.logo_url as string | null) ?? null,
    userId: user.id,
    userRole: profile.role as 'owner' | 'admin' | 'staff',
    fullName: profile.full_name,
  }

  return (
    <BusinessProvider value={contextValue}>
      <NumberScrollFix />
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </BusinessProvider>
  )
}
