/**
 * RAG Pipeline – Enhanced with proper query understanding and formatting
 */

import { classifyQuery } from './classifier';
import { retrieveData, getDistinctIndicators } from './retriever';
import { callGroq, streamGroq } from './providers/groq';
import { callHuggingFace } from './providers/huggingface';
import { buildConversationContext } from './memory';

// ============================================================
// DATA FORMATTERS
// ============================================================

/**
 * Format data as HTML table with proper styling
 */
function formatAsHTMLTable(data, options = {}) {
  if (!data || data.length === 0) {
    return '<p class="text-muted-foreground">No data available</p>';
  }

  const {
    columns = null,
    caption = '',
    maxRows = 100,
    striped = true,
    bordered = true,
    compact = false,
  } = options;

  // Auto-detect columns if not specified
  const detectedColumns = columns || Object.keys(data[0] || {});
  const displayColumns = detectedColumns.filter(col => {
    // Filter out internal/technical columns
    return !['id', '_id', '__v'].includes(col);
  });

  const rows = data.slice(0, maxRows);

  let html = `<div class="table-wrapper" style="margin: 16px 0; overflow-x: auto;">`;
  
  // Caption
  if (caption) {
    html += `<div class="table-caption" style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${caption}</div>`;
  }
  
  // Table
  html += `<table class="data-table" style="width: 100%; border-collapse: collapse; font-size: ${compact ? '0.75rem' : '0.875rem'}; background: white; border-radius: 8px; overflow: hidden;">`;
  
  // Header
  html += `<thead>`;
  html += `<tr style="background: #f0f5ff; border-bottom: 2px solid #e2e8f0;">`;
  displayColumns.forEach(col => {
    const label = col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    html += `<th style="padding: ${compact ? '6px 10px' : '10px 14px'}; text-align: left; font-weight: 600; color: #1e293b; white-space: nowrap;">${label}</th>`;
  });
  html += `</tr></thead>`;
  
  // Body
  html += `<tbody>`;
  rows.forEach((row, i) => {
    const bgColor = striped && i % 2 === 0 ? '#f8fafc' : 'white';
    html += `<tr style="border-bottom: ${bordered ? '1px solid #e2e8f0' : '1px solid #f1f5f9'}; background: ${bgColor}; transition: background 0.2s;">`;
    
    displayColumns.forEach(col => {
      let value = row[col] !== undefined && row[col] !== null ? row[col] : 'N/A';
      
      // Format numbers
      if (typeof value === 'number' && !isNaN(value)) {
        if (Number.isInteger(value)) {
          value = value.toLocaleString();
        } else {
          value = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }
      }
      
      // Format dates
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          value = new Date(value).toLocaleDateString('en-KE');
        } catch (e) {}
      }
      
      // Truncate long text
      if (typeof value === 'string' && value.length > 60) {
        value = value.substring(0, 57) + '…';
      }
      
      html += `<td style="padding: ${compact ? '6px 10px' : '8px 14px'}; color: #334155; ${value === 'N/A' ? 'color: #94a3b8; font-style: italic;' : ''}">${value}</td>`;
    });
    
    html += `</tr>`;
  });
  html += `</tbody>`;
  html += `</table>`;
  
  // Footer
  if (data.length > maxRows) {
    html += `<div class="table-footer" style="font-size: 0.75rem; color: #64748b; margin-top: 8px; text-align: right;">Showing ${maxRows} of ${data.length} rows</div>`;
  }
  
  html += `</div>`;
  
  // Inline styles for hover
  html += `<style>
    .data-table tbody tr:hover {
      background: #f1f5f9 !important;
    }
    @media (max-width: 768px) {
      .data-table { font-size: 0.7rem; }
      .data-table th, .data-table td { padding: 4px 6px; }
    }
  </style>`;
  
  return html;
}

/**
 * Format data as a clean list
 */
function formatAsList(data, options = {}) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const {
    maxItems = 50,
    showNumbers = true,
    showDetails = true,
  } = options;

  const items = data.slice(0, maxItems);
  
  let list = '';
  
  items.forEach((item, i) => {
    const number = showNumbers ? `${i + 1}. ` : '• ';
    let line = number;
    
    // Extract the most relevant fields
    const name = item.name || item.indicator || item.title || 'Unnamed';
    const year = item.year || item.date || '';
    const value = item.value !== undefined && item.value !== null ? item.value : '';
    const unit = item.unit || '';
    const source = item.source || item.source_mcda || '';
    
    line += name;
    
    if (showDetails) {
      const details = [];
      if (year) details.push(year);
      if (value !== '') details.push(`${typeof value === 'number' ? value.toLocaleString() : value} ${unit}`);
      if (source) details.push(`(${source})`);
      
      if (details.length > 0) {
        line += ` — ${details.join(', ')}`;
      }
    }
    
    list += line + '\n';
  });
  
  if (data.length > maxItems) {
    list += `\n*Showing ${maxItems} of ${data.length} items*`;
  }
  
  return list;
}

/**
 * Format data as a structured report
 */
function generateReport(data, classification, options = {}) {
  const {
    title = 'Economic Report',
    includeSummary = true,
    includeTrends = true,
    includeRecommendations = true,
  } = options;

  const geography = classification?.geography?.name || 'Kenya';
  const timeRange = classification?.time_range || { start: null, end: null };
  
  let report = `# ${title}\n\n`;
  report += `**Generated:** ${new Date().toLocaleString('en-KE')}\n`;
  report += `**Geography:** ${geography}\n`;
  report += `**Time Period:** ${timeRange.start || 'N/A'} - ${timeRange.end || 'N/A'}\n`;
  report += `**Total Records:** ${data.length}\n\n`;
  
  // Executive Summary
  if (includeSummary) {
    report += `## Executive Summary\n\n`;
    const numericValues = data.filter(d => typeof d.value === 'number' && !isNaN(d.value));
    if (numericValues.length > 0) {
      const values = numericValues.map(d => d.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      report += `- **Average Value:** ${avg.toFixed(2)} (based on ${values.length} indicators)\n`;
      report += `- **Range:** ${min.toFixed(2)} to ${max.toFixed(2)}\n`;
    }
    report += `- **Total Indicators:** ${data.length}\n`;
    if (classification?.intent) {
      report += `- **Query Intent:** ${classification.intent}\n`;
    }
    report += '\n';
  }
  
  // Key Indicators
  report += `## Key Indicators\n\n`;
  const topIndicators = data.slice(0, 10);
  report += formatAsList(topIndicators, { maxItems: 10, showNumbers: true, showDetails: true });
  report += '\n';
  
  // Trends
  if (includeTrends && data.length > 2) {
    report += `## Trends\n\n`;
    const sortedByYear = [...data].filter(d => d.year).sort((a, b) => a.year - b.year);
    if (sortedByYear.length > 1) {
      const earliest = sortedByYear[0];
      const latest = sortedByYear[sortedByYear.length - 1];
      report += `- **Earliest Data:** ${earliest.year} (${earliest.value || 'N/A'})\n`;
      report += `- **Latest Data:** ${latest.year} (${latest.value || 'N/A'})\n`;
      if (typeof earliest.value === 'number' && typeof latest.value === 'number') {
        const change = latest.value - earliest.value;
        const pctChange = earliest.value !== 0 ? (change / Math.abs(earliest.value)) * 100 : 0;
        report += `- **Change:** ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%)\n`;
      }
    }
    report += '\n';
  }
  
  // Recommendations
  if (includeRecommendations) {
    report += `## Recommendations\n\n`;
    report += `Based on the data analysis:\n\n`;
    const recs = [
      `1. Focus on ${data.length > 10 ? 'key ' : ''}indicators showing significant trends`,
      `2. Consider ${data.some(d => d.value < 0) ? 'addressing negative trends' : 'maintaining positive momentum'}`,
      `3. Compare with ${geography !== 'Kenya' ? 'national' : 'county'} averages for context`,
      `4. Use this data for evidence-based policy decisions`,
    ];
    report += recs.join('\n') + '\n';
  }
  
  // Sources
  const sources = [...new Set(data.map(d => d.source_mcda || d.source).filter(Boolean))];
  if (sources.length > 0) {
    report += `\n## Data Sources\n\n`;
    sources.forEach(s => report += `- ${s}\n`);
  }
  
  return report;
}

/**
 * Generate a concise summary
 */
function generateSummary(data, classification) {
  if (!data || data.length === 0) {
    return `No data found for "${classification?.geography?.name || 'Kenya'}". Try adjusting your search.`;
  }

  const geography = classification?.geography?.name || 'Kenya';
  const numericData = data.filter(d => typeof d.value === 'number' && !isNaN(d.value));
  
  let summary = `### 📊 Data Summary for ${geography}\n\n`;
  summary += `- **Total Records:** ${data.length}\n`;
  
  if (numericData.length > 0) {
    const values = numericData.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    summary += `- **Value Range:** ${min.toFixed(1)} to ${max.toFixed(1)}\n`;
    summary += `- **Average Value:** ${avg.toFixed(1)}\n`;
  }
  
  // Top 5 indicators
  if (data.length > 0) {
    summary += `\n**Top Indicators:**\n`;
    data.slice(0, 5).forEach((d, i) => {
      const name = d.name || d.indicator || 'Unknown';
      const value = d.value !== undefined ? 
        (typeof d.value === 'number' ? d.value.toLocaleString() : d.value) : 
        'N/A';
      summary += `${i + 1}. ${name}: ${value} ${d.unit || ''}\n`;
    });
  }
  
  return summary;
}

// ============================================================
// INSTRUCTION PARSER
// ============================================================

/**
 * Parse user instructions from query
 */
function parseUserInstructions(query, classification) {
  const lowerQuery = query.toLowerCase();
  const instructions = {
    action: 'list', // Default
    format: 'list',
    limit: null,
    geography: classification?.geography?.name || null,
    sortBy: null,
    sortOrder: 'asc',
    includeSource: true,
    includeYear: true,
    includeUnit: true,
    compact: false,
  };

  // Detect action type
  if (lowerQuery.includes('table') || lowerQuery.includes('tabular')) {
    instructions.action = 'table';
    instructions.format = 'table';
  } else if (lowerQuery.includes('report') || lowerQuery.includes('generate report') || lowerQuery.includes('summary report')) {
    instructions.action = 'report';
    instructions.format = 'report';
  } else if (lowerQuery.includes('summary') || lowerQuery.includes('summarise') || lowerQuery.includes('summarize')) {
    instructions.action = 'summary';
    instructions.format = 'summary';
  } else if (lowerQuery.includes('list') || lowerQuery.includes('show me all') || lowerQuery.includes('display')) {
    instructions.action = 'list';
    instructions.format = 'list';
  } else if (lowerQuery.includes('compare') || lowerQuery.includes('comparison')) {
    instructions.action = 'comparison';
    instructions.format = 'list';
  }

  // Detect limit
  const limitMatch = lowerQuery.match(/\b(?:top|limit|show|first|only)\s*(\d+)\b/i);
  if (limitMatch) {
    instructions.limit = parseInt(limitMatch[1]);
  }

  // Detect sort
  if (lowerQuery.includes('highest') || lowerQuery.includes('largest') || lowerQuery.includes('max')) {
    instructions.sortBy = 'value';
    instructions.sortOrder = 'desc';
  } else if (lowerQuery.includes('lowest') || lowerQuery.includes('smallest') || lowerQuery.includes('min')) {
    instructions.sortBy = 'value';
    instructions.sortOrder = 'asc';
  }

  // Detect compact view
  if (lowerQuery.includes('compact') || lowerQuery.includes('brief')) {
    instructions.compact = true;
  }

  // Detect if source should be hidden
  if (lowerQuery.includes('no source') || lowerQuery.includes('without source')) {
    instructions.includeSource = false;
  }

  return instructions;
}

// ============================================================
// MAIN RAG FUNCTION
// ============================================================

/**
 * Main RAG pipeline with enhanced query understanding
 */
export async function runRAG(query, conversationHistory = [], options = {}) {
  const {
    conversationId,
    filterContext = {},
    onChunk,
    maxTokens = 800,
    temperature = 0.7,
  } = options;

  const trimmedQuery = (query || '').trim();

  // Guard against accidental single-character / empty submissions
  if (!trimmedQuery || trimmedQuery.length < 2) {
    const defaultMsg = '👋 Hello! I am AlphaEconomist. Please ask a question about Kenya\'s data or specify a county/indicator.';
    if (onChunk) {
      onChunk(defaultMsg);
      // Call onChunk with the final formatted version
      setTimeout(() => onChunk(''), 100);
    }
    return {
      answer: defaultMsg,
      data: [],
      classification: { intent: 'greeting', geography: null },
      provider: 'assistant',
      citations: [],
      suggested_questions: ['What are the key economic indicators for Kenya?', 'Compare counties', 'Generate a report'],
    };
  }

  console.log('🧠 Running RAG pipeline for:', trimmedQuery);

  // ============================================================
  // STEP 1: Classify query (extract intent, entities, geography)
  // ============================================================
  const classification = await classifyQuery(trimmedQuery, conversationHistory);
  console.log('📋 Classification:', classification);

  // ============================================================
  // STEP 2: Parse user instructions
  // ============================================================
  const instructions = parseUserInstructions(trimmedQuery, classification);
  console.log('📝 Instructions:', instructions);

  // ============================================================
  // STEP 3: Build context from conversation history
  // ============================================================
  const historyContext = buildConversationContext(conversationHistory);

  // ============================================================
  // STEP 4: Retrieve data based on classification
  // ============================================================
  let retrievedData = [];
  
  // Apply limit from instructions if present
  const limit = instructions.limit || 100;
  
  // Special handling for "listing" intent
  if (classification.intent === 'listing') {
    // Get distinct indicators for the geography
    retrievedData = await getDistinctIndicators(classification.geography);
    console.log(`📊 Found ${retrievedData.length} distinct indicators`);
  } else {
    // Normal retrieval with limit
    retrievedData = await retrieveData(trimmedQuery, classification, { 
      ...filterContext,
      geography: classification.geography,
      time_range: classification.time_range,
      limit: Math.min(limit, 500),
    });
    console.log(`📊 Retrieved ${retrievedData.length} indicators`);
  }

  // ============================================================
  // STEP 5: If no data, broaden the search
  // ============================================================
  if (retrievedData.length === 0 && classification.geography?.code) {
    console.log('No data, trying broader search...');
    // Try without geography filter
    const broadData = await retrieveData(trimmedQuery, { ...classification, geography: null });
    retrievedData = broadData;
  }

  // ============================================================
  // STEP 6: Apply sorting if requested
  // ============================================================
  if (instructions.sortBy && retrievedData.length > 0) {
    const field = instructions.sortBy;
    const order = instructions.sortOrder === 'desc' ? -1 : 1;
    retrievedData.sort((a, b) => {
      const valA = a[field] || 0;
      const valB = b[field] || 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * order;
      }
      return String(valA).localeCompare(String(valB)) * order;
    });
  }

  // ============================================================
  // STEP 7: Apply limit
  // ============================================================
  const maxDisplay = instructions.limit || 100;
  const displayData = retrievedData.slice(0, maxDisplay);

  // ============================================================
  // STEP 8: Build context for LLM
  // ============================================================
  let contextText = '';
  
  // Add data summary to context
  if (retrievedData.length > 0) {
    if (instructions.action === 'table') {
      // Use HTML table format
      contextText = formatAsHTMLTable(displayData, {
        caption: classification?.geography?.name ? 
          `Data for ${classification.geography.name}` : 
          'Data Results',
        maxRows: maxDisplay,
        compact: instructions.compact,
      });
    } else if (instructions.action === 'report') {
      // Generate report
      contextText = generateReport(displayData, classification, {
        title: classification?.geography?.name ? 
          `${classification.geography.name} Economic Report` : 
          'Economic Report',
        includeSummary: true,
        includeTrends: true,
        includeRecommendations: true,
      });
    } else if (instructions.action === 'summary') {
      // Generate summary
      contextText = generateSummary(displayData, classification);
    } else {
      // Default: list format
      contextText = formatAsList(displayData, {
        maxItems: maxDisplay,
        showNumbers: true,
        showDetails: true,
      });
    }
  } else {
    contextText = 'No specific data found for this query.';
  }

  // ============================================================
  // STEP 9: Generate response with LLM
  // ============================================================
  const actionDescriptions = {
    table: 'Format the data as a clean, well-structured HTML table with proper headers and alignment. Do NOT use bullet points.',
    report: 'Generate a comprehensive report with: Executive Summary, Key Findings, Data Analysis, Trends, and Recommendations. Use professional language.',
    summary: 'Provide a concise summary of the key findings, including main metrics, notable patterns, and actionable insights.',
    list: 'Present the data as a clean, organized list with clear labels and values.',
  };

  const systemPrompt = `You are AlphaEconomist, a senior economic advisor for Kenya.

Context:
- Query intent: ${classification.intent || 'analysis'}
- Geography: ${classification.geography?.type || 'National'} ${classification.geography?.name || ''}
- Time range: ${classification.time_range?.start || 'N/A'} - ${classification.time_range?.end || 'N/A'}
- Output format: ${instructions.format || 'standard'}
- User requested format: ${instructions.action}

Guidelines:
1. ${actionDescriptions[instructions.action] || actionDescriptions.list}
2. ${instructions.limit ? `The user requested a limit of ${instructions.limit} items. Respect this limit.` : 'Show all relevant data.'}
3. If the user asks for a specific number of items (e.g., "top 5"), strictly adhere to that limit.
4. Cite SPI references when available.
5. If data is insufficient, state that clearly and suggest alternatives.
6. For county-specific queries, mention the county name clearly.
7. Be concise and professional.
8. ${instructions.sortBy ? `Data is sorted by ${instructions.sortBy} in ${instructions.sortOrder === 'desc' ? 'descending' : 'ascending'} order.` : ''}
9. DO NOT use ASCII tables or text-based tables. Use HTML tables with the <table> tag for table formatting.
10. For reports, use proper markdown headers (##, ###) and structured sections.`;

  const userPrompt = `User Question: ${trimmedQuery}

Retrieved Data:
${contextText}

Previous Conversation:
${historyContext || 'No previous conversation.'}

${instructions.limit ? `Please show exactly ${instructions.limit} items as requested.` : ''}

Provide a helpful response that strictly follows the user's requested format.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: userPrompt },
  ];

  let response = null;
  let provider = 'groq';

  // Try Groq with streaming support
  if (onChunk) {
    try {
      const streamResult = await streamGroq(messages, onChunk, { maxTokens, temperature });
      if (streamResult) {
        response = { content: streamResult, provider: 'groq' };
      }
    } catch (err) {
      console.warn('Groq streaming failed, attempting standard call:', err);
    }
  }

  if (!response) {
    response = await callGroq(messages, { maxTokens, temperature });
  }

  // Fallback to HuggingFace
  if (!response) {
    console.log('🔄 Falling back to HuggingFace...');
    response = await callHuggingFace(messages, { maxTokens: Math.min(maxTokens, 500), temperature });
    provider = 'huggingface';
  }

  // Ultimate fallback – data summary
  if (!response || !response.content) {
    console.log('⚠️ All LLMs failed, generating data summary');
    let fallbackResponse;
    
    if (instructions.action === 'table') {
      fallbackResponse = formatAsHTMLTable(displayData, {
        caption: classification?.geography?.name ? 
          `Data for ${classification.geography.name}` : 
          'Data Results',
        maxRows: maxDisplay,
      });
    } else if (instructions.action === 'report') {
      fallbackResponse = generateReport(displayData, classification);
    } else if (instructions.action === 'summary') {
      fallbackResponse = generateSummary(displayData, classification);
    } else {
      fallbackResponse = formatAsList(displayData, { maxItems: maxDisplay });
    }
    
    return {
      answer: fallbackResponse,
      data: retrievedData,
      classification,
      provider: 'fallback',
      citations: retrievedData.slice(0, 5).map(d => d.spi).filter(Boolean),
      suggested_questions: generateSuggestedQuestions(trimmedQuery, classification, retrievedData),
      metadata: {
        totalFound: retrievedData.length,
        displayed: displayData.length,
        limit: maxDisplay,
        format: instructions.action,
      },
    };
  }

  // ============================================================
  // STEP 10: Return response with metadata
  // ============================================================
  return {
    answer: response.content,
    data: retrievedData,
    classification,
    provider: response.provider || provider,
    citations: retrievedData.slice(0, 5).map(d => d.spi).filter(Boolean),
    suggested_questions: generateSuggestedQuestions(trimmedQuery, classification, retrievedData),
    metadata: {
      totalFound: retrievedData.length,
      displayed: displayData.length,
      limit: maxDisplay,
      format: instructions.action,
      geography: classification?.geography?.name || 'National',
    },
  };
}

/**
 * Generate suggested questions
 */
function generateSuggestedQuestions(query, classification, data) {
  const suggestions = [];

  if (classification.geography?.name) {
    suggestions.push(`Show me GDP growth in ${classification.geography.name}`);
    suggestions.push(`What are the main sectors in ${classification.geography.name}?`);
  }

  if (data && data.length > 0 && data[0]?.name) {
    suggestions.push(`Show me the trend for "${data[0].name}"`);
  }

  suggestions.push('Compare counties');
  suggestions.push('Generate a report');

  return suggestions.slice(0, 4);
}

export default { runRAG };
