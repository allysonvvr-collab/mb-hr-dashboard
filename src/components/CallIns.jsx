import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Check, ArrowLeft, Phone, Edit2, Trash2 } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import Avatar from './Avatar';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };
const emptyForm = { employeeId:'', date:todaySA(), reason:'' };

export default function CallIns() {
  const { data, addCallIn, updateCallIn, deleteCallIn, isAdmin } = useApp();
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(null); // null | 'add' | log object (edit)
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);

  const allCallIns = data.callIns || [];
  const activeEmps = (data.employees || []).filter(e => e.employment_status !== 'Terminated');

  const openAdd  = (empId) => { setForm({ ...emptyForm, employeeId: empId ? String(empId) : '' }); setModal('add'); };
  const openEdit = (log)   => { setForm({ employeeId: String(log.employee_id), date: log.date, reason: log.reason, id: log.id }); setModal(log); };
  const closeModal = () => { setModal(null); setForm(emptyForm); };

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

  // ── Drill-in: single employee ──────────────────────────
  if (selected) {
    const emp  = activeEmps.find(e => e.id === selected) || {};
    const logs = allCallIns
      .filter(c => String(c.employee_id) === String(selected))
      .sort((a,b) => (b.date||'').localeCompare(a.date||''));

    return (
      <div>
        <button onClick={()=>setSelected(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:16, padding:0 }}>
          <ArrowLeft size={15}/> Back
        </button>

        {/* Employee header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', marginBottom:16 }}>
          <Avatar name={emp.name} photoUrl={emp.photo_url} size={48} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{emp.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{emp.role}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:28, fontWeight:800, fontFamily:'Manrope,sans-serif', color: logs.length >= 3 ? '#dc2626' : logs.length > 0 ? '#f59e0b' : '#9ca3af' }}>
              {logs.length}
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>call-ins</div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="btn-primary" onClick={()=>openAdd(selected)}>
              <Plus size={14}/> Log Call-In
            </button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {logs.map((log, i) => (
            <div key={log.id} className="list-card" style={{ borderLeft:`3px solid ${i===0?'#f59e0b':'#e5e7eb'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#374151', marginBottom:4 }}>{log.date}</div>
                  <div style={{ fontSize:14, color:'#374151', lineHeight:1.5 }}>{log.reason}</div>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="btn-icon" onClick={()=>openEdit(log)}><Edit2 size={13}/></button>
                    <button className="btn-icon danger" onClick={()=>deleteCallIn(log.id)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && <div className="empty-state">No call-ins recorded.</div>}
        </div>

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modal==='add'?'Log Call-In':'Edit Call-In'}</h3>
                <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                  Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
                </label>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                  Reason<textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} placeholder="e.g. Called in sick, no notice given" />
                </label>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={saving||!form.reason.trim()}>
                  <Check size={14}/> {saving?'Saving...':'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Summary: card grid ─────────────────────────────────
  const thisMonthKey = new Date().toISOString().slice(0,7);
  const thisMonth    = allCallIns.filter(c=>c.date?.startsWith(thisMonthKey)).length;
  const repeat       = activeEmps.filter(emp=>allCallIns.filter(c=>String(c.employee_id)===String(emp.id)).length>=3).length;

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
          <button className="btn-primary" onClick={()=>openAdd(null)}>
            <Plus size={14}/> Log Call-In
          </button>
        )}
      </div>

      {/* Employee cards */}
      <div className="card-grid">
        {activeEmps
          .map(emp => ({
            emp,
            logs: [...allCallIns.filter(c=>String(c.employee_id)===String(emp.id))].sort((a,b)=>(b.date||'').localeCompare(a.date||'')),
          }))
          .sort((a,b) => b.logs.length - a.logs.length || a.emp.name.localeCompare(b.emp.name))
          .map(({ emp, logs }) => {
            const count = logs.length;
            const last  = logs[0];
            return (
              <div key={emp.id} className="emp-card" style={{ cursor:'pointer', borderTop:`3px solid ${count>=3?'#dc2626':count>=2?'#f59e0b':'#e5e7eb'}` }}
                onClick={()=>setSelected(emp.id)}>

                {/* Top: avatar + name + badge — always same layout */}
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                  </div>
                  <span style={{ background:count>0?(count>=3?'#fee2e2':count>=2?'#fef3c7':'#f3f4f6'):'#f3f4f6', color:count>0?(count>=3?'#dc2626':count>=2?'#92400e':'#374151'):'#d1d5db', border:`1px solid ${count>0?(count>=3?'#fca5a5':count>=2?'#fde68a':'#e5e7eb'):'#e5e7eb'}`, fontSize:13, fontWeight:800, padding:'4px 10px', borderRadius:20, flexShrink:0, minWidth:32, textAlign:'center' }}>
                    {count}
                  </span>
                </div>

                {/* Bottom: last call-in OR placeholder — always present so all cards same height */}
                <div style={{ marginTop:10, background:last?'#fef9f9':'#f9fafb', border:`1px solid ${last?'#fecaca':'#f3f4f6'}`, borderRadius:7, padding:'8px 10px', minHeight:50 }}>
                  {last ? (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2 }}>Last · {last.date}</div>
                      <div style={{ fontSize:12, color:'#374151', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{last.reason}</div>
                    </>
                  ) : (
                    <div style={{ fontSize:12, color:'#d1d5db', fontStyle:'italic' }}>No call-ins recorded</div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Add modal from summary */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}><Phone size={16}/> Log Call-In</h3>
              <button className="btn-icon" onClick={closeModal}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Employee
                <select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}>
                  <option value="">Select employee...</option>
                  {[...activeEmps].sort((a,b)=>a.name.localeCompare(b.name)).map(e=><option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Date<input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Reason<textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} placeholder="e.g. Called in sick, no notice given" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.employeeId||!form.reason.trim()}>
                <Check size={14}/> {saving?'Saving...':'Log Call-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
