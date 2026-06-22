import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Team from './components/Team';
import Hiring from './components/Hiring';
import Performance from './components/Performance';
import Reviews from './components/Reviews';
import TimeOff from './components/TimeOff';
import Raises from './components/Raises';
import Uniforms from './components/Uniforms';
import Observations from './components/Observations';
import Incidents from './components/Incidents';
import Certifications from './components/Certifications';
import Celebrations from './components/Celebrations';
import UserManagement from './components/UserManagement';
import mbLogo from './assets/mb-logo.webp';
import {
  Download, Users, UserPlus, BarChart2, Star,
  Calendar, TrendingUp, Shirt, AlertTriangle,
  Award, LogOut, Crown, Shield, User, Settings,
  Gift, Menu, X as XIcon, ClipboardList
} from 'lucide-react';

const TABS = [
  { id: 'team',           label: 'Team',             shortLabel: 'Team',    icon: Users         },
  { id: 'hiring',         label: 'Hiring',           shortLabel: 'Hiring',  icon: UserPlus      },
  { id: 'performance',    label: 'Performance',      shortLabel: 'Perf',    icon: BarChart2     },
  { id: 'reviews',        label: 'Reviews',          shortLabel: 'Reviews', icon: Star          },
  { id: 'observations',   label: 'Observation Log',  shortLabel: 'Observ.', icon: ClipboardList },
  { id: 'timeoff',        label: 'Time Off',         shortLabel: 'Time',    icon: Calendar      },
  { id: 'raises',         label: 'Raises',           shortLabel: 'Raises',  icon: TrendingUp    },
  { id: 'uniforms',       label: 'Uniforms',         shortLabel: 'Uniforms',icon: Shirt         },
  { id: 'incidents',      label: 'Damages',          shortLabel: 'Damages', icon: AlertTriangle },
  { id: 'certifications', label: 'Certifications',   shortLabel: 'Certs',   icon: Award         },
  { id: 'celebrations',   label: 'Birthdays & Anniv',shortLabel: 'Events',  icon: Gift          },
];

const COMPONENTS = {
  team: Team, hiring: Hiring, performance: Performance,
  reviews: Reviews, observations: Observations, timeoff: TimeOff, raises: Raises,
  uniforms: Uniforms, incidents: Incidents,
  certifications: Certifications, celebrations: Celebrations,
};

const ROLE_ICONS  = { super_admin: Crown, admin: Shield, user: User };
const ROLE_COLORS = { super_admin: '#7c3aed', admin: '#5db88a', user: '#9ca3af' };

// Bottom bar shows first 4 tabs + More
const BOTTOM_TABS = ['team', 'hiring', 'timeoff', 'incidents'];

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#0d1f16', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ background:'#fff', borderRadius:8, padding:'6px 12px' }}>
        <img src={mbLogo} alt="MB" style={{ height:24, display:'block' }} />
      </div>
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading...</div>
    </div>
  );
}

function Dashboard() {
  // Read the starting tab from the URL path (e.g. /reviews -> 'reviews'), defaulting to 'team'
  const getTabFromPath = () => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes
    return TABS.some(t => t.id === path) ? path : 'team';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [showUsers, setShowUsers] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [observationTarget, setObservationTarget] = useState(null);
  const { data, profile, isSuperAdmin, exportData, signOut } = useApp();

  const Component = showUsers ? UserManagement : COMPONENTS[activeTab];
  const pendingTimeOff = (data.timeOff  || []).filter(t => t.status === 'Pending').length;
  const openIncidents  = (data.incidents || []).filter(i => i.status === 'Open').length;
  const RoleIcon  = ROLE_ICONS[profile?.role]  || User;
  const roleColor = ROLE_COLORS[profile?.role] || '#9ca3af';

  const getBadge = (id) =>
    id === 'timeoff'   && pendingTimeOff > 0 ? pendingTimeOff :
    id === 'incidents' && openIncidents  > 0 ? openIncidents  : 0;

  const goTo = (id) => {
    setActiveTab(id);
    setShowUsers(false);
    setDrawerOpen(false);
    const newPath = `/${id}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ tab: id }, '', newPath);
    }
  };

  // Jump straight to a specific employee's profile in the Observation Log, from any other tab
  const goToObservation = (employeeId) => {
    setObservationTarget(employeeId);
    goTo('observations');
  };

  // Support browser Back/Forward buttons
  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getTabFromPath());
      setShowUsers(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // On first load, make sure the URL reflects the resolved tab (e.g. bare "/" becomes "/team")
  useEffect(() => {
    const newPath = `/${activeTab}`;
    if (window.location.pathname !== newPath) {
      window.history.replaceState({ tab: activeTab }, '', newPath);
    }
  }, []);

  return (
    <div className="app">

      {/* ── Header (desktop + mobile) ── */}
      <header className="top-header">
        <div className="header-brand">
          <div style={{ background:'#fff', borderRadius:7, padding:'3px 8px', display:'flex', alignItems:'center' }}>
            <img src={mbLogo} alt="Macario Brothers" style={{ height:20, width:'auto', display:'block' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.1 }}>
            <span style={{ color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope,sans-serif' }}>HR Dashboard</span>
          </div>
        </div>

        <div className="header-actions">
          {/* Desktop only */}
          <div className="desktop-only" style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.6)', fontSize:12 }}>
            <RoleIcon size={12} color={roleColor} />
            <span>{profile?.full_name || profile?.email?.split('@')[0] || 'User'}</span>
          </div>
          {isSuperAdmin && (
            <button className="btn-header desktop-only" onClick={() => { setShowUsers(s=>!s); setDrawerOpen(false); }} title="Users">
              <Settings size={14} /><span className="btn-label"> Users</span>
            </button>
          )}
          <button className="btn-header desktop-only" onClick={exportData} title="Export">
            <Download size={14} /><span className="btn-label"> Export</span>
          </button>
          <button className="btn-header desktop-only" onClick={signOut}
            style={{ background:'rgba(220,38,38,0.2)', borderColor:'rgba(220,38,38,0.35)' }}>
            <LogOut size={14} />
          </button>

          {/* Mobile: hamburger ONLY — no other buttons */}
          <button className="mobile-only btn-header" onClick={() => setDrawerOpen(o=>!o)}
            style={{ padding:'6px 10px' }}>
            {drawerOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Desktop Tab Nav ── */}
      {!showUsers && (
        <nav className="tab-nav-wrap desktop-only">
          <div className="tab-nav" id="tab-nav-scroll">
            {TABS.map(t => {
              const Icon = t.icon;
              const b = getBadge(t.id);
              return (
                <button key={t.id} className={`tab-btn ${activeTab===t.id?'active':''}`} onClick={() => goTo(t.id)}>
                  <Icon size={14} /> {t.label}
                  {b > 0 && <span className="tab-badge">{b}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {showUsers && (
        <div style={{ background:'#0d1f16', padding:'8px 20px', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setShowUsers(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:13 }}>
            Back
          </button>
          <span style={{ color:'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color:'#5db88a', fontSize:13, fontWeight:600 }}>User Management</span>
        </div>
      )}

      {/* ── Mobile Slide-in Drawer ── */}
      {drawerOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position:'absolute', top:0, right:0, width:'75%', maxWidth:280, height:'100%', background:'#fff', display:'flex', flexDirection:'column', animation:'slideInRight 0.22s ease' }}
            onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div style={{ background:'#1B3A2D', padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'#5db88a', color:'#0d1f16', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>
                {(profile?.full_name||profile?.email||'U').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{profile?.full_name||profile?.email?.split('@')[0]}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                  <RoleIcon size={10} color={roleColor} />
                  {(profile?.role||'user').replace('_',' ')}
                </div>
              </div>
            </div>

            {/* All tabs list */}
            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              {TABS.map(t => {
                const Icon = t.icon;
                const b = getBadge(t.id);
                const isActive = !showUsers && activeTab===t.id;
                return (
                  <button key={t.id} onClick={() => goTo(t.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 20px', border:'none', background:isActive?'#f0fdf4':'none', color:isActive?'#1B3A2D':'#374151', fontWeight:isActive?700:400, fontSize:14, cursor:'pointer', textAlign:'left', borderLeft:`3px solid ${isActive?'#1B3A2D':'transparent'}` }}>
                    <Icon size={16} />
                    {t.label}
                    {b>0 && <span style={{ marginLeft:'auto', background:'#dc2626', color:'#fff', fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{b}</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom actions */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:8 }}>
              {isSuperAdmin && (
                <button onClick={() => { setShowUsers(true); setDrawerOpen(false); }} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', fontSize:13, cursor:'pointer', color:'#374151' }}>
                  <Settings size={15} /> User Management
                </button>
              )}
              <button onClick={exportData} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', fontSize:13, cursor:'pointer', color:'#374151' }}>
                <Download size={15} /> Export Data
              </button>
              <button onClick={signOut} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', fontSize:13, cursor:'pointer', color:'#dc2626', fontWeight:600 }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Tab Bar — only 4 key tabs + More ── */}
      {!showUsers && (
        <nav className="mobile-tab-bar">
          {BOTTOM_TABS.map(id => {
            const t = TABS.find(x => x.id === id);
            const Icon = t.icon;
            const b = getBadge(id);
            const isActive = activeTab === id;
            return (
              <button key={id} onClick={() => goTo(id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 2px 6px', border:'none', background:'none', color:isActive?'#5db88a':'rgba(255,255,255,0.45)', cursor:'pointer', position:'relative', fontSize:10, fontWeight:isActive?700:400 }}>
                <Icon size={19} />
                <span>{t.shortLabel}</span>
                {b>0 && <span style={{ position:'absolute', top:4, right:'50%', transform:'translateX(12px)', background:'#dc2626', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:8 }}>{b}</span>}
              </button>
            );
          })}
          <button onClick={() => setDrawerOpen(true)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 2px 6px', border:'none', background:'none', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:10 }}>
            <Menu size={19} />
            <span>More</span>
          </button>
        </nav>
      )}

      <main className="main-content">
        <Component goToObservation={goToObservation} observationTarget={observationTarget} clearObservationTarget={()=>setObservationTarget(null)} />
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
