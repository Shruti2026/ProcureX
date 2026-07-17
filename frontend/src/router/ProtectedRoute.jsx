import { Navigate } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'

/**
 * Wraps a route and enforces authentication + role checks.
 *
 * Props:
 *   user         — current user object from AuthContext (null if not logged in)
 *   loading      — true while silent refresh is in progress on page load
 *   allowedRoles — array of role strings allowed to access this route
 *   children     — the protected page component
 *
 * Note: Until AuthContext is wired in Day 2, pass user/loading as props
 * from App.jsx. After Day 2, this reads directly from useAuth().
 */
export default function ProtectedRoute({ user, loading, allowedRoles = [], children }) {
  // Still checking session on first load
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but wrong role
  if (allowedRoles.length > 0 && !allowedRoles.some((r) => user.roles?.includes(r))) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
