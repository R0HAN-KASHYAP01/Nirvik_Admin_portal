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
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Official — Registration Request
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        Your request will be reviewed by the System Admin before your account is
        activated.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <label className="block text-sm font-medium mb-1">
            Official Level
          </label>

          <select
            className="w-full border rounded px-3 py-2"
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
        <div>
          <label className="block text-sm font-medium mb-1">
            Government ID (document)
          </label>

          <input
            type="file"
            required
            onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Authorization document */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Authorization / Official Document
          </label>

          <input
            type="file"
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
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </main>
  )
}

function Field({ label, name, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>

      <input
        className="w-full border rounded px-3 py-2"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  )
}