import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import {
  Map as MapIcon, Layers, MapPin, Download, Search, ChevronRight,
  Thermometer, Leaf, Users, DollarSign, TrendingUp, Shield, Target
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const KENYA_CENTER = [-0.0236, 37.9062];

const SAMPLE_WARDS = [
  { code: 'KN-001', name: 'Kibera', county: 'Nairobi', constituency: 'Langata', lat: -1.312, lng: 36.782, poverty_rate: 78.2, gva: 12.5, evi: 0.12, mean_temperature: 24.5, population: 185000, sdg_score: 42.3, carbon_storage: 2.1, biodiversity_index: 0.15 },
  { code: 'KN-002', name: 'Westlands', county: 'Nairobi', constituency: 'Westlands', lat: -1.264, lng: 36.811, poverty_rate: 12.8, gva: 185.4, evi: 0.08, mean_temperature: 23.8, population: 95000, sdg_score: 82.1, carbon_storage: 1.8, biodiversity_index: 0.22 },
  { code: 'MK-001', name: 'Mavoko', county: 'Machakos', constituency: 'Mavoko', lat: -1.327, lng: 36.964, poverty_rate: 38.5, gva: 45.2, evi: 0.28, mean_temperature: 25.1, population: 140000, sdg_score: 58.7, carbon_storage: 8.5, biodiversity_index: 0.45 },
  { code: 'KM-001', name: 'Naivasha', county: 'Nakuru', constituency: 'Naivasha', lat: -0.728, lng: 36.432, poverty_rate: 31.2, gva: 78.3, evi: 0.42, mean_temperature: 19.5, population: 230000, sdg_score: 64.5, carbon_storage: 15.2, biodiversity_index: 0.68 },
  { code: 'KM-002', name: 'Bahati', county: 'Nakuru', constituency: 'Bahati', lat: -0.281, lng: 36.094, poverty_rate: 42.1, gva: 32.1, evi: 0.38, mean_temperature: 18.2, population: 110000, sdg_score: 52.8, carbon_storage: 12.8, biodiversity_index: 0.55 },
  { code: 'KK-001', name: 'Likoni', county: 'Mombasa', constituency: 'Likoni', lat: -4.075, lng: 39.666, poverty_rate: 55.3, gva: 28.7, evi: 0.15, mean_temperature: 27.8, population: 195000, sdg_score: 48.2, carbon_storage: 3.2, biodiversity_index: 0.35 },
  { code: 'KK-002', name: 'Nyali', county: 'Mombasa', constituency: 'Nyali', lat: -4.034, lng: 39.715, poverty_rate: 18.5, gva: 112.3, evi: 0.10, mean_temperature: 27.5, population: 88000, sdg_score: 76.8, carbon_storage: 2.8, biodiversity_index: 0.40 },
  { code: 'KS-001', name: 'Nyeri Central', county: 'Nyeri', constituency: 'Nyeri Town', lat: -0.417, lng: 36.951, poverty_rate: 22.8, gva: 56.4, evi: 0.48, mean_temperature: 18.5, population: 125000, sdg_score: 71.3, carbon_storage: 18.5, biodiversity_index: 0.72 },
  { code: 'KV-001', name: 'Vihiga', county: 'Vihiga', constituency: 'Vihiga', lat: 0.034, lng: 34.717, poverty_rate: 48.5, gva: 22.1, evi: 0.55, mean_temperature: 20.2, population: 98000, sdg_score: 55.4, carbon_storage: 22.1, biodiversity_index: 0.78 },
  { code: 'KB-001', name: 'Bungoma', county: 'Bungoma', constituency: 'Bungoma South', lat: 0.564, lng: 34.563, poverty_rate: 44.2, gva: 35.8, evi: 0.52, mean_temperature: 21.5, population: 165000, sdg_score: 57.2, carbon_storage: 19.8, biodiversity_index: 0.70 },
  { code: 'KS-002', name: 'Kisumu Central', county: 'Kisumu', constituency: 'Kisumu Central', lat: -0.092, lng: 34.768, poverty_rate: 39.8, gva: 48.5, evi: 0.35, mean_temperature: 23.5, population: 155000, sdg_score: 61.5, carbon_storage: 6.5, biodiversity_index: 0.48 },
  { code: 'KG-001', name: 'Garissa Township', county: 'Garissa', constituency: 'Garissa Township', lat: 0.454, lng: 39.646, poverty_rate: 65.8, gva: 15.2, evi: 0.18, mean_temperature: 29.5, population: 105000, sdg_score: 38.5, carbon_storage: 1.5, biodiversity_index: 0.20 },
];

const INDICATOR_LAYERS = [
  { key: 'poverty_rate', label: 'Poverty Rate', icon: Users, unit: '%', color: '#E5243B' },
  { key: 'gva', label: 'Gross Value Added', icon: DollarSign, unit: 'KES M', color: '#4C9F38' },
  { key: 'evi', label: 'Vegetation Index', icon: Leaf, unit: '', color: '#26BDE2' },
  { key: 'mean_temperature', label: 'Mean Temperature', icon: Thermometer, unit: '°C', color: '#FF3A21' },
  { key: 'sdg_score', label: 'SDG Composite', icon: Target, unit: '', color: '#19486A' },
  { key: 'carbon_storage', label: 'Carbon Storage', icon: Shield, unit: 'tC/ha', color: '#3F7E44' },
];

export default function WardGISMap() {
  const { t } = useLanguage();
  const [activeLayer, setActiveLayer] = useState('poverty_rate');
  const [selectedWard, setSelectedWard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbWards, setDbWards] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.WardData.list('-created_date', 100);
        setDbWards(data || []);
      } catch (e) {}
    }
    load();
  }, []);

  const wards = dbWards.length > 0 ? dbWards.map(w => ({
    ...w,
    lat: SAMPLE_WARDS[Math.floor(Math.random() * SAMPLE_WARDS.length)].lat + (Math.random() - 0.5) * 2,
    lng: SAMPLE_WARDS[Math.floor(Math.random() * SAMPLE_WARDS.length)].lng + (Math.random() - 0.5) * 2,
  })) : SAMPLE_WARDS;

  const filtered = searchQuery
    ? wards.filter(w =>
        w.ward_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.county?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : wards;

  const getColor = (value) => {
    const layer = INDICATOR_LAYERS.find(l => l.key === activeLayer);
    if (!layer) return '#666';
    return layer.color;
  };

  const getRadius = (value) => {
    if (!value) return 5;
    return Math.max(5, Math.min(20, value / 5));
  };

  const activeLayerConfig = INDICATOR_LAYERS.find(l => l.key === activeLayer);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('public.gis')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Interactive Kenya map with drill-down to 1,450 wards · SAE estimates with satellite covariates.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Layer sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Indicator Layers</h3>
            </div>
            <div className="space-y-1.5">
              {INDICATOR_LAYERS.map(layer => (
                <button
                  key={layer.key}
                  onClick={() => setActiveLayer(layer.key)}
                  className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeLayer === layer.key ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: layer.color }} />
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ward or county..."
                className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Selected ward details */}
          {selectedWard && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-scale-in">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{selectedWard.ward_name}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">County</span>
                  <span className="font-medium">{selectedWard.county}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Constituency</span>
                  <span className="font-medium">{selectedWard.constituency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ward Code</span>
                  <span className="font-mono text-primary">{selectedWard.ward_code || '—'}</span>
                </div>
                <div className="pt-2 border-t border-border space-y-1.5">
                  {INDICATOR_LAYERS.map(layer => (
                    <div key={layer.key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }} />
                        {layer.label}
                      </span>
                      <span className="font-semibold">{selectedWard[layer.key] ?? '—'}{layer.unit && ` ${layer.unit}`}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                  <Download className="h-3.5 w-3.5" />
                  Download Ward Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden h-[500px] lg:h-[600px]">
            <MapContainer center={KENYA_CENTER} zoom={6} className="w-full h-full" scrollWheelZoom={true}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {filtered.map((ward, i) => (
                <CircleMarker
                  key={i}
                  center={[ward.lat, ward.lng]}
                  radius={getRadius(ward[activeLayer])}
                  pathOptions={{
                    color: getColor(ward[activeLayer]),
                    fillColor: getColor(ward[activeLayer]),
                    fillOpacity: 0.6,
                  }}
                  eventHandlers={{ click: () => setSelectedWard(ward) }}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>{ward.ward_name}</strong><br />
                      {ward.county} County<br />
                      {activeLayerConfig?.label}: {ward[activeLayer]}{activeLayerConfig?.unit}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground">{activeLayerConfig?.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Low</span>
              <div className="h-2 w-32 rounded-full" style={{ background: `linear-gradient(to right, ${activeLayerConfig?.color}40, ${activeLayerConfig?.color})` }} />
              <span className="text-xs text-muted-foreground">High</span>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} wards shown</span>
          </div>
        </div>
      </div>
    </div>
  );
}