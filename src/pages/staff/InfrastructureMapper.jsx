import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Building2, Map, Layers, Plus, Minus, Search, Loader2, TrendingUp, Users, Zap, Droplet, Route as Road
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from 'react-leaflet';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PROJECTS = [
  { name: 'Northern Bypass Expansion', type: 'road', lat: -1.2864, lng: 36.8172, status: 'in_progress', budget: 4.5 },
  { name: 'Thiba Dam Construction', type: 'dam', lat: -0.5833, lng: 37.4500, status: 'in_progress', budget: 8.2 },
  { name: 'Garissa Solar Plant', type: 'power', lat: -0.4536, lng: 39.6461, status: 'completed', budget: 3.1 },
  { name: 'Mombasa Port Expansion', type: 'port', lat: -4.0435, lng: 39.6682, status: 'in_progress', budget: 12.5 },
  { name: 'Kisumu Water Supply', type: 'water', lat: -0.0917, lng: 34.7680, status: 'in_progress', budget: 2.3 },
  { name: 'Eldoret Power Line', type: 'power', lat: 0.5143, lng: 35.2698, status: 'completed', budget: 1.8 },
  { name: 'Nyeri Hospital', type: 'health', lat: -0.4167, lng: 36.9500, status: 'completed', budget: 1.2 },
  { name: 'Turkana Wind Farm', type: 'power', lat: 2.7917, lng: 35.6500, status: 'in_progress', budget: 6.8 },
];

const LAYERS = [
  { key: 'road', label: 'Roads', icon: Road, color: '#3b82f6' },
  { key: 'dam', label: 'Dams', icon: Droplet, color: '#06b6d4' },
  { key: 'power', label: 'Power Lines', icon: Zap, color: '#f59e0b' },
  { key: 'water', label: 'Water', icon: Droplet, color: '#10b981' },
  { key: 'health', label: 'Health', icon: Building2, color: '#ef4444' },
];

const overlayData = [
  { county: 'Nairobi', projects: 8, population: 4397000 },
  { county: 'Mombasa', projects: 4, population: 1209000 },
  { county: 'Nakuru', projects: 5, population: 1864000 },
  { county: 'Kisumu', projects: 3, population: 1156000 },
  { county: 'Turkana', projects: 2, population: 926000 },
  { county: 'Garissa', projects: 2, population: 841000 },
];

export default function InfrastructureMapper() {
  const { lang } = useLanguage();
  const [activeLayers, setActiveLayers] = useState(['road', 'dam', 'power']);
  const [selectedProject, setSelectedProject] = useState(null);

  const toggleLayer = (key) => {
    setActiveLayers(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const visibleProjects = PROJECTS.filter(p => activeLayers.includes(p.type));
  const totalBudget = PROJECTS.reduce((a, p) => a + p.budget, 0);
  const completed = PROJECTS.filter(p => p.status === 'completed').length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Ramani ya Miundombinu' : 'Infrastructure Mapper'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Weka data ya kijamii juu ya miradi ya miundombinu kuhakikisha rasilimali zinakwenda sehemu zinazohitajika.'
            : 'Overlay socio-economic data with physical infrastructure projects to ensure resources go where needed most.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Miradi Yote' : 'Total Projects', value: PROJECTS.length, icon: Building2, color: 'text-primary' },
          { label: lang === 'sw' ? 'Imekamilika' : 'Completed', value: completed, icon: TrendingUp, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'Bajeti (KES B)' : 'Budget (KES B)', value: totalBudget.toFixed(1), icon: Zap, color: 'text-amber-600' },
          { label: lang === 'sw' ? 'Tabaka Amilifu' : 'Active Layers', value: activeLayers.length, icon: Layers, color: 'text-blue-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card overflow-hidden h-[500px]">
            <MapContainer center={[-0.5, 37.5]} zoom={6} className="w-full h-full" scrollWheelZoom={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {visibleProjects.map((p, i) => {
                const layer = LAYERS.find(l => l.key === p.type);
                return (
                  <CircleMarker key={i} center={[p.lat, p.lng]} radius={10} pathOptions={{ color: layer?.color, fillColor: layer?.color, fillOpacity: 0.6 }} eventHandlers={{ click: () => setSelectedProject(p) }}>
                    <Popup>
                      <div className="text-xs">
                        <strong>{p.name}</strong><br />
                        Type: {p.type}<br />
                        Status: {p.status}<br />
                        Budget: KES {p.budget}B
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            {LAYERS.map(layer => (
              <button
                key={layer.key}
                onClick={() => toggleLayer(layer.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeLayers.includes(layer.key) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                {layer.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Overlay chart & detail */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {lang === 'sw' ? 'Miradi dhidi ya Watu' : 'Projects vs Population'}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overlayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                <XAxis dataKey="county" tick={{ fontSize: 9, fill: 'hsl(155 10% 40%)' }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
                <Bar dataKey="projects" name="Projects" fill="hsl(149 56% 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {selectedProject && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="font-heading font-bold text-sm text-foreground">{selectedProject.name}</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{selectedProject.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-semibold capitalize ${selectedProject.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedProject.status.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-bold text-foreground">KES {selectedProject.budget}B</span></div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}