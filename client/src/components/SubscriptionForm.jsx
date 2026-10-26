// The form used to add a new subscription or edit an existing one.
import { useState } from 'react'
import { CATEGORIES, PRESETS } from '../presets'

// Convert a date into the "YYYY-MM-DD" text that date input boxes need.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')

// The starting values for a brand-new, empty form (date defaults to today).
const blank = () => ({
  name: '',
  price: '',
  cycle: 'monthly',
  category: 'Streaming',
  nextBillingDate: toDateInput(new Date()),
  status: 'active',
})

// Props (inputs from the parent): initial = subscription being edited (none when adding),
// onSave / onCancel = what to do on Save / Cancel, saving = true while saving, error = message to show.
export default function SubscriptionForm({ initial, onSave, onCancel, saving, error }) {
  // The form's memory of what's currently typed. Starts from the edited item, or blank.
  const [form, setForm] = useState(() =>
    initial ? { ...initial, nextBillingDate: toDateInput(initial.nextBillingDate) } : blank()
  )
  // Makes a function that updates one field whenever the user types in it.
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  // When the user picks a service from "Quick pick", fill in its name, price, and category.
  const applyPreset = (e) => {
    const preset = PRESETS.find((p) => p.name === e.target.value)
    if (preset) setForm({ ...form, name: preset.name, price: preset.price, category: preset.category })
  }

  // When the user presses Save, hand the data (with price as a real number) to the parent.
  const submit = (e) => {
    e.preventDefault()
    onSave({ ...form, price: Number(form.price) })
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>{initial ? 'Edit subscription' : 'Add subscription'}</h3>
      {/* Quick-pick dropdown only appears when adding (not editing) */}
      {!initial && (
        <label>
          Quick pick
          <select defaultValue="" onChange={applyPreset}>
            <option value="" disabled>Choose a service…</option>
            {PRESETS.map((p) => <option key={p.name}>{p.name}</option>)}
          </select>
        </label>
      )}
      {/* Name of the service */}
      <label>
        Name
        <input value={form.name} onChange={set('name')} required maxLength={80} />
      </label>
      {/* How much it costs */}
      <label>
        Price
        <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
      </label>
      {/* How often you're charged */}
      <label>
        Billing cycle
        <select value={form.cycle} onChange={set('cycle')}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>
      {/* The date of the next charge */}
      <label>
        Next billing date
        <input type="date" value={form.nextBillingDate} onChange={set('nextBillingDate')} required />
      </label>
      {/* Group label, like Streaming or Music */}
      <label>
        Category
        <select value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      {/* Error message, only if there is one */}
      {error && <p role="alert" className="error">{error}</p>}
      {/* Save and Cancel buttons */}
      <div className="row">
        <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
