import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Check, ArrowLeft, Phone, Trash2, Edit2 } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import Avatar from './Avatar';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };

export default function CallIns() {
  const { data, addCallIn, updateCallIn, deleteCallIn, isAdmin } = useApp();
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(null); // null | 'add' | log object (edit)
  const [form, setForm]         = useState({ employeeId:'', date:todaySA(), reason:'' });
  const [saving, setSaving]     = useState(false);

  const allCallIns = data.callIns || [];
  const activeEmps = (data.employees || [])
    .filter(e => e.employment_status !== 'Terminated')
    .sort((a,b) => a.name.localeCompare(b.name));

  const openAdd = (empId = '') => {
    setForm({ employeeId: String(empId), date: todaySA(), reason: '' });
    setModal('add');
  };
  const openEdit = (log) => {
    setForm({ id: log.id, employeeId: String(log.employee_id), date: log.date, reason: log.reason });
    setModal(log);
  };
  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.employeeId || !form.date || !form.reason.trim()) return;
    setSaving(true);
    if (modal === 'add') {
      await addCallIn({ employeeId: parseInt(form.employeeId), date: form.date, reason: form.reason.trim() });
    } else {
      await updateCallIn({ id: form.id, date: form.date, reason: form.reason.trim() });
    }
    closeModal();
    setSaving(false);
  };

  // ── Drill-in: single employee thread ──
  if (selected) {
    const logs = allCallIns
      .filter(c => String(c.employee_id) === String(selected.id))
      .sort((a,b) => (b.date||'').localeCompare(a.date||''));

    return (
      <div>
        <button onClick={() => setSelected(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={15}/> Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', marginBottom:20 }}>
          <Avatar name={selected.name} photoUrl={selected.photo_url} size={50} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{selected.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{selected.role}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:30, fontWeight:800, fontFamily:'Manrope,sans-serif', lineHeight:1, color: logs.length >= 3 ? '#dc2626' : logs.length >= 1 ? '#f59e0b' : '#374151' }}>
              {logs.length}
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>call-in{logs.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="btn-primary" onClick={() => openAdd(selected.id)}>
              <Plus size={14}/> Log Call-In
            </button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {logs.map((log, i) => (
            <div key={log.id} className="list-card" style={{ borderLeft: `3px solid ${i === 0 ? '#dc2626' : '#e5e7eb'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#9ca3af', marginBottom:3 }}>{log.date}</div>
                  <div style={{ fontSize:14, color:'#111827', lineHeight:1.5 }}>{log.reason}</div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button className="btn-icon" onClick={() => openEdit(log)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={() => deleteCallIn(log.id)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && <div className="empty-state">No call-ins logged yet.</div>}
        </div>

        {/* Edit/Add modal */}
        {modal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modal === 'add' ? 'Log Call-In' : 'Edit Call-In'}</h3>
                <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                  Date
                  <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </label>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                  Reason
                  <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                    style={{ ...inp, resize:'none' }} placeholder="e.g. Called in sick, no notice given" />
                </label>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={saving || !form.reason.trim()}>
                  <Check size={14}/> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Summary: cards per employee ──
  const summary = activeEmps.map(emp => {
    const logs = allCallIns
      .filter(c => String(c.employee_id) === String(emp.id))
      .sort((a,b) => (b.date||'').localeCompare(a.date||''));
    return { emp, logs, count: logs.length, last: logs[0]?.date };
  }).filter(x => x.count > 0); // only show employees who have call-ins

  const thisMonthKey = new Date().toISOString().slice(0,7);
  const thisMonth    = allCallIns.filter(c => c.date?.startsWith(thisMonthKey)).length;
  const repeat       = summary.filter(x => x.count >= 3).length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        <div className="stat-card">
          <div className="stat-num">{allCallIns.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'#f59e0b' }}>{thisMonth}</div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'#dc2626' }}>{repeat}</div>
          <div className="stat-label">3+ Call-Ins</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 className="section-title">Call-In Tracker</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => openAdd()}>
            <Plus size={14}/> Log Call-In
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="card-grid">
        {summary.map(({ emp, count, last, logs }) => (
          <div key={emp.id} className="emp-card" style={{ cursor:'pointer', borderTop:`3px solid ${count>=3?'#dc2626':count>=2?'#f59e0b':'#e5e7eb'}` }}
            onClick={() => setSelected(emp)}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{emp.name}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:22, fontWeight:800, fontFamily:'Manrope,sans-serif', lineHeight:1, color:count>=3?'#dc2626':count>=2?'#f59e0b':'#374151' }}>
                  {count}
                </div>
                <div style={{ fontSize:10, color:'#9ca3af' }}>call-in{count!==1?'s':''}</div>
              </div>
            </div>
            {last && (
              <div style={{ marginTop:10, fontSize:12, color:'#6b7280' }}>
                Last: <span style={{ color:'#374151', fontWeight:500 }}>{last}</span>
              </div>
            )}
            {/* Mini log preview */}
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
              {logs.slice(0,2).map(log => (
                <div key={log.id} style={{ fontSize:12, color:'#374151', background:'#f9fafb', borderRadius:6, padding:'5px 8px', borderLeft:'2px solid #e5e7eb', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                  <span style={{ color:'#9ca3af', marginRight:6 }}>{log.date}</span>{log.reason}
                </div>
              ))}
              {logs.length > 2 && (
                <div style={{ fontSize:12, color:'#9ca3af', padding:'2px 8px' }}>+{logs.length-2} more</div>
              )}
            </div>
          </div>
        ))}
        {summary.length === 0 && (
          <div className="empty-state" style={{ gridColumn:'1/-1' }}>No call-ins recorded yet.</div>
        )}
      </div>

      {/* Add modal (from summary view) */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}><Phone size={16}/> Log Call-In</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Employee
                <select style={inp} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select employee...</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Date
                <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Reason
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                  style={{ ...inp, resize:'none' }} placeholder="e.g. Called in sick, no notice given" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.employeeId || !form.reason.trim()}>
                <Check size={14}/> {saving ? 'Saving...' : 'Log Call-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
