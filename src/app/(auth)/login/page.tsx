'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, Package, Users, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div
        className="relative flex flex-col justify-between p-10 md:w-[40%] overflow-hidden"
        style={{ background: 'var(--navy-900)' }}
      >
        {/* Background gradient blobs */}
        <div
          className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--teal-400)' }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--teal-500)' }}
        />

        {/* Top — Logo + Brand */}
        <div className="relative z-10">
          {/* Teal pill icon */}
          <div className="mb-8 flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl"
              style={{ background: 'var(--teal-500)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Pill shape */}
                <rect
                  x="3"
                  y="9"
                  width="18"
                  height="6"
                  rx="3"
                  fill="white"
                  opacity="0.9"
                />
                <rect
                  x="3"
                  y="9"
                  width="9"
                  height="6"
                  rx="3"
                  fill="white"
                />
                <line
                  x1="12"
                  y1="9"
                  x2="12"
                  y2="15"
                  stroke="var(--teal-500)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span
              className="text-2xl font-semibold tracking-tight"
              style={{ color: 'var(--navy-text)' }}
            >
              MedFlow
            </span>
          </div>

          <h1
            className="text-3xl font-semibold leading-snug mb-3"
            style={{ color: 'var(--navy-text)' }}
          >
            Wholesale medicine distribution,{' '}
            <span style={{ color: 'var(--teal-400)' }}>simplified.</span>
          </h1>
          <p
            className="text-base leading-relaxed mb-10"
            style={{ color: 'var(--navy-text-muted)' }}
          >
            Manage your entire distribution pipeline — orders, clients,
            logistics, and revenue — from a single intelligent platform.
          </p>

          {/* Feature bullets */}
          <ul className="space-y-5">
            {[
              {
                icon: <Package size={18} />,
                label: 'Order tracking & logistics',
                desc: 'Real-time shipment status with multi-carrier support.',
              },
              {
                icon: <Users size={18} />,
                label: 'Client intelligence center',
                desc: 'Full financial history and credit visibility per customer.',
              },
              {
                icon: <BarChart3 size={18} />,
                label: 'Revenue & analytics',
                desc: 'Daily & monthly reports with outstanding payment alerts.',
              },
            ].map(({ icon, label, desc }) => (
              <li key={label} className="flex items-start gap-4">
                <div
                  className="mt-0.5 flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{
                    background: 'rgba(14,165,160,0.12)',
                    color: 'var(--teal-400)',
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--navy-text)' }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xs leading-relaxed mt-0.5"
                    style={{ color: 'var(--navy-text-muted)' }}
                  >
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom copy */}
        <p
          className="relative z-10 text-xs mt-12"
          style={{ color: 'var(--navy-text-muted)' }}
        >
          © {new Date().getFullYear()} MedFlow. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel ────────────────────────────────────────── */}
      <div
        className="flex flex-1 items-center justify-center p-8 md:p-16"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-10">
            <h2
              className="text-3xl font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              Sign in to your MedFlow account to continue.
            </p>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  // @ts-expect-error - CSS custom property
                  '--tw-ring-color': 'var(--teal-500)',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    // @ts-expect-error - CSS custom property
                    '--tw-ring-color': 'var(--teal-500)',
                  }}
                />
                <button
                  id="toggle-password"
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-black/5"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                }}
                role="alert"
              >
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="sign-in-button"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
              style={{
                background: 'var(--teal-500)',
                color: '#ffffff',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p
            className="mt-8 text-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Access is restricted to authorised personnel only.
          </p>
        </div>
      </div>
    </div>
  )
}
