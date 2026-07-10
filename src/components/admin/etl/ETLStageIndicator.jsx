import React from 'react';
import { UploadCloud, TableProperties, FileCheck, Database } from 'lucide-react';

const STAGES = [
  { key: 'upload', label: 'Upload', icon: UploadCloud },
  { key: 'preview', label: 'Silo-Heal & Map', icon: TableProperties },
  { key: 'validating', label: 'Validate & Ingest', icon: FileCheck },
  { key: 'done', label: 'Complete', icon: Database },
];

export default function ETLStageIndicator({ stage }) {
  const stageIndex = STAGES.findIndex(s => s.key === stage);

  return (
    <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
      {STAGES.map((s, i) => {
        const isActive = stage === s.key;
        const isPast = stageIndex > i;
        return (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors
              ${isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-secondary text-foreground' : 'bg-muted text-muted-foreground'}`}>
              <s.icon className="h-4 w-4" />
              {i + 1}. {s.label}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-px w-4 sm:w-8 ${isPast ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}