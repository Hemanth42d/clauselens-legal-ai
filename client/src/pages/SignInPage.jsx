import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Scale, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SignInPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setError(''); setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">ClauseLens</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue to your documents.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-8 space-y-5">

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Demo hint — prominent card */}
          <div className="border-t border-gray-100 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                🚀 Try the demo account
              </p>
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between bg-white border border-blue-100 rounded px-3 py-1.5">
                  <span className="text-xs text-gray-500 font-medium">Email</span>
                  <span className="text-xs font-mono font-semibold text-gray-800">demo@clauselens.app</span>
                </div>
                <div className="flex items-center justify-between bg-white border border-blue-100 rounded px-3 py-1.5">
                  <span className="text-xs text-gray-500 font-medium">Password</span>
                  <span className="text-xs font-mono font-semibold text-gray-800">Demo1234!</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setEmail('demo@clauselens.app'); setPassword('Demo1234!') }}
                className="w-full btn-primary btn-sm justify-center"
              >
                Fill in demo credentials
              </button>
            </div>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-500 hover:text-blue-600 font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
