import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * OrgProtectedRoute
 * - Redirects to /login if not authenticated.
 * - Redirects to /organizer/setup if authenticated but not an organizer/admin.
 */
export default function OrgProtectedRoute({ children }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'organizer' && user?.role !== 'admin') {
    return <Navigate to="/organizer/setup" replace />;
  }

  return children;
}
