'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Loader2, CheckCircle2,
  Package, Users, BarChart3, ArrowLeft, Mail,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Shared input style (use separate border properties to avoid React
//    "shorthand vs non-shorthand" hydration warning) ──────────────────────────
const INPUT_BASE: React.CSSProperties = {
  width: '100%',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border-color)',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 150ms',
}

type View = 'signin' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  const router = useRouter()

  // ── Sign-in state ────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Forgot-password state ─────────────────────────────────
  const [view, setView] = useState<View>('signin')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  // ── Handlers ─────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/reset-password`

    // We call this regardless of whether the email exists to prevent
    // user enumeration — Supabase silently succeeds for unknown emails.
    await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo })

    setForgotLoading(false)
    setView('forgot-sent')
  }

  function switchToForgot() {
    setForgotEmail(email) // pre-fill with sign-in email if typed
    setForgotError(null)
    setView('forgot')
  }

  function switchToSignIn() {
    setError(null)
    setView('signin')
  }

  // ── Left panel content (never changes) ───────────────────
  const leftPanel = (
    <div
      className="relative flex flex-col justify-between p-10 md:w-[40%] overflow-hidden"
      style={{ background: 'var(--navy-900)' }}
    >
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-10 blur-3xl"
        style={{ background: 'var(--teal-400)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-10 blur-3xl"
        style={{ background: 'var(--teal-500)' }} />

      <div className="relative z-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: 'var(--teal-500)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="9" width="18" height="6" rx="3" fill="white" opacity="0.9" />
              <rect x="3" y="9" width="9" height="6" rx="3" fill="white" />
              <line x1="12" y1="9" x2="12" y2="15" stroke="var(--teal-500)" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--navy-text)' }}>
            MedFlow
          </span>
        </div>

        <h1 className="text-3xl font-semibold leading-snug mb-3" style={{ color: 'var(--navy-text)' }}>
          Wholesale medicine distribution,{' '}
          <span style={{ color: 'var(--teal-400)' }}>simplified.</span>
        </h1>
        <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--navy-text-muted)' }}>
          Manage your entire distribution pipeline — orders, clients, logistics, and revenue — from a single intelligent platform.
        </p>

        <ul className="space-y-5">
          {[
            { icon: <Package size={18} />, label: 'Order tracking & logistics', desc: 'Real-time shipment status with multi-carrier support.' },
            { icon: <Users size={18} />, label: 'Client intelligence center', desc: 'Full financial history and credit visibility per customer.' },
            { icon: <BarChart3 size={18} />, label: 'Revenue & analytics', desc: 'Daily & monthly reports with outstanding payment alerts.' },
          ].map(({ icon, label, desc }) => (
            <li key={label} className="flex items-start gap-4">
              <div className="mt-0.5 flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: 'rgba(14,165,160,0.12)', color: 'var(--teal-400)' }}>
                {icon}
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--navy-text)' }}>{label}</p>
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--navy-text-muted)' }}>{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs mt-12" style={{ color: 'var(--navy-text-muted)' }}>
        © 2025 MedFlow. All rights reserved.
      </p>
    </div>
  )

  // ── Right panel: Sign-In ──────────────────────────────────
  const signInPanel = (
    <div className="flex flex-1 items-center justify-center p-8 md:p-16" style={{ background: 'var(--bg-card)' }}>
      <div className="w-full max-w-md">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in to your MedFlow account to continue.
          </p>
        </div>

        <form id="login-form" onSubmit={handleSignIn} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
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
              style={INPUT_BASE}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <button
                id="forgot-password-link"
                type="button"
                onClick={switchToForgot}
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--teal-500)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...INPUT_BASE, paddingRight: 44 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              />
              <button
                id="toggle-password"
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
              role="alert">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            id="sign-in-button"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
            style={{ background: 'var(--teal-500)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <><CheckCircle2 size={16} /> Sign In</>}
          </button>
        </form>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Access is restricted to authorised personnel only.
        </p>
      </div>
    </div>
  )

  // ── Right panel: Forgot Password ─────────────────────────
  const forgotPanel = (
    <div className="flex flex-1 items-center justify-center p-8 md:p-16" style={{ background: 'var(--bg-card)' }}>
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={switchToSignIn}
          className="flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal-500)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={15} /> Back to sign in
        </button>

        <div className="mb-8 flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: 'var(--teal-50)' }}>
          <Mail size={26} style={{ color: 'var(--teal-500)' }} />
        </div>

        <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Forgot password?
        </h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Enter the email address linked to your account and we&apos;ll send you a secure reset link.
        </p>

        <form id="forgot-password-form" onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              style={INPUT_BASE}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            />
          </div>

          {forgotError && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
              role="alert">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{forgotError}</span>
            </div>
          )}

          <button
            id="send-reset-button"
            type="submit"
            disabled={forgotLoading || !forgotEmail}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            style={{ background: 'var(--teal-500)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { if (!forgotLoading) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
          >
            {forgotLoading
              ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
              : <><Mail size={16} /> Send Reset Link</>}
          </button>
        </form>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Access is restricted to authorised personnel only.
        </p>
      </div>
    </div>
  )

  // ── Right panel: Forgot-sent success ─────────────────────
  const forgotSentPanel = (
    <div className="flex flex-1 items-center justify-center p-8 md:p-16" style={{ background: 'var(--bg-card)' }}>
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'var(--success-bg)' }}>
          <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
        </div>

        <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Check your inbox
        </h2>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
          If <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong> is registered, you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t see it? Check your spam folder.
        </p>

        <button
          id="back-to-signin-button"
          type="button"
          onClick={switchToSignIn}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.99]"
          style={{ background: 'var(--teal-500)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
        >
          <ArrowLeft size={15} /> Back to Sign In
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {leftPanel}
      {view === 'signin' && signInPanel}
      {view === 'forgot' && forgotPanel}
      {view === 'forgot-sent' && forgotSentPanel}
    </div>
  )
}
