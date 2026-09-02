import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { Globe, MapPin, Layers, Building2, Home } from 'lucide-react';

const ENTITY_LEVELS = [
  { value: 'all', label: 'All Levels', icon: Layers },
  { value: 'National', label: 'National', icon: Globe },
  { value: 'County', label: 'County', icon: Building2 },
  { value: 'Sub-County', label: 'Sub-County', icon: MapPin },
  { value: 'Ward', label: 'Ward', icon: Home },
];

export default function EntityLevelSelector({
  selected = 'all',
  onChange,
  counts = {},
  className = '',
}) {
  const { lang } = useLanguage();

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      <span className="text-xs font-medium text-muted-foreground mr-1">
        {lang === 'sw' ? 'Kiwango:' : 'Level:'}
      </span>
      {ENTITY_LEVELS.map((level) => {
        const Icon = level.icon;
        const isSelected = selected === level.value;
        const count = counts[level.value] || 0;

        return (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
              ${isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {level.value === 'all' 
              ? (lang === 'sw' ? 'Zote' : 'All') 
              : level.label}
            {count > 0 && level.value !== 'all' && (
              <span className="text-[10px] opacity-70 ml-0.5">
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
