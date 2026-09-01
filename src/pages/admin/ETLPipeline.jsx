import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
// Custom toast implementation replaces the default hook
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient';
import { supabaseStorage } from '@/lib/supabaseStorage';   
import { supabaseAuth } from '@/lib/supabaseAuth';
import ETLStageIndicator from '@/components/admin/etl/ETLStageIndicator';
import ETLFileDropzone from '@/components/admin/etl/ETLFileDropzone';
import ETLDataPreview from '@/components/admin/etl/ETLDataPreview';
import ETLMappingPanel from '@/components/admin/etl/ETLMappingPanel';
import ETLValidationGate from '@/components/admin/etl/ETLValidationGate';
import ETLIngestionResult from '@/components/admin/etl/ETLIngestionResult';
import ETLJobHistory from '@/components/admin/etl/ETLJobHistory';
import {
  computeSHA256, parseFile, autoSuggestMapping, validateRow,
  calculateFairScore, saveEtlState, loadEtlState, clearEtlState,
  GLOBAL_SCHEMA_FIELDS,
  COUNTY_SCHEMA_FIELDS,
  detectDataFormat,
  autoSuggestMappingCounty,
  parseCountyFile,
  validateCountyRow,
  transformCountyRow,
  getOrCreateDomainSubdomain,
} from '@/lib/etlUtils';
import { ArrowRight, FileCheck, Info, Database, CheckCircle2, X } from 'lucide-react';

const MCDA_OPTIONS = [
  'The National Treasury', 'KNBS', 'CBK', 'Ministry of Education',
  'Ministry of Health', 'Ministry of Agriculture', 'KIPPRA', 'County Government',
];

export default function ETLPipeline() {
  const { t } = useLanguage();
  
  // --- Custom Toast Logic ---
  const [toasts, setToasts] = useState([]);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, variant, duration = 4000 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);
  // ---------------------------

  const [stage, setStage] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');

  // File state
  const [fileMetadata, setFileMetadata] = useState(null);

  // Form state
  const [sourceMCDA, setSourceMCDA] = useState('');
  const [frameworkName, setFrameworkName] = useState('');
  const [temporalYear, setTemporalYear] = useState('');

  // Data state
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});

  // Results
  const [ingestionResult, setIngestionResult] = useState(null);

  // Job history
  const [recentJobs, setRecentJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // NEW: Upload type state
  const [uploadType, setUploadType] = useState('national');
  const [sheetProgress, setSheetProgress] = useState({ current: 0, total: 0 });
  // NEW: Store sheets for county data
  const [rawRowsBySheet, setRawRowsBySheet] = useState({});

  // -------------------------------------------------------------------------
  // Session Persistence — restore on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const saved = loadEtlState();
    if (saved) {
      const restoredStage = (saved.stage === 'validating' || saved.stage === 'done')
        ? (saved.rawRows?.length > 0 ? 'preview' : 'upload')
        : saved.stage;

      setStage(restoredStage);
      setFileMetadata(saved.fileMetadata || null);
      setSourceMCDA(saved.sourceMCDA || '');
      setFrameworkName(saved.frameworkName || '');
      setTemporalYear(saved.temporalYear || '');
      setRawRows(saved.rawRows || []);
      setHeaders(saved.headers || []);
      setMapping(saved.mapping || {});
      setUploadType(saved.uploadType || 'national');
      setRawRowsBySheet(saved.rawRowsBySheet || {});

      if (restoredStage !== 'upload') {
        toast({
          title: 'Session restored',
          description: 'Your previous upload has been restored',
          duration: 3000,
        });
      }
    }
    loadRecentJobs();
  }, []);

  // Save state
  useEffect(() => {
    if (fileMetadata || stage !== 'upload') {
      saveEtlState({
        stage,
        fileMetadata,
        sourceMCDA,
        frameworkName,
        temporalYear,
        rawRows,
        headers,
        mapping,
        uploadType,
        rawRowsBySheet,
      });
    }
  }, [stage, fileMetadata, sourceMCDA, frameworkName, temporalYear, rawRows, headers, mapping, uploadType, rawRowsBySheet]);

  // -------------------------------------------------------------------------
  // Job History
  // -------------------------------------------------------------------------
  const loadRecentJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from('data_ingestion_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentJobs(data || []);
    } catch (e) {
      setRecentJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Enhanced auto-mapping (national)
  // -------------------------------------------------------------------------
  const enhanceMapping = (autoMap, headersList) => {
    const enhanced = { ...autoMap };
    const mappedTargets = new Set(Object.values(enhanced).filter(Boolean));
    const requiredFields = GLOBAL_SCHEMA_FIELDS.filter(f => f.required).map(f => f.key);
    const missingRequired = requiredFields.filter(f => !mappedTargets.has(f));

    if (missingRequired.length === 0) return enhanced;

    const heuristicMap = {
      indicator_id: {
        keywords: ['id', 'code', 'ind', 'indicator', 'number', 'ref', 'identifier'],
        fallback: true,
      },
      sector: {
        keywords: ['sector', 'area', 'domain', 'industry', 'field', 'branch'],
        fallback: true,
      },
    };

    const mappedHeaders = new Set(Object.keys(enhanced).filter(h => enhanced[h]));
    const unmappedHeaders = headersList.filter(h => !mappedHeaders.has(h));

    for (const field of missingRequired) {
      const rules = heuristicMap[field];
      if (!rules) continue;

      let matchedHeader = null;
      for (const header of unmappedHeaders) {
        const lowerHeader = header.toLowerCase();
        if (rules.keywords.some(kw => lowerHeader.includes(kw))) {
          matchedHeader = header;
          break;
        }
      }

      if (!matchedHeader && rules.fallback && unmappedHeaders.length > 0) {
        matchedHeader = unmappedHeaders[0];
      }

      if (matchedHeader) {
        enhanced[matchedHeader] = field;
        const idx = unmappedHeaders.indexOf(matchedHeader);
        if (idx > -1) unmappedHeaders.splice(idx, 1);
        mappedTargets.add(field);
      }
    }

    return enhanced;
  };

  // -------------------------------------------------------------------------
  // File Upload Handler
  // -------------------------------------------------------------------------
  const handleFileSelect = async (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toUpperCase();
    if (!['CSV', 'JSON', 'XLSX'].includes(ext)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload CSV, JSON, or XLSX',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    try {
      setStepLabel('Computing SHA-256 hash…');
      const sha256 = await computeSHA256(selectedFile);

      setStepLabel('Uploading to sovereign storage…');
      const filePath = `uploads/${Date.now()}_${selectedFile.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('kedis-private')
        .upload(filePath, selectedFile);
      if (uploadError) throw uploadError;
      const file_uri = data?.path || filePath;

      setStepLabel(`Parsing ${ext} file…`);
      let rows = [];
      let fileHeaders = [];
      let detectedType = 'national';
      
      if (ext === 'XLSX') {
        try {
          // Parse all sheets for county detection - now returns { sheets: {...}, headers: [...] }
          const countyResult = await parseCountyFile(selectedFile);
          fileHeaders = countyResult.headers || [];
          setRawRowsBySheet(countyResult.sheets || {});
          // Get first sheet for preview
          const sheetKeys = Object.keys(countyResult.sheets || {});
          if (sheetKeys.length > 0) {
            rows = countyResult.sheets[sheetKeys[0]] || [];
          }
          detectedType = detectDataFormat(fileHeaders);
        } catch (parseErr) {
          console.warn('County parse fallback:', parseErr);
          rows = await parseFile(selectedFile);
          fileHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
          detectedType = detectDataFormat(fileHeaders);
          setRawRowsBySheet({});
        }
      } else {
        rows = await parseFile(selectedFile);
        fileHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
        detectedType = detectDataFormat(fileHeaders);
        setRawRowsBySheet({});
      }

      // Set upload type based on detection
      const finalUploadType = detectedType === 'county' ? 'county' : 'national';
      setUploadType(finalUploadType);

      let autoMapping;
      if (finalUploadType === 'county') {
        autoMapping = autoSuggestMappingCounty(fileHeaders);
      } else {
        autoMapping = autoSuggestMapping(fileHeaders);
        autoMapping = enhanceMapping(autoMapping, fileHeaders);
      }

      const sheetCount = Object.keys(rawRowsBySheet).length;
      setFileMetadata({
        file_uri,
        file_name: selectedFile.name,
        file_type: ext,
        file_size: selectedFile.size,
        sha256_hash: sha256,
        sheet_count: sheetCount || 1,
      });
      setRawRows(rows);
      setHeaders(fileHeaders);
      setMapping(autoMapping);

      setStage('preview');

      const mappedCount = Object.values(autoMapping).filter(v => v).length;
      const dataTypeLabel = finalUploadType === 'county' ? 'County' : 'National';
      const sheetInfo = finalUploadType === 'county' && sheetCount > 0 ? ` (${sheetCount} sheets)` : '';
      toast({
        title: `${dataTypeLabel} file processed & auto-mapped`,
        description: `${rows.length} rows · ${mappedCount} columns intelligently mapped${sheetInfo}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'File processing failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
        duration: 3000,
      });
      setFileMetadata(null);
      setRawRows([]);
      setHeaders([]);
      setMapping({});
      setRawRowsBySheet({});
    } finally {
      setIsProcessing(false);
      setStepLabel('');
    }
  };

  // -------------------------------------------------------------------------
  // File Removal
  // -------------------------------------------------------------------------
  const handleRemoveFile = async () => {
    if (fileMetadata?.file_uri) {
      try {
        await supabase.storage.from('kedis-private').remove([fileMetadata.file_uri]);
      } catch (e) { /* ignore */ }
    }
    setFileMetadata(null);
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setRawRowsBySheet({});
    setSourceMCDA('');
    setFrameworkName('');
    setTemporalYear('');
    setStage('upload');
    setUploadType('national');
    setSheetProgress({ current: 0, total: 0 });
    clearEtlState();
    toast({
      title: 'File removed',
      description: 'Upload data cleared from session',
      variant: 'warning',
      duration: 3000,
    });
  };

  // -------------------------------------------------------------------------
  // Domain Resolver for County Data
  // -------------------------------------------------------------------------
  const domainResolver = useCallback(async (domainName, subdomainCode, subdomainName) => {
    return await getOrCreateDomainSubdomain(supabase, domainName, subdomainCode, subdomainName);
  }, []);

  // -------------------------------------------------------------------------
  // Validate + Ingest
  // -------------------------------------------------------------------------
  const handleValidateAndIngest = async () => {
    // --- NATIONAL DATA ---
    if (uploadType === 'national') {
      const requiredFields = GLOBAL_SCHEMA_FIELDS.filter(f => f.required);
      const mappedTargets = new Set(Object.values(mapping).filter(Boolean));
      const missingRequired = requiredFields.filter(f => !mappedTargets.has(f.key));

      if (missingRequired.length > 0) {
        toast({
          title: 'Mapping incomplete',
          description: `Required fields not mapped: ${missingRequired.map(f => f.label).join(', ')}`,
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }

      setStage('validating');
      setValidationProgress(5);
      setStepLabel('Running FAIR data contract validation…');

      try {
        await new Promise(r => setTimeout(r, 100));

        const defaults = {
          source_mcda: sourceMCDA,
          ...(temporalYear ? { year: parseInt(temporalYear, 10) } : {}),
        };

        const valid = [];
        const errors = [];

        for (let i = 0; i < rawRows.length; i++) {
          const result = validateRow(rawRows[i], mapping, defaults);
          if (result.valid) {
            valid.push(result.record);
          } else {
            errors.push({ row: i + 2, errors: result.errors });
          }
          if (i % 200 === 0) {
            setValidationProgress(5 + Math.round((i / rawRows.length) * 40));
            await new Promise(r => setTimeout(r, 0));
          }
        }

        if (valid.length === 0) {
          throw new Error('All rows failed validation. Please check your mapping and data.');
        }

        setValidationProgress(50);
        setStepLabel(`Preparing ${valid.length} records…`);

        const uniqueMap = new Map();
        for (const record of valid) {
          const key = `${record.indicator_id}|${record.year}|${record.source_mcda}`;
          uniqueMap.set(key, record);
        }
        const uniqueValid = Array.from(uniqueMap.values());
        const duplicateCount = valid.length - uniqueValid.length;
        if (duplicateCount > 0) {
          toast({
            title: 'Duplicates removed',
            description: `${duplicateCount} duplicate records were merged based on unique constraints`,
            variant: 'warning',
            duration: 3000,
          });
        }

        const user = await supabaseAuth.me();

        let inserted = 0;
        const totalRecords = uniqueValid.length;
        for (let i = 0; i < totalRecords; i += 500) {
          const batch = uniqueValid.slice(i, i + 500).map(r => ({
            ...r,
            created_by: user.id,
            is_verified: false,
          }));
          const { data, error: insertError } = await supabase
            .from('indicators')
            .upsert(batch, { onConflict: 'indicator_id, year, source_mcda' })
            .select('id');
          if (insertError) throw insertError;
          inserted += data?.length || 0;
          setValidationProgress(50 + Math.round((i + batch.length) / totalRecords * 30));
        }

        setValidationProgress(85);
        setStepLabel('Creating ingestion job record…');

        const fairScore = calculateFairScore(uniqueValid[0] || {});

        const { data: job, error: jobError } = await supabase
          .from('data_ingestion_jobs')
          .insert({
            file_name: fileMetadata.file_name,
            file_type: fileMetadata.file_type,
            source_mcda: sourceMCDA,
            upload_type: 'national',
            status: errors.length > 0 ? 'anomaly' : 'ingested',
            records_ingested: inserted,
            validation_errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
            sha256_hash: fileMetadata.sha256_hash,
            spi_assigned: true,
            framework_name: frameworkName || null,
            temporal_year: temporalYear ? parseInt(temporalYear, 10) : null,
            fair_score: fairScore,
            file_uri: fileMetadata.file_uri,
            created_by: user.id,
          })
          .select()
          .single();

        if (jobError) throw jobError;

        setValidationProgress(95);
        setStepLabel('Recording SHA-256 audit lineage…');

        await supabase.from('audit_logs').insert({
          action: 'upload',
          user_email: user.email,
          user_role: user.portal_role,
          target_entity: 'indicators',
          target_id: job?.id,
          details: `Ingested ${inserted} national records from ${fileMetadata.file_name} (${fileMetadata.file_type})`,
          sha256_hash: fileMetadata.sha256_hash,
        });

        setValidationProgress(100);
        setStepLabel('Ingestion complete');

        setIngestionResult({
          inserted,
          errors: errors.length,
          fairScore,
          sha256: fileMetadata.sha256_hash,
          spi: job?.spi_assigned ? `KEDIS-SPI-${String(job.id).substring(0, 8)}` : null,
          errorDetails: errors.slice(0, 50),
        });

        setStage('done');
        clearEtlState();

        toast({
          title: 'National ingestion successful',
          description: `${inserted} records committed to Sovereign Data Pool`,
          duration: 3000,
        });

        loadRecentJobs();
      } catch (error) {
        toast({
          title: 'Ingestion failed',
          description: error.message || 'An unexpected error occurred during ingestion',
          variant: 'destructive',
          duration: 3000,
        });
        setStage('preview');
      } finally {
        setStepLabel('');
        setValidationProgress(0);
      }
      return;
    }

    // --- COUNTY DATA ---
    // Use rawRowsBySheet for county data
    if (Object.keys(rawRowsBySheet).length === 0) {
      toast({
        title: 'No county data found',
        description: 'Please upload a valid county workbook with sheets.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const countyRequiredFields = COUNTY_SCHEMA_FIELDS.filter(f => f.required);
    const mappedTargets = new Set(Object.values(mapping).filter(Boolean));
    const missingRequired = countyRequiredFields.filter(f => !mappedTargets.has(f.key));

    if (missingRequired.length > 0) {
      toast({
        title: 'County mapping incomplete',
        description: `Required fields not mapped: ${missingRequired.map(f => f.label).join(', ')}`,
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setStage('validating');
    setValidationProgress(5);
    setStepLabel('Validating county data…');

    try {
      await new Promise(r => setTimeout(r, 100));

      const defaults = {
        data_source: sourceMCDA || 'County Government',
        ingestion_job_id: null,
      };

      // Get sheets from rawRowsBySheet
      const sheetNames = Object.keys(rawRowsBySheet);
      const totalSheets = sheetNames.length;
      let processedSheets = 0;
      const allValidRecords = [];
      const allErrors = [];

      // Process each sheet
      for (const sheetName of sheetNames) {
        const sheetRows = rawRowsBySheet[sheetName] || [];
        processedSheets++;
        setSheetProgress({ current: processedSheets, total: totalSheets });
        setStepLabel(`Processing sheet ${processedSheets} of ${totalSheets} (${sheetName})…`);
        setValidationProgress(5 + Math.round((processedSheets / totalSheets) * 40));

        // Auto-extract county_code from sheet name if it matches 3-digit code
        const sheetCode = sheetName.match(/^(\d{3})/);
        if (sheetCode) {
          for (const row of sheetRows) {
            if (!row.county_code) {
              row.county_code = sheetCode[1];
            }
          }
        }

           for (const row of sheetRows) {
  console.log('Row being validated:', row);
  console.log('Mapping being used:', mapping);
  const result = validateCountyRow(row, mapping, defaults);
  console.log('Validation result:', result);
  if (result.valid) {
    allValidRecords.push(result.record);
  } else {
    allErrors.push({ sheet: sheetName, errors: result.errors });
  }
}

        await new Promise(r => setTimeout(r, 50));
      }

      if (allValidRecords.length === 0) {
        throw new Error('All rows failed validation. Please check your county data and mapping.');
      }

      setValidationProgress(50);
      setStepLabel(`Transforming ${allValidRecords.length} county records…`);

      // Transform records (expand years)
      const transformedRecords = [];
      for (const record of allValidRecords) {
        const rowWithYears = { ...record };
        const transformed = await transformCountyRow(
          rowWithYears,
          mapping,
          { ...defaults, source_mcda: sourceMCDA || 'County Government' },
          domainResolver
        );
        transformedRecords.push(...transformed);
      }

      if (transformedRecords.length === 0) {
        throw new Error('No valid year values found in the county data.');
      }

      setValidationProgress(70);
      setStepLabel(`Ingesting ${transformedRecords.length} county records…`);

      const user = await supabaseAuth.me();

      // Create ingestion job first
      const { data: job, error: jobError } = await supabase
        .from('data_ingestion_jobs')
        .insert({
          file_name: fileMetadata.file_name,
          file_type: fileMetadata.file_type,
          source_mcda: sourceMCDA || 'County Government',
          upload_type: 'county',
          total_sheets: totalSheets,
          processed_sheets: 0,
          status: 'pending',
          records_ingested: 0,
          validation_errors: allErrors.length > 0 ? JSON.stringify(allErrors.slice(0, 50)) : null,
          sha256_hash: fileMetadata.sha256_hash,
          spi_assigned: true,
          framework_name: frameworkName || null,
          temporal_year: temporalYear ? parseInt(temporalYear, 10) : null,
          fair_score: 0,
          file_uri: fileMetadata.file_uri,
          created_by: user.id,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Batch insert records with job_id
      let inserted = 0;
      const totalRecords = transformedRecords.length;
      for (let i = 0; i < totalRecords; i += 500) {
        const batch = transformedRecords.slice(i, i + 500).map(r => ({
          ...r,
          created_by: user.id,
          is_verified: false,
          ingestion_job_id: job.id,
          source_mcda: sourceMCDA || 'County Government',
        }));
        const { data, error: insertError } = await supabase
          .from('indicators')
          .upsert(batch, { onConflict: 'indicator_id, year, source_mcda, county_code' })
          .select('id');
        if (insertError) throw insertError;
        inserted += data?.length || 0;
        setValidationProgress(70 + Math.round((i + batch.length) / totalRecords * 25));
      }

      setValidationProgress(95);
      setStepLabel('Recording audit lineage…');

      await supabase
        .from('data_ingestion_jobs')
        .update({
          status: allErrors.length > 0 ? 'anomaly' : 'ingested',
          records_ingested: inserted,
          processed_sheets: totalSheets,
          fair_score: calculateFairScore(transformedRecords[0] || {}),
        })
        .eq('id', job.id);

      await supabase.from('audit_logs').insert({
        action: 'upload',
        user_email: user.email,
        user_role: user.portal_role,
        target_entity: 'indicators',
        target_id: job?.id,
        details: `Ingested ${inserted} county records from ${fileMetadata.file_name} (${totalSheets} sheets, ${allErrors.length} errors)`,
        sha256_hash: fileMetadata.sha256_hash,
      });

      setValidationProgress(100);
      setStepLabel('County ingestion complete');

      setIngestionResult({
        inserted,
        errors: allErrors.length,
        fairScore: calculateFairScore(transformedRecords[0] || {}),
        sha256: fileMetadata.sha256_hash,
        spi: job?.spi_assigned ? `KEDIS-SPI-${String(job.id).substring(0, 8)}` : null,
        errorDetails: allErrors.slice(0, 50),
      });

      setStage('done');
      clearEtlState();

      toast({
        title: 'County ingestion successful',
        description: `${inserted} records from ${totalSheets} sheets committed to Sovereign Data Pool`,
        duration: 3000,
      });

      loadRecentJobs();
    } catch (error) {
      toast({
        title: 'County ingestion failed',
        description: error.message || 'An unexpected error occurred during county ingestion',
        variant: 'destructive',
        duration: 3000,
      });
      setStage('preview');
    } finally {
      setStepLabel('');
      setValidationProgress(0);
      setSheetProgress({ current: 0, total: 0 });
    }
  };

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------
  const handleReset = () => {
    setStage('upload');
    setFileMetadata(null);
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setRawRowsBySheet({});
    setSourceMCDA('');
    setFrameworkName('');
    setTemporalYear('');
    setUploadType('national');
    setSheetProgress({ current: 0, total: 0 });
    setIngestionResult(null);
    clearEtlState();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <TooltipProvider>
      {/* Fleeting Toasts - Top Left */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl text-white flex items-start gap-3
              transform transition-all duration-500 animate-in slide-in-from-left-full fade-in
              ${t.variant === 'destructive' ? 'bg-red-600' : t.variant === 'warning' ? 'bg-orange-500' : 'bg-emerald-600'}
            `}
          >
            <div className="flex-1">
              {t.title && <div className="font-bold text-sm tracking-tight">{t.title}</div>}
              {t.description && <div className="text-xs opacity-90 mt-1 leading-normal font-medium">{t.description}</div>}
            </div>
            <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('admin.etl')}</h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            Sovereign data ingestion with silo-healing, FAIR validation, SPI assignment, and SHA-256 audit lineage.
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </p>
          {uploadType === 'county' && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Database className="h-3 w-3" />
              County Data Mode – {sheetProgress.total > 0 ? `${sheetProgress.current}/${sheetProgress.total} sheets` : 'Multi-sheet ready'}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <ETLStageIndicator stage={stage} />

            {stage === 'upload' && (
              <div className="space-y-6 animate-fade-in">
                <ETLFileDropzone
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                  fileMetadata={fileMetadata}
                  isProcessing={isProcessing}
                />
                {isProcessing && stepLabel && (
                  <p className="text-center text-sm text-muted-foreground">{stepLabel}</p>
                )}

                {fileMetadata && !isProcessing && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Source MCDA *</label>
                        <select
                          value={sourceMCDA}
                          onChange={(e) => setSourceMCDA(e.target.value)}
                          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select ministry/agency…</option>
                          {MCDA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Framework Name</label>
                        <input
                          type="text"
                          value={frameworkName}
                          onChange={(e) => setFrameworkName(e.target.value)}
                          placeholder="e.g. Economic Survey 2025"
                          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Temporal Year</label>
                        <input
                          type="number"
                          value={temporalYear}
                          onChange={(e) => setTemporalYear(e.target.value)}
                          placeholder="e.g. 2025"
                          min="1963" max="2063"
                          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setStage('preview')}
                      disabled={!sourceMCDA}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                    >
                      Continue to Preview & Auto‑Mapping
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage === 'preview' && fileMetadata && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {uploadType === 'county' ? 'County Data' : 'National Data'} – Auto‑Mapping Applied
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {Object.values(mapping).filter(v => v).length} of {headers.length} headers automatically mapped.
                      <br />
                      <span className="font-mono text-primary">
                        {Object.entries(mapping).filter(([, v]) => v).map(([k, v]) => `${k} → ${v}`).join(' · ')}
                      </span>
                    </p>
                    {uploadType === 'county' && Object.keys(rawRowsBySheet).length > 0 && (
                      <p className="text-xs text-primary mt-1">
                        📊 {Object.keys(rawRowsBySheet).length} sheets detected – will process each separately
                      </p>
                    )}
                  </div>
                </div>

                <ETLDataPreview rows={rawRows} headers={headers} fileName={fileMetadata.file_name} />

                <div className="flex gap-3">
                  <button onClick={() => setStage('upload')} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
                    Back
                  </button>
                  <button
                    onClick={handleValidateAndIngest}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-lg"
                  >
                    <FileCheck className="h-4 w-4" />
                    {uploadType === 'county' ? 'Validate & Ingest County Data' : 'Validate & Ingest to Sovereign Pool'}
                  </button>
                </div>
              </div>
            )}

            {stage === 'validating' && (
              <ETLValidationGate 
                progress={validationProgress} 
                stepLabel={stepLabel}
                sheetProgress={uploadType === 'county' ? sheetProgress : undefined}
              />
            )}

            {stage === 'done' && ingestionResult && (
              <ETLIngestionResult result={ingestionResult} onReset={handleReset} />
            )}
          </div>

          <div className="space-y-4">
            <ETLJobHistory jobs={recentJobs} onRefresh={loadRecentJobs} isLoading={isLoadingJobs} />
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-primary" />
                Sovereign Pool Status
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Storage</span>
                  <span className="text-foreground font-medium">Encrypted (AES-256)</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Trail</span>
                  <span className="text-foreground font-medium">SHA-256 Immutable</span>
                </div>
                <div className="flex justify-between">
                  <span>SPI Assignment</span>
                  <span className="text-foreground font-medium">Auto-generated</span>
                </div>
                <div className="flex justify-between">
                  <span>RAG Ready</span>
                  <span className="text-emerald-600 font-medium">Yes</span>
                </div>
                {uploadType === 'county' && (
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span>County Mode</span>
                    <span className="text-primary font-medium">Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
