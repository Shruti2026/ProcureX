import { Navigate } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";

/**
 * Protects routes based on authentication and roles.
 */
export default function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { user, loading } = useAuth();

  // Checking session on initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have required role
  const hasAccess =
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => user.roles?.includes(role));

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Allow access
  return children;
}