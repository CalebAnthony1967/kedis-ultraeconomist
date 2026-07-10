import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Languages } from 'lucide-react';

export default function LanguageToggle({ className = '' }) {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary ${className}`}
    >
      <Languages className="h-4 w-4 text-primary" />
      <span className={lang === 'en' ? 'font-bold text-primary' : 'text-muted-foreground'}>EN</span>
      <span className="text-muted-foreground">/</span>
      <span className={lang === 'sw' ? 'font-bold text-primary' : 'text-muted-foreground'}>SW</span>
    </button>
  );
}