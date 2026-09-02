import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, RefreshCw, Maximize2 } from 'lucide-react';
import { getIndicatorSeries } from '@/lib/explorerAPI';

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'area', label: 'Area Chart', icon: '📉' },
  { value: 'pie', label: 'Pie Chart', icon: '🍩' },
];

const COLORS = ['#004d99', '#008c51', '#f5a623', '#d0021b', '#7f8c8d'];

export default function ChartView({ 
  indicators, 
  selectedIndicatorId, 
  onSelectIndicator,
  onExport,
  className = '' 
}) {
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (selectedIndicatorId) {
      loadChartData(selectedIndicatorId);
    }
  }, [selectedIndicatorId]);

  const loadChartData = async (indicatorId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIndicatorSeries(indicatorId);
      setChartData(data);
    } catch (err) {
      setError(err.message);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-sm">No data available for chart</p>
          <p className="text-xs">Select an indicator to visualise</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#004d99" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#004d99" 
              fill="#004d99" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        );
      case 'pie':
        const pieData = chartData.slice(0, 10).map(d => ({
          name: d.year,
          value: d.value
        }));
        return (
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#004d99" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartType === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            onClick={() => onExport?.(chartData, chartType)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart
          </button>
          {/* Fullscreen */}
          <button
            onClick={() => setShowFullscreen(!showFullscreen)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Indicator Selector */}
      <div className="mb-4">
        <select
          value={selectedIndicatorId || ''}
          onChange={(e) => onSelectIndicator?.(e.target.value)}
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
      <div className="h-80">
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

      {/* Chart Summary */}
      {chartData.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
          <span>
            {chartData.length} data points • 
            {chartData[0]?.source_mcda && ` Source: ${chartData[0].source_mcda}`}
            {chartData[0]?.county_name && ` • ${chartData[0].county_name}`}
          </span>
        </div>
      )}
    </div>
  );
}
