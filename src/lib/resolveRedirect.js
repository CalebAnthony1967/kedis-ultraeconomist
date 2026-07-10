/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Redirection Engine
 * ============================================================================
 * REFERENCE COPY — implements Part 3 of the Master Plan.
 * To activate: copy to src/lib/resolveRedirect.js
 * ============================================================================
 *
 * Resolves the final destination after successful authentication using
 * a strict priority hierarchy:
 *
 *   Priority 1 (Deep Link):  ?next= param exists and is valid
 *   Priority 2 (Role):       admin → /admin, staff → /staff/handshake
 *   Priority 3 (Fallback):   /
 * ============================================================================
 */

/**
 * Check if a next-path is valid (not null, undefined, "default", or empty)
 */
export function isValidNextPath(next) {
  if (!next) return false;
  const trimmed = String(next).trim();
  if (trimmed === 'null' || trimmed === 'undefined' || trimmed === 'default') {
    return false;
  }
  if (trimmed === '' || trimmed === '/') return false;
  // Must start with / to be a valid internal path
  if (!trimmed.startsWith('/')) return false;
  return true;
}

/**
 * Resolve the redirect destination.
 *
 * @param {object} profile  - The user's profile row from public.profiles
 *   Expected fields: role ('admin'|'super_admin'|'staff'|'public'),
 *                    portal_role (optional override)
 * @param {string|null} nextParam - The ?next= query param value
 * @returns {string} The path to navigate to
 */
export function resolveRedirect(profile, nextParam) {
  // Priority 1: Deep Link
  if (isValidNextPath(nextParam)) {
    return nextParam;
  }

  // Priority 2: Institutional Role
  const role = profile?.portal_role || profile?.role || 'public';

  if (role === 'admin' || role === 'super_admin') {
    return '/admin';
  }

  if (role === 'staff') {
    return '/staff/handshake';
  }

  // Priority 3: Safety Fallback
  return '/';
}

export default resolveRedirect;