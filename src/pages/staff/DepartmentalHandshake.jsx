/**
 * ============================================================================
 * KEDIS UltraEconomist — Departmental Handshake (Supabase)
 * ============================================================================
 * REFERENCE COPY — implements Part 4 of the Master Plan.
 * To activate: copy to src/pages/staff/DepartmentalHandshake.jsx
 * ============================================================================
 *
 * Part 4 — The Departmental Handshake:
 *   - Staff member selects their Directorate + Department (Designation)
 *   - The choice is persisted to session_state (localStorage + profiles table)
 *   - The user is redirected to their specific workspace
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ChevronRight, Building2, Users, Shield, Cpu, Globe2,
  Briefcase, Server, Scale, Megaphone, MapPin, Lock, ArrowRight, CheckCircle2,
  TrendingUp
} from 'lucide-react';

const DIRECTORATES = [
  {
    id: 'economic',
    name: 'Economic Management Directorate',
    name_sw: 'Idara ya Uendeshaji wa Kiuchumi',
    icon: TrendingUp,
    departments: [
      { id: 'macro', name: 'Macroeconomics', designation: 'Macroeconomist', tools: ['/staff/iemh', '/staff/digital-twin'], icon: Cpu },
      { id: 'social', name: 'Social Sector', designation: 'Social Researcher', tools: ['/staff/ward-observatory'], icon: Users },
      { id: 'governance', name: 'Governance', designation: 'Governance Researcher', tools: ['/staff/integrity'], icon: Scale },
    ],
  },
  {
    id: 'development',
    name: 'Integrated Development Directorate',
    name_sw: 'Idara ya Maendeleo Jumuishi',
    icon: Globe2,
    departments: [
      { id: 'infra', name: 'Infrastructure', designation: 'Infrastructure Specialist', tools: ['/staff/infrastructure'], icon: Building2 },
      { id: 'trade', name: 'Trade & Foreign Policy', designation: 'Trade Analyst', tools: ['/staff/trade'], icon: Briefcase },
      { id: 'km', name: 'Knowledge Management', designation: 'FAIR Librarian', tools: ['/staff/knowledge-vault'], icon: Brain },
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Services Directorate',
    name_sw: 'Idara ya Huduma za Shiriki',
    icon: Shield,
    departments: [
      { id: 'audit', name: 'Internal Audit', designation: 'Auditor', tools: ['/staff/audit-vault'], icon: Lock },
      { id: 'finance', name: 'Finance', designation: 'Finance Officer', tools: ['/staff/fiscal'], icon: Briefcase },
      { id: 'hr', name: 'HR & Admin', designation: 'HR Manager', tools: ['/staff/resources'], icon: Users },
      { id: 'procurement', name: 'Supply Chain', designation: 'Procurement Officer', tools: ['/staff/procurement'], icon: Server },
    ],
  },
  {
    id: 'tech',
    name: 'Technical Command & Compliance',
    name_sw: 'Amri ya Kiufundi na Uzingatiaji',
    icon: Server,
    departments: [
      { id: 'ict', name: 'ICT', designation: 'ICT Officer', tools: ['/admin/connectors'], icon: Cpu },
      { id: 'legal', name: 'Legal', designation: 'Legal Officer', tools: ['/admin/compliance'], icon: Scale },
      { id: 'comms', name: 'Corporate Communications', designation: 'Communications Officer', tools: ['/staff/collab'], icon: Megaphone },
    ],
  },
];

export default function DepartmentalHandshake() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [selectedDir, setSelectedDir] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectDept = (dir, dept) => {
    setSelectedDir(dir);
    setSelectedDept(dept);
  };

  /**
   * Part 4 — Persist the designation choice to session_state
   * and redirect to the department's primary workspace.
   */
  const handleEnter = async () => {
    setLoading(true);

    try {
      // Persist to session_state (localStorage)
      const sessionState = {
        directorate_id: selectedDir.id,
        directorate_name: selectedDir.name,
        department_id: selectedDept.id,
        department_name: selectedDept.name,
        designation: selectedDept.designation,
        workspace_path: selectedDept.tools[0],
        set_at: new Date().toISOString(),
      };
      localStorage.setItem('kedis_session_state', JSON.stringify(sessionState));

      // Also persist to the profiles table (server-side)
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            department: selectedDept.name,
            designation: selectedDept.designation,
            directorate: selectedDir.name,
          })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Failed to persist session state:', err);
    }

    // Redirect to the department's primary workspace
    setTimeout(() => {
      navigate(selectedDept.tools[0]);
    }, 1200);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-primary mb-4 shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
          {lang === 'sw' ? 'Mkono wa Idara' : 'Departmental Handshake'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {lang === 'sw'
            ? 'Chagua Idara yako na Wizara kujenga kituo chako cha kazi.'
            : 'Select your Directorate and Department to build your workstation.'}
        </p>
        {profile && (
          <p className="mt-3 text-xs text-primary font-medium">
            {lang === 'sw' ? 'Akaunti:' : 'Signed in as:'} {profile.full_name || user?.email}
          </p>
        )}
      </motion.div>

      {/* Step 1: Directorate */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {DIRECTORATES.map((dir, i) => {
          const isActive = selectedDir?.id === dir.id;
          return (
            <motion.button
              key={dir.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => { setSelectedDir(dir); setSelectedDept(null); }}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                isActive ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                <dir.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-foreground leading-tight">
                {lang === 'sw' ? dir.name_sw : dir.name}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">{dir.departments.length} {lang === 'sw' ? 'wizara' : 'departments'}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Step 2: Department */}
      <AnimatePresence>
        {selectedDir && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-5 mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Chagua Wizara' : 'Select Department'}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedDir.departments.map((dept, i) => {
                  const isActive = selectedDept?.id === dept.id;
                  return (
                    <motion.button
                      key={dept.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSelectDept(selectedDir, dept)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'
                      }`}
                    >
                      <dept.icon className={`h-5 w-5 mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold text-foreground">{dept.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{dept.designation}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Enter workstation */}
      <AnimatePresence>
        {selectedDept && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"
          >
            {loading ? (
              <div className="py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mx-auto mb-3">
                  <div className="h-6 w-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {lang === 'sw' ? 'Inajenga kituo cha kazi...' : 'Building your workstation...'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'sw' ? `Kama ${selectedDept.designation}` : `Loading tools for ${selectedDept.designation}`}
                </p>
              </div>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-heading font-bold text-foreground">
                  {lang === 'sw' ? 'Kituo cha Kazi Tayari' : 'Workstation Ready'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'sw'
                    ? `Umechaguliwa kama ${selectedDept.designation} katika ${selectedDept.name}`
                    : `You are signed in as ${selectedDept.designation} in ${selectedDept.name}`}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{lang === 'sw' ? 'KIPPRA Nyumbani, Nairobi' : 'KIPPRA Towers, Nairobi'}</span>
                  <span className="mx-1">·</span>
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">{lang === 'sw' ? 'MFA Imethibitishwa' : 'MFA Verified'}</span>
                </div>
                <button
                  onClick={handleEnter}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:shadow-lg transition-all"
                >
                  {lang === 'sw' ? 'Ingia kwenye Kituo' : 'Enter Workstation'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}