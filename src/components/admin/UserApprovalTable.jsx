import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, UserCheck, UserX, ShieldCheck, Clock, Mail, Building2,
  CheckCircle2, XCircle, Loader2, Users, ChevronRight
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'pending', label: 'Pending Approval', icon: Clock, color: 'amber', textColor: 'text-amber-600' },
  { key: 'active', label: 'Active Users', icon: ShieldCheck, color: 'emerald', textColor: 'text-emerald-600' },
  { key: 'all', label: 'All Identities', icon: Users, color: 'primary', textColor: 'text-primary' },
];

const ROLE_COLORS = {
  admin: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  super_admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  staff: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  public: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
};

function UserRow({ user, onApprove, onDisapprove, onRevoke, loadingId }) {
  const isLoading = loadingId === user.id;
  const initials = (user.full_name || user.email || '?').charAt(0).toUpperCase();
  const role = user.role || user.portal_role || 'staff';
  const roleClass = ROLE_COLORS[role] || ROLE_COLORS.staff;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
    >
      <td className="py-3.5 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 font-bold text-amber-600">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {user.full_name || 'Unnamed User'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          {user.directorate || '—'}
        </div>
      </td>
      <td className="py-3.5 px-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleClass}`}>
          {role.replace('_', ' ')}
        </span>
      </td>
      <td className="py-3.5 px-3">
        {user.is_active ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        )}
      </td>
      <td className="py-3.5 px-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : !user.is_active ? (
            <>
              <button
                onClick={() => onApprove(user)}
                title="Approve user"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/15 hover:border-emerald-500/50"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Approve
              </button>
              <button
                onClick={() => onDisapprove(user)}
                title="Reject user"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-500/15 hover:border-red-500/50"
              >
                <UserX className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          ) : (
            <button
              onClick={() => onRevoke(user)}
              title="Revoke access"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-500/15 hover:border-red-500/50"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Revoke
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function UserApprovalTable({ users, onApprove, onDisapprove, onRevoke, loadingId }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    let result = users;
    if (activeTab === 'pending') result = users.filter(u => !u.is_active);
    else if (activeTab === 'active') result = users.filter(u => u.is_active);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.directorate || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, activeTab, searchQuery]);

  const counts = useMemo(() => ({
    pending: users.filter(u => !u.is_active).length,
    active: users.filter(u => u.is_active).length,
    all: users.length,
  }), [users]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-secondary/30 px-2 py-2 overflow-x-auto scrollbar-thin">
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${isActive ? tab.textColor : ''}`} />
              {tab.label}
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive
                  ? tab.color === 'amber' ? 'bg-amber-500/15 text-amber-600'
                    : tab.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-5 py-4 border-b border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or directorate..."
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Staff Member</th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Directorate</th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                      {activeTab === 'pending' ? (
                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                      ) : (
                        <Users className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {activeTab === 'pending'
                        ? 'No pending approvals — all identities verified'
                        : activeTab === 'active'
                          ? 'No active users yet'
                          : 'No users found'}
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-muted-foreground">Try a different search term</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  onApprove={onApprove}
                  onDisapprove={onDisapprove}
                  onRevoke={onRevoke}
                  loadingId={loadingId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> of{' '}
          <span className="font-semibold text-foreground">{users.length}</span> identities
        </span>
        <div className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          <span>Registry updates are SHA-256 logged</span>
        </div>
      </div>
    </div>
  );
}