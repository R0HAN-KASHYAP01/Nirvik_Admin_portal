'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_CONFIG } from '@/lib/registrationConfig'
import { schemeLabel, categoryLabel } from '@/lib/schemeCatalog'

const prettify = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Formatted from UTC parts so the server and client render identical markup.
const formatDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const STATUS_BADGE = {
  approved: 'badge-success',
  rejected: 'badge-danger',
  pending: 'badge-warning',
}

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

  // Approve / reject through ONE database function (review_registration).
  // It updates profiles + the role table + the notification in a single
  // transaction and returns a real error if anything is blocked. The old
  // three separate updates could be silently blocked by RLS (0 rows changed,
  // no error), which made the page just reload with nothing happening.
  const updateStatus = async (newStatus) => {
    if (!tableName) {
      alert(`Unknown role table for "${app.role}" — cannot update.`)
      return
    }

    const cleanReason = reason.trim()
    if (newStatus === 'rejected' && !cleanReason) {
      alert('Please enter a reason for rejecting this application.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const notifyMessage =
        newStatus === 'approved'
          ? `Your ${roleLabel} registration on NIRVIK has been approved. You can now log in.`
          : `Your ${roleLabel} registration on NIRVIK was rejected. Reason: ${cleanReason}`

      const { error } = await supabase.rpc('review_registration', {
        p_profile_id: app.profile_id,
        p_table: tableName,
        p_status: newStatus,
        p_reason: newStatus === 'rejected' ? cleanReason : null,
        p_title:
          newStatus === 'approved' ? 'Registration Approved' : 'Registration Rejected',
        p_message: notifyMessage,
      })

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    } catch (err) {
      alert(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const viewDocument = async (path) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .storage.from('registration-documents')
      .createSignedUrl(path, 60)
    if (error) { alert(error.message); return }
    window.open(data.signedUrl, '_blank')
  }

  const visibleDetails = otherDetailEntries.filter(([, v]) => v)
  const availableDocs = fileFieldNames.filter((name) => details[name])
  const receivedOn = formatDate(app.created_at)
  const reasonInputId = `reject-reason-${app.role}-${app.profile_id}`

  return (
    <>
      <tr>
        <td>
          <p className="applicant-name">{app.full_name}</p>
          <p className="applicant-contact">{app.official_email}</p>
          <p className="applicant-contact">{app.mobile_number}</p>
        </td>

        <td>
          <span className="badge badge-info">{roleLabel}</span>
        </td>

        <td>
          {visibleDetails.length > 0 ? (
            <dl className="detail-list">
              {visibleDetails.map(([key, value]) => {
                const displayValue =
                  key === 'scheme_code' ? schemeLabel(value)
                  : key === 'scheme_category' ? categoryLabel(value)
                  : value
                return (
                  <div key={key} className="detail-item">
                    <dt>{labelFor(key)}</dt>
                    <dd>{displayValue}</dd>
                  </div>
                )
              })}
            </dl>
          ) : (
            <span className="cell-blank">No extra details</span>
          )}
        </td>

        <td>
          {availableDocs.length > 0 ? (
            <ul className="doc-list">
              {availableDocs.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="doc-link"
                    onClick={() => viewDocument(details[name])}
                  >
                    {labelFor(name)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <span className="cell-blank">None uploaded</span>
          )}
        </td>

        <td className="cell-date">{receivedOn || <span className="cell-blank">Not recorded</span>}</td>

        <td className="gov-col-action">
          {readOnly ? (
            <span className={`badge ${STATUS_BADGE[app.status] || 'badge-neutral'}`}>
              {app.status}
            </span>
          ) : (
            <div className="row-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm btn-approve"
                disabled={loading}
                onClick={() => updateStatus('approved')}
              >
                {loading ? 'Working…' : 'Approve'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-reject"
                disabled={loading}
                aria-expanded={showReasonBox}
                aria-controls={reasonInputId}
                onClick={() => setShowReasonBox(!showReasonBox)}
              >
                Reject
              </button>
            </div>
          )}
        </td>
      </tr>

      {showReasonBox && (
        <tr className="gov-row-form">
          <td colSpan={6}>
            <div className="reject-panel">
              <label className="form-label" htmlFor={reasonInputId}>
                Reason for rejecting {app.full_name}
              </label>
              <div className="reject-controls">
                <input
                  id={reasonInputId}
                  className="form-input"
                  placeholder="For example: Uploaded ID document is unreadable"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={loading || !reason.trim()}
                  onClick={() => updateStatus('rejected')}
                >
                  Reject application
                </button>
              </div>
              <p className="form-hint">This reason is sent to the applicant.</p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}