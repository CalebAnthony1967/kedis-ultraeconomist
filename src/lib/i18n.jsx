import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // --- Landing & Hero ---
    'landing.badge': 'Sovereign Intelligence Platform v13.0',
    'landing.title': 'AlphaEconomist Sovereign Intelligence',
    'landing.subtitle': 'A FAIR-compliant sovereign data lakehouse delivering AI-powered causal modeling, ward-level GIS intelligence, and autonomous policy oversight.',
    'landing.cta': 'Enter Sovereign Gateway',
    'landing.objective': 'Kenya Economic Planning Data and Information System (KEDIS)',
    
    // --- Pillars ---
    'landing.pillar1.title': 'Sovereign Data Highway',
    'landing.pillar1.desc': 'Breaking MCDA silos through intelligent ETL and live connectors from KNBS, CBK, and National Treasury.',
    'landing.pillar2.title': 'AlphaEconomist Brain',
    'landing.pillar2.desc': 'Zero-hallucination Policy RAG with SPI citations, causal inference, and automated MTEF reporting.',
    'landing.pillar3.title': 'Citizen Lab (SAE)',
    'landing.pillar3.desc': 'Localized policy playgrounds and Bayesian Small Area Estimation for all 1,450 Wards.',
    
    // --- Portal Gateways ---
    'portal.admin.title': 'Control Center',
    'portal.admin.desc': 'Data factory, silo-healing engine, and Super Admin secure vault.',
    'portal.staff.title': 'KIPPRA Sovereign Hub',
    'portal.staff.desc': 'Institutional workstations, macro-modeling labs, and AI policy copilot.',
    'portal.public.title': 'Citizen Lab',
    'portal.public.desc': 'Open dissemination, ward-level GIS, and policy playgrounds.',
    'portal.select': 'Secure Institutional Gateway',
    'portal.enter': 'Authenticate Access',

    // --- Role/Org Structure (Org Chart Labels) ---
    'org.mgmt': 'Top Management',
    'org.econ': 'Economic Management',
    'org.dev': 'Integrated Development',
    'org.corp': 'Corporate Services',
    'org.ed': 'Executive Director',
    'org.legal': 'Corporation Secretary / Legal',
    'org.audit': 'Internal Audit',

    // --- Admin Functionality ---
    'admin.etl': 'Connect to Data',
    'admin.connectors': 'Live Connectors',
    'admin.registry': 'Master Registry',
    'admin.vault': 'Super Admin Vault',
    'admin.audit': 'Tracking & History',
    'admin.fair': 'FAIR Compliance Scorecard',
    'admin.silo': 'Silo-Healing Engine',

    // --- Staff Functionality ---
    'staff.workstation': 'My Workstation',
    'staff.copilot': 'AI Policy Assistant',
    'staff.digitaltwin': 'Predictive Digital Twin',
    'staff.iemh': 'Modelling Hub (IEMH)',
    'staff.reports': 'Report Automator',
    'staff.sdg': 'SDG Tracker',
    'staff.collab': 'Internal Collaboration',

    // --- Public/Citizen Lab Functionality ---
    'public.playground': 'Policy Playground',
    'public.gis': 'Kenya GIS Observatory',
    'public.stories': 'Visual Narratives',
    'public.vnr': 'SDG VNR Generator',
    'public.feedback': 'Ground-Truthing Lab',
    'public.research': 'Research Workspace',

    // --- Common UI ---
    'common.lang': 'Language / Lugha',
    'common.logout': 'Absolute Session Kill',
    'common.anonymize': 'Privacy Shield (KDPA)',
    'common.spi': 'Sovereign Persistent Identifier',
    'common.search': 'Search Lakehouse...',
    'common.loading': 'Orchestrating Intelligence...',
    'common.welcome': 'Welcome, Officer',
    'common.save': 'Commit to Pool',
    'common.cancel': 'Abandone Changes',
  },
  sw: {
    // --- Landing & Hero ---
    'landing.badge': 'Jukwaa la Ujasusi wa Kitaifa v13.0',
    'landing.title': 'AlphaEconomist Akili ya Kitaifa',
    'landing.subtitle': 'Ghala kuu la data inayozingatia kanuni za FAIR, ikitoa mifano ya kisaidiki ya AI, akili ya kijografia ya kata, na ufuatiliaji wa sera.',
    'landing.cta': 'Ingia Kwenye Lango Kuu',
    'landing.objective': 'Mfumo wa Takwimu na Taarifa za Mipango ya Kiuchumi (KEDIS)',
    
    // --- Pillars ---
    'landing.pillar1.title': 'Barabara Kuu ya Data',
    'landing.pillar1.desc': 'Kuvunja kuta za data kupitia ETL yenye akili na viunganishi vya moja kwa moja kutoka KNBS na Hazina.',
    'landing.pillar2.title': 'Ubongo wa AlphaEconomist',
    'landing.pillar2.desc': 'Ushauri wa sera bila makosa (RAG) wenye marejeleo ya SPI na uandishi wa ripoti za MTEF.',
    'landing.pillar3.title': 'Maabara ya Mwananchi',
    'landing.pillar3.desc': 'Viwanja vya sera vilivyojanibishwa na makadirio ya Bayesian kwa Kata zote 1,450.',
    
    // --- Portal Gateways ---
    'portal.admin.title': 'Kituo cha Usimamizi',
    'portal.admin.desc': 'Kiwanda cha data, injini ya kuponya data, na ghala salama la msimamizi.',
    'portal.staff.title': 'Kitovu cha KIPPRA',
    'portal.staff.desc': 'Vituo vya kazi vya kitaasisi, maabara ya uundaji modeli, na msaidizi wa sera wa AI.',
    'portal.public.title': 'Maabara ya Mwananchi',
    'portal.public.desc': 'Upashanaji wazi, ramani ya kata, na viwanja vya sera.',
    'portal.select': 'Lango Salama la Kitaasisi',
    'portal.enter': 'Thibitisha Utambulisho',

    // --- Role/Org Structure ---
    'org.mgmt': 'Usimamizi Mkuu',
    'org.econ': 'Usimamizi wa Uchumi',
    'org.dev': 'Maendeleo Jumuishi',
    'org.corp': 'Huduma za Shirika',
    'org.ed': 'Mkurugenzi Mtendaji',
    'org.legal': 'Katibu wa Shirika / Sheria',
    'org.audit': 'Ukaguzi wa Ndani',

    // --- Admin Functionality ---
    'admin.etl': 'Unganisha na Takwimu',
    'admin.connectors': 'Viunganishi Moja kwa Moja',
    'admin.registry': 'Sajili Kuu ya Data',
    'admin.vault': 'Ghala la Msimamizi Mkuu',
    'admin.audit': 'Ufuatiliaji na Historia',
    'admin.fair': 'Alama ya FAIR ya Kitaifa',
    'admin.silo': 'Injini ya Kusawazisha Data',

    // --- Staff Functionality ---
    'staff.workstation': 'Kituo Changu cha Kazi',
    'staff.copilot': 'Msaidizi wa Sera wa AI',
    'staff.digitaltwin': 'Pacha wa Kidijitali wa Kutabiri',
    'staff.iemh': 'Kituo cha Modeli (IEMH)',
    'staff.reports': 'Kiotomatiki cha Ripoti',
    'staff.sdg': 'Kifuatiliaji cha SDG',
    'staff.collab': 'Ushirikiano wa Ndani',

    // --- Public/Citizen Lab Functionality ---
    'public.playground': 'Uwanja wa Sera',
    'public.gis': 'Ramani ya Akili ya Kenya',
    'public.stories': 'Hadithi za Data',
    'public.vnr': 'Mzalishaji wa SDG VNR',
    'public.feedback': 'Maabara ya Ukweli nyanjani',
    'public.research': 'Eneo la Utafiti',

    // --- Common UI ---
    'common.lang': 'Lugha / Language',
    'common.logout': 'Tekeleza Kutoka Kabisa',
    'common.anonymize': 'Kinga ya Faragha (KDPA)',
    'common.spi': 'Kitambulisho cha Kudumu cha Kitaifa',
    'common.search': 'Tafuta Kwenye Ghala...',
    'common.loading': 'Inatayarisha Akili ya Kitaifa...',
    'common.welcome': 'Karibu, Afisa',
    'common.save': 'Hifadhi Kwenye Ghala',
    'common.cancel': 'Ghairi Mabadiliko',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Sync with app-params local storage key
    return localStorage.getItem('kedis_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kedis_lang', lang);
    // Update HTML lang attribute for accessibility/SEO
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(prev => prev === 'en' ? 'sw' : 'en');

  const t = (key) => {
    const value = translations[lang]?.[key] || translations.en[key] || key;
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      <div className={lang === 'sw' ? 'lang-sw' : 'lang-en'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}