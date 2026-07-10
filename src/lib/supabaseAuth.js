/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Supabase Auth Adapter (v14.0 Production)
 * ============================================================================
 * Security: CIA Triad, PoLP, Absolute Session Kill
 * Usability: Seamless Redirection, Institutional Metadata Mapping
 * ============================================================================
 */

import { supabase } from './supabaseClient';

export const supabaseAuth = {
  /** 
   * Check if a user session is currently valid.
   * Used by Protected Routes to prevent unauthorized access.
   */
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  /** 
   * Institutional Identity Engine
   * Fetches Auth metadata + DB Profile to build a complete Staff/Admin object.
   */
  async me() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // Fetch hierarchical profile from public.profiles (Section 3.1 of Schema)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Institutional Identity Sync Error:", profileError.message);
    }

    // Merged Object for High Usability in Frontend
    return {
      id: user.id,
      email: user.email,
      email_confirmed: !!user.email_confirmed_at,
      full_name: profile?.full_name || user.user_metadata?.full_name,
      role: profile?.role || 'public',
      portal_role: profile?.portal_role || 'public',
      directorate: profile?.directorate,
      department: profile?.department,
      sub_role: profile?.sub_role || profile?.designation,
      is_active: profile?.is_active ?? false, // Security Gate
      last_login: user.last_sign_in_at,
      ...profile,
    };
  },

  /** 
   * Secure Login
   * Seamlessly logs the user in and prepares the Institutional Profile.
   */
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    if (error) throw error;
    return data;
  },

  /** 
   * Institutional Onboarding (Registration)
   * Includes 'emailRedirectTo' for seamless return after verification.
   */
  async register({ email, password, full_name, role, portal_role, directorate, department, sub_role }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name,
          role: role || 'staff',
          portal_role: portal_role || 'staff',
          directorate,
          department,
          sub_role
        },
        // SEAMLESS REDIRECTION: Link in email returns user to the login with a success flag
        emailRedirectTo: `${window.location.origin}/login?verified=true`
      },
    });
    if (error) throw error;
    return data;
  },

  /** 
   * Session Health Check
   * Forces a session refresh to ensure JWT tokens haven't been tampered with.
   */
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  },

  /** 
   * Logout + Absolute Session Kill 
   * Purges browser memory/cache/localStorage to prevent back-button data theft.
   */
  async logout(redirectUrl = '/') {
    // 1. Kill server-side session globally
    await supabase.auth.signOut({ scope: 'global' });

    // 2. Clear application memory (Absolute Kill)
    window.localStorage.clear();
    window.sessionStorage.clear();

    // 3. Clear cookies (Standard Practice)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 4. Forced Redirection
    window.location.href = redirectUrl;
  },

  /** 
   * Role-Based Identity Redirector
   * Intelligently routes the user based on their Institutional Designation.
   */
  async resolvePostLoginRoute() {
    try {
      const profile = await this.me();
      
      // If profile fetch fails or user is inactive
      if (!profile || !profile.is_active) {
        return '/login?error=pending_approval';
      }

      // Tiered Routing based on Org Chart
      if (profile.role === 'super_admin' || profile.role === 'admin') {
        return '/admin';
      }
      
      if (profile.role === 'staff') {
        return '/staff/handshake';
      }

      // Open Data Dissemination default
      return '/public/glance'; 
    } catch (e) {
      return '/'; // The "Fail-Safe" route
    }
  },

  /** Dynamic Login Redirector with 'Next' param preservation */
  redirectToLogin(nextUrl) {
    const loginUrl = nextUrl
      ? `/login?next=${encodeURIComponent(nextUrl)}`
      : '/login';
    window.location.href = loginUrl;
  },

  /** Auth State Observer */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabaseAuth;