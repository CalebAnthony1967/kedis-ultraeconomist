import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart,
  ReferenceLine,
  Label,
} from 'recharts';
import {
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MapPin,
  Database,
  FileText,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react';
import { getIndicatorSeries } from '@/lib/explorerAPI';
import { exportChartAsPNG } from '../utils/exportUtils';

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'area', label: 'Area Chart', icon: '📉' },
  { value: 'pie', label: 'Pie Chart', icon: '🍩' },
];

const COLORS = ['#004d99', '#008c51', '#f5a623', '#d0021b', '#7f8c8d', '#8b5cf6', '#06b6d4'];

export default function ChartView({
  indicators = [],
  selectedIndicatorId = null,
  onSelectIndicator = () => {},
  onExport = () => {},
  className = '',
  height = 350,
  lang: propLang, // Allow lang to be passed as prop
}) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang; // Use prop if provided, otherwise context
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [zoomDomain, setZoomDomain] = useState({ start: null, end: null });
  const [isZooming, setIsZooming] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);

  const chartRef = useRef(null);

  // Load chart data when indicator is selected
  useEffect(() => {
    if (selectedIndicatorId) {
      loadChartData(selectedIndicatorId);
    } else {
      setChartData([]);
      setAiInsights([]);
    }
  }, [selectedIndicatorId]);

  const loadChartData = async (indicatorId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIndicatorSeries(indicatorId);
      setChartData(data);
      
      const indicator = indicators.find(ind => ind.id === indicatorId);
      setSelectedSeries(indicator);
      
      // Generate AI insights
      generateAIInsights(data, indicator);
    } catch (err) {
      setError(err.message);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = (data, indicator) => {
    if (data.length === 0) {
      setAiInsights([]);
      return;
    }

    const insights = [];
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);

    // Trend insight
    if (values.length > 1) {
      const first = values[0];
      const last = values[values.length - 1];
      const change = ((last - first) / (first || 1)) * 100;
      const direction = change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';
      insights.push({
        type: 'trend',
        icon: change > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : 
              change < 0 ? <TrendingDown className="h-4 w-4 text-red-500" /> :
              <Minus className="h-4 w-4 text-muted-foreground" />,
        text: `${indicator?.name || 'Indicator'} is ${direction} by ${Math.abs(change).toFixed(1)}%`,
        severity: Math.abs(change) > 10 ? 'high' : 'medium',
      });
    }

    // Anomaly insight
    if (values.length > 3) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min;
      if (range / (mean || 1) > 0.4) {
        const maxIndex = values.indexOf(max);
        const minIndex = values.indexOf(min);
        insights.push({
          type: 'anomaly',
          icon: <span className="text-amber-500 text-lg">⚠️</span>,
          text: `Significant variance: high of ${max.toFixed(2)} in ${data[maxIndex]?.year}, low of ${min.toFixed(2)} in ${data[minIndex]?.year}`,
          severity: 'medium',
        });
      }
    }

    // Data coverage insight
    const yearCount = data.length;
    if (yearCount > 0) {
      insights.push({
        type: 'coverage',
        icon: <span className="text-primary">📊</span>,
        text: `${yearCount} years of data (${data[0]?.year} – ${data[data.length-1]?.year})`,
        severity: 'low',
      });
    }

    setAiInsights(insights);
  };

  const handleExportPNG = () => {
    exportChartAsPNG(chartRef, `chart-${selectedIndicatorId || 'export'}.png`);
    onExport?.('png');
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <RefreshCw className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium">{lang === 'sw' ? 'Hakuna data' : 'No data'}</p>
          <p className="text-xs opacity-70">
            {lang === 'sw' ? 'Chagua kiashiria ili kuona chati' : 'Select an indicator to visualise'}
          </p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                {entry.name}: {entry.value?.toLocaleString() || 'N/A'}
                {selectedSeries?.unit && ` ${selectedSeries.unit}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar 
              dataKey="value" 
              fill="#004d99" 
              name={selectedSeries?.name || 'Value'}
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine
              y={chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length}
              stroke="#f5a623"
              strokeDasharray="3 3"
            >
              <Label value={lang === 'sw' ? 'Wastani' : 'Average'} position="top" />
            </ReferenceLine>
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#004d99" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#004d99" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#004d99" 
              strokeWidth={2.5}
              fill="url(#areaGradient)"
              name={selectedSeries?.name || 'Value'}
            />
          </AreaChart>
        );
      case 'pie':
        const pieData = chartData.slice(0, 10).map(d => ({
          name: d.year,
          value: d.value || 0,
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        );
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#004d99" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#004d99' }}
              activeDot={{ r: 6 }}
              name={selectedSeries?.name || 'Value'}
            />
            <ReferenceLine
              y={chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length}
              stroke="#f5a623"
              strokeDasharray="3 3"
            >
              <Label value={lang === 'sw' ? 'Wastani' : 'Average'} position="top" />
            </ReferenceLine>
          </LineChart>
        );
    }
  };

  return (
    <div 
      ref={chartRef}
      className={`
        rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4
        ${showFullscreen ? 'fixed inset-4 z-50 shadow-2xl overflow-auto' : ''}
        ${className}
      `}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/50 p-0.5">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                  ${chartType === type.value
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary/50'
                  }`}
                title={type.label}
              >
                {type.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Insights Toggle */}
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
              ${showAIInsights 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-muted-foreground hover:bg-secondary/50'
              }`}
          >
            <span className="text-sm">🧠</span>
            {lang === 'sw' ? 'Uchambuzi' : 'Insights'}
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportPNG}
            disabled={chartData.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setShowFullscreen(!showFullscreen)}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {showFullscreen ? (
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && aiInsights.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
            <span className="text-sm">🧠</span>
            {lang === 'sw' ? 'Uchambuzi wa AI' : 'AI Insights'}
          </h4>
          <div className="space-y-1.5">
            {aiInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 mt-0.5">{insight.icon}</span>
                <span className="text-foreground/80">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicator Selector */}
      <div className="mb-4">
        <select
          value={selectedIndicatorId || ''}
          onChange={(e) => onSelectIndicator(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">
            {lang === 'sw' ? 'Chagua kiashiria...' : 'Select an indicator...'}
          </option>
          {indicators?.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.name} ({ind.year || 'No year'})
            </option>
          ))}
        </select>
      </div>

      {/* Chart Area */}
      <div className={`w-full ${showFullscreen ? 'h-[calc(100%-200px)]' : ''}`} style={{ height: showFullscreen ? undefined : height }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Metadata */}
      {chartData.length > 0 && selectedSeries && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
          {selectedSeries.source_mcda && (
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {selectedSeries.source_mcda}
            </span>
          )}
          {selectedSeries.county_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {selectedSeries.county_name}
            </span>
          )}
          {selectedSeries.unit && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {selectedSeries.unit}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {chartData[0]?.year} – {chartData[chartData.length - 1]?.year}
          </span>
          <span className="flex items-center gap-1">
            📊 {chartData.length} {lang === 'sw' ? 'data point' : 'data points'}
          </span>
        </div>
      )}
    </div>
  );
}
