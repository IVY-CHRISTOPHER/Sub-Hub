// This file sets up how the website talks to the server, so every other file can reuse it.
import axios from 'axios'   // A tool for sending requests to the server

// The name under which the login token is saved in the browser's memory.
const TOKEN_KEY = 'subhub_token'

// Read the saved login token (or nothing if logged out).
export const getToken = () => localStorage.getItem(TOKEN_KEY)
// Save the token when logging in, or erase it (when given nothing) when logging out.
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

// A ready-made messenger: all requests automatically go to addresses starting with "/api".
const api = axios.create({ baseURL: '/api' })

// Before every request leaves, attach the login token (if there is one) so the server knows who we are.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Turn any failure into a short message we can show the user.
// Prefer the server's own message, then fall back to something generic.
export const errorMessage = (err) => err.response?.data?.error || err.message || 'Something went wrong'

export default api
