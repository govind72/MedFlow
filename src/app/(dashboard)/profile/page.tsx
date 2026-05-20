'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, User, Building2, ShieldCheck,
  KeyRound, Eye, EyeOff, Loader2, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessContext } from '@/contexts/BusinessContext'

// ── Shared styles ─────────────────────────────────────────────────────────────
// Use separate border sub-properties to avoid React's "shorthand vs
// non-shorthand" rerender warning when we change borderColor on focus/blur.
const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  padding: '11px 14px',
  fontSize: '14px',
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 150ms',
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  disabled?: boolean
  hint?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          disabled={disabled}
          style={{ ...fieldInputStyle, paddingRight: 44, opacity: disabled ? 0.6 : 1 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          disabled={disabled}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', borderWidth: 0, cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center',
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const { businessName, businessSlug, fullName, userRole } = useBusinessContext()

  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(true)

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  const loadEmail = useCallback(async () => {
    setEmailLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setEmail(user?.email ?? '')
    setEmailLoading(false)
  }, [])

  useEffect(() => { Promise.resolve().then(() => loadEmail()) }, [loadEmail])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    // Client-side validation
    if (newPwd.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwError('New passwords do not match.')
      return
    }
    if (currentPwd === newPwd) {
      setPwError('New password must differ from your current password.')
      return
    }

    setPwLoading(true)
    const supabase = createClient()

    // Step 1 — Verify the current password by re-authenticating
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPwd,
    })
    if (verifyErr) {
      setPwError('Current password is incorrect.')
      setPwLoading(false)
      return
    }

    // Step 2 — Update to the new password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd })
    if (updateErr) {
      setPwError(updateErr.message)
      setPwLoading(false)
      return
    }

    setPwSuccess(true)
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setPwLoading(false)
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleBadgeColor: Record<string, string> = {
    owner: 'var(--teal-500)',
    admin: 'var(--warning)',
    staff: 'var(--text-muted)',
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 48 }}>
      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          id="profile-back-btn"
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-card)',
            borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)',
            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
            My Profile
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            View your account info and manage your password.
          </p>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Left col: Identity ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Avatar card */}
          <div style={{
            background: 'var(--bg-card)',
            borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)',
            borderRadius: 16, padding: '28px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--teal-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: 1,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</p>
              <span style={{
                display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 600,
                padding: '4px 12px', borderRadius: 999,
                background: 'var(--bg-subtle)',
                color: roleBadgeColor[userRole] ?? 'var(--text-muted)',
                textTransform: 'capitalize', letterSpacing: '0.03em',
              }}>
                {userRole}
              </span>
            </div>
          </div>

          {/* Info rows */}
          {[
            {
              icon: <User size={15} style={{ color: 'var(--teal-500)', flexShrink: 0 }} />,
              label: 'Email',
              value: emailLoading ? '—' : email,
            },
            {
              icon: <Building2 size={15} style={{ color: 'var(--teal-500)', flexShrink: 0 }} />,
              label: 'Business',
              value: businessName,
              sub: `@${businessSlug}`,
            },
            {
              icon: <ShieldCheck size={15} style={{ color: 'var(--teal-500)', flexShrink: 0 }} />,
              label: 'Role',
              value: userRole.charAt(0).toUpperCase() + userRole.slice(1),
            },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} style={{
              background: 'var(--bg-card)',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)',
              borderRadius: 14, padding: '16px 18px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{
                marginTop: 2, width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'var(--teal-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 3 }}>
                  {label}
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {value}
                </p>
                {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right col: Change Password ───────────────────── */}
        <div style={{
          background: 'var(--bg-card)',
          borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)',
          borderRadius: 16, padding: '28px 24px',
          alignSelf: 'start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--teal-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={16} style={{ color: 'var(--teal-500)' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
            Verify your current password first, then choose a new one.
          </p>

          {pwSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--success-bg)', borderRadius: 10,
              padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: 'var(--success-text)',
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              Password updated successfully!
            </div>
          )}

          {pwError && (
            <div style={{
              background: 'var(--danger-bg)', borderRadius: 10,
              padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: 'var(--danger-text)',
            }}>
              ⚠ {pwError}
            </div>
          )}

          <form id="change-password-form" onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PasswordInput
              id="current-password"
              label="Current Password"
              value={currentPwd}
              onChange={setCurrentPwd}
              autoComplete="current-password"
              disabled={pwLoading}
            />
            <PasswordInput
              id="new-password"
              label="New Password"
              value={newPwd}
              onChange={setNewPwd}
              autoComplete="new-password"
              disabled={pwLoading}
              hint="min. 8 characters"
            />
            <PasswordInput
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPwd}
              onChange={setConfirmPwd}
              autoComplete="new-password"
              disabled={pwLoading}
            />

            {/* Password strength indicator */}
            {newPwd.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[...Array(4)].map((_, i) => {
                    const strength = newPwd.length >= 12 ? 4
                      : newPwd.length >= 10 ? 3
                      : newPwd.length >= 8 ? 2
                      : 1
                    const filled = i < strength
                    const color = strength === 4 ? 'var(--success)' : strength === 3 ? 'var(--teal-500)' : strength === 2 ? 'var(--warning)' : 'var(--danger)'
                    return (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: filled ? color : 'var(--border-color)',
                        transition: 'background 200ms',
                      }} />
                    )
                  })}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {newPwd.length < 8 ? 'Too short' : newPwd.length < 10 ? 'Fair' : newPwd.length < 12 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}

            <button
              id="update-password-btn"
              type="submit"
              disabled={pwLoading || !currentPwd || !newPwd || !confirmPwd}
              style={{
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '12px 0', borderRadius: 10, borderWidth: 0,
                background: 'var(--teal-500)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: (pwLoading || !currentPwd || !newPwd || !confirmPwd) ? 0.55 : 1,
                transition: 'opacity 150ms, filter 150ms',
              }}
              onMouseEnter={(e) => { if (!pwLoading) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
            >
              {pwLoading
                ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                : <><CheckCircle2 size={14} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
