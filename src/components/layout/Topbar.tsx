'use client'

import { usePathname } from 'next/navigation'
import { useBusinessContext } from '@/contexts/BusinessContext'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Product Catalog',
  '/customers': 'Client Intelligence Center',
  '/orders': 'Order Management',
  '/reports': 'Reports & Analytics',
}

function getTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Prefix match for nested routes
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (key !== '/' && pathname.startsWith(key)) return title
  }
  return 'MedFlow'
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export function Topbar() {
  const pathname = usePathname()
  const { fullName } = useBusinessContext()
  const title = getTitle(pathname)

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6"
      style={{
        height: '64px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Left: Page title */}
      <h1
        className="text-lg font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>

      {/* Right: date + divider + user */}
      <div className="flex items-center gap-4">
        <span
          className="text-sm hidden sm:block"
          style={{ color: 'var(--text-muted)' }}
        >
          {getFormattedDate()}
        </span>

        <div
          className="w-px h-5 hidden sm:block"
          style={{ background: 'var(--border-md)' }}
        />

        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {fullName}
        </span>
      </div>
    </header>
  )
}
