/**
 * OfficerPortal.tsx
 * ─────────────────
 * Drop this file into your farmer app's src/ folder.
 * Add a route in your router:  <Route path="/officer" element={<OfficerPortal />} />
 * Update Login.tsx officer button:  navigate('/officer')
 *
 * Report statuses are stored in localStorage under 'cropic_reports' — the same
 * key your farmer Dashboard reads — so approvals/rejections are instantly visible
 * to the farmer side without any backend.
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle,
  LayoutGrid, Hourglass, XCircle, LogOut, Search, 
  MapPin, LocateFixed, Clock, RotateCcw, Phone,
   X, Clipboard, Calendar,
  ShieldAlert,  CheckCircle,
} from 'lucide-react';

// ─── Shared localStorage key — must match what your farmer dashboard reads ───
const LS_SESSION_KEY = 'cropic_officer_session';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportStatus = 'pending' | 'approved' | 'rejected';
type Screen = 'dashboard' | 'pending' | 'approved' | 'rejected';

interface CropReport {
  id: string;
  farmerName: string;
  cropType: string;
  area: string;
  location: string;
  village: string;
  submittedDate: string;
  status: ReportStatus;
  lat: string;
  lng: string;
  image: string;
  accuracy: string;
  flagged?: boolean;
  remarks?: string;
}

interface Officer {
  name: string;
  role: string;
  email: string;
}



const OFFICER_CREDENTIALS = [
  { email: 'admin@cropic.gov', password: 'officer123', name: 'Admin Officer', role: 'Regional Supervisor' },
  { email: 'officer@cropic.gov', password: 'officer123', name: 'Field Officer', role: 'District Inspector' },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface Ctx {
  officer: Officer | null;
  reports: CropReport[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateStatus: (id: string, status: ReportStatus, remarks?: string) => void;
  stats: { pending: number; approved: number; rejected: number; total: number };
}

const OfficerCtx = createContext<Ctx | null>(null);

function useOfficer() {
  const ctx = useContext(OfficerCtx);
  if (!ctx) throw new Error('OfficerCtx missing');
  return ctx;
}

function OfficerProvider({ children }: { children: React.ReactNode }) {
  const [officer, setOfficer] = useState<Officer | null>(() => {
    try { return JSON.parse(localStorage.getItem(LS_SESSION_KEY) || 'null'); } catch { return null; }
  });

  const [reports, setReports] = useState<CropReport[]>([]); // Start empty
  const [, setLoading] = useState(true);

  // FETCH FROM YOUR REAL BACKEND (MongoDB)
  const refreshData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/officer/reports');
      const data = await res.json();
      
      // Map your MongoDB fields to the Portal's format
      const mappedData = data.map((r: any) => ({
        id: r.id,
        farmerName: r.farmerName || "Farmer #" + r.id.slice(-4),
        cropType: r.disease || "Unknown Crop",
        area: r.area || "1.0 Hectares",
        location: r.location || "Detected",
        village: r.village || "Regional Block",
        submittedDate: new Date(r.time).toLocaleDateString(),
        status: r.status.toLowerCase() === 'approved' ? 'approved' : 
                r.status.toLowerCase() === 'rejected' ? 'rejected' : 'pending',
        lat: r.coordinates[0].toString(),
        lng: r.coordinates[1].toString(),
        image: r.image || 'https://picsum.photos/seed/maize/800/600',
        accuracy: r.confidence ? `${r.confidence}%` : "N/A",
        remarks: r.remarks || ""
      }));
      
      setReports(mappedData);
    } catch (err) {
      console.error("Failed to fetch from MongoDB", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (officer) refreshData();
  }, [officer]);

  const login = (email: string, password: string): boolean => {
    const match = OFFICER_CREDENTIALS.find(c => c.email === email && c.password === password);
    if (match) { setOfficer({ name: match.name, role: match.role, email: match.email }); return true; }
    return false;
  };

  const logout = () => setOfficer(null);

  // UPDATE STATUS IN THE REAL DATABASE (MongoDB)
  const updateStatus = async (id: string, status: ReportStatus, remarks?: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending',
          remarks: remarks 
        }),
      });

      if (response.ok) {
        // Update local state after successful DB update
        setReports(prev => prev.map(r => r.id === id ? { ...r, status, remarks: remarks ?? r.remarks } : r));
      }
    } catch (err) {
      alert("Failed to update database.");
    }
  };

  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
    total: reports.length,
  };

  return (
    <OfficerCtx.Provider value={{ officer, reports, login, logout, updateStatus, stats }}>
      {children}
    </OfficerCtx.Provider>
  );
}

// ─── CSS injected once ────────────────────────────────────────────────────────

const PORTAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .op-root { font-family: 'Inter', sans-serif; }
  .op-root * { box-sizing: border-box; }

  /* Sidebar */
  .op-sidebar {
    position: fixed; left:0; top:0; height:100vh; width:72px;
    background:#1e293b; display:flex; flex-direction:column;
    align-items:center; padding:20px 0; z-index:50;
  }
  .op-nav-btn {
    width:100%; display:flex; flex-direction:column; align-items:center;
    gap:4px; padding:10px 0; color:#94a3b8; cursor:pointer;
    background:none; border:none; font-family:'Inter',sans-serif;
    font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
    transition:color .15s;
  }
  .op-nav-btn:hover { color:#fff; }
  .op-nav-btn.active { color:#fff; }
  .op-nav-btn.active svg { color:#2563eb; }

  /* Main area */
  .op-main { margin-left:72px; min-height:100vh; background:#f1f5f9; }
  .op-header {
    position:sticky; top:0; z-index:40; background:#fff;
    height:72px; padding:0 32px; display:flex;
    justify-content:space-between; align-items:center;
    border-bottom:1px solid #e2e8f0;
  }

  /* Cards */
  .op-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.05); }
  .op-card:hover { box-shadow:0 4px 12px rgba(0,0,0,.08); }

  /* Stat cards */
  .op-stat { padding:24px; cursor:pointer; transition:box-shadow .2s; }
  .op-stat-val { font-size:32px; font-weight:800; color:#0f172a; line-height:1; margin:8px 0 4px; }
  .op-stat-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#64748b; }
  .op-stat-sub { font-size:11px; color:#94a3b8; font-weight:500; }

  /* Status badge */
  .op-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:20px;
    font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
  }
  .op-badge.pending  { background:#fef3c7; color:#92400e; }
  .op-badge.approved { background:#d1fae5; color:#065f46; }
  .op-badge.rejected { background:#fee2e2; color:#991b1b; }
  .op-badge.flagged  { background:#fee2e2; color:#991b1b; }

  /* Table */
  .op-table { width:100%; border-collapse:collapse; text-align:left; }
  .op-table th { padding:12px 20px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#64748b; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
  .op-table td { padding:14px 20px; font-size:13px; color:#334155; font-weight:500; border-bottom:1px solid #f1f5f9; }
  .op-table tr:hover td { background:#f8fafc; }
  .op-table tr { cursor:pointer; transition:background .12s; }

  /* Inputs */
  .op-input {
    padding:9px 14px; border:1px solid #e2e8f0; border-radius:8px;
    font-size:13px; font-family:'Inter',sans-serif; outline:none;
    background:#f8fafc; transition:border .15s, box-shadow .15s;
    color:#0f172a;
  }
  .op-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); background:#fff; }
  .op-input::placeholder { color:#cbd5e1; }

  /* Buttons */
  .op-btn { border:none; cursor:pointer; border-radius:8px; font-family:'Inter',sans-serif; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:.06em; display:inline-flex; align-items:center; gap:6px; transition:all .15s; padding:9px 18px; }
  .op-btn-approve { background:#059669; color:#fff; box-shadow:0 2px 8px rgba(5,150,105,.25); }
  .op-btn-approve:hover { background:#047857; }
  .op-btn-reject  { background:#fff; border:1.5px solid #fca5a5; color:#dc2626; }
  .op-btn-reject:hover  { background:#fef2f2; }
  .op-btn-ghost   { background:#f1f5f9; color:#475569; }
  .op-btn-ghost:hover   { background:#e2e8f0; }
  .op-btn-primary { background:#2563eb; color:#fff; }
  .op-btn-primary:hover { background:#1d4ed8; }

  /* Modal */
  .op-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(4px); z-index:100; display:flex; align-items:center; justify-content:center; padding:24px; }
  .op-modal { background:#fff; border-radius:16px; box-shadow:0 25px 60px rgba(0,0,0,.18); width:100%; max-width:860px; max-height:90vh; overflow:hidden; display:flex; flex-direction:column; border:1px solid #e2e8f0; }

  /* Login page */
  .op-login-root { min-height:100vh; background:#0f172a; display:flex; align-items:center; justify-content:center; padding:24px; position:relative; overflow:hidden; }
  .op-login-orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }

  /* Toast */
  .op-toast { position:fixed; top:20px; right:20px; z-index:999; padding:12px 20px; border-radius:10px; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; display:flex; align-items:center; gap:8px; box-shadow:0 8px 24px rgba(0,0,0,.15); animation:slideIn .25s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
  .op-toast.success { background:#059669; color:#fff; }
  .op-toast.error   { background:#dc2626; color:#fff; }
  .op-toast.info    { background:#2563eb; color:#fff; }
`;

function injectCss() {
  if (document.getElementById('op-styles')) return;
  const style = document.createElement('style');
  style.id = 'op-styles';
  style.textContent = PORTAL_CSS;
  document.head.appendChild(style);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const show = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const Toast = toast ? (
    <div className={`op-toast ${toast.type}`}>
      {toast.type === 'success' ? <CheckCircle size={15} /> : toast.type === 'error' ? <XCircle size={15} /> : <AlertCircle size={15} />}
      {toast.msg}
    </div>
  ) : null;
  return { show, Toast };
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login } = useOfficer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { show, Toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = login(email, password);
    if (!ok) { setError('Invalid email or password.'); }
    else { show(`Welcome back!`, 'success'); }
    setLoading(false);
  };

  return (
    <div className="op-login-root">
      {Toast}
      {/* Orbs */}
      <div className="op-login-orb" style={{ width:480,height:480,background:'radial-gradient(circle,#1d4ed8,#0f172a)',top:-120,left:-120,opacity:.18 }} />
      <div className="op-login-orb" style={{ width:320,height:320,background:'radial-gradient(circle,#059669,#0f172a)',bottom:-80,right:-80,opacity:.12 }} />
      {/* Grid */}
      <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none' }} />

      <div style={{ width:'100%',maxWidth:420,position:'relative',zIndex:1 }}>
        {/* Badge */}
        <div style={{ display:'flex',justifyContent:'center',marginBottom:32 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:100,padding:'8px 18px' }}>
            <ShieldCheck size={14} color="#60a5fa" />
            <span style={{ color:'rgba(255,255,255,.6)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em' }}>CROPIC · Government Portal</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'#fff',borderRadius:20,boxShadow:'0 25px 60px rgba(0,0,0,.35)',overflow:'hidden' }}>
          <div style={{ height:4,background:'linear-gradient(90deg,#2563eb,#60a5fa,#059669)' }} />
          <div style={{ padding:36 }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:'#2563eb',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(37,99,235,.35)' }}>
                <ShieldCheck size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:'#0f172a' }}>Officer Portal</div>
                <div style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>Authorised personnel only</div>
              </div>
            </div>

            <div style={{ fontSize:24,fontWeight:800,color:'#0f172a',marginBottom:4 }}>Sign in</div>
            <div style={{ fontSize:13,color:'#64748b',marginBottom:24 }}>Access the CROPIC crop-report verification system.</div>

            {error && (
              <div style={{ display:'flex',alignItems:'center',gap:8,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',marginBottom:16,color:'#dc2626',fontSize:13,fontWeight:600 }}>
                <AlertCircle size={15} />{error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#64748b',marginBottom:6 }}>Email address</label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none' }} />
                  <input className="op-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="officer@cropic.gov" style={{ width:'100%',paddingLeft:38 }} />
                </div>
              </div>
              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#64748b',marginBottom:6 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none' }} />
                  <input className="op-input" type={showPw?'text':'password'} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{ width:'100%',paddingLeft:38,paddingRight:38 }} />
                  <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0,display:'flex' }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div style={{ fontSize:12,color:'#94a3b8',marginBottom:20 }}>
                Demo: <strong style={{color:'#475569'}}>admin@cropic.gov</strong> / <strong style={{color:'#475569'}}>officer123</strong>
              </div>
              <button className="op-btn op-btn-primary" type="submit" disabled={loading} style={{ width:'100%',justifyContent:'center',padding:'12px',fontSize:13 }}>
                {loading
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  : <><ArrowRight size={15}/>Sign In</>}
              </button>
            </form>
          </div>
        </div>
        <div style={{ textAlign:'center',color:'rgba(255,255,255,.2)',fontSize:11,marginTop:24,fontWeight:500 }}>
          CROPIC Government Verification System · {new Date().getFullYear()}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Report Detail Modal ──────────────────────────────────────────────────────

function ReportModal({ report, onClose }: { report: CropReport; onClose: () => void }) {
  const { updateStatus } = useOfficer();
  const { show, Toast } = useToast();
  const [remarks, setRemarks] = useState(report.remarks || '');

  const approve = () => { updateStatus(report.id, 'approved', remarks); show(`Report #${report.id} approved`, 'success'); onClose(); };
  const reject  = () => { updateStatus(report.id, 'rejected', remarks || 'Flagged for inconsistencies.'); show(`Report #${report.id} rejected`, 'error'); onClose(); };

  return (
    <div className="op-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      {Toast}
      <div className="op-modal">
        {/* Header */}
        <div style={{ padding:'16px 24px',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:40,height:40,background:'#f1f5f9',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Clipboard size={18} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize:16,fontWeight:700,color:'#0f172a' }}>Report Details</div>
              <div style={{ fontSize:11,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em' }}>ID: {report.id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,color:'#94a3b8',display:'flex' }}>
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:28,display:'grid',gridTemplateColumns:'1fr 1fr',gap:28 }}>
          {/* Left */}
          <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
            <div>
              <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:8 }}>Field Imagery</div>
              <div style={{ borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',aspectRatio:'16/10' }}>
                <img src={report.image} alt="Field" style={{ width:'100%',height:'100%',objectFit:'cover' }} referrerPolicy="no-referrer" />
              </div>
            </div>
            <div>
              <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:8 }}>Location</div>
              <div style={{ background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,padding:16,display:'flex',alignItems:'center',gap:12 }}>
                <MapPin size={20} color="#2563eb" />
                <div>
                  <div style={{ fontWeight:700,color:'#0f172a',fontSize:14 }}>{report.lat}, {report.lng}</div>
                  <div style={{ fontSize:12,color:'#64748b' }}>{report.location}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
            <div style={{ background:'#f8fafc',borderRadius:12,border:'1px solid #e2e8f0',padding:16 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:6 }}>
                <div style={{ fontSize:18,fontWeight:800,color:'#0f172a' }}>{report.farmerName}</div>
                <span className={`op-badge ${report.status}`}>{report.status}</span>
              </div>
              <div style={{ fontSize:13,color:'#64748b',display:'flex',alignItems:'center',gap:4 }}>
                <MapPin size={13}/> {report.village}
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {[
                { icon:<ShieldCheck size={14}/>, label:'Crop', value:report.cropType },
                { icon:<Calendar size={14}/>, label:'Submitted', value:report.submittedDate },
                { icon:<LocateFixed size={14}/>, label:'GPS Accuracy', value:report.accuracy },
                { icon:<Clock size={14}/>, label:'Area', value:report.area },
              ].map(m => (
                <div key={m.label} style={{ border:'1px solid #e2e8f0',borderRadius:10,padding:12 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:4 }}>{m.icon}{m.label}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{m.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:8 }}>Officer Remarks</div>
              <textarea
                className="op-input"
                rows={3}
                style={{ width:'100%',resize:'vertical' }}
                placeholder="Add notes before decision…"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

            {report.status === 'pending' && (
              <div style={{ display:'flex',gap:10,paddingTop:8,borderTop:'1px solid #f1f5f9' }}>
                <button className="op-btn op-btn-approve" style={{ flex:1,justifyContent:'center' }} onClick={approve}>
                  <ShieldCheck size={14}/>Approve
                </button>
                <button className="op-btn op-btn-reject" style={{ flex:1,justifyContent:'center' }} onClick={reject}>
                  <XCircle size={14}/>Reject
                </button>
              </div>
            )}
            {report.status !== 'pending' && (
              <div style={{ display:'flex',gap:10,paddingTop:8,borderTop:'1px solid #f1f5f9' }}>
                <button className="op-btn op-btn-ghost" style={{ flex:1,justifyContent:'center' }} onClick={()=>{updateStatus(report.id,'pending');show(`Reset to pending`,'info');onClose();}}>
                  <RotateCcw size={14}/>Reset to Pending
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ current, onNav }: { current: Screen; onNav: (s: Screen) => void }) {
  const { logout } = useOfficer();
  const navigate = useNavigate();

  const items: { id: Screen; Icon: any; label: string }[] = [
    { id: 'dashboard', Icon: LayoutGrid, label: 'Dash' },
    { id: 'pending',   Icon: Hourglass,  label: 'Pending' },
    { id: 'approved',  Icon: ShieldCheck,label: 'Approved' },
    { id: 'rejected',  Icon: XCircle,    label: 'Rejected' },
  ];

  return (
    <nav className="op-sidebar">
      <div style={{ width:40,height:40,background:'#2563eb',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32 }}>
        <span style={{ color:'#fff',fontWeight:800,fontSize:16 }}>C</span>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:4,width:'100%',flex:1 }}>
        {items.map(({id,Icon,label}) => (
          <button key={id} className={`op-nav-btn ${current===id?'active':''}`} onClick={()=>onNav(id)}>
            <Icon size={22}/>
            {label}
          </button>
        ))}
      </div>
      <button
        className="op-nav-btn"
        style={{ marginTop:'auto' }}
        onClick={()=>{ logout(); navigate('/'); }}
      >
        <LogOut size={22}/>
        Logout
      </button>
    </nav>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ title }: { title: string }) {
  const { officer } = useOfficer();
  return (
    <header className="op-header">
      <div style={{ fontSize:18,fontWeight:700,color:'#0f172a' }}>{title}</div>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{officer?.name}</div>
          <div style={{ fontSize:11,color:'#64748b',fontWeight:500 }}>{officer?.role}</div>
        </div>
        <div style={{ width:36,height:36,borderRadius:'50%',background:'#2563eb',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <ShieldCheck size={16} color="#fff"/>
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

function DashboardScreen({ onNav, onView }: { onNav:(s:Screen)=>void; onView:(id:string)=>void }) {
  const { reports, stats } = useOfficer();
  return (
    <div style={{ flex:1,minHeight:'100vh',background:'#f1f5f9',display:'flex',flexDirection:'column' }}>
      <Header title="CROPIC Dashboard" />
      <div style={{ padding:32,maxWidth:1200 }}>
        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:32 }}>
          {[
            { label:'Pending Reports',    val:stats.pending,  sub:'Requires review',       border:'#f59e0b', accent:'warning', icon:<Hourglass size={18} color="#f59e0b"/> },
            { label:'Approved Reports',   val:stats.approved, sub:'Subsidy eligible',      border:'#059669', accent:'success', icon:<ShieldCheck size={18} color="#059669"/> },
            { label:'Rejected Reports',   val:stats.rejected, sub:'Audit required',        border:'#dc2626', accent:'error',   icon:<XCircle size={18} color="#dc2626"/> },
          ].map(s => (
            <div key={s.label} className="op-card op-stat" style={{ borderLeft:`4px solid ${s.border}` }} onClick={()=>onNav(s.accent==='warning'?'pending':s.accent==='success'?'approved':'rejected')}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                <div className="op-stat-lbl">{s.label}</div>
                {s.icon}
              </div>
              <div className="op-stat-val">{s.val}</div>
              <div className="op-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent table */}
        <div className="op-card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div style={{ fontSize:14,fontWeight:700,color:'#0f172a' }}>Recent Activity</div>
            <button className="op-btn op-btn-ghost" style={{ fontSize:10 }} onClick={()=>onNav('pending')}>
              View Pending <ArrowRight size={12}/>
            </button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="op-table">
              <thead>
                <tr>
                  <th>Report ID</th><th>Farmer</th><th>Crop</th><th>Village</th><th style={{textAlign:'right'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0,8).map(r => (
                  <tr key={r.id} onClick={()=>onView(r.id)}>
                    <td style={{ fontWeight:700,color:'#0f172a' }}>{r.id}</td>
                    <td>{r.farmerName}</td>
                    <td>{r.cropType}</td>
                    <td style={{ color:'#94a3b8' }}>{r.village}</td>
                    <td style={{ textAlign:'right' }}><span className={`op-badge ${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Screen ───────────────────────────────────────────────────────────

function PendingScreen({ onView }: { onView:(id:string)=>void }) {
  const { reports, updateStatus } = useOfficer();
  const { show, Toast } = useToast();
  const [search, setSearch] = useState('');
  const pending = reports.filter(r => r.status==='pending' && (r.farmerName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ flex:1,minHeight:'100vh',background:'#f1f5f9' }}>
      {Toast}
      <Header title="Pending Verification" />
      <div style={{ padding:32,maxWidth:1100 }}>
        {/* Toolbar */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:8 }}>
            <div style={{ position:'relative' }}>
              <Search size={15} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none' }} />
              <input className="op-input" placeholder="Search pending…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34,width:240 }} />
            </div>
          </div>
          <div style={{ fontSize:13,color:'#64748b',fontWeight:600 }}>{pending.length} pending reports</div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          {pending.length === 0 && (
            <div className="op-card" style={{ padding:60,textAlign:'center' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin:'0 auto 12px' }} />
              <div style={{ fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.08em',fontSize:12 }}>No pending reports</div>
            </div>
          )}
          {pending.map(r => (
            <PendingCard
              key={r.id} report={r}
              onApprove={(rem:string) => { updateStatus(r.id,'approved',rem); show(`Report #${r.id} approved`,'success'); }}
              onReject={(rem:string)  => { updateStatus(r.id,'rejected',rem||'Flagged.'); show(`Report #${r.id} rejected`,'error'); }}
              onView={() => onView(r.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingCard({ report:r, onApprove, onReject, onView }: any) {
  const [notes, setNotes] = useState('');
  return (
    <div className="op-card" style={{ padding:24,display:'flex',gap:24,alignItems:'start' }}>
      <div style={{ width:180,height:130,borderRadius:10,overflow:'hidden',border:'1px solid #e2e8f0',flexShrink:0 }}>
        <img src={r.image} alt="Field" style={{ width:'100%',height:'100%',objectFit:'cover' }} referrerPolicy="no-referrer" />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:10 }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
              <div style={{ fontSize:17,fontWeight:800,color:'#0f172a' }}>{r.farmerName}</div>
              <span style={{ fontSize:11,color:'#94a3b8',fontWeight:600 }}>#{r.id}</span>
            </div>
            <div style={{ fontSize:12,color:'#64748b',display:'flex',alignItems:'center',gap:4 }}>
              <MapPin size={12}/> {r.village} · Submitted {r.submittedDate}
            </div>
          </div>
          <span className={`op-badge ${r.flagged?'flagged':'pending'}`}>{r.flagged?'Flagged':'Pending'}</span>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16 }}>
          {[
            { label:'GPS Accuracy', val:r.accuracy, red:r.flagged },
            { label:'Crop',         val:r.cropType },
            { label:'Area',         val:r.area },
          ].map(m => (
            <div key={m.label} style={{ background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:10 }}>
              <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:13,fontWeight:700,color:m.red?'#dc2626':'#0f172a' }}>{m.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <input className="op-input" placeholder="Officer notes before decision…" value={notes} onChange={e=>setNotes(e.target.value)} style={{ width:'100%' }} />
          <div style={{ display:'flex',gap:10 }}>
            <button className="op-btn op-btn-approve" onClick={()=>onApprove(notes)}><ShieldCheck size={14}/>Approve</button>
            <button className="op-btn op-btn-reject"  onClick={()=>onReject(notes)}><XCircle size={14}/>Reject</button>
            <button className="op-btn op-btn-ghost" style={{ marginLeft:'auto' }} onClick={onView}><Eye size={14}/>View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Approved Screen ──────────────────────────────────────────────────────────

function ApprovedScreen({ onView }: { onView:(id:string)=>void }) {
  const { reports, updateStatus } = useOfficer();
  const { show, Toast } = useToast();
  const [search, setSearch] = useState('');
  const approved = reports.filter(r => r.status==='approved' && (r.farmerName.toLowerCase().includes(search.toLowerCase())||r.id.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ flex:1,minHeight:'100vh',background:'#f1f5f9' }}>
      {Toast}
      <Header title="Approved Reports" />
      <div style={{ padding:32,maxWidth:1100 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <div>
            <div style={{ fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:2 }}>Verification Records</div>
            <div style={{ fontSize:13,color:'#64748b' }}>All reports approved for subsidy disbursement.</div>
          </div>
          <div style={{ position:'relative' }}>
            <Search size={15} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none' }} />
            <input className="op-input" placeholder="Search records…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34,width:240 }} />
          </div>
        </div>
        <div className="op-card" style={{ overflow:'hidden' }}>
          <table className="op-table">
            <thead>
              <tr><th>Farmer</th><th>Report ID</th><th>Crop</th><th>Area</th><th>Date</th><th style={{textAlign:'right'}}>Action</th></tr>
            </thead>
            <tbody>
              {approved.map(r => (
                <tr key={r.id} onClick={()=>onView(r.id)}>
                  <td style={{ fontWeight:700,color:'#0f172a' }}>{r.farmerName}</td>
                  <td style={{ color:'#64748b' }}>{r.id}</td>
                  <td>{r.cropType}</td>
                  <td>{r.area}</td>
                  <td style={{ color:'#94a3b8' }}>{r.submittedDate}</td>
                  <td style={{ textAlign:'right' }}>
                    <button className="op-btn op-btn-ghost" style={{ fontSize:10,padding:'6px 12px' }} onClick={e=>{e.stopPropagation();updateStatus(r.id,'pending');show(`Reset to pending`,'info');}}>
                      <RotateCcw size={12}/>Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {approved.length===0 && <div style={{ padding:40,textAlign:'center',color:'#94a3b8',fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'.08em' }}>No approved records</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Rejected Screen ──────────────────────────────────────────────────────────

function RejectedScreen({ onView }: { onView:(id:string)=>void }) {
  const { reports, updateStatus } = useOfficer();
  const { show, Toast } = useToast();
  const [search, setSearch] = useState('');
  const rejected = reports.filter(r => r.status==='rejected' && (r.farmerName.toLowerCase().includes(search.toLowerCase())||r.id.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ flex:1,minHeight:'100vh',background:'#f1f5f9' }}>
      {Toast}
      <Header title="Rejected Reports" />
      <div style={{ padding:32,maxWidth:1100 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <div>
            <div style={{ fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:2 }}>Flagged Submissions</div>
            <div style={{ fontSize:13,color:'#64748b' }}>Review and manage rejected crop verification requests.</div>
          </div>
          <div style={{ position:'relative' }}>
            <Search size={15} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none' }} />
            <input className="op-input" placeholder="Search rejections…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34,width:240 }} />
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20 }}>
          {rejected.map(r => (
            <div key={r.id} className="op-card" style={{ padding:20,borderLeft:'4px solid #dc2626',cursor:'pointer' }} onClick={()=>onView(r.id)}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:16,fontWeight:800,color:'#0f172a' }}>{r.farmerName}</div>
                  <div style={{ fontSize:11,color:'#94a3b8',fontWeight:600 }}>Report ID: {r.id}</div>
                </div>
                <span className="op-badge rejected">Rejected</span>
              </div>
              <div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:14 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,color:'#dc2626',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6 }}>
                  <ShieldAlert size={13}/>Rejection Reason
                </div>
                <div style={{ fontSize:12,color:'#7f1d1d',lineHeight:1.6 }}>{r.remarks||'No remarks provided.'}</div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
                <div><div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:3 }}>Crop</div><div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{r.cropType}</div></div>
                <div><div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94a3b8',marginBottom:3 }}>Date</div><div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{r.submittedDate}</div></div>
              </div>
              <div style={{ display:'flex',gap:10,paddingTop:12,borderTop:'1px solid #f1f5f9' }}>
                <button className="op-btn op-btn-ghost" style={{ flex:1,justifyContent:'center',fontSize:11 }} onClick={e=>{e.stopPropagation();updateStatus(r.id,'pending');show(`Reset to pending`,'info');}}>
                  <RotateCcw size={13}/>Re-evaluate
                </button>
                <button className="op-btn op-btn-ghost" style={{ flex:1,justifyContent:'center',fontSize:11 }} onClick={e=>e.stopPropagation()}>
                  <Phone size={13}/>Contact
                </button>
              </div>
            </div>
          ))}
          {rejected.length===0 && (
            <div style={{ gridColumn:'span 2' }} className="op-card">
              <div style={{ padding:60,textAlign:'center' }}>
                <CheckCircle size={40} color="#10b981" style={{ margin:'0 auto 12px' }} />
                <div style={{ fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.08em',fontSize:12 }}>No rejected reports</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Portal Shell (authenticated) ────────────────────────────────────────────

function PortalShell() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [modalId, setModalId] = useState<string | null>(null);
  const { reports } = useOfficer();
  const modalReport = reports.find(r => r.id === modalId) || null;

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <DashboardScreen onNav={setScreen} onView={setModalId} />;
      case 'pending':   return <PendingScreen onView={setModalId} />;
      case 'approved':  return <ApprovedScreen onView={setModalId} />;
      case 'rejected':  return <RejectedScreen onView={setModalId} />;
      default:          return <DashboardScreen onNav={setScreen} onView={setModalId} />;
    }
  };

  return (
    <div style={{ display:'flex',minHeight:'100vh' }}>
      <Sidebar current={screen} onNav={setScreen} />
      <div className="op-main" style={{ flex:1,display:'flex',flexDirection:'column' }}>
        {renderScreen()}
      </div>
      {modalReport && <ReportModal report={modalReport} onClose={()=>setModalId(null)} />}
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

function OfficerPortalInner() {
  useEffect(() => { injectCss(); }, []);
  const { officer } = useOfficer();
  return officer ? <PortalShell /> : <LoginScreen />;
}

export default function OfficerPortal() {
  return (
    <OfficerProvider>
      <div className="op-root">
        <OfficerPortalInner />
      </div>
    </OfficerProvider>
  );
}