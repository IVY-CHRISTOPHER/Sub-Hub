// This is the top-level screen of the website. It decides what to show:
// the login form if you're signed out, or your dashboard if you're signed in.
import { useState } from 'react'
import { getToken, setToken } from './api'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'
import './SubHub.css'   // The file that controls how things look

function App() {
  // Remember whether the user is logged in. We start as "logged in" if a saved token exists.
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))

  // Light or dark look. The page's starting theme was already set by a small script in index.html.
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')

  // Flip between light and dark, apply it to the page, and remember the choice for next visit.
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('subhub_theme', next)
    setTheme(next)
  }

  // Log out: erase the saved token and switch back to the login screen.
  const logout = () => {
    setToken(null)
    setLoggedIn(false)
  }

  return (
    <div className="app">
      {/* The page header: logo and app name, the light/dark toggle, and Log out when signed in */}
      <header className="row between">
        <div className="brand">
          <span className="logo" aria-hidden="true">S</span>
          <h1>Sub-Hub</h1>
        </div>
        <div className="row">
          <button
            className="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className={theme === 'dark' ? 'sun' : 'moon'} aria-hidden="true">
              {theme === 'dark' ? '☀\uFE0E' : '☾\uFE0E'}
            </span>
          </button>
          {loggedIn && <button onClick={logout}>Log out</button>}
        </div>
      </header>
      {/* The main area: dashboard if logged in, otherwise the login/sign-up form */}
      <main>{loggedIn ? <Dashboard /> : <AuthForm onAuth={() => setLoggedIn(true)} />}</main>
    </div>
  )
}

export default App
