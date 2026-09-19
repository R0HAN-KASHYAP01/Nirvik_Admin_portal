// app/register/page.js
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_CONFIG, ROLE_OPTIONS } from '@/lib/registrationConfig'
import { SCHEME_CATEGORIES, schemesForCategory } from '@/lib/schemeCatalog'
import { INDIA_STATES, districtsForState } from '@/lib/indiaLocations'

const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

export default function RegisterPage() {
  const [role, setRole] = useState('')
  const [values, setValues] = useState({})
  const [files, setFiles] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const config = role ? ROLE_CONFIG[role] : null

  const textFields = useMemo(
    () => (config ? config.fields.filter((f) => f.type !== 'file') : []),
    [config]
  )
  const fileFields = useMemo(
    () => (config ? config.fields.filter((f) => f.type === 'file') : []),
    [config]
  )

  // A district dropdown only makes sense when this role also asks for a state.
  const hasStateField = useMemo(
    () => textFields.some((f) => f.name === 'state'),
    [textFields]
  )

  const handleRoleChange = (e) => {
    setRole(e.target.value)
    setValues({})
    setFiles({})
    setError(null)
  }

  const handleValueChange = (name, val) => {
    setValues((prev) => {
      const next = { ...prev, [name]: val }
      if (name === 'scheme_category') {
        next.scheme_code = '' // dependent field must reset when category changes
      }
      if (name === 'state') {
        next.district = '' // districts belong to a state, so reset on change
      }
      return next
    })
  }

  const handleFileChange = (name, file) => {
    setFiles((prev) => ({ ...prev, [name]: file }))
  }

  // Renders the right control for a field. State and district are matched by
  // field name (the same name is used as the database column in the insert).
  const renderControl = (f) => {
    const id = `field-${f.name}`

    if (f.type === 'scheme_category') {
      return (
        <select
          id={id}
          className="form-select"
          value={values.scheme_category || ''}
          onChange={(e) => handleValueChange('scheme_category', e.target.value)}
          required={f.required}
        >
          <option value="">Select a category…</option>
          {SCHEME_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      )
    }

    if (f.type === 'scheme_code') {
      return (
        <select
          id={id}
          className="form-select"
          value={values.scheme_code || ''}
          onChange={(e) => handleValueChange('scheme_code', e.target.value)}
          required={f.required}
          disabled={!values.scheme_category}
        >
          <option value="">
            {values.scheme_category ? 'Select a scheme…' : 'Choose a category first'}
          </option>
          {schemesForCategory(values.scheme_category).map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      )
    }

    if (f.name === 'state') {
      return (
        <select
          id={id}
          className="form-select"
          value={values.state || ''}
          onChange={(e) => handleValueChange('state', e.target.value)}
          required={f.required}
        >
          <option value="">Select a state / UT…</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    }

    if (f.name === 'district' && hasStateField) {
      return (
        <select
          id={id}
          className="form-select"
          value={values.district || ''}
          onChange={(e) => handleValueChange('district', e.target.value)}
          required={f.required}
          disabled={!values.state}
        >
          <option value="">
            {values.state ? 'Select a district…' : 'Choose a state first'}
          </option>
          {districtsForState(values.state).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )
    }

    return (
      <input
        id={id}
        className="form-input"
        type={f.type}
        value={values[f.name] || ''}
        onChange={(e) => handleValueChange(f.name, e.target.value)}
        required={f.required}
      />
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!config) {
      setError('Please select a role.')
      return
    }

    // The form uses noValidate, so required text fields (including the new
    // state / district dropdowns) are checked here.
    for (const f of textFields) {
      if (f.name === 'password') continue
      if (f.required && !String(values[f.name] ?? '').trim()) {
        setError(`Please fill in: ${f.label}`)
        return
      }
    }
    if (!values.password) {
      setError('Please enter a password.')
      return
    }

    for (const f of fileFields) {
      if (f.required && !files[f.name]) {
        setError(`Please attach: ${f.label}`)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const email = values.official_email
      const password = values.password

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) throw signUpError

      const userId = signUpData.user?.id
      if (!userId) throw new Error('Could not create account. Please try again.')

      if (!signUpData.session) {
        throw new Error(
          'Please confirm your email address, then sign in to finish your registration request.'
        )
      }

      const displayName = values.full_name || values.representative_name || ''

      const { error: profileError } = await supabase.from('profiles').upsert(
        { id: userId, full_name: displayName, role, status: 'pending' },
        { onConflict: 'id' }
      )
      if (profileError) throw profileError

      const uploadedPaths = {}
      for (const f of fileFields) {
        const file = files[f.name]
        if (!file) continue

        const path = `${role}/${userId}/${f.name}-${Date.now()}-${safeName(file.name)}`
        const { error: uploadError } = await supabase.storage
          .from('registration-documents')
          .upload(path, file)
        if (uploadError) throw uploadError

        uploadedPaths[f.name] = path
      }

      const insertPayload = { profile_id: userId }
      for (const f of textFields) {
        if (f.name === 'password') continue
        insertPayload[f.name] = values[f.name] ?? null
      }
      Object.assign(insertPayload, uploadedPaths)

      const { error: insertError } = await supabase.from(config.table).insert(insertPayload)
      if (insertError) throw insertError

      // Show the confirmation dialog instead of redirecting immediately.
      setSubmitted(true)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const goHome = () => {
    router.push('/')
  }

  return (
    <>
      <header className="gov-masthead">
        <div className="tricolor-bar" />
        <div className="gov-container gov-masthead-inner">
          <div className="gov-emblem" aria-hidden="true">
            NK
          </div>
          <div className="gov-masthead-text">
            <p className="gov-masthead-org">Government of India &middot; Sentinal Programme</p>
            <p className="gov-masthead-title">NIRVIK Registration Portal</p>
          </div>
        </div>
      </header>

      <main className="gov-container gov-page auth-page-wrap">
        <div className="auth-card card">
          <div className="auth-card-head">
            <h1>Register for access</h1>
            <p>
              Choose the role you are registering as. Your request will be reviewed by the
              system admin before your account is activated.
            </p>
          </div>

          <div className="card-body auth-card-body">
            <div className="form-group">
              <label className="form-label" htmlFor="register-role">
                I am registering as
              </label>
              <select
                id="register-role"
                className="form-select"
                value={role}
                onChange={handleRoleChange}
                required
                disabled={submitted}
              >
                <option value="">Select a role…</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {config && !submitted && (
              <form onSubmit={handleSubmit} noValidate className="field-grid auth-form">
                {textFields
                  .filter((f) => f.name !== 'password')
                  .map((f) => (
                    <div className="form-group" key={f.name}>
                      <label className="form-label" htmlFor={`field-${f.name}`}>
                        {f.label}
                        {f.required && ' *'}
                      </label>

                      {renderControl(f)}
                    </div>
                  ))}

                {fileFields.map((f) => (
                  <div className="form-group field-full" key={f.name}>
                    <label className="form-label" htmlFor={`field-${f.name}`}>
                      {f.label}
                      {f.required && ' *'}
                    </label>
                    <input
                      id={`field-${f.name}`}
                      type="file"
                      className="form-file"
                      required={f.required}
                      onChange={(e) => handleFileChange(f.name, e.target.files?.[0] || null)}
                    />
                  </div>
                ))}

                <div className="form-group field-full">
                  <label className="form-label" htmlFor="field-password">
                    Password *
                  </label>
                  <input
                    id="field-password"
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    value={values.password || ''}
                    onChange={(e) => handleValueChange('password', e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="alert-danger field-full" role="alert">
                    {error}
                  </div>
                )}

                <div className="field-full">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-lg auth-submit"
                  >
                    {loading ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {submitted && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Request submitted</h2>
            <p>
              Your registration request has been sent for review. This usually takes up
              to <strong>24 hours</strong>. You&apos;ll be notified once a decision is made
              — you can then log in and check your status.
            </p>
            <button onClick={goHome} className="btn btn-primary auth-submit">
              Return to home
            </button>
          </div>
        </div>
      )}
    </>
  )
}