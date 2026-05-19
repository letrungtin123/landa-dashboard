import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/utils/store';

interface AuthGuardProps {
  requireAuth: boolean;
}

/**
 * AuthGuard — Replaces Next.js middleware for route protection.
 *
 * - requireAuth=true: Must be authenticated → otherwise redirect to /login
 * - requireAuth=false: Must NOT be authenticated → otherwise redirect to /dashboard
 *
 * Uses Zustand store directly (no cookie needed).
 */
export function AuthGuard({ requireAuth }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  // While initial auth check is in progress, render nothing to prevent flash
  if (isLoading) return null;

  // During logout, render nothing to prevent "Access Denied" flash
  if (isLoggingOut) return null;

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    const role = useAuthStore.getState().user?.role;
    return <Navigate to={role === 'learner_plus' ? '/report-summary' : '/dashboard'} replace />;
  }

  return <Outlet />;
}
