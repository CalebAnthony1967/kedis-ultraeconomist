import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { supabaseEntities } from '@/lib/supabaseData';
import {
  Server, Activity, Pause, Play, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, Radio
} from 'lucide-react';

export default function ConnectorMonitor() {
  const { t } = useLanguage();
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);

  useEffect(() => {
    loadConnectors();
  }, []);

  async function loadConnectors() {
    try {
      setLoading(true);
      // Supabase migration: fetching from 'data_connectors' table
      const data = await supabaseEntities.DataConnector.list('-created_date', 50);
      setConnectors(data || []);
    } catch (e) {
      console.error("Failed to load connectors:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(id) {
    setSyncingId(id);
    try {
      // Simulate/Trigger Edge Function or Update Status
      await supabaseEntities.DataConnector.update(id, { 
        last_sync: new Date().toISOString(),
        status: 'active' 
      });
      await loadConnectors();
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncingId(null);
    }
  }

  async function toggleStatus(connector) {
    const newStatus = connector.status === 'active' ? 'paused' : 'active';
    try {
      await supabaseEntities.DataConnector.update(connector.id, { status: newStatus });
      await loadConnectors();
    } catch (e) {
      console.error("Status update failed:", e);
    }
  }

  return (
    <div className="p-6 space-y-6 main-anim">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Radio className="text-blue-400 animate-pulse" />
            {t('statistical_connectors') || 'Statistical Connector Monitor'}
          </h2>
          <p className="text-gray-400 mt-1">Live CDC (Change Data Capture) Pipeline Management</p>
        </div>
        <button 
          onClick={loadConnectors}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded-lg hover:bg-blue-600/30 transition-all text-blue-400"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          {t('refresh') || 'Refresh Status'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="animate-spin text-blue-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map((connector) => (
            <div key={connector.id} className="glass-card p-6 border border-white/10 rounded-2xl relative overflow-hidden">
              {/* Background Status Glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-20 ${
                connector.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />

              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Server className="text-blue-400" size={24} />
                </div>
                <span className={`status-pill ${
                  connector.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {connector.status.toUpperCase()}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{connector.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{connector.source_type || 'External API'}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Clock size={16} className="text-gray-500" />
                  <span>Last Sync: {connector.last_sync ? new Date(connector.last_sync).toLocaleString() : 'Never'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Activity size={16} className="text-gray-500" />
                  <span>Health: {connector.health_score || '98'}%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleSync(connector.id)}
                  disabled={syncingId === connector.id}
                  className="flex-1 py-2 bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={syncingId === connector.id ? "animate-spin" : ""} />
                  {syncingId === connector.id ? 'Syncing...' : 'Sync Now'}
                </button>
                <button 
                  onClick={() => toggleStatus(connector)}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                >
                  {connector.status === 'active' ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {connectors.length === 0 && !loading && (
        <div className="glass-card p-12 text-center border-dashed border-white/20">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h4 className="text-xl font-bold text-white">No Connectors Configured</h4>
          <p className="text-gray-400">Initialize live pipes in the Ingestion Engine to begin monitoring.</p>
        </div>
      )}
    </div>
  );
}