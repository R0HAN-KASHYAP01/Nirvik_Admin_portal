'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_CONFIG } from '@/lib/registrationConfig'

const prettify = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function ApplicationRow({ app, readOnly = false }) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [showReasonBox, setShowReasonBox] = useState(false)
  const router = useRouter()

  const config = ROLE_CONFIG[app.role]
  const roleLabel = config?.label || app.role
  const tableName = config?.table
  const details = app.details || {}

  const fileFieldNames = config
    ? config.fields.filter((f) => f.type === 'file').map((f) => f.name)
    : Object.keys(details).filter((k) => k.endsWith('_path'))

  const otherDetailEntries = Object.entries(details).filter(
    ([key]) => !fileFieldNames.includes(key)
  )

  const labelFor = (name) =>
    config?.fields.find((f) => f.name === name)?.label || prettify(name)

  const updateStatus = async (newStatus) => {
    if (!tableName) {
      alert(`Unknown role table for "${app.role}" — cannot update.`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', app.profile_id)

    const { error: roleTableErr } = await supabase
      .from(tableName)
      .update({
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: newStatus === 'rejected' ? reason : null,
      })
      .eq('profile_id', app.profile_id)

    const notifyMessage =
      newStatus === 'approved'
        ? `Your ${roleLabel} registration on NIRVIK has been approved. You can now log in.`
        : `Your ${roleLabel} registration on NIRVIK was rejected. Reason: ${reason}`

    const { error: notifyErr } = await supabase.from('notifications').insert({
      profile_id: app.profile_id,
      title: newStatus === 'approved' ? 'Registration Approved' : 'Registration Rejected',
      message: notifyMessage,
      notification_type: 'registration',
    })

    setLoading(false)

    const firstError = profileErr || roleTableErr || notifyErr
    if (firstError) {
      alert(firstError.message)
      return
    }

    router.refresh()
  }

  const viewDocument = async (path) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .storage.from('registration-documents')
      .createSignedUrl(path, 60)
    if (error) { alert(error.message); return }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-700 rounded px-2 py-0.5">
              {roleLabel}
            </span>
            <p className="font-medium">{app.full_name}</p>
          </div>

          <p className="text-sm text-gray-600">
            {app.official_email} · {app.mobile_number}
          </p>

          {otherDetailEntries.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {otherDetailEntries
                .filter(([, v]) => v)
                .map(([key, value]) => `${labelFor(key)}: ${value}`)
                .join(' · ')}
            </p>
          )}

          {fileFieldNames.length > 0 && (
            <div className="mt-2 space-x-3 text-sm">
              {fileFieldNames.map((name) =>
                details[name] ? (
                  <button
                    key={name}
                    className="text-blue-600 underline"
                    onClick={() => viewDocument(details[name])}
                  >
                    {labelFor(name)}
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>

        {readOnly ? (
          <span
            className={`text-sm font-medium whitespace-nowrap ${
              app.status === 'approved' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {app.status}
          </span>
        ) : (
          <div className="space-x-2 whitespace-nowrap">
            <button
              disabled={loading}
              onClick={() => updateStatus('approved')}
              className="bg-green-600 text-white text-sm rounded px-3 py-1.5 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={loading}
              onClick={() => setShowReasonBox(!showReasonBox)}
              className="bg-red-600 text-white text-sm rounded px-3 py-1.5 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {showReasonBox && (
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            disabled={loading || !reason}
            onClick={() => updateStatus('rejected')}
            className="bg-red-700 text-white text-sm rounded px-3 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}