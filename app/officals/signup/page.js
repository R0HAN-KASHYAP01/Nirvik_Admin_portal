'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const initialForm = {
  fullName: '',
  officialEmail: '',
  mobileNumber: '',
  employeeId: '',
  designation: '',
  department: '',
  officialLevel: 'district',
  state: '',
  district: '',
  officeLocation: '',
  password: '',
}

// strip characters Supabase Storage keys don't like
const safeName = (name) =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_')

export default function OfficialSignupPage() {
  const [form, setForm] = useState(initialForm)
  const [govIdFile, setGovIdFile] = useState(null)
  const [authDocFile, setAuthDocFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const router = useRouter()

  const update = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!govIdFile || !authDocFile) {
      setError(
        'Please attach both the Government ID and the Authorization document.'
      )
      return
    }

    setLoading(true)

    const supabase = createClient()

    try {
      // ============================================
      // 1. Create the Auth user
      // ============================================

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: form.officialEmail,
          password: form.password,
        })

      if (signUpError) {
        throw signUpError
      }

      const userId = signUpData.user?.id

      if (!userId) {
        throw new Error('Could not create account. Please try again.')
      }

      // If email confirmation is ON, there is no session yet and every
      // request below runs as an anonymous user — RLS will reject them.
      if (!signUpData.session) {
        throw new Error(
          'Please confirm your email address, then sign in to finish your registration request.'
        )
      }

      // ============================================
      // 2. Create/update profiles row
      // ============================================

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: form.fullName,
            role: 'official',
            status: 'pending',
          },
          {
            onConflict: 'id',
          }
        )

      if (profileError) {
        throw profileError
      }

      // ============================================
      // 3. Upload documents
      // ============================================

      const uploadDoc = async (file, label) => {
        const path = `${userId}/${label}-${Date.now()}-${safeName(file.name)}`

        const { error: uploadError } = await supabase.storage
          .from('official-documents')
          .upload(path, file)

        if (uploadError) {
          throw uploadError
        }

        return path
      }

      const govIdPath = await uploadDoc(govIdFile, 'gov-id')
      const authDocPath = await uploadDoc(authDocFile, 'auth-doc')

      // ============================================
      // 4. Insert official application
      //    (status lives on profiles, not here)
      // ============================================

      const { error: insertError } = await supabase
        .from('officials')
        .insert({
          profile_id: userId,
          full_name: form.fullName,
          official_email: form.officialEmail,
          mobile_number: form.mobileNumber,
          employee_id: form.employeeId,
          designation: form.designation,
          department: form.department,
          official_level: form.officialLevel,
          state: form.state,
          district: form.district,
          office_location: form.officeLocation,
          government_id_path: govIdPath,
          authorization_doc_path: authDocPath,
        })

      if (insertError) {
        throw insertError
      }

      // ============================================
      // 5. Success
      // ============================================

      router.push('/officials/signup/success')
    } catch (err) {
      console.error('Official signup error:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
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
        <div className="auth-card auth-card-wide card">
          <div className="auth-card-head">
            <h1>Official — registration request</h1>
            <p>
              Your request will be reviewed by the system admin before your account is
              activated.
            </p>
          </div>

          <div className="card-body auth-card-body">
            <form onSubmit={handleSubmit} noValidate className="field-grid auth-form">
              <Field
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={update}
                required
              />

              <Field
                label="Official Email"
                name="officialEmail"
                type="email"
                value={form.officialEmail}
                onChange={update}
                required
              />

              <Field
                label="Mobile Number"
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={update}
                required
              />

              <Field
                label="Employee ID"
                name="employeeId"
                value={form.employeeId}
                onChange={update}
                required
              />

              <Field
                label="Designation"
                name="designation"
                value={form.designation}
                onChange={update}
                required
              />

              <Field
                label="Department"
                name="department"
                value={form.department}
                onChange={update}
                required
              />

              {/* Official level */}
              <div className="form-group">
                <label className="form-label" htmlFor="officialLevel">
                  Official Level
                </label>

                <select
                  id="officialLevel"
                  className="form-select"
                  name="officialLevel"
                  value={form.officialLevel}
                  onChange={update}
                  required
                >
                  <option value="district">District</option>
                  <option value="state">State</option>
                  <option value="mosje">MoSJE</option>
                  <option value="central">Central</option>
                </select>
              </div>

              <Field
                label="State"
                name="state"
                value={form.state}
                onChange={update}
                required
              />

              <Field
                label="District"
                name="district"
                value={form.district}
                onChange={update}
                required
              />

              <Field
                label="Office Location"
                name="officeLocation"
                value={form.officeLocation}
                onChange={update}
                required
              />

              {/* Government ID */}
              <div className="form-group field-full">
                <label className="form-label" htmlFor="govIdFile">
                  Government ID (document)
                </label>

                <input
                  id="govIdFile"
                  type="file"
                  className="form-file"
                  required
                  onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                />
              </div>

              {/* Authorization document */}
              <div className="form-group field-full">
                <label className="form-label" htmlFor="authDocFile">
                  Authorization / Official Document
                </label>

                <input
                  id="authDocFile"
                  type="file"
                  className="form-file"
                  required
                  onChange={(e) => setAuthDocFile(e.target.files?.[0] || null)}
                />
              </div>

              <Field
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={update}
                required
                full
              />

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
          </div>
        </div>
      </main>
    </>
  )
}

function Field({ label, name, value, onChange, type = 'text', required, full = false }) {
  return (
    <div className={`form-group${full ? ' field-full' : ''}`}>
      <label className="form-label" htmlFor={name}>
        {label}
      </label>

      <input
        id={name}
        className="form-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  )
}