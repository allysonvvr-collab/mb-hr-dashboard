import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { isBirthdayUpcoming, daysUntilBirthday, todaySA } from '../lib/timezone';

const ROLES = ['Foreman', 'Crew Leader', 'Crew Member', 'Office Manager', 'Office Assistant'];
const COLORS = ['#2d6a1f','#3a7d44','#1a5c2a','#4a8c3f','#215c31','#5a7d2f','#0f4a20'];

function Avatar({ text }) {
  const bg = COLORS[(text || 'MB').charCodeAt(0) % COLORS.length];
  return <div style={{ background: bg, width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{(text||'MB').slice(0,2)}</div>;
}

function StrikeBadge({ count }) {
  if (!count) return null;
  return <span style={{ background: count >= 2 ? '#dc2626' : '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{count} Strike{count > 1 ? 's' : ''}</span>;
}

const emptyEmp = { name: '', role: 'Crew Member', phone: '', email: '', start_date: '', birthday: '', wage: '', strikes: 0 };

export default function Team() {
  const { data, addEmployee, updateEmployee, deleteEmployee, isAdmin, isSuperAdmin } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyEmp);
  const [search, setSearch] = useState('');

  const openAdd = () => { setForm(emptyEmp); setModal('add'); };
  const openEdit = (emp) => { setForm({ ...emp }); setModal(emp); };
  const closeModal = () => setModal(null);
  const save = () => {
    const emp = { ...form, wage: parseFloat(form.wage) || 0, strikes: parseInt(form.strikes) || 0 };
    if (modal === 'add') addEmployee(emp);
    else updateEmployee(emp);
    closeModal();
  };

  const filtered = (data.employees || []).filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const upcomingBdays = (data.employees || []).filter(emp => isBirthdayUpcoming(emp.birthday));

  return (
    <div>
      {upcomingBdays.length > 0 && (
        <div className="alert-banner">
          🎂 <strong>Upcoming Birthdays (next 30 days):</strong>{' '}
          {upcomingBdays.map(e => `${e.name} — ${e.birthday} (${daysUntilBirthday(e.birthday)}d away)`).join(', ')}
        </div>
      )}
      <div className="section-header">
        <input className="search-input" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
        {isAdmin && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Employee</button>}
      </div>
      <div className="card-grid">
        {filtered.map(emp => (
          <div key={emp.id} className="emp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar text={emp.avatar || emp.name.slice(0,2)} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{emp.role}</div>
                </div>
              </div>
              <StrikeBadge count={emp.strikes} />
            </div>
            <div className="emp-details">
              <div><span>Phone</span><span>{emp.phone}</span></div>
              <div><span>Email</span><span style={{ fontSize: 12 }}>{emp.email}</span></div>
              <div><span>Start</span><span>{emp.start_date}</span></div>
              <div><span>Birthday</span><span>{emp.birthday}</span></div>
              <div><span>Wage</span><span style={{ color: '#2d6a1f', fontWeight: 700 }}>${Number(emp.wage).toFixed(2)}/hr</span></div>
            </div>
            {isAdmin && (
              <div className="card-actions">
                <button className="btn-icon" onClick={() => openEdit(emp)}><Edit2 size={14} /></button>
                {isSuperAdmin && <button className="btn-icon danger" onClick={() => deleteEmployee(emp.id)}><Trash2 size={14} /></button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{modal === 'add' ? 'Add Employee' : 'Edit Employee'}</h3><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
            <div className="form-grid">
              <label>Full Name<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
              <label>Role<select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></label>
              <label>Phone<input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></label>
              <label>Email<input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></label>
              <label>Start Date<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></label>
              <label>Birthday (e.g. Jul 21)<input value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} /></label>
              <label>Wage ($/hr)<input type="number" step="0.25" value={form.wage} onChange={e => setForm(f => ({ ...f, wage: e.target.value }))} /></label>
              <label>Strikes<input type="number" min="0" max="3" value={form.strikes} onChange={e => setForm(f => ({ ...f, strikes: e.target.value }))} /></label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save}><Check size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
