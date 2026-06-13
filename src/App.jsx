import { useState, useRef, useEffect } from 'react';
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
import UserManagement from './components/UserManagement';
import { clockSA, todaySA } from './lib/timezone';
import { Download, Upload, Users, UserPlus, BarChart2, Star, Calendar, TrendingUp, Shirt, AlertTriangle, Award, LogOut, Crown, Shield, User, Settings } from 'lucide-react';

const TABS = [
  { id: 'team', label: 'Team', icon: Users, component: Team },
  { id: 'hiring', label: 'Hiring', icon: UserPlus, component: Hiring },
  { id: 'performance', label: 'Performance', icon: BarChart2, component: Performance },
  { id: 'reviews', label: 'Reviews', icon: Star, component: Reviews },
  { id: 'timeoff', label: 'Time Off', icon: Calendar, component: TimeOff },
  { id: 'raises', label: 'Raises', icon: TrendingUp, component: Raises },
  { id: 'uniforms', label: 'Uniforms', icon: Shirt, component: Uniforms },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle, component: Incidents },
  { id: 'certifications', label: 'Certifications', icon: Award, component: Certifications },
];

const ROLE_ICONS = { super_admin: Crown, admin: Shield, user: User };
const ROLE_COLORS = { super_admin: '#7c3aed', admin: '#1d5c25', user: '#6b7280' };

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#14401a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: '#1d5c25', color: '#8bc34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, fontFamily: 'Manrope, sans-serif' }}>MB</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading…</div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('team');
  const [showUsers, setShowUsers] = useState(false);
  const { data, profile, isSuperAdmin, exportData, signOut } = useApp();
  const [clock, setClock] = useState(clockSA());
  useEffect(() => {
    const timer = setInterval(() => setClock(clockSA()), 30000);
    return () => clearInterval(timer);
  }, []);
  const fileRef = useRef();

  const Tab = TABS.find(t => t.id === activeTab);
  const Component = showUsers ? UserManagement : Tab.component;

  const pendingTimeOff = (data.timeOff || []).filter(t => t.status === 'Pending').length;
  const openIncidents = (data.incidents || []).filter(i => i.status === 'Open').length;

  const RoleIcon = ROLE_ICONS[profile?.role] || User;
  const roleColor = ROLE_COLORS[profile?.role] || '#6b7280';

  return (
    <div className="app">
      <header className="top-header">
        <div className="header-brand">
          <div className="logo-mark">MB</div>
          <div>
            <div className="brand-name">Macario Brothers</div>
            <div className="brand-sub">HR Dashboard</div>
          </div>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            <RoleIcon size={14} color={roleColor === '#6b7280' ? 'rgba(255,255,255,0.6)' : '#8bc34a'} />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name || profile?.email?.split('@')[0]}
            </span>
          </div>
          {isSuperAdmin && (
            <button className="btn-header" onClick={() => setShowUsers(s => !s)} style={{ background: showUsers ? 'rgba(139,195,74,0.25)' : undefined }}>
              <Settings size={15} /> Users
            </button>
          )}
          <button className="btn-header" onClick={exportData}>
            <Download size={15} /> Export
          </button>
          <button className="btn-header" onClick={signOut} style={{ background: 'rgba(220,38,38,0.2)', borderColor: 'rgba(220,38,38,0.4)' }}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {!showUsers && (
        <nav className="tab-nav">
          {TABS.map(t => {
            const Icon = t.icon;
            const badge = (t.id === 'timeoff' && pendingTimeOff > 0) ? pendingTimeOff
              : (t.id === 'incidents' && openIncidents > 0) ? openIncidents : 0;
            return (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}>
                <Icon size={15} />
                {t.label}
                {badge > 0 && <span className="tab-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
      )}

      {showUsers && (
        <div style={{ background: '#14401a', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowUsers(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Dashboard
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color: '#8bc34a', fontSize: 13, fontWeight: 600 }}>User Management</span>
        </div>
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
  if (!user) return <Login />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
