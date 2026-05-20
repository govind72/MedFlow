'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  {
    section: 'BUSINESS',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { businessName, businessSlug, logoUrl, fullName, userRole } =
    useBusinessContext()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleBadgeColors: Record<string, string> = {
    owner: 'var(--teal-500)',
    admin: 'var(--warning)',
    staff: 'var(--text-muted)',
  }

  return (
    <aside
      className="flex flex-col shrink-0 h-screen overflow-y-auto"
      style={{
        width: '260px',
        background: 'var(--navy-900)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Top: Logo + Business ─────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo or pill icon */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={businessName}
            className="w-10 h-10 rounded-xl object-cover shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
        ) : (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: 'var(--teal-500)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect x="3" y="9" width="18" height="6" rx="3" fill="white" opacity="0.9" />
              <rect x="3" y="9" width="9" height="6" rx="3" fill="white" />
              <line x1="12" y1="9" x2="12" y2="15" stroke="var(--teal-500)" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold"
            style={{
              color: 'var(--navy-text)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.35',
              wordBreak: 'break-word',
            }}
            title={businessName}
          >
            {businessName}
          </p>
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: 'var(--navy-text-muted)' }}
          >
            @{businessSlug}
          </p>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section}>
            <p
              className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'var(--navy-text-muted)' }}
            >
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
                      style={{
                        color: active
                          ? 'var(--teal-400)'
                          : 'var(--navy-text-muted)',
                        background: active
                          ? 'rgba(14,165,160,0.10)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background =
                            'rgba(255,255,255,0.04)'
                          e.currentTarget.style.color = 'var(--navy-text)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--navy-text-muted)'
                        }
                      }}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                          style={{ background: 'var(--teal-400)' }}
                        />
                      )}
                      <Icon size={17} className="shrink-0" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom: User + Logout ────────────────────────── */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* User info — click to navigate to profile page */}
        <button
          id="sidebar-user-profile"
          type="button"
          onClick={() => router.push('/profile')}
          aria-label="View profile"
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-left transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        >
          {/* Avatar */}
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-sm font-semibold"
            style={{
              background: 'var(--teal-500)',
              color: '#ffffff',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--navy-text)' }}
            >
              {fullName}
            </p>
            {/* Role badge */}
            <span
              className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize mt-0.5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: roleBadgeColors[userRole] ?? 'var(--text-muted)',
              }}
            >
              {userRole}
            </span>
          </div>
        </button>

        {/* Logout */}
        <button
          id="sidebar-logout-button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--navy-text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.10)'
            e.currentTarget.style.color = '#FC8181'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--navy-text-muted)'
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
