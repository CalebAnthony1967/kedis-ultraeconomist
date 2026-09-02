/**
 * AlphaEconomist Math & Statistical Computation Engine
 * Pre-computes deterministic metrics to ensure 100% mathematical accuracy.
 */

export function computeDataStatistics(records = []) {
  if (!records || records.length === 0) return null;

  // Filter valid numeric entries
  const validRecords = records
    .filter(r => r.value !== null && r.value !== undefined && !isNaN(Number(r.value)))
    .map(r => ({ ...r, value: Number(r.value), year: Number(r.year) || null }));

  if (validRecords.length === 0) return null;

  // Group by indicator + geography
  const grouped = {};
  for (const item of validRecords) {
    const geoKey = item.county_name || item.county_code || 'National';
    const key = `${item.name || item.indicator_id}__${geoKey}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  const seriesSummaries = [];

  for (const [key, series] of Object.entries(grouped)) {
    // Sort chronologically
    series.sort((a, b) => (a.year || 0) - (b.year || 0));

    const indicatorName = series[0].name || series[0].indicator_id;
    const geography = series[0].county_name || 'National';
    const unit = series[0].unit || '';
    const earliest = series[0];
    const latest = series[series.length - 1];

    const values = series.map(s => s.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avgVal = values.reduce((sum, v) => sum + v, 0) / values.length;

    let pctChange = null;
    let cagr = null;

    if (series.length > 1 && earliest.value !== 0 && earliest.year && latest.year && latest.year > earliest.year) {
      const yearDiff = latest.year - earliest.year;
      pctChange = ((latest.value - earliest.value) / Math.abs(earliest.value)) * 100;
      if (earliest.value > 0 && latest.value > 0) {
        cagr = (Math.pow(latest.value / earliest.value, 1 / yearDiff) - 1) * 100;
      }
    }

    seriesSummaries.push({
      indicator: indicatorName,
      geography,
      unit,
      latestYear: latest.year,
      latestValue: latest.value,
      earliestYear: earliest.year,
      earliestValue: earliest.value,
      pctChange: pctChange !== null ? Number(pctChange.toFixed(2)) : null,
      cagr: cagr !== null ? Number(cagr.toFixed(2)) : null,
      average: Number(avgVal.toFixed(2)),
      min: minVal,
      max: maxVal,
      dataPointsCount: series.length,
      spi: series.map(s => s.spi).filter(Boolean)[0] || null,
      source: series[0].source_mcda || 'Kenya National Bureau of Statistics (KNBS)',
    });
  }

  return {
    summaries: seriesSummaries,
    totalRecordsEvaluated: validRecords.length,
  };
}

export function formatStatisticsMarkdown(stats) {
  if (!stats || !stats.summaries || stats.summaries.length === 0) return '';

  let md = `\n### Verified Statistical Computation (Ground Truth):\n`;
  md += `| Indicator | Geography | Latest Value | Earliest Value | % Change | CAGR | Source |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const s of stats.summaries) {
    const latestStr = `${s.latestValue.toLocaleString()} ${s.unit} (${s.latestYear || 'N/A'})`;
    const earliestStr = s.earliestYear && s.earliestYear !== s.latestYear 
      ? `${s.earliestValue.toLocaleString()} (${s.earliestYear})` 
      : '—';
    const changeStr = s.pctChange !== null ? `${s.pctChange > 0 ? '+' : ''}${s.pctChange}%` : 'N/A';
    const cagrStr = s.cagr !== null ? `${s.cagr}%` : 'N/A';

    md += `| ${s.indicator} | ${s.geography} | ${latestStr} | ${earliestStr} | ${changeStr} | ${cagrStr} | ${s.source} |\n`;
  }

  return md;
}
