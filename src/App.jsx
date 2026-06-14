import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Team from './components/Team';
import Hiring from './components/Hiring';
import Performance from './components/Performance';
import Reviews from './components/Reviews';
import TimeOff from './components/TimeOff';
import Raises from './components/Raises';
import Uniforms from './components/Uniforms';
import Incidents from './components/Incidents';
import Certifications from './components/Certifications';
import Celebrations from './components/Celebrations';
import UserManagement from './components/UserManagement';
import mbLogo from './assets/mb-logo.webp';
import {
  Download, Users, UserPlus, BarChart2, Star,
  Calendar, TrendingUp, Shirt, AlertTriangle,
  Award, LogOut, Crown, Shield, User, Settings,
  Gift, Menu, X as XIcon
} from 'lucide-react';

const TABS = [
  { id: 'team',           label: 'Team',                      icon: Users         },
  { id: 'hiring',         label: 'Hiring',                    icon: UserPlus      },
  { id: 'performance',    label: 'Performance',               icon: BarChart2     },
  { id: 'reviews',        label: 'Reviews',                   icon: Star          },
  { id: 'timeoff',        label: 'Time Off',                  icon: Calendar      },
  { id: 'raises',         label: 'Raises',                    icon: TrendingUp    },
  { id: 'uniforms',       label: 'Uniforms',                  icon: Shirt         },
  { id: 'incidents',      label: 'Incidents',                 icon: AlertTriangle },
  { id: 'certifications', label: 'Certifications',            icon: Award         },
  { id: 'celebrations',   label: 'Birthdays & Anniversaries', icon: Gift          },
];

const COMPONENTS = {
  team: Team, hiring: Hiring, performance: Performance,
  reviews: Reviews, timeoff: TimeOff, raises: Raises,
  uniforms: Uniforms, incidents: Incidents,
  certifications: Certifications, celebrations: Celebrations,
};

const ROLE_ICONS  = { super_admin: Crown, admin: Shield, user: User };
const ROLE_COLORS = { super_admin: '#7c3aed', admin: '#5db88a', user: '#6b7280' };

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#0d1f16', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <img src={mbLogo} alt="MB" style={{ height:36, width:"auto" }} />
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading...</div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab]   = useState('team');
  const [showUsers, setShowUsers]   = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const { data, profile, isSuperAdmin, exportData, signOut } = useApp();

  const Component = showUsers ? UserManagement : COMPONENTS[activeTab];
  const pendingTimeOff = (data.timeOff  || []).filter(t => t.status === 'Pending').length;
  const openIncidents  = (data.incidents || []).filter(i => i.status === 'Open').length;
  const RoleIcon  = ROLE_ICONS[profile?.role]  || User;
  const roleColor = ROLE_COLORS[profile?.role] || '#6b7280';

  const handleTabClick = (id) => {
    setActiveTab(id);
    setShowUsers(false);
    setMenuOpen(false);
  };

  const badge = (tabId) =>
    (tabId === 'timeoff'   && pendingTimeOff > 0) ? pendingTimeOff :
    (tabId === 'incidents' && openIncidents  > 0) ? openIncidents  : 0;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="top-header">
        <div className="header-brand">
          <div style={{ width:36, height:36, borderRadius:8, background:"#1B3A2D", color:"#5db88a", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, fontFamily:"Manrope,sans-serif" }}>MB</div>
          <div>
            <div style={{ color:'#fff', fontFamily:'Manrope,sans-serif', fontWeight:800, fontSize:15, lineHeight:1.1, letterSpacing:'-0.3px' }}>MACARIO BROTHERS</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase' }}>Lawn Care · HR</div>
          </div>
        </div>

        <div className="header-actions">
          {/* Desktop: show user + action buttons */}
          <div className="desktop-only header-user">
            <RoleIcon size={13} color={roleColor} />
            <span>{profile?.full_name || profile?.email?.split('@')[0] || 'User'}</span>
          </div>
          {isSuperAdmin && (
            <button className="btn-header desktop-only" onClick={() => { setShowUsers(s => !s); setMenuOpen(false); }} title="User Management">
              <Settings size={15} /><span className="btn-label"> Users</span>
            </button>
          )}
          <button className="btn-header desktop-only" onClick={exportData} title="Export">
            <Download size={15} /><span className="btn-label"> Export</span>
          </button>
          <button className="btn-header desktop-only" onClick={signOut} title="Sign out"
            style={{ background:'rgba(220,38,38,0.2)', borderColor:'rgba(220,38,38,0.35)' }}>
            <LogOut size={15} />
          </button>

          {/* Mobile: hamburger */}
          <button className="btn-header mobile-only" onClick={() => setMenuOpen(o => !o)}
            style={{ padding:'6px 10px' }}>
            {menuOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {menuOpen && (
        <div className="mobile-drawer" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer-inner" onClick={e => e.stopPropagation()}>
            {/* User info */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'#1B3A2D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>
                {(profile?.full_name || profile?.email || 'U').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{profile?.full_name || profile?.email?.split('@')[0]}</div>
                <div style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}>
                  <RoleIcon size={11} color={roleColor} />
                  {profile?.role?.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding:'8px 0', overflowY:'auto', flex:1 }}>
              {TABS.map(t => {
                const Icon = t.icon;
                const b = badge(t.id);
                const isActive = !showUsers && activeTab === t.id;
                return (
                  <button key={t.id} onClick={() => handleTabClick(t.id)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 20px', border:'none', background: isActive ? '#f0fdf4' : 'none', color: isActive ? '#1B3A2D' : '#374151', fontWeight: isActive ? 700 : 400, fontSize:14, cursor:'pointer', textAlign:'left', borderLeft: isActive ? '3px solid #1B3A2D' : '3px solid transparent' }}>
                    <Icon size={17} />
                    {t.label}
                    {b > 0 && <span style={{ marginLeft:'auto', background:'#dc2626', color:'#fff', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{b}</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom actions */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:8 }}>
              {isSuperAdmin && (
                <button onClick={() => { setShowUsers(true); setMenuOpen(false); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', fontSize:13, cursor:'pointer', color:'#374151' }}>
                  <Settings size={15} /> User Management
                </button>
              )}
              <button onClick={exportData}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', fontSize:13, cursor:'pointer', color:'#374151' }}>
                <Download size={15} /> Export Data
              </button>
              <button onClick={signOut}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', fontSize:13, cursor:'pointer', color:'#dc2626', fontWeight:600 }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Tab Nav ── */}
      {!showUsers && (
        <nav className="tab-nav desktop-only">
          {TABS.map(t => {
            const Icon = t.icon;
            const b = badge(t.id);
            return (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => handleTabClick(t.id)}>
                <Icon size={15} /> {t.label}
                {b > 0 && <span className="tab-badge">{b}</span>}
              </button>
            );
          })}
        </nav>
      )}

      {showUsers && (
        <div style={{ background:'#0d1f16', padding:'10px 20px', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setShowUsers(false)}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:13 }}>
            Back to Dashboard
          </button>
          <span style={{ color:'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color:'#5db88a', fontSize:13, fontWeight:600 }}>User Management</span>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      {!showUsers && (
        <nav className="mobile-tab-bar">
          {TABS.slice(0, 5).map(t => {
            const Icon = t.icon;
            const b = badge(t.id);
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => handleTabClick(t.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 4px', border:'none', background:'none', color: isActive ? '#5db88a' : 'rgba(255,255,255,0.45)', cursor:'pointer', position:'relative', fontSize:10, fontWeight: isActive ? 700 : 400 }}>
                <Icon size={18} />
                <span>{t.label.split(' ')[0]}</span>
                {b > 0 && <span style={{ position:'absolute', top:4, right:'50%', transform:'translateX(14px)', background:'#dc2626', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:8 }}>{b}</span>}
              </button>
            );
          })}
          <button onClick={() => setMenuOpen(true)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 4px', border:'none', background:'none', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:10 }}>
            <Menu size={18} />
            <span>More</span>
          </button>
        </nav>
      )}

      <main className="main-content">
        <Component />
      </main>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useApp();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Login />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
