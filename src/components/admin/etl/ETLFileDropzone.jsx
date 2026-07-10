import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileJson, FileText, X, Loader2, Shield } from 'lucide-react';
import { formatBytes } from '@/lib/etlUtils';

export default function ETLFileDropzone({ onFileSelect, onRemoveFile, fileMetadata, isProcessing }) {
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const FileTypeIcon = fileMetadata?.file_type === 'JSON' ? FileJson
    : fileMetadata?.file_type === 'CSV' ? FileText
    : FileSpreadsheet;

  if (fileMetadata && !isProcessing) {
    return (
      <div className="border-2 border-solid border-primary/30 rounded-2xl p-6 bg-primary/5 animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <FileTypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{fileMetadata.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {fileMetadata.file_type} · {formatBytes(fileMetadata.file_size)}
              </p>
              {fileMetadata.sha256_hash && (
                <p className="text-xs text-primary/60 font-mono mt-0.5 truncate">
                  SHA-256: {fileMetadata.sha256_hash.substring(0, 16)}…
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onRemoveFile}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => !isProcessing && fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border hover:border-primary hover:bg-primary/5'}
        ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input ref={fileRef} type="file" accept=".xlsx,.csv,.json" className="hidden"
        onChange={(e) => { const f = e.target.files[0]; if (f) onFileSelect(f); }} />
      {isProcessing ? (
        <>
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="font-heading font-semibold text-foreground">Processing file…</p>
          <p className="mt-1 text-sm text-muted-foreground">Uploading to sovereign storage, computing SHA-256, and parsing data</p>
        </>
      ) : (
        <>
          <UploadCloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-heading font-semibold text-foreground">Drop your MCDA framework file here</p>
          <p className="mt-1 text-sm text-muted-foreground">Supports XLSX, CSV, JSON — up to 50MB</p>
          <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Files are encrypted at rest in the sovereign data pool
          </p>
        </>
      )}
    </div>
  );
}