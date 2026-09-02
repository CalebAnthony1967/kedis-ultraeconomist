import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Export data as CSV
 */
export function exportAsCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] || '';
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    });
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

/**
 * Export data as Excel
 */
export function exportAsExcel(data, filename = 'export.xlsx') {
  if (!data || data.length === 0) return;
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  downloadBlob(blob, filename);
}

/**
 * Export chart as PNG
 */
export async function exportChartAsPNG(elementRef, filename = 'chart.png') {
  if (!elementRef?.current) return;
  
  try {
    const canvas = await html2canvas(elementRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    canvas.toBlob((blob) => {
      downloadBlob(blob, filename);
    });
  } catch (error) {
    console.error('Export chart failed:', error);
  }
}

/**
 * Download blob helper
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get shareable URL from current filters
 */
export function getShareableURL(filters) {
  const params = new URLSearchParams();
  
  if (filters.query) params.set('q', filters.query);
  if (filters.domainIds?.length) params.set('d', filters.domainIds.join(','));
  if (filters.subdomainIds?.length) params.set('sd', filters.subdomainIds.join(','));
  if (filters.pillars?.length) params.set('p', filters.pillars.join(','));
  if (filters.countyCodes?.length) params.set('c', filters.countyCodes.join(','));
  if (filters.sourceMcdas?.length) params.set('s', filters.sourceMcdas.join(','));
  if (filters.yearStart) params.set('ys', filters.yearStart);
  if (filters.yearEnd) params.set('ye', filters.yearEnd);
  if (filters.sortBy) params.set('sort', filters.sortBy);
  if (filters.limit) params.set('limit', filters.limit);
  
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/**
 * Parse shareable URL filters
 */
export function parseShareableURL() {
  const params = new URLSearchParams(window.location.search);
  const filters = {};
  
  if (params.has('q')) filters.query = params.get('q');
  if (params.has('d')) filters.domainIds = params.get('d').split(',').filter(Boolean);
  if (params.has('sd')) filters.subdomainIds = params.get('sd').split(',').filter(Boolean);
  if (params.has('p')) filters.pillars = params.get('p').split(',').filter(Boolean);
  if (params.has('c')) filters.countyCodes = params.get('c').split(',').filter(Boolean);
  if (params.has('s')) filters.sourceMcdas = params.get('s').split(',').filter(Boolean);
  if (params.has('ys')) filters.yearStart = parseInt(params.get('ys'));
  if (params.has('ye')) filters.yearEnd = parseInt(params.get('ye'));
  if (params.has('sort')) filters.sortBy = params.get('sort');
  if (params.has('limit')) filters.limit = parseInt(params.get('limit'));
  
  return filters;
}
