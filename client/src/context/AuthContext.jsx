import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, registerUser, logoutUser, getMe } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'cl_token'
const USER_KEY  = 'cl_user'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(true)  // true while verifying stored token

  // ── Verify stored token on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return }

    getMe(token)
      .then(data => {
        setUser(data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      })
      .catch(() => {
        // Token expired or invalid — clear it
        _clear()
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Internal helpers ──────────────────────────────────────────────────────
  function _save(tok, usr) {
    localStorage.setItem(TOKEN_KEY, tok)
    localStorage.setItem(USER_KEY, JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }

  function _clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  // ── Public API ────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { token: tok, user: usr } = await loginUser(email, password)
    _save(tok, usr)
    return usr
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { token: tok, user: usr } = await registerUser(name, email, password)
    _save(tok, usr)
    return usr
  }, [])

  const logout = useCallback(async () => {
    try { await logoutUser(token) } catch { /* ignore */ }
    _clear()
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
