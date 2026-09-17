'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_CONFIG, ROLE_OPTIONS } from '@/lib/registrationConfig'
import { SCHEME_CATEGORIES, schemesForCategory } from '@/lib/schemeCatalog'

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
      return next
    })
  }

  const handleFileChange = (name, file) => {
    setFiles((prev) => ({ ...prev, [name]: file }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!config) {
      setError('Please select a role.')
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
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">NIRVIK — Registration</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">I am registering as</label>
        <select
          className="w-full border rounded px-3 py-2"
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
        <>
          <p className="text-sm text-gray-600 mb-6">
            Your request will be reviewed by the System Admin before your account is activated.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
                        {textFields
              .filter((f) => f.name !== 'password')
              .map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-1">
                    {f.label}
                    {f.required && ' *'}
                  </label>

                  {f.type === 'scheme_category' ? (
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={values.scheme_category || ''}
                      onChange={(e) => handleValueChange('scheme_category', e.target.value)}
                      required={f.required}
                    >
                      <option value="">Select a category…</option>
                      {SCHEME_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'scheme_code' ? (
                    <select
                      className="w-full border rounded px-3 py-2"
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
                  ) : (
                    <input
                      className="w-full border rounded px-3 py-2"
                      type={f.type}
                      value={values[f.name] || ''}
                      onChange={(e) => handleValueChange(f.name, e.target.value)}
                      required={f.required}
                    />
                  )}
                </div>
              ))}

            {fileFields.map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium mb-1">
                  {f.label}
                  {f.required && ' *'}
                </label>
                <input
                  type="file"
                  required={f.required}
                  onChange={(e) => handleFileChange(f.name, e.target.files?.[0] || null)}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="password"
                value={values.password || ''}
                onChange={(e) => handleValueChange('password', e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </>
      )}

      {submitted && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center">
            <div className="text-3xl mb-3">✅</div>
            <h2 className="text-lg font-semibold mb-2">Request Submitted</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your registration request has been sent for review. This usually takes up
              to <strong>24 hours</strong>. You&apos;ll be notified once a decision is made
              — you can then log in and check your status.
            </p>
            <button
              onClick={goHome}
              className="w-full bg-black text-white rounded py-2"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </main>
  )
}