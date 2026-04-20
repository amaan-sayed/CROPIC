import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft, // Added for back button
  Loader2,
  AlertCircle,
  MapPin,
  TrendingUp,
  Leaf,
  Activity,
  Calendar,
  Filter,
  X, // Added for close button
  ShieldCheck, // Added for remarks
} from 'lucide-react';

// --- TYPESCRIPT INTERFACES ---

interface Submission {
  id: string;
  time: string;
  location: string;
  // Add 'Approved' and 'Rejected' here inside the type definition
  status: 'Healthy' | 'Moisture Stress' | 'Pest Alert' | 'High Damage' | 'Approved' | 'Rejected';
  coordinates: [number, number];
  cropStage?: string;
  remarks?: string;
}

interface EnrichedSubmission extends Submission {
  resolvedLocation: string;
  formattedTime: string;
}

// --- HELPERS ---

function formatTime(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const place =
      a.village || a.suburb || a.town || a.city_district || a.city || a.county || '';
    const district = a.state_district || a.county || a.state || '';
    return [place, district].filter(Boolean).join(', ') || data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

const statusConfig = {
  Healthy: {
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: '#10b981',
    label: 'Healthy',
  },
  'Moisture Stress': {
    color: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    dot: '#f59e0b',
    label: 'Moisture Stress',
  },
  'Pest Alert': {
    color: '#f43f5e',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    dot: '#f43f5e',
    label: 'Pest Alert',
  },
  'High Damage': {
    color: '#dc2626',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    dot: '#dc2626',
    label: 'High Damage',
  },
  // --- ADD THESE TWO LINES ---
  'Approved': { color: '#059669', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', badge: 'bg-emerald-200 text-emerald-900', dot: '#059669', label: 'Approved by Officer' },
  'Rejected': { color: '#991b1b', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-200 text-red-900', dot: '#991b1b', label: 'Rejected by Officer' },
};

const validStatuses = ['Healthy', 'Moisture Stress', 'Pest Alert', 'High Damage' ,'Approved','Rejected' ] as const;

// 2. Update this function to catch officer decisions
function normalizeStatus(raw: string): keyof typeof statusConfig {
  if (validStatuses.includes(raw as any)) return raw as keyof typeof statusConfig;
  
  const lower = raw?.toLowerCase?.() ?? '';
  
  // Logic to catch officer responses from the database
  if (lower.includes('approved')) return 'Approved';
  if (lower.includes('rejected')) return 'Rejected';
  
  if (lower.includes('healthy')) return 'Healthy';
  if (lower.includes('moisture') || lower.includes('stress')) return 'Moisture Stress';
  if (lower.includes('pest')) return 'Pest Alert';
  if (lower.includes('damage')) return 'High Damage';
  return 'Healthy'; 
}

function getCfg(status: string) {
  return statusConfig[status as keyof typeof statusConfig] ?? statusConfig['Healthy'];
}

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.1825, 73.1841]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<EnrichedSubmission | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/user/dashboard', {
          cache: 'no-store',
        });
        const backendData = await response.json();

        if (backendData.userCenter) setMapCenter(backendData.userCenter);

        const rawSubs: Submission[] = backendData.submissions || [];

        const enriched: EnrichedSubmission[] = rawSubs.map((s) => ({
          ...s,
          status: normalizeStatus(s.status as unknown as string),
          formattedTime: formatTime(s.time),
          resolvedLocation: s.location || `${s.coordinates[0].toFixed(4)}, ${s.coordinates[1].toFixed(4)}`,
        }));

        setSubmissions(enriched);

        for (let i = 0; i < enriched.length; i++) {
          const sub = enriched[i];
          if (!sub.location || sub.location.trim() === '') {
            if (i > 0) await new Promise((r) => setTimeout(r, 1100));
            const resolved = await reverseGeocode(sub.coordinates[0], sub.coordinates[1]);
            setSubmissions((prev) =>
              prev.map((s) => (s.id === sub.id ? { ...s, resolvedLocation: resolved } : s))
            );
          }
        }
      } catch (err) {
        console.error('Backend connection failed:', err);
        setError('Could not connect to the CROPIC servers.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const totalAnalyzed = submissions.length;
  const healthyCount = submissions.filter((s) => s.status === 'Healthy').length;
  const alertCount = submissions.filter(
    (s) => s.status === 'Pest Alert' || s.status === 'High Damage'
  ).length;
  const healthyPercentage =
    totalAnalyzed > 0 ? Math.round((healthyCount / totalAnalyzed) * 100) : 0;

  const filteredSubmissions =
    selectedFilter === 'All'
      ? submissions
      : submissions.filter((s) => s.status === selectedFilter);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F4F6F0] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
          <Leaf className="w-7 h-7 text-white animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Loading Field Data</h2>
          <p className="text-slate-500 text-sm mt-1">Syncing your crop reports…</p>
        </div>
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="flex-1 min-h-screen bg-[#F4F6F0] flex flex-col items-center justify-center text-center px-6 gap-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .cropic-dash { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }

        .stat-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e8ede6;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .stat-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-1px); }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 80px; height: 80px;
          border-radius: 0 20px 0 80px;
          opacity: 0.06;
        }
        .stat-card.blue::before { background: #2563eb; }
        .stat-card.green::before { background: #10b981; }
        .stat-card.amber::before { background: #f59e0b; }

        .upload-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.15s;
          border: 1px solid transparent;
        }
        .upload-row:hover { background: #f8faf6; border-color: #e0e8da; }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .filter-btn {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: 1.5px solid #e0e8da;
          background: white;
          color: #64748b;
        }
        .filter-btn.active {
          background: #1a3a2a;
          border-color: #1a3a2a;
          color: white;
        }

        .map-wrapper { border-radius: 0 0 20px 20px; overflow: hidden; }
        .section-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e8ede6;
          overflow: hidden;
        }
        .section-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f0f4ee;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `}</style>

      <div className="cropic-dash flex-1 min-h-screen overflow-y-auto" style={{ background: '#F4F6F0' }}>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

{/* ── PAGE HEADER ── */}
<div className="flex items-center justify-between mb-8">
  <div className="flex items-center gap-4">
    {/* PREMIUM BACK BUTTON */}
    <button 
      onClick={() => navigate('/home')}
      className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 shadow-sm hover:shadow-md active:scale-95"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Field Dashboard</h1>
      <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5 font-medium">
        <Calendar className="w-3.5 h-3.5" />
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  </div>
  {/* Existing stats badge here... */}
</div>
          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Analyzed */}
            <div className="stat-card blue">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <span className="mono text-xs text-slate-400 font-medium">TOTAL</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Analyses</p>
              <p className="text-4xl font-bold text-slate-900 mono">{totalAnalyzed}</p>
              <p className="text-xs text-slate-400 mt-2">crop images submitted</p>
            </div>

            {/* Health Score */}
            <div className="stat-card green">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="mono text-xs text-slate-400 font-medium">SCORE</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Field Health</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-slate-900 mono">{healthyPercentage}%</p>
                {healthyPercentage >= 50 && (
                  <TrendingUp className="w-5 h-5 text-emerald-500 mb-1.5" />
                )}
              </div>
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${healthyPercentage}%`,
                    background: healthyPercentage >= 70 ? '#10b981' : healthyPercentage >= 40 ? '#f59e0b' : '#f43f5e',
                  }}
                />
              </div>
            </div>

            {/* Active Alerts */}
            <div className="stat-card amber">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="mono text-xs text-slate-400 font-medium">ALERTS</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Active Alerts</p>
              <p className="text-4xl font-bold text-slate-900 mono">{alertCount}</p>
              <p className="text-xs text-slate-400 mt-2">
                {alertCount === 0 ? 'No issues detected' : 'require attention'}
              </p>
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* MAP — 3 cols */}
            <div className="lg:col-span-3 section-card" style={{ minHeight: 460 }}>
              <div className="section-header">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-bold text-slate-800">Geospatial Footprint</h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Healthy</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Stress</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Alert</span>
                </div>
              </div>
              <div className="map-wrapper" style={{ height: 400 }}>
                {submissions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                    <MapPin className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">No field locations yet</p>
                    <p className="text-xs opacity-70">Upload a crop image to see it here</p>
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {submissions.map((sub) => {
                      const cfg = getCfg(sub.status);
                      return (
                        <CircleMarker
                          key={sub.id}
                          center={sub.coordinates}
                          pathOptions={{
                            color: cfg.color,
                            fillColor: cfg.color,
                            fillOpacity: 0.75,
                            weight: 2,
                          }}
                          radius={10}
                        >
                          <Popup>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', minWidth: 160 }}>
                              <p style={{ fontWeight: 700, marginBottom: 4 }}>Report #{sub.id}</p>
                              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{sub.resolvedLocation}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{sub.formattedTime}</p>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                background: cfg.color + '22',
                                color: cfg.color,
                              }}>
                                {sub.status}
                              </span>
                              {sub.cropStage && (
                                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{sub.cropStage}</p>
                              )}
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                )}
              </div>
            </div>
            {/* ── OFFICER FEEDBACK MODAL ── */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedReport(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> {/* Uses Activity icon */}
                  Verification Details
                </h3>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div 
                    className="w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-inner"
                    style={{ background: getCfg(selectedReport.status).color + '15' }}
                  >
                    <FileText style={{ color: getCfg(selectedReport.status).color }} className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Report ID: #{selectedReport.id}</p>
                    <p className="text-lg font-extrabold leading-none" style={{ color: getCfg(selectedReport.status).color }}>
                      {getCfg(selectedReport.status).label}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 relative">
                  <ShieldCheck className="absolute top-4 right-4 w-4 h-4 text-slate-200" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Officer Remarks</p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                    {selectedReport.remarks ? `"${selectedReport.remarks}"` : "Official validation based on AI geospatial analysis. No extra remarks."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Crop State</p>
                    <p className="text-sm font-bold text-slate-700">{selectedReport.cropStage || 'Vegetative'}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time Sync</p>
                    <p className="text-sm font-bold text-slate-700">{selectedReport.formattedTime.split(',')[0]}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            {/* UPLOAD HISTORY — 2 cols */}
            <div className="lg:col-span-2 section-card flex flex-col">
              <div className="section-header">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h2 className="font-bold text-slate-800">Upload History</h2>
                </div>
                <span className="mono text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  {submissions.length} total
                </span>
              </div>

              {/* Filter bar */}
              {submissions.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  {['All', 'Healthy', 'Moisture Stress', 'Pest Alert', 'High Damage'].map((f) => (
                    <button
                      key={f}
                      className={`filter-btn ${selectedFilter === f ? 'active' : ''}`}
                      onClick={() => setSelectedFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4">
                {submissions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 py-12">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 opacity-40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">No submissions yet</p>
                      <p className="text-xs text-slate-400 mt-1">Upload a crop image to get started</p>
                    </div>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-sm font-medium">No {selectedFilter} submissions</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredSubmissions.map((submission) => {
                      const cfg = getCfg(submission.status);
                      return (
                        <div key={submission.id} className="upload-row group"
                          onClick={() => setSelectedReport(submission)}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{
                              background: cfg.color + '15',
                              border: `1.5px solid ${cfg.color}40`,
                              color: cfg.color,
                            }}
                          >
                            {submission.status === 'Healthy' ? (
                              <Leaf className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-slate-800 mono">#{submission.id}</p>
                              <span
                                className="status-pill"
                                style={{
                                  background: cfg.color + '18',
                                  color: cfg.color,
                                }}
                              >
                                <span className="status-dot" style={{ background: cfg.color }} />
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                {submission.formattedTime}
                              </span>
                              {submission.resolvedLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{submission.resolvedLocation}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary footer */}
              {submissions.length > 0 && (
                <div className="p-4 border-t border-slate-50 grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700 mono">{healthyCount}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Healthy</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-rose-700 mono">{alertCount}</p>
                    <p className="text-xs text-rose-600 font-medium mt-0.5">Alerts</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;