// The "Detect from your bank" box. It lets the user connect a bank account, shows the
// repeating charges we found, and lets them pick which ones to add as subscriptions.
import { useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'   // Plaid's tool for the secure bank-login pop-up
import api, { errorMessage } from '../api'
import { money } from '../presets'

// The "Connect your bank" button and the pop-up it opens.
function LinkButton({ onLinked, onError }) {
  const [linkToken, setLinkToken] = useState(null)

  // When the button first appears, ask our server for a one-time token that allows the pop-up to open.
  useEffect(() => {
    api.post('/plaid/link-token')
      .then(({ data }) => setLinkToken(data.linkToken))
      .catch((err) => onError(errorMessage(err)))
  }, [onError])

  // Set up the pop-up. When the user finishes logging in to their bank, onSuccess runs.
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        // Send the temporary token to our server so it can finish linking the bank.
        await api.post('/plaid/exchange', { publicToken })
        onLinked()   // Tell the parent to go look for subscriptions
      } catch (err) {
        onError(errorMessage(err))
      }
    },
  })

  // The button is disabled until the pop-up is ready to open.
  return (
    <button className="primary" onClick={() => open()} disabled={!ready}>
      Connect your bank
    </button>
  )
}

// The whole box. onImported is called after importing so the dashboard can refresh.
export default function BankImport({ onImported }) {
  // The box's memory: loading status, whether a bank is linked, and the charges found.
  const [state, setState] = useState({ loading: true, linked: false, streams: [] })
  const [selected, setSelected] = useState([])   // IDs of the charges the user has ticked
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)       // true while importing

  // Ask the server what repeating charges it can find, and tick them all by default.
  const detect = () => {
    setState((s) => ({ ...s, loading: true }))
    return api.get('/plaid/detected')
      .then(({ data }) => {
        setState({ loading: false, linked: data.linked, streams: data.streams })
        setSelected(data.streams.map((s) => s.streamId))
        setError('')
      })
      .catch((err) => {
        setState({ loading: false, linked: false, streams: [] })
        setError(errorMessage(err))
      })
  }

  // Run the same check once when the box first appears.
  useEffect(() => {
    api.get('/plaid/detected')
      .then(({ data }) => {
        setState({ loading: false, linked: data.linked, streams: data.streams })
        setSelected(data.streams.map((s) => s.streamId))
      })
      .catch((err) => {
        setState({ loading: false, linked: false, streams: [] })
        setError(errorMessage(err))
      })
  }, [])

  // Tick or untick one charge in the list.
  const toggle = (id) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  // Save the ticked charges as subscriptions, re-check for new ones, and refresh the dashboard.
  const importSelected = async () => {
    setBusy(true)
    try {
      await api.post('/plaid/import', { streamIds: selected })
      await detect()
      onImported()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h3>Detect from your bank</h3>
      {error && <p role="alert" className="error">{error}</p>}
      {/* Show one of four things: "Checking…", the connect button, "nothing found", or the list */}
      {state.loading ? (
        <p>Checking…</p>
      ) : !state.linked ? (
        <LinkButton onLinked={detect} onError={setError} />
      ) : state.streams.length === 0 ? (
        <>
          <p>No new recurring charges found.</p>
          <button onClick={detect}>Refresh</button>
        </>
      ) : (
        <>
          <ul className="detected">
            {state.streams.map((s) => (
              <li key={s.streamId}>
                <label>
                  <input type="checkbox" checked={selected.includes(s.streamId)} onChange={() => toggle(s.streamId)} />{' '}
                  {s.name} — {money(s.price, s.currency)} / {s.cycle}
                </label>
              </li>
            ))}
          </ul>
          <button className="primary" onClick={importSelected} disabled={busy || selected.length === 0}>
            {busy ? 'Importing…' : `Import ${selected.length} selected`}
          </button>
        </>
      )}
    </section>
  )
}
