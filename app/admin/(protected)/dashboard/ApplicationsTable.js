'use client'

import { useMemo, useState } from 'react'
import ApplicationRow from './ApplicationRow'
import { ROLE_CONFIG } from '@/lib/registrationConfig'

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
]

export default function ApplicationsTable({
  applications,
  readOnly = false,
  caption,
  emptyTitle,
  emptyText,
  actionColumnLabel,
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')

  // Only offer a role filter when the section actually contains more than one role.
  const roleOptions = useMemo(() => {
    const seen = new Map()
    applications.forEach((app) => {
      if (!seen.has(app.role)) {
        seen.set(app.role, ROLE_CONFIG[app.role]?.label || app.role)
      }
    })
    return Array.from(seen.entries())
  }, [applications])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    const result = applications.filter((app) => {
      if (roleFilter !== 'all' && app.role !== roleFilter) return false
      if (readOnly && statusFilter !== 'all' && app.status !== statusFilter) return false
      if (!term) return true

      const roleLabel = (ROLE_CONFIG[app.role]?.label || app.role || '').toLowerCase()
      const haystack = [app.full_name, app.official_email, app.mobile_number, roleLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'name_asc':
          return (a.full_name || '').localeCompare(b.full_name || '')
        case 'name_desc':
          return (b.full_name || '').localeCompare(a.full_name || '')
        case 'created_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })
  }, [applications, search, roleFilter, statusFilter, sortBy, readOnly])

  const hasAnyApplications = applications.length > 0
  const hasActiveFilters = search.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  return (
    <>
      {hasAnyApplications && (
        <div className="table-toolbar">
          <input
            type="search"
            className="form-input table-toolbar-search"
            placeholder="Search by name, email or mobile number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search applications"
          />

          {roleOptions.length > 1 && (
            <select
              className="form-select table-toolbar-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              {roleOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}

          {readOnly && (
            <select
              className="form-select table-toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}

          <select
            className="form-select table-toolbar-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort applications"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}

          <span className="table-toolbar-count">
            {filtered.length} of {applications.length} shown
          </span>
        </div>
      )}

      <div className="table-wrap">
        <table className="gov-table gov-table-apps">
          <caption className="gov-visually-hidden">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Applicant</th>
              <th scope="col">Role</th>
              <th scope="col">Submitted details</th>
              <th scope="col">Documents</th>
              <th scope="col">Received</th>
              <th scope="col" className="gov-col-action">
                {actionColumnLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasAnyApplications ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p className="empty-state-title">{emptyTitle}</p>
                    <p className="empty-state-text">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p className="empty-state-title">No matching applications</p>
                    <p className="empty-state-text">
                      Try a different search term, or clear the filters to see all applications
                      in this section.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <ApplicationRow
                  key={`${app.role}-${app.profile_id}`}
                  app={app}
                  readOnly={readOnly}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}