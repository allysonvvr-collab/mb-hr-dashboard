import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { isBirthdayUpcoming, daysUntilBirthday } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const ROLES = ['Owner', 'Operations Manager', 'Office Manager', 'Crew Leader', 'Crew Worker'];

// Order roles appear in sections
const ROLE_ORDER = ['Owner', 'Operations Manager', 'Office Manager', 'Crew Leader', 'Crew Worker', 'Crew Member'];

const ROLE_COLORS = {
  Owner:              { bg: '#7c3aed', light: '#f5f3ff', border: '#e9d5ff' },
  'Operations Manager':{ bg: '#1B3A2D', light: '#f0fdf4', border: '#86efac' },
  'Office Manager':   { bg: '#0369a1', light: '#f0f9ff', border: '#bae6fd' },
  'Crew Leader':      { bg: '#b45309', light: '#fffbeb', border: '#fde68a' },
  'Crew Worker':      { bg: '#374151', light: '#f9fafb', border: '#e5e7eb' },
  'Crew Member':      { bg: '#374151', light: '#f9fafb', border: '#e5e7eb' },
};

const AVATAR_COLORS = ['#1B3A2D','#224d3a','#2d6349','#0d1f16','#3a7a5c','#4d9973','#163025'];

function Avatar({ text }) {
  const bg = AVATAR_COLORS[(text || 'MB').charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ background: bg, width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
      {(text || 'MB').slice(0, 2).toUpperCase()}
    </div>
  );
}

function StrikeBadge({ count }) {
  if (!count) return null;
  return <span style={{ background: count >= 2 ? '#dc2626' : '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{count} Strike{count > 1 ? 's' : ''}</span>;
}

const inputStyle = {
  padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 15, fontFamily: 'inherit', outline: 'none', width: '100%',
  background: '#fff', color: '#111827', boxSizing: 'border-box',
};

const emptyEmp = { name: '', role: 'Crew Worker', phone: '', email: '', start_date: '', birthday: '', wage: '', strikes: 0 };

function RoleSection({ role, employees, onEdit, onDelete, isAdmin, isSuperAdmin }) {
  const [collapsed, setCollapsed] = useState(false);
  const colors = ROLE_COLORS[role] || ROLE_COLORS['Crew Worker'];

  if (employees.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px', textAlign: 'left' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors.bg, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{role}</span>
        <span style={{ background: colors.light, border: `1px solid ${colors.border}`, color: colors.bg, fontSize: 12, fontWeight: 600, padding: '1px 8px', borderRadius: 20 }}>
          {employees.length}
        </span>
        <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </span>
      </button>

      {/* Employee cards */}
      {!collapsed && (
        <div className="card-grid">
          {employees.map(emp => (
            <div key={emp.id} className="emp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar text={emp.avatar || emp.name.slice(0, 2)} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span style={{ background: colors.light, border: `1px solid ${colors.border}`, color: colors.bg, fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20 }}>
                        {emp.role}
                      </span>
                    </div>
                  </div>
                </div>
                <StrikeBadge count={emp.strikes} />
              </div>

              <div className="emp-details">
                <div><span>Phone</span><span>{emp.phone || '—'}</span></div>
                <div><span>Email</span><span style={{ fontSize: 12 }}>{emp.email || '—'}</span></div>
                <div><span>Start</span><span>{emp.start_date || '—'}</span></div>
                <div><span>Birthday</span><span>{emp.birthday || '—'}</span></div>
                <div><span>Wage</span><span style={{ color: '#1B3A2D', fontWeight: 700 }}>${Number(emp.wage || 0).toFixed(2)}/hr</span></div>
              </div>

              {isAdmin && (
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => onEdit(emp)} title="Edit"><Edit2 size={14} /></button>
                  {isSuperAdmin && <button className="btn-icon danger" onClick={() => onDelete(emp)} title="Delete"><Trash2 size={14} /></button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { data, addEmployee, updateEmployee, deleteEmployee, isAdmin, isSuperAdmin } = useApp();
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(emptyEmp);
  const [search, setSearch]             = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [viewMode, setViewMode]         = useState('grouped'); // 'grouped' | 'all'

  const openAdd  = () => { setForm(emptyEmp); setError(''); setModal('add'); };
  const openEdit = (emp) => {
    setForm({ id: emp.id, name: emp.name || '', role: emp.role || 'Crew Worker', phone: emp.phone || '', email: emp.email || '', start_date: emp.start_date || '', birthday: emp.birthday || '', wage: emp.wage !== undefined ? String(emp.wage) : '', strikes: emp.strikes || 0, avatar: emp.avatar || '' });
    setError(''); setModal(emp);
  };
  const closeModal = () => { setModal(null); setError(''); };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const emp = { ...form, name: form.name.trim(), wage: parseFloat(form.wage) || 0, strikes: parseInt(form.strikes) || 0, avatar: form.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() };
      if (modal === 'add') await addEmployee(emp);
      else await updateEmployee(emp);
      closeModal();
    } catch (e) { setError('Save failed. Check your permissions.'); }
    setSaving(false);
  };

  const upcomingBdays = (data.employees || []).filter(emp => isBirthdayUpcoming(emp.birthday));

  const filtered = (data.employees || []).filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by role in order
  const grouped = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = filtered.filter(e => e.role === role);
    return acc;
  }, {});

  // Ungrouped (for "all" view)
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const totalPayroll = (data.employees || []).reduce((s, e) => s + Number(e.wage || 0), 0);

  const settingsPanel = (
    <div>
      <label style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13, fontWeight:600, color:'#374151', marginBottom:12 }}>
        Display Mode
        <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={inputStyle}>
          <option value="grouped">Grouped by Role</option>
          <option value="all">All Employees (A–Z)</option>
        </select>
      </label>
      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:12, fontSize:13, color:'#166534' }}>
        <div><strong>Total employees:</strong> {(data.employees||[]).length}</div>
        <div><strong>Total payroll/hr:</strong> ${totalPayroll.toFixed(2)}</div>
        <div style={{ marginTop:8, borderTop:'1px solid #86efac', paddingTop:8 }}>
          {ROLE_ORDER.map(role => {
            const count = (data.employees||[]).filter(e => e.role === role).length;
            if (!count) return null;
            return <div key={role} style={{ display:'flex', justifyContent:'space-between' }}><span>{role}</span><strong>{count}</strong></div>;
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {upcomingBdays.length > 0 && (
        <div className="alert-banner">
          <strong>Upcoming Birthdays — Next 30 Days:</strong>{' '}
          {upcomingBdays.map(e => `${e.name} — ${e.birthday} (${daysUntilBirthday(e.birthday)}d away)`).join(', ')}
        </div>
      )}

      <TabHeader title="Team" settings={settingsPanel}>
        <input className="search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Employee
          </button>
        )}
      </TabHeader>

      {/* Stats row */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {ROLE_ORDER.map(role => {
          const count = filtered.filter(e => e.role === role).length;
          if (!count) return null;
          const colors = ROLE_COLORS[role];
          return (
            <div key={role} style={{ background: colors.light, border:`1px solid ${colors.border}`, borderRadius:8, padding:'6px 12px', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:colors.bg, display:'inline-block' }} />
              <span style={{ color:colors.bg, fontWeight:600 }}>{role}</span>
              <span style={{ color:'#6b7280' }}>({count})</span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        ROLE_ORDER.map(role => (
          <RoleSection key={role} role={role} employees={grouped[role] || []}
            onEdit={openEdit} onDelete={setConfirmDelete}
            isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
        ))
      ) : (
        <div className="card-grid">
          {sorted.map(emp => (
            <div key={emp.id} className="emp-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <Avatar text={emp.avatar || emp.name.slice(0,2)} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{emp.name}</div>
                    <div style={{ color:'#6b7280', fontSize:13 }}>{emp.role}</div>
                  </div>
                </div>
                <StrikeBadge count={emp.strikes} />
              </div>
              <div className="emp-details">
                <div><span>Phone</span><span>{emp.phone||'—'}</span></div>
                <div><span>Email</span><span style={{ fontSize:12 }}>{emp.email||'—'}</span></div>
                <div><span>Start</span><span>{emp.start_date||'—'}</span></div>
                <div><span>Birthday</span><span>{emp.birthday||'—'}</span></div>
                <div><span>Wage</span><span style={{ color:'#1B3A2D', fontWeight:700 }}>${Number(emp.wage||0).toFixed(2)}/hr</span></div>
              </div>
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => openEdit(emp)}><Edit2 size={14} /></button>
                  {isSuperAdmin && <button className="btn-icon danger" onClick={() => setConfirmDelete(emp)}><Trash2 size={14} /></button>}
                </div>
              )}
            </div>
          ))}
          {sorted.length === 0 && <div className="empty-state" style={{ gridColumn:'1/-1' }}>No employees found.</div>}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add Employee' : `Edit — ${form.name}`}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>{error}</div>}
            <div className="form-grid">
              <label>Full Name<input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" /></label>
              <label>Role
                <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label>Phone<input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" /></label>
              <label>Email<input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="employee@email.com" /></label>
              <label>Start Date<input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></label>
              <label>Birthday (e.g. Jul 21)<input style={inputStyle} value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} placeholder="Jul 21" /></label>
              <label>Wage ($/hr)<input style={inputStyle} type="number" step="0.25" min="0" value={form.wage} onChange={e => setForm(f => ({ ...f, wage: e.target.value }))} placeholder="15.00" /></label>
              <label>Strikes (0–3)<input style={inputStyle} type="number" min="0" max="3" value={form.strikes} onChange={e => setForm(f => ({ ...f, strikes: e.target.value }))} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.name.trim()}>
                <Check size={16} /> {saving ? 'Saving...' : modal === 'add' ? 'Add Employee' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Employee?</h3>
              <button className="btn-icon" onClick={() => setConfirmDelete(null)}><X size={18} /></button>
            </div>
            <p style={{ color:'#6b7280', fontSize:14, margin:'8px 0 20px' }}>
              Are you sure you want to permanently delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button onClick={() => { deleteEmployee(confirmDelete.id); setConfirmDelete(null); }}
                style={{ background:'#dc2626', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
