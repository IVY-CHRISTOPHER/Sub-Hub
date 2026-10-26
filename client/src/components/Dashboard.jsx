// The main screen after logging in: totals, upcoming renewals, the list of subscriptions,
// and the buttons to add, edit, pause, and delete them.
import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api'
import { money } from '../presets'
import SubscriptionForm from './SubscriptionForm'
import BankImport from './BankImport'
import ConfirmDialog from './ConfirmDialog'

// How many days from now until a date (86400000 = milliseconds in one day).
const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / 86400000)

export default function Dashboard() {
  // The page's memory:
  const [subs, setSubs] = useState([])            // the list of subscriptions
  const [summary, setSummary] = useState(null)    // the totals from the server
  const [loading, setLoading] = useState(true)    // true until the first load finishes
  const [error, setError] = useState('')          // a page-level error message
  const [formError, setFormError] = useState('')  // an error shown inside the form
  const [saving, setSaving] = useState(false)     // true while a save is in progress
  const [editing, setEditing] = useState(null) // null = form hidden | 'new' = adding | subscription = editing it
  const [toDelete, setToDelete] = useState(null)  // the subscription waiting on delete confirmation (or null)

  // Ask the server for the latest list and totals, and refresh the screen with them.
  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([api.get('/subscriptions'), api.get('/subscriptions/summary')])
      setSubs(list.data)
      setSummary(sum.data)
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Load the data once, when the dashboard first appears.
  useEffect(() => {
    Promise.all([api.get('/subscriptions'), api.get('/subscriptions/summary')])
      .then(([list, sum]) => {
        setSubs(list.data)
        setSummary(sum.data)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  // Save the form: create a new subscription or update the one being edited, then refresh.
  const save = async (data) => {
    setSaving(true)
    setFormError('')
    try {
      if (editing === 'new') await api.post('/subscriptions', data)
      else await api.put(`/subscriptions/${editing._id}`, data)
      setEditing(null)
      await load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Delete the subscription the user confirmed in the pop-up, then refresh.
  const confirmDelete = async () => {
    const sub = toDelete
    setToDelete(null)   // Close the pop-up right away
    try {
      await api.delete(`/subscriptions/${sub._id}`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  // Pause an active subscription (stops counting it in totals) or resume a paused one.
  const toggle = async (sub) => {
    try {
      await api.put(`/subscriptions/${sub._id}`, { status: sub.status === 'active' ? 'paused' : 'active' })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  // While the first load is happening, show a simple message instead of the page.
  if (loading) return <p className="empty">Loading…</p>

  return (
    <div>
      {/* Page-level error message, only shown if something failed */}
      {error && <p role="alert" className="error">{error}</p>}

      {/* Three summary boxes at the top */}
      <section className="stats">
        <div className="card">
          <small>Monthly total</small>
          <strong>{money(summary?.monthlyTotal ?? 0)}</strong>
        </div>
        <div className="card">
          <small>Yearly total</small>
          <strong>{money(summary?.yearlyTotal ?? 0)}</strong>
        </div>
        <div className="card">
          <small>Active subscriptions</small>
          <strong>{summary?.activeCount ?? 0}</strong>
        </div>
      </section>

      {/* Spending broken down by category, with a bar showing each one's share */}
      {summary && Object.keys(summary.byCategory).length > 0 && (
        <section className="card">
          <h3>By category</h3>
          <ul className="cats">
            {Object.entries(summary.byCategory).map(([cat, amount]) => (
              <li key={cat}>
                <div className="cat-top"><span>{cat}</span><span>{money(amount)}/mo</span></div>
                <div className="bar"><span style={{ width: `${(amount / summary.monthlyTotal) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Charges coming up in the next 30 days, with how many days away each one is */}
      {summary?.upcoming.length > 0 && (
        <section className="card">
          <h3>Renewing in the next 30 days</h3>
          <ul className="upcoming">
            {summary.upcoming.map((s) => (
              <li key={s._id}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="when">{new Date(s.nextBillingDate).toLocaleDateString()}</div>
                </div>
                <div className="row">
                  <span>{money(s.price, s.currency)}</span>
                  <span className="chip">in {daysUntil(s.nextBillingDate)}d</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* If adding/editing, show the form; otherwise show the "Add subscription" button */}
      {editing ? (
        <SubscriptionForm
          key={editing === 'new' ? 'new' : editing._id}
          initial={editing === 'new' ? null : editing}
          onSave={save}
          onCancel={() => { setEditing(null); setFormError('') }}
          saving={saving}
          error={formError}
        />
      ) : (
        <button className="primary" onClick={() => setEditing('new')}>+ Add subscription</button>
      )}

      {/* The "find subscriptions from my bank" box */}
      <BankImport onImported={load} />

      {/* The full table of the user's subscriptions */}
      <section>
        <h3>Your subscriptions</h3>
        {subs.length === 0 ? (
          <p className="empty card">No subscriptions yet. Add your first one above.</p>
        ) : (
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Price</th><th>Per month</th><th>Next billing</th><th>Status</th><th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {/* One table row per subscription; paused ones are faded out */}
              {subs.map((s) => (
                <tr key={s._id} className={s.status === 'paused' ? 'paused' : ''}>
                  <td><strong>{s.name}</strong><br /><small>{s.category}</small></td>
                  <td>{money(s.price, s.currency)} / {s.cycle}</td>
                  <td>{money(s.monthlyCost, s.currency)}</td>
                  <td>{new Date(s.nextBillingDate).toLocaleDateString()}</td>
                  <td><span className={`pill ${s.status}`}>{s.status}</span></td>
                  {/* Buttons to edit, pause/resume, or delete this subscription */}
                  <td>
                    <div className="row">
                      <button onClick={() => setEditing(s)}>Edit</button>
                      <button onClick={() => toggle(s)}>{s.status === 'active' ? 'Pause' : 'Resume'}</button>
                      <button className="danger" onClick={() => setToDelete(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      {/* Our custom "Are you sure?" pop-up for deleting a subscription */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete subscription?"
        message={toDelete ? `This will permanently remove ${toDelete.name} from Sub-Hub.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
