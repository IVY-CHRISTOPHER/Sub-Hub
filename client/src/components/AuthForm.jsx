// The login / sign-up form. One form that can switch between the two modes.
import { useState } from 'react'
import api, { errorMessage, setToken } from '../api'

export default function AuthForm({ onAuth }) {
  // "State" is the form's memory: what mode it's in, what's typed, any error, and whether it's busy.
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Runs when the user presses the submit button.
  const submit = async (e) => {
    e.preventDefault()   // Stop the browser from reloading the page
    setError('')
    setLoading(true)
    try {
      // Send the email and password to the server (to /auth/login or /auth/register).
      const { data } = await api.post(`/auth/${mode}`, { email, password })
      setToken(data.token)   // Save the login token
      onAuth(data.user)      // Tell the app we're now logged in
    } catch (err) {
      setError(errorMessage(err))   // Show what went wrong
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
      {/* Email box */}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      {/* Password box (characters are hidden, minimum 8 long) */}
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>
      {/* Show an error message only if there is one */}
      {error && <p role="alert" className="error">{error}</p>}
      {/* Main button; disabled while waiting for the server */}
      <button type="submit" className="primary" disabled={loading}>
        {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
      </button>
      {/* Link-style button that flips between login and sign-up */}
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </form>
  )
}
