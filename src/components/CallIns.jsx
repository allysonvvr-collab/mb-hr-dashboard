import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Check, ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import Avatar from './Avatar';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };

export default function CallIns() {
  const { data, addCallIn, deleteCallIn, isAdmin } = useApp();
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ employeeId:'', date:todaySA(), reason:'' });
  const [saving, setSaving]     = useState(false);

  const allCallIns = data.callIns || [];
  const activeEmps = (data.employees || []).filter(e => e.employment_status !== 'Terminated');

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonth    = allCallIns.filter(c => c.date?.startsWith(thisMonthKey)).length;
  const repeatCount  = activeEmps.filter(emp =>
    allCallIns.filter(c => String(c.employee_id) === String(emp.id)).length >= 3
  ).length;

  const getEmpLogs = (empId) =>
    allCallIns
      .filter(c => String(c.employee_id) === String(empId))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const save = async () => {
    if (!form.employeeId || !form.date || !form.reason.trim()) return;
    setSaving(true);
    await addCallIn({ employeeId: parseInt(form.employeeId), date: form.date, reason: form.reason.trim() });
    setForm({ employeeId: '', date: todaySA(), reason: '' });
    setModal(false);
    setSaving(false);
  };

  // ── Drill-in: single employee thread ──
  if (selected) {
    const logs = getEmpLogs(selected.id);
    return (
      <div>
        <button onClick={() => setSelected(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={16}/> Back
        </button>

        {/* Employee summary card */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'18px', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <Avatar name={selected.name} photoUrl={selected.photo_url} size={52} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:17 }}>{selected.name}</div>
            <div style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{selected.role}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:36, fontWeight:800, fontFamily:'Manrope,sans-serif', lineHeight:1, color: logs.length >= 3 ? '#dc2626' : logs.length >= 1 ? '#f59e0b' : '#1B3A2D' }}>
              {logs.length}
            </div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>call-in{logs.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <button className="btn-primary"
              onClick={() => { setForm({ employeeId: String(selected.id), date: todaySA(), reason: '' }); setModal(true); }}>
              <Plus size={14}/> Log Call-In
            </button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {logs.map((log, i) => (
            <div key={log.id} className="list-card" style={{ borderLeft:`3px solid ${i === 0 ? '#f59e0b' : '#e5e7eb'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#1B3A2D' }}>{log.date}</span>
                    {i === 0 && (
                      <span style={{ background:'#fef3c7', color:'#92400e', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>
                        Most Recent
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:14, color:'#374151', lineHeight:1.5 }}>{log.reason}</div>
                </div>
                {isAdmin && (
                  <button className="btn-icon danger" onClick={() => deleteCallIn(log.id)} title="Delete">
                    <X size={13}/>
                  </button>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="empty-state">No call-ins logged for {selected.name}.</div>
          )}
        </div>
      </div>
    );
  }

  // ── Summary: card grid ──
  const summary = activeEmps
    .map(emp => ({ emp, logs: getEmpLogs(emp.id) }))
    .sort((a, b) => b.logs.length - a.logs.length || a.emp.name.localeCompare(b.emp.name));

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
          <div className="stat-num" style={{ color:'#dc2626' }}>{repeatCount}</div>
          <div className="stat-label">3+ Call-Ins</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 className="section-title">Call-In Tracker</h2>
        {isAdmin && (
          <button className="btn-primary"
            onClick={() => { setForm({ employeeId:'', date:todaySA(), reason:'' }); setModal(true); }}>
            <Plus size={14}/> Log Call-In
          </button>
        )}
      </div>

      {/* Card grid */}
      <div className="card-grid">
        {summary.map(({ emp, logs }) => {
          const count = logs.length;
          const last  = logs[0];
          return (
            <div key={emp.id} className="emp-card" style={{ cursor:'pointer' }}
              onClick={() => setSelected(emp)}>
              {/* Card header */}
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', minWidth:0 }}>
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{emp.role}</div>
                  </div>
                </div>

                {/* Call-in count badge */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                  <span style={{
                    background: count >= 3 ? '#fee2e2' : count >= 2 ? '#fef3c7' : count >= 1 ? '#f3f4f6' : '#f9fafb',
                    color:      count >= 3 ? '#dc2626' : count >= 2 ? '#92400e' : count >= 1 ? '#374151' : '#9ca3af',
                    border:     `1px solid ${count >= 3 ? '#fca5a5' : count >= 2 ? '#fde68a' : '#e5e7eb'}`,
                    fontSize:13, fontWeight:700, padding:'3px 10px', borderRadius:20, minWidth:28, textAlign:'center',
                    display:'flex', alignItems:'center', gap:4
                  }}>
                    {count >= 3 && <AlertTriangle size={11}/>}
                    {count}
                  </span>
                </div>
              </div>

              {/* Last call-in */}
              <div className="emp-details" style={{ marginTop:10 }}>
                <div>
                  <span>Last call-in</span>
                  <span>{last ? last.date : '—'}</span>
                </div>
                <div>
                  <span>Total</span>
                  <span style={{ fontWeight:600, color: count >= 3 ? '#dc2626' : count >= 1 ? '#f59e0b' : '#374151' }}>
                    {count} call-in{count !== 1 ? 's' : ''}
                  </span>
                </div>
                {last && (
                  <div>
                    <span>Reason</span>
                    <span style={{ fontSize:12, color:'#374151' }}>
                      {last.reason.length > 40 ? last.reason.slice(0, 40) + '…' : last.reason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Phone size={16}/> Log Call-In
              </h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Employee
                <select style={inp} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId:e.target.value }))}>
                  <option value="">Select employee...</option>
                  {activeEmps.sort((a,b) => a.name.localeCompare(b.name)).map(e =>
                    <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                  )}
                </select>
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Date
                <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Reason
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason:e.target.value }))}
                  rows={3} style={{ ...inp, resize:'none' }} placeholder="e.g. Called in sick, no notice given" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}
                disabled={saving || !form.employeeId || !form.reason.trim()}>
                <Check size={14}/> {saving ? 'Saving...' : 'Log Call-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
