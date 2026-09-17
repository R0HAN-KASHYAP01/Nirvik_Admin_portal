'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Invalid credentials.')
      setLoading(false)
      return
    }

    // Password was correct — now confirm this account is actually an
    // approved system_admin before letting them anywhere near /admin.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', signInData.user.id)
      .single()

    if (
      profileError ||
      !profile ||
      profile.role !== 'system_admin' ||
      profile.status !== 'approved'
    ) {
      await supabase.auth.signOut()
      setError('This account does not have admin access.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-hidden="true">
        <div className="tricolor-bar" />
        <div className="auth-brand-inner">
          <div className="auth-brand-mark">
            <span className="gov-emblem">NK</span>
            <div>
              <p className="auth-brand-org">Government of India &middot; Sentinal Programme</p>
              <p className="auth-brand-title">NIRVIK Administrative Portal</p>
            </div>
          </div>

          <p className="auth-brand-copy">
            The administrative console for NIRVIK. Sign in with your system administrator
            account to manage registration requests and platform access.
          </p>

          <ul className="auth-brand-list">
            <li>Review pending registration requests</li>
            <li>Approve or reject applicant accounts</li>
            <li>Oversee citizen, official and admin access</li>
          </ul>

          <p className="auth-brand-footnote">
            This portal is restricted to authorised personnel. Access attempts are logged.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card card">
          <div className="auth-card-head">
            <h1>Admin sign in</h1>
            <p>Enter your administrator credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                Email address
              </label>
              <input
                id="admin-email"
                className="form-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                className="form-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert-danger" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg auth-submit"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="auth-panel-footnote">
          Looking to register instead?{' '}
          <a href="/register">Submit a registration request</a>.
        </p>
      </section>
    </main>
  )
}