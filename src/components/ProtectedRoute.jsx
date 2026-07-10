/**
 * ============================================================================
 * KEDIS UltraEconomist — Protected Route (Supabase)
 * ============================================================================
 * REFERENCE COPY — implements Part 1 of the Master Plan.
 * To activate: copy to src/components/ProtectedRoute.jsx
 * ============================================================================
 *
 * Part 1 — The "Intended Destination" Protocol:
 *   When an unauthenticated user attempts to access a protected path,
 *   the system intercepts and redirects to /login?next=<intended_path>.
 * ============================================================================
 */

import { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  // Loading state
  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  // Auth error handling
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // For other errors, redirect to login with intended destination
    const intendedPath = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(intendedPath)}`} replace />;
  }

  // Part 1 — Capture intended destination and redirect to login
  if (!isAuthenticated) {
    const intendedPath = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(intendedPath)}`} replace />;
  }

  return <Outlet />;
}