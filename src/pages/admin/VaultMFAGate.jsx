import React, { useState } from 'react';
import { Lock, KeyRound, AlertTriangle, Shield, Fingerprint } from 'lucide-react';

/**
 * MFA-gated unlock screen for the Super Admin Vault.
 * Requires a root key to access identity & audit controls.
 */
export default function VaultMFAGate({ onUnlock }) {
  const [rootKey, setRootKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rootKey.length < 6) {
      setError('Root Key must be at least 6 characters.');
      return;
    }
    onUnlock(rootKey);
    setRootKey('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Header badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-semibold text-amber-600">
            <Fingerprint className="h-3.5 w-3.5" />
            Restricted Zone · Level 4 Clearance
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-xl shadow-amber-500/5 relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <Lock className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">Sovereign Vault</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
              MFA-gated secondary security zone. Enter your decryption key to access identity governance and national audit controls.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Root Access Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={rootKey}
                  onChange={(e) => { setRootKey(e.target.value); setError(''); }}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-3.5 text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Decrypt Vault
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-amber-600" />
            <span>No persistent root tokens stored · Session terminates on logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}