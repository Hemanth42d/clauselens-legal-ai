import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './ui/LoadingSpinner'

/**
 * ProtectedRoute — renders children only when user is authenticated.
 * Redirects to /signin, preserving the attempted URL in location.state.from
 * so the user lands back here after signing in.
 */
export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner label="Loading…" />
      </div>
    )
  }

  if (!isAuth) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  }

  return children
}
