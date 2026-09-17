import { createClient } from '@/lib/supabase/server'
import ApplicationsTable from './ApplicationsTable'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('all_registration_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="gov-container gov-page">
        <div className="card">
          <div className="card-header">Applications could not be loaded</div>
          <div className="card-body">
            <p className="gov-text-muted">
              The registration request list did not load. Refresh the page, and if the
              problem continues, report the message below to the system administrator.
            </p>
            <p className="form-error gov-error-detail">{error.message}</p>
          </div>
        </div>
      </main>
    )
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')
  const approved = requests.filter((r) => r.status === 'approved')
  const rejected = requests.filter((r) => r.status === 'rejected')

  const stats = [
    {
      key: 'total',
      label: 'Total applications',
      value: requests.length,
      note: 'All registration requests received',
    },
    {
      key: 'pending',
      label: 'Awaiting review',
      value: pending.length,
      note: 'Needs an approval decision',
    },
    {
      key: 'approved',
      label: 'Approved',
      value: approved.length,
      note: 'Applicant can now sign in',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: rejected.length,
      note: 'Applicant was notified with a reason',
    },
  ]

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
            <p className="gov-masthead-title">NIRVIK Administrative Portal</p>
          </div>
          <span className="gov-masthead-role">Super Admin</span>
        </div>
      </header>

      <main className="gov-container gov-page">
        <div className="gov-page-head">
          <h1>Registration requests</h1>
          <p>
            Review applications submitted for access to NIRVIK. Approving a request lets the
            applicant sign in; rejecting one sends them the reason you enter.
          </p>
        </div>

        <section aria-label="Application summary">
          <div className="stat-grid">
            {stats.map((stat) => (
              <div key={stat.key} className={`stat-card stat-card-${stat.key}`}>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-note">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="pending-heading">
          <div className="section-head">
            <h2 id="pending-heading">Awaiting review</h2>
            <span className="section-count">
              {pending.length} {pending.length === 1 ? 'application' : 'applications'}
            </span>
          </div>

          <ApplicationsTable
            applications={pending}
            caption="Registration requests awaiting an approval decision"
            actionColumnLabel="Decision"
            emptyTitle="Nothing waiting for review"
            emptyText="New registration requests appear here as soon as they are submitted."
          />
        </section>

        <section aria-labelledby="reviewed-heading">
          <div className="section-head">
            <h2 id="reviewed-heading">Already reviewed</h2>
            <span className="section-count">
              {reviewed.length} {reviewed.length === 1 ? 'application' : 'applications'}
            </span>
          </div>

          <ApplicationsTable
            applications={reviewed}
            readOnly
            caption="Registration requests that have already been approved or rejected"
            actionColumnLabel="Status"
            emptyTitle="No decisions recorded yet"
            emptyText="Applications you approve or reject are listed here."
          />
        </section>
      </main>
    </>
  )
}