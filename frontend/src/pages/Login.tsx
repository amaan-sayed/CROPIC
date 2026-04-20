import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Lock, Mail, ArrowRight, Sprout } from 'lucide-react';

const Login: React.FC = () => {
  const [role, setRole] = useState<'user' | 'officer'>('user');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'user') {
      navigate('/home');
    } else {
      navigate('/officer');
    }
  };

  const isUser = role === 'user';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Outfit', sans-serif;
          background: #0a0f0a;
          position: relative;
          overflow: hidden;
        }

        .bg-canvas { position: fixed; inset: 0; z-index: 0; background: #080d08; }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: drift 14s ease-in-out infinite alternate;
        }
        .bg-orb-1 { width:520px;height:520px;background:radial-gradient(circle,#16a34a,#052e16);top:-100px;left:-120px;animation-duration:16s; }
        .bg-orb-2 { width:380px;height:380px;background:radial-gradient(circle,#166534,#0a0f0a);bottom:-80px;right:-80px;animation-duration:20s;animation-delay:-6s; }
        .bg-orb-3 { width:260px;height:260px;background:radial-gradient(circle,#4ade80,#052e16);top:45%;left:55%;opacity:0.08;animation-duration:24s;animation-delay:-10s; }
        @keyframes drift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(40px,30px) scale(1.08); }
        }

        .bg-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .panel-left {
          display: none; flex: 1; flex-direction: column; justify-content: flex-end;
          padding: 64px; position: relative; z-index: 1;
        }
        @media (min-width: 900px) { .panel-left { display: flex; } }

        .panel-tagline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px,3.5vw,52px);
          font-weight: 600; color: #fff; line-height: 1.2;
          letter-spacing: -0.02em; margin-bottom: 20px;
        }
        .panel-tagline em { font-style: normal; color: #4ade80; }
        .panel-sub { font-size:15px;color:rgba(255,255,255,0.38);font-weight:300;max-width:320px;line-height:1.7; }
        .panel-badges { display:flex;gap:10px;margin-top:40px;flex-wrap:wrap; }
        .panel-badge {
          display:flex;align-items:center;gap:8px;padding:8px 16px;
          border:1px solid rgba(255,255,255,0.1);border-radius:100px;
          font-size:12px;color:rgba(255,255,255,0.5);font-weight:500;
          letter-spacing:0.04em;text-transform:uppercase;
        }
        .badge-dot {
          width:6px;height:6px;border-radius:50%;background:#4ade80;
          box-shadow:0 0 8px #4ade80;animation:pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.3} }

        .panel-right {
          width:100%;max-width:480px;display:flex;flex-direction:column;justify-content:center;
          padding:40px 32px;position:relative;z-index:1;
          background:rgba(255,255,255,0.03);backdrop-filter:blur(24px);
          border-left:1px solid rgba(255,255,255,0.06);
        }
        @media (max-width:899px) {
          .panel-right { max-width:100%;margin:auto;background:transparent;border:none;padding:32px 24px; }
        }

        .logo-wrap { display:flex;align-items:center;gap:10px;margin-bottom:48px; }
        .logo-icon {
          width:40px;height:40px;border-radius:12px;
          background:linear-gradient(135deg,#16a34a,#4ade80);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 24px rgba(74,222,128,0.35);
        }
        .logo-name { font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.06em; }

        .form-heading { font-family:'Playfair Display',serif;font-size:30px;font-weight:600;color:#fff;line-height:1.2;margin-bottom:6px; }
        .form-sub { font-size:14px;color:rgba(255,255,255,0.35);font-weight:300;margin-bottom:36px; }

        .role-toggle {
          display:flex;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);
          border-radius:14px;padding:5px;margin-bottom:32px;gap:4px;
        }
        .role-btn {
          flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
          padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;
          cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,0.35);
          transition:all 0.22s ease;font-family:'Outfit',sans-serif;letter-spacing:0.02em;
        }
        .role-btn.active-user { background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 4px 20px rgba(22,163,74,0.4); }
        .role-btn.active-officer { background:rgba(255,255,255,0.12);color:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.3); }

        .field-wrap { position:relative;margin-bottom:16px; }
        .field-icon { position:absolute;left:16px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.25);pointer-events:none;transition:color 0.2s; }
        .field-input {
          width:100%;padding:15px 16px 15px 46px;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
          border-radius:14px;font-size:14px;font-family:'Outfit',sans-serif;
          font-weight:400;color:#fff;outline:none;transition:all 0.2s ease;
        }
        .field-input::placeholder { color:rgba(255,255,255,0.25); }
        .field-input:focus { border-color:rgba(74,222,128,0.5);background:rgba(255,255,255,0.07);box-shadow:0 0 0 3px rgba(74,222,128,0.1); }
        .field-input:-webkit-autofill,.field-input:-webkit-autofill:focus {
          -webkit-box-shadow:0 0 0 1000px #111a11 inset!important;
          -webkit-text-fill-color:#fff!important;
        }

        .officer-notice {
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
          border-radius:14px;padding:22px 20px;margin-bottom:16px;text-align:center;
        }
        .officer-notice p { font-size:13px;color:rgba(255,255,255,0.42);line-height:1.7; }
        .officer-notice strong { color:rgba(255,255,255,0.72);font-weight:600; }

        .submit-btn {
          width:100%;padding:15px;margin-top:8px;border:none;border-radius:14px;
          font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;
          letter-spacing:0.04em;transition:all 0.22s ease;position:relative;overflow:hidden;
        }
        .submit-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.12),transparent);opacity:0;transition:opacity 0.2s; }
        .submit-btn:hover::before { opacity:1; }
        .submit-btn:active { transform:scale(0.98); }
        .submit-btn.user-btn { background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#fff;box-shadow:0 8px 32px rgba(22,163,74,0.4); }
        .submit-btn.user-btn:hover { box-shadow:0 12px 40px rgba(22,163,74,0.55);transform:translateY(-1px); }
        .submit-btn.officer-btn { background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.15); }
        .submit-btn.officer-btn:hover { background:rgba(255,255,255,0.15);transform:translateY(-1px); }

        .divider { display:flex;align-items:center;gap:14px;margin:24px 0 0; }
        .divider-line { flex:1;height:1px;background:rgba(255,255,255,0.08); }
        .divider-text { font-size:11px;color:rgba(255,255,255,0.2);font-weight:500;letter-spacing:0.08em;text-transform:uppercase; }
        .footer-note { margin-top:32px;text-align:center;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6; }

        .form-card { animation:fadeUp 0.4s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="login-root">
        <div className="bg-canvas">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <div className="bg-grid" />

        {/* Left panel */}
        <div className="panel-left">
          <p className="panel-tagline">
            Intelligent<br />
            crop monitoring<br />
            for <em>every field.</em>
          </p>
          <p className="panel-sub">
            Upload. Analyze. Act. CROPIC gives you real-time health insights across all your farmland.
          </p>
          <div className="panel-badges">
            <div className="panel-badge"><span className="badge-dot" />Live Analysis</div>
            <div className="panel-badge"><span className="badge-dot" style={{ animationDelay: '0.8s' }} />Geospatial Maps</div>
            <div className="panel-badge"><span className="badge-dot" style={{ animationDelay: '1.6s' }} />Pest Alerts</div>
          </div>
        </div>

        {/* Right panel */}
        <div className="panel-right">
          <div className="form-card" key={role}>

            <div className="logo-wrap">
              <div className="logo-icon"><Sprout size={20} color="#fff" /></div>
              <span className="logo-name">CROPIC</span>
            </div>

            <h1 className="form-heading">{isUser ? 'Welcome back' : 'Officer Portal'}</h1>
            <p className="form-sub">
              {isUser
                ? 'Sign in to monitor your fields'
                : 'You will be redirected to the secure government portal'}
            </p>

            <div className="role-toggle">
              <button type="button" onClick={() => setRole('user')} className={`role-btn ${role === 'user' ? 'active-user' : ''}`}>
                <User size={14} /> Farmer
              </button>
              <button type="button" onClick={() => setRole('officer')} className={`role-btn ${role === 'officer' ? 'active-officer' : ''}`}>
                <ShieldCheck size={14} /> Officer
              </button>
            </div>

            <form onSubmit={handleLogin}>
              {isUser ? (
                <>
                  <div className="field-wrap">
                    <Mail size={16} className="field-icon" />
                    <input type="email" required placeholder="Email address" className="field-input" />
                  </div>
                  <div className="field-wrap">
                    <Lock size={16} className="field-icon" />
                    <input type="password" required placeholder="Password" className="field-input" />
                  </div>
                </>
              ) : (
                <div className="officer-notice">
                  <ShieldCheck size={28} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p>
                    The <strong>Officer Portal</strong> is a separate secure system.<br />
                    Click below to open it — you'll sign in there with your government credentials.
                  </p>
                </div>
              )}

              <button type="submit" className={`submit-btn ${isUser ? 'user-btn' : 'officer-btn'}`}>
                {isUser ? 'Sign In' : 'Go to Officer Portal'} <ArrowRight size={16} />
              </button>
            </form>

            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">CROPIC &copy; 2026</span>
              <span className="divider-line" />
            </div>
            <p className="footer-note">Powered by AI crop intelligence &nbsp;·&nbsp; India</p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;