import { createClient } from '@/lib/supabase/server'
import ApplicationRow from './ApplicationRow'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('all_registration_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <main className="p-6 text-red-600">Failed to load applications: {error.message}</main>
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Registration Requests</h1>

      <h2 className="text-lg font-medium mb-3">Pending ({pending.length})</h2>
      <div className="space-y-3 mb-10">
        {pending.length === 0 && (
          <p className="text-gray-500 text-sm">No pending applications.</p>
        )}
        {pending.map((app) => (
          <ApplicationRow key={`${app.role}-${app.profile_id}`} app={app} />
        ))}
      </div>

      <h2 className="text-lg font-medium mb-3">Reviewed ({reviewed.length})</h2>
      <div className="space-y-3">
        {reviewed.map((app) => (
          <ApplicationRow key={`${app.role}-${app.profile_id}`} app={app} readOnly />
        ))}
      </div>
    </main>
  )
}