'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Use separate border sub-properties to avoid the React "shorthand vs
// non-shorthand" rerender warning when we change borderColor on focus.
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

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          required
          disabled={disabled}
          style={{ ...INPUT_BASE, paddingRight: 44, opacity: disabled ? 0.6 : 1 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          disabled={disabled}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', borderWidth: 0, cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4,
            display: 'flex', alignItems: 'center',
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionChecking, setSessionChecking] = useState(true)

  // Supabase browser client automatically processes the #access_token hash from
  // the reset email link and emits PASSWORD_RECOVERY when the session is ready.
  useEffect(() => {
    const supabase = createClient()

    // In case of page reload where session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
      setSessionChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true)
        setSessionChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Password strength helpers
  const strength = newPassword.length >= 12 ? 4
    : newPassword.length >= 10 ? 3
    : newPassword.length >= 8 ? 2
    : newPassword.length > 0 ? 1
    : 0
  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = [
    '', 'var(--danger)', 'var(--warning)', 'var(--teal-500)', 'var(--success)',
  ][strength]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    // Sign out so the user must log in fresh with the new password
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2800)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)', padding: 24,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card)',
        borderRadius: 20,
        borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)',
        padding: '44px 40px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--teal-50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <KeyRound size={24} style={{ color: 'var(--teal-500)' }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Set new password
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          Choose a strong password of at least 8 characters to secure your account.
        </p>

        {/* ── Checking session ─────────────────────────────── */}
        {sessionChecking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14, paddingBottom: 16 }}>
            <Loader2 size={16} className="animate-spin" />
            Verifying reset link…
          </div>
        )}

        {/* ── Invalid / expired link ───────────────────────── */}
        {!sessionChecking && !sessionReady && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'var(--danger-bg)', borderRadius: 12,
            padding: '16px', fontSize: 14, color: 'var(--danger-text)', marginBottom: 24,
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Reset link is invalid or has expired.</p>
              <p>
                Please{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  style={{
                    background: 'none', borderWidth: 0, cursor: 'pointer',
                    color: 'var(--teal-500)', fontWeight: 600, padding: 0,
                    textDecoration: 'underline', fontSize: 14,
                  }}
                >
                  request a new reset link
                </button>
                {' '}from the login page.
              </p>
            </div>
          </div>
        )}

        {/* ── Success ──────────────────────────────────────── */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--success-bg)', borderRadius: 12,
            padding: '16px', fontSize: 14, color: 'var(--success-text)',
          }}>
            <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600 }}>Password updated!</p>
              <p style={{ marginTop: 2, fontSize: 13 }}>Redirecting to sign in…</p>
            </div>
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────── */}
        {sessionReady && !success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'var(--danger-bg)', borderRadius: 10,
                padding: '12px 14px', fontSize: 13, color: 'var(--danger-text)',
              }}>
                <span style={{ flexShrink: 0 }}>⚠</span>
                {error}
              </div>
            )}

            <PasswordField
              id="reset-new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              disabled={loading}
            />

            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div style={{ marginTop: -10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i < strength ? strengthColor : 'var(--border-color)',
                      transition: 'background 200ms',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}

            <PasswordField
              id="reset-confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              disabled={loading}
            />

            <button
              id="set-password-btn"
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              style={{
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px 0', borderRadius: 12, borderWidth: 0,
                background: 'var(--teal-500)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: (loading || !newPassword || !confirmPassword) ? 0.6 : 1,
                transition: 'opacity 150ms, filter 150ms',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Updating…</>
                : <><CheckCircle2 size={16} /> Set New Password</>}
            </button>
          </form>
        )}

        {/* Back to sign in */}
        {!success && (
          <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{
                background: 'none', borderWidth: 0, cursor: 'pointer',
                color: 'var(--teal-500)', fontWeight: 600,
                padding: 0, fontSize: 13,
              }}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
