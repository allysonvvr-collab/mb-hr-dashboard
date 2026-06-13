import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { isBirthdayUpcoming, daysUntilBirthday } from '../lib/timezone';
import { TabHeader } from './TabHeader';

const ROLES = ['Foreman', 'Crew Leader', 'Crew Member', 'Office Manager', 'Office Assistant'];
const COLORS = ['#1B3A2D','#224d3a','#2d6349','#0d1f16','#3a7a5c','#4d9973','#163025'];

function Avatar({ text }) {
  const bg = COLORS[(text || 'MB').charCodeAt(0) % COLORS.length];
  return (
    <div style={{ background: bg, width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
      {(text || 'MB').slice(0, 2).toUpperCase()}
    </div>
  );
}

function StrikeBadge({ count }) {
  if (!count) return null;
  return <span style={{ background: count >= 2 ? '#dc2626' : '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{count} Strike{count > 1 ? 's' : ''}</span>;
}

const emptyEmp = { name: '', role: 'Crew Member', phone: '', email: '', start_date: '', birthday: '', wage: '', strikes: 0 };

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  background: '#fff',
  color: '#111827',
  boxSizing: 'border-box',
};

export default function Team() {
  const { data, addEmployee, updateEmployee, deleteEmployee, isAdmin, isSuperAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyEmp);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openAdd  = () => { setForm(emptyEmp); setError(''); setModal('add'); };
  const openEdit = (emp) => {
    setForm({
      id: emp.id,
      name: emp.name || '',
      role: emp.role || 'Crew Member',
      phone: emp.phone || '',
      email: emp.email || '',
      start_date: emp.start_date || '',
      birthday: emp.birthday || '',
      wage: emp.wage !== undefined ? String(emp.wage) : '',
      strikes: emp.strikes !== undefined ? emp.strikes : 0,
      avatar: emp.avatar || '',
    });
    setError('');
    setModal(emp);
  };
  const closeModal = () => { setModal(null); setError(''); };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const emp = {
        ...form,
        name: form.name.trim(),
        wage: parseFloat(form.wage) || 0,
        strikes: parseInt(form.strikes) || 0,
        avatar: form.name.trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(),
      };
      if (modal === 'add') await addEmployee(emp);
      else await updateEmployee(emp);
      closeModal();
    } catch(e) {
      setError('Save failed. Check your permissions.');
    }
    setSaving(false);
  };

  const upcomingBdays = (data.employees || []).filter(emp => isBirthdayUpcoming(emp.birthday));

  const filtered = (data.employees || [])
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'wage')  return Number(b.wage) - Number(a.wage);
      if (sortBy === 'role')  return a.role.localeCompare(b.role);
      if (sortBy === 'start') return new Date(a.start_date) - new Date(b.start_date);
      return a.name.localeCompare(b.name);
    });

  const settingsPanel = (
    <div>
      <label style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13, fontWeight:600, color:'#374151', marginBottom:12 }}>
        Sort By
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
          <option value="name">Name (A–Z)</option>
          <option value="role">Role</option>
          <option value="wage">Wage (High–Low)</option>
          <option value="start">Start Date</option>
        </select>
      </label>
      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:12, fontSize:13, color:'#166534' }}>
        <div><strong>Total employees:</strong> {(data.employees||[]).length}</div>
        <div><strong>Total payroll/hr:</strong> ${(data.employees||[]).reduce((s,e)=>s+Number(e.wage||0),0).toFixed(2)}</div>
      </div>
    </div>
  );

  return (
    <div>
      {upcomingBdays.length > 0 && (
        <div className="alert-banner">
          <strong>Upcoming Birthdays (next 30 days):</strong>{' '}
          {upcomingBdays.map(e => `${e.name} — ${e.birthday} (${daysUntilBirthday(e.birthday)}d away)`).join(', ')}
        </div>
      )}

      <TabHeader title="Team" settings={settingsPanel}>
        <input className="search-input" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Employee
          </button>
        )}
      </TabHeader>

      <div className="card-grid">
        {filtered.map(emp => (
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
              <div><span>Phone</span><span>{emp.phone || '—'}</span></div>
              <div><span>Email</span><span style={{ fontSize:12 }}>{emp.email || '—'}</span></div>
              <div><span>Start</span><span>{emp.start_date || '—'}</span></div>
              <div><span>Birthday</span><span>{emp.birthday || '—'}</span></div>
              <div><span>Wage</span><span style={{ color:'#1B3A2D', fontWeight:700 }}>${Number(emp.wage||0).toFixed(2)}/hr</span></div>
            </div>
            {isAdmin && (
              <div className="card-actions">
                <button className="btn-icon" onClick={() => openEdit(emp)} title="Edit">
                  <Edit2 size={14} />
                </button>
                {isSuperAdmin && (
                  <button className="btn-icon danger" onClick={() => setConfirmDelete(emp)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn:'1/-1' }}>No employees found.</div>}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add Employee' : `Edit — ${form.name}`}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <label>
                Full Name
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" />
              </label>
              <label>
                Role
                <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label>
                Phone
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
              </label>
              <label>
                Email
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="employee@email.com" />
              </label>
              <label>
                Start Date
                <input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </label>
              <label>
                Birthday (e.g. Jul 21)
                <input style={inputStyle} value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} placeholder="Jul 21" />
              </label>
              <label>
                Wage ($/hr)
                <input style={inputStyle} type="number" step="0.25" min="0" value={form.wage} onChange={e => setForm(f => ({ ...f, wage: e.target.value }))} placeholder="15.00" />
              </label>
              <label>
                Strikes (0–3)
                <input style={inputStyle} type="number" min="0" max="3" value={form.strikes} onChange={e => setForm(f => ({ ...f, strikes: e.target.value }))} />
              </label>
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
