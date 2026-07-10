/**
 * ============================================================================
 * KEDIS UltraEconomist — Portal Layout (Supabase)
 * ============================================================================
 * REFERENCE COPY — implements Part 5 of the Master Plan.
 * To activate: copy to src/components/PortalLayout.jsx
 * ============================================================================
 *
 * Part 5 — The Absolute Termination Protocol:
 *   - supabase.auth.signOut({ scope: 'global' })  (Server-side kill)
 *   - localStorage.clear() & sessionStorage.clear()  (Client-side wipe)
 *   - Force redirect to Landing Page /
 *   - Browser "Back" button cannot retrieve any session fragment
 * ============================================================================
 */

import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';
import { ArrowLeft, LogOut, Menu, X, Shield, Brain, Users } from 'lucide-react';

export default function PortalLayout({ portalKey, navItems, accentColor = 'primary' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [killingSession, setKillingSession] = React.useState(false);

  const portalMeta = {
    Admin: { icon: Shield, gradient: 'from-amber-500 to-orange-600', label: lang === 'sw' ? 'Kituo cha Udhibiti' : 'Control Center' },
    Staff: { icon: Brain, gradient: 'from-emerald-500 to-primary', label: lang === 'sw' ? 'Kituo cha Wafanyakazi' : 'KIPPRA Staff Hub' },
    Public: { icon: Users, gradient: 'from-teal-500 to-cyan-600', label: lang === 'sw' ? 'Maabara ya Raia' : 'Citizen Lab' },
  };

  const meta = portalMeta[portalKey] || portalMeta.Staff;
  const PortalIcon = meta.icon;

  const accentTextMap = { primary: 'text-primary', amber: 'text-amber-600', teal: 'text-teal-600' };
  const accentBgMap = { primary: 'bg-primary', amber: 'bg-amber-600', teal: 'bg-teal-600' };

  const isGrouped = navItems.length > 0 && navItems[0].items;
  const flatItems = isGrouped ? navItems.flatMap(g => g.items) : navItems;

  /**
   * Part 5 — Absolute Session Kill.
   * Uses the logout() from AuthContext which:
   *   1. Calls supabase.auth.signOut({ scope: 'global' })
   *   2. Wipes localStorage + sessionStorage
   *   3. Force-redirects to /
   */
  const handleAbsoluteTermination = async () => {
    setKillingSession(true);
    await logout(true); // true = redirect to /
  };

  const renderItem = (item) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          isActive ? `${accentTextMap[accentColor]} font-semibold bg-secondary` : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        }`}
      >
        {isActive && <motion.div layoutId="active-pill" className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full ${accentBgMap[accentColor]}`} />}
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 border-r border-border bg-card/80 backdrop-blur-xl flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-border hover:bg-secondary/30 transition-colors">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} shadow-lg`}>
            <PortalIcon className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-bold text-sm text-foreground">KEDIS</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{meta.label}</span>
          </div>
        </Link>

        <div className="px-3 py-4 flex-1 overflow-y-auto scrollbar-thin">
          {isGrouped ? (
            navItems.map((group, gi) => (
              <div key={gi} className="mb-4">
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</p>
                <nav className="space-y-0.5">{group.items.map(renderItem)}</nav>
              </div>
            ))
          ) : (
            <nav className="space-y-1">{flatItems.map(renderItem)}</nav>
          )}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {lang === 'sw' ? 'Rudi Nyumbani' : 'Back to Home'}
          </Link>
          <LanguageToggle className="w-full justify-center" />
          <button
            onClick={handleAbsoluteTermination}
            disabled={killingSession}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            {killingSession ? (
              <>
                <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                {lang === 'sw' ? 'Inafuta kikao...' : 'Terminating...'}
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                {lang === 'sw' ? 'Maliza Kikao' : 'Log Out'}
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">{sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <span className="font-heading font-bold text-sm">KEDIS · {meta.label}</span>
          <Link to="/" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}