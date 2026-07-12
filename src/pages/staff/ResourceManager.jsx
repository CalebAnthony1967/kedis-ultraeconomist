import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Users, Search, Shield, GraduationCap, Briefcase,
  Lock, CheckCircle2, Plus, Mail
} from 'lucide-react';

const STAFF = [
  { name: 'Dr. James Gachanja', role: 'Senior Policy Analyst', dept: 'IESD', access: 'Super Admin', training: 100 },
  { name: 'Eng. Otieno Samuel', role: 'Infrastructure Specialist', dept: 'Integrated Development', access: 'Staff', training: 78 },
  { name: 'Dr. Achieng Pamela', role: 'Social Researcher', dept: 'Economic Management', access: 'Staff', training: 85 },
  { name: 'Mr. Kamau Thomas', role: 'Trade Analyst', dept: 'Integrated Development', access: 'Staff', training: 64 },
  { name: 'Ms. Fatuma Ali', role: 'Legal Officer', dept: 'Technical Command', access: 'Admin', training: 88 },
  { name: 'Mr. Brian Kiprop', role: 'ICT Officer', dept: 'Technical Command', access: 'Admin', training: 95 },
  { name: 'Dr. Eldah Onsomu', role: 'Executive Director', dept: 'Governance', access: 'Super Admin', training: 100 },
  { name: 'Mr. Daniel Mwale', role: 'Auditor', dept: 'Corporate Services', access: 'Staff', training: 72 },
];

const ACCESS_LEVELS = [
  { level: 'Super Admin', count: 1, color: 'text-red-600', bg: 'bg-red-50' },
  { level: 'Admin', count: 2, color: 'text-amber-600', bg: 'bg-amber-50' },
  { level: 'Staff', count: 5, color: 'text-primary', bg: 'bg-primary/5' },
];

export default function ResourceManager() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const filtered = STAFF.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Meneja wa Rasilimali' : 'Resource Manager'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Simamia majukumu ya wafanyakazi, rekodi za mafunzo, na haki za upatikanaji. Kanuni ya Upendeleo Mdogo.'
            : 'Manage staff designations, training records, and access rights. Principle of Least Privilege enforced.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <Users className="h-5 w-5 text-primary mb-2" />
          <div className="font-display text-2xl font-extrabold text-foreground">{STAFF.length}</div>
          <div className="text-xs text-muted-foreground mt-1">{lang === 'sw' ? 'Wafanyakazi Wote' : 'Total Staff'}</div>
        </motion.div>
        {ACCESS_LEVELS.map((al, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <Shield className={`h-5 w-5 ${al.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{al.count}</div>
            <div className="text-xs text-muted-foreground mt-1">{al.level}</div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'sw' ? 'Tafuta wafanyakazi...' : 'Search staff...'} className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg">
          <Plus className="h-4 w-4" />
          {lang === 'sw' ? 'Karibisha' : 'Invite User'}
        </button>
      </div>

      {showInvite && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              {lang === 'sw' ? 'Karibisha Mtumiaji Mpya' : 'Invite New User'}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <input type="email" placeholder="email@kippra.or.ke" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option>Staff</option>
                <option>Admin</option>
              </select>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:shadow-lg">
                {lang === 'sw' ? 'Tuma Mwaliko' : 'Send Invite'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Staff table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Jina' : 'Name'}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Nafasi' : 'Role'}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Idara' : 'Department'}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Upatikanaji' : 'Access'}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Mafunzo' : 'Training'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} className="border-b border-border hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-foreground">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.dept}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.access === 'Super Admin' ? 'bg-red-50 text-red-600' :
                      s.access === 'Admin' ? 'bg-amber-50 text-amber-600' :
                      'bg-primary/5 text-primary'
                    }`}>
                      <Lock className="h-3 w-3" />
                      {s.access}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${s.training >= 80 ? 'bg-emerald-500' : s.training >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.training}%` }} />
                      </div>
                      <span className="text-xs font-bold text-foreground">{s.training}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}