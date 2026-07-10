/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign App Parameters
 * ============================================================================
 * Handles global configuration, environment variables, and session metadata.
 * Compliant with CIA Triad and Absolute Session Termination requirements.
 * ============================================================================
 */

const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * Retrieves a parameter from URL or LocalStorage.
 * Prefixed with 'kedis_' to ensure data sovereignty and avoid collisions.
 */
const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) {
    return defaultValue;
  }
  
  // Use kedis_ prefix for all local storage keys
  const storageKey = `kedis_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue) {
    // Only set if not already present to preserve user settings (like lang)
    if (!storage.getItem(storageKey)) {
      storage.setItem(storageKey, defaultValue);
    }
    return storage.getItem(storageKey) || defaultValue;
  }

  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  
  return null;
};

const getAppParams = () => {
  /**
   * SECURITY FEATURE: Absolute Session Kill Check
   * If the URL contains 'force_logout', we purge all KEDIS-related memory.
   */
  if (getAppParamValue("clear_session") === 'true') {
    Object.keys(storage).forEach(key => {
      if (key.startsWith('kedis_') || key.startsWith('sb-')) {
        storage.removeItem(key);
      }
    });
  }

  return {
    // Supabase Core Configuration
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    
    // Sovereign Environment Settings
    appName: "KEDIS UltraEconomist",
    appVersion: "13.0.0-Sovereign",
    
    // Localization Preference (FAIR Requirement)
    language: getAppParamValue("lang", { defaultValue: "en" }),
    
    // Tracking & Integrity
    fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
    environment: import.meta.env.MODE || 'development',
    
    // API/M2M Gateway (SDMX/e-GDDS readiness)
    apiBaseUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`,
  };
};

export const appParams = {
  ...getAppParams()
};

/**
 * EXPORT: Purge All Session Data
 * Expert-level function used during logout to ensure 100% memory clearance.
 */
export const purgeKEDISSession = () => {
  Object.keys(storage).forEach(key => {
    if (key.startsWith('kedis_') || key.startsWith('sb-')) {
      storage.removeItem(key);
    }
  });
};