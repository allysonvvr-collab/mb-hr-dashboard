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
import Incidents from './components/Incidents';
import Certifications from './components/Certifications';
import Celebrations from './components/Celebrations';
import UserManagement from './components/UserManagement';
import mbLogo from './assets/mb-logo.webp';
import {
  Download, Users, UserPlus, BarChart2, Star,
  Calendar, TrendingUp, Shirt, AlertTriangle,
  Award, LogOut, Crown, Shield, User, Settings, Gift
} from 'lucide-react';

const TABS = [
  { id: 'team',           label: 'Team',                      icon: Users,         component: Team },
  { id: 'hiring',         label: 'Hiring',                    icon: UserPlus,      component: Hiring },
  { id: 'performance',    label: 'Performance',               icon: BarChart2,     component: Performance },
  { id: 'reviews',        label: 'Reviews',                   icon: Star,          component: Reviews },
  { id: 'timeoff',        label: 'Time Off',                  icon: Calendar,      component: TimeOff },
  { id: 'raises',         label: 'Raises',                    icon: TrendingUp,    component: Raises },
  { id: 'uniforms',       label: 'Uniforms',                  icon: Shirt,         component: Uniforms },
  { id: 'incidents',      label: 'Incidents',                 icon: AlertTriangle, component: Incidents },
  { id: 'certifications', label: 'Certifications',            icon: Award,         component: Certifications },
  { id: 'celebrations',   label: 'Birthdays & Anniversaries', icon: Gift,          component: Celebrations },
];

const ROLE_ICONS  = { super_admin: Crown, admin: Shield, user: User };
const ROLE_COLORS = { super_admin: '#7c3aed', admin: '#5db88a', user: '#6b7280' };

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'#0d1f16', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <img src={mbLogo} alt="MB" style={{ height:44, width:'auto', opacity:0.8 }} />
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading...</div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('team');
  const [showUsers, setShowUsers] = useState(false);
  const { data, profile, isSuperAdmin, exportData, signOut } = useApp();

  const Tab = TABS.find(t => t.id === activeTab);
  const Component = showUsers ? UserManagement : Tab.component;

  const pendingTimeOff = (data.timeOff  || []).filter(t => t.status === 'Pending').length;
  const openIncidents  = (data.incidents || []).filter(i => i.status === 'Open').length;

  const RoleIcon  = ROLE_ICONS[profile?.role]  || User;
  const roleColor = ROLE_COLORS[profile?.role] || '#6b7280';

  return (
    <div className="app">
      {/* Header */}
      <header className="top-header">
        <div className="header-brand">
          <img src={mbLogo} alt="Macario Brothers Lawn Care"
            style={{ height:34, width:'auto' }} />
          <span className="brand-sub">HR Dashboard</span>
        </div>

        <div className="header-actions">
          <div className="header-user">
            <RoleIcon size={13} color={roleColor} />
            <span>{profile?.full_name || profile?.email?.split('@')[0] || 'User'}</span>
          </div>
          {isSuperAdmin && (
            <button className="btn-header icon-only" onClick={() => setShowUsers(s => !s)}
              title="User Management"
              style={{ background: showUsers ? 'rgba(93,184,138,0.25)' : undefined }}>
              <Settings size={15} />
              <span className="btn-label"> Users</span>
            </button>
          )}
          <button className="btn-header icon-only" onClick={exportData} title="Export data">
            <Download size={15} />
            <span className="btn-label"> Export</span>
          </button>
          <button className="btn-header icon-only" onClick={signOut} title="Sign out"
            style={{ background:'rgba(220,38,38,0.2)', borderColor:'rgba(220,38,38,0.4)' }}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Tab Nav */}
      {!showUsers && (
        <nav className="tab-nav">
          {TABS.map(t => {
            const Icon = t.icon;
            const badge = (t.id === 'timeoff'   && pendingTimeOff > 0) ? pendingTimeOff
                        : (t.id === 'incidents' && openIncidents  > 0) ? openIncidents : 0;
            return (
              <button key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
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
        <div style={{ background:'#0d1f16', padding:'10px 20px', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setShowUsers(false)}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            Back to Dashboard
          </button>
          <span style={{ color:'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color:'#5db88a', fontSize:13, fontWeight:600 }}>User Management</span>
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
