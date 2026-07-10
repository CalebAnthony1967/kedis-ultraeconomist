import React from 'react';
import { Loader2, FileCheck, Shield, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ETLValidationGate({ progress, stepLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <p className="font-heading font-semibold text-foreground">{stepLabel || 'Processing…'}</p>
      <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
        FAIR validation · Type checking · Range constraints · SPI assignment · SHA-256 audit lineage
      </p>
      <div className="w-full max-w-md mt-6">
        <Progress value={progress || 0} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FileCheck className="h-3 w-3" /> Validating</span>
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Hashing</span>
          <span className="flex items-center gap-1"><Database className="h-3 w-3" /> Ingesting</span>
        </div>
      </div>
    </div>
  );
}