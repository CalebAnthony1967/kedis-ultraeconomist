/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Authentication & Session Context
 * ============================================================================
 * Features: 
 * - Absolute Session Kill (purges browser memory on logout)
 * - KIPPRA Org Chart Identity Mapping (Directorates/Roles)
 * - Citizen Lab Persona Management (Public Gateway)
 * - Bilingual State Integration
 * ============================================================================
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { purgeKEDISSession, appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // --- SOVEREIGN IDENTITY STATES ---
  const [user, setUser] = useState(null); // Contains Profile (Role, Sub-role, Directorate)
  const [persona, setPersona] = useState(appParams.persona || 'Citizen'); // For Public Lab
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // --- SYSTEM STATES ---
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [currentLang, setCurrentLang] = useState(appParams.language || 'en');

  useEffect(() => {
    // Initial check on mount
    checkUserAuth();

    // LISTEN: Supabase Auth State Observer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkUserAuth();
        } else if (event === 'SIGNED_OUT') {
          handleLocalLogoutPurge();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * SOVEREIGN IDENTITY ENGINE
   * Fetches user profile data and maps it to the KIPPRA Org Structure
   */
  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const session = await supabase.auth.getSession();
      
      if (!session.data.session) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // supabaseAuth.me() should be configured to return data from 'profiles' table
      // which includes: role, sub_role, directorate, and department
      const profileData = await supabaseAuth.me();

      if (profileData) {
        setUser(profileData);
        setIsAuthenticated(true);
        setAuthError(null);
      }
    } catch (error) {
      console.error('Sovereign Identity Fetch Failed:', error);
      setAuthError({
        type: 'auth_failed',
        message: error.message || 'Institutional authentication failed',
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  /**
   * SECURITY: Absolute Session Kill
   * Purges JWT, local preferences, and browser cache for this app.
   */
  const handleLocalLogoutPurge = () => {
    setUser(null);
    setIsAuthenticated(false);
    purgeKEDISSession(); // Calls the expert purge function from app-params
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await supabaseAuth.logout();
      handleLocalLogoutPurge();
      if (shouldRedirect) window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * CITIZEN LAB PERSONA SWITCHER
   * Allows public users to toggle views without a full auth session
   */
  const updatePersona = (newPersona) => {
    setPersona(newPersona);
    localStorage.setItem('kedis_persona', newPersona);
  };

  const toggleLanguage = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('kedis_lang', lang);
  };

  return (
    <AuthContext.Provider value={{
      // States
      user,
      persona,
      isAuthenticated,
      isLoadingAuth,
      authError,
      currentLang,
      
      // Org Metadata Helpers
      isManagement: user?.role === 'management' || user?.portal_role === 'admin',
      isStaff: user?.role === 'staff',
      directorate: user?.directorate,
      subRole: user?.sub_role,
      
      // Actions
      logout,
      checkUserAuth,
      updatePersona,
      toggleLanguage,
      navigateToLogin: () => window.location.href = '/login'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a KEDIS AuthProvider');
  }
  return context;
};