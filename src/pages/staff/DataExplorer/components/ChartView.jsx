import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Download, RefreshCw, Maximize2, Minimize2,
  TrendingUp, TrendingDown, Minus, Calendar,
  MapPin, Database, FileText, ChevronDown, ChevronUp
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
  height = 300,
}) {
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  
  const chartRef = useRef(null);

  // Load chart data when indicator is selected
  useEffect(() => {
    if (selectedIndicatorId) {
      loadChartData(selectedIndicatorId);
    } else {
      setChartData([]);
    }
  }, [selectedIndicatorId]);

  const loadChartData = async (indicatorId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIndicatorSeries(indicatorId);
      setChartData(data);
      
      // Find the indicator name
      const indicator = indicators.find(ind => ind.id === indicatorId);
      setSelectedSeries(indicator);
    } catch (err) {
      setError(err.message);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-sm font-medium">No data available for chart</p>
          <p className="text-xs opacity-70">Select an indicator to visualise</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    // Format tooltip
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                {entry.name}: {entry.value?.toLocaleString() || 'N/A'}
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
          </LineChart>
        );
    }
  };

  // Get trend info
  const getTrend = () => {
    if (chartData.length < 2) return null;
    const first = chartData[0]?.value || 0;
    const last = chartData[chartData.length - 1]?.value || 0;
    const change = ((last - first) / (first || 1)) * 100;
    const direction = change > 1 ? 'up' : change < -1 ? 'down' : 'stable';
    return { change, direction };
  };

  const trend = getTrend();

  // Get summary stats
  const getStats = () => {
    if (chartData.length === 0) return null;
    const values = chartData.map(d => d.value).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    };
  };

  const stats = getStats();

  return (
    <div 
      ref={chartRef}
      className={`
        rounded-xl border border-border bg-card p-4
        ${showFullscreen ? 'fixed inset-4 z-50 shadow-2xl overflow-auto' : ''}
        ${className}
      `}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                  ${chartType === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                  }`}
                title={type.label}
              >
                {type.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Trend indicator */}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg
              ${trend.direction === 'up' ? 'text-emerald-600 bg-emerald-50' : 
                trend.direction === 'down' ? 'text-red-600 bg-red-50' : 
                'text-muted-foreground bg-secondary'
              }`}
            >
              {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
              {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
              {trend.direction === 'stable' && <Minus className="h-3.5 w-3.5" />}
              {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExportPNG}
            disabled={chartData.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setShowFullscreen(!showFullscreen)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            {showFullscreen ? (
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Metadata Toggle */}
          {stats && (
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              {showMetadata ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Indicator Selector */}
      <div className="mb-4">
        <select
          value={selectedIndicatorId || ''}
          onChange={(e) => onSelectIndicator(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select an indicator to visualise...</option>
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

      {/* Metadata Panel */}
      {showMetadata && stats && selectedSeries && (
        <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-semibold text-foreground">{stats.count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Min Value</div>
              <div className="font-semibold text-foreground">{stats.min.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Value</div>
              <div className="font-semibold text-foreground">{stats.max.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Average</div>
              <div className="font-semibold text-foreground">{stats.avg.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
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
          </div>
        </div>
      )}
    </div>
  );
}
