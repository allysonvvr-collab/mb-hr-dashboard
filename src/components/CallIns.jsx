import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Check, ArrowLeft, Phone } from 'lucide-react';
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

  const save = async () => {
    if (!form.employeeId || !form.date || !form.reason.trim()) return;
    setSaving(true);
    await addCallIn({ employeeId:parseInt(form.employeeId), date:form.date, reason:form.reason.trim() });
    setForm({ employeeId:'', date:todaySA(), reason:'' });
    setModal(false);
    setSaving(false);
  };

  // ── Drill-in: single employee thread ──
  if (selected) {
    const logs = allCallIns
      .filter(c => String(c.employee_id) === String(selected.id))
      .sort((a,b) => (b.date||'').localeCompare(a.date||''));

    return (
      <div>
        <button onClick={()=>setSelected(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={15}/> Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', marginBottom:16 }}>
          <Avatar name={selected.name} photoUrl={selected.photo_url} size={50} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{selected.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{selected.role}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:30, fontWeight:800, fontFamily:'Manrope,sans-serif', lineHeight:1, color:logs.length>=3?'#dc2626':logs.length>=1?'#f59e0b':'#374151' }}>
              {logs.length}
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>call-ins</div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ marginBottom:14, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn-primary" onClick={()=>{ setForm({ employeeId:String(selected.id), date:todaySA(), reason:'' }); setModal(true); }}>
              <Plus size={14}/> Log Call-In
            </button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {logs.map((log, i) => (
            <div key={log.id} className="list-card" style={{ borderLeft:`3px solid ${i===0?'#f59e0b':'#e5e7eb'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#9ca3af', marginBottom:3 }}>{log.date}</div>
                  <div style={{ fontSize:14, color:'#374151', lineHeight:1.5 }}>{log.reason}</div>
                </div>
                {isAdmin && <button className="btn-icon danger" onClick={()=>deleteCallIn(log.id)}><X size={13}/></button>}
              </div>
            </div>
          ))}
          {logs.length === 0 && <div className="empty-state">No call-ins on record.</div>}
        </div>
      </div>
    );
  }

  // ── Summary: card grid ──
  const summary = activeEmps
    .map(emp => ({
      emp,
      count: allCallIns.filter(c => String(c.employee_id) === String(emp.id)).length,
      last:  allCallIns.filter(c => String(c.employee_id) === String(emp.id)).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]?.date,
    }))
    .sort((a,b) => b.count - a.count || a.emp.name.localeCompare(b.emp.name));

  const thisMonthKey = new Date().toISOString().slice(0,7);

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        <div className="stat-card">
          <div className="stat-num">{allCallIns.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'#f59e0b' }}>
            {allCallIns.filter(c=>c.date?.startsWith(thisMonthKey)).length}
          </div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'#dc2626' }}>
            {summary.filter(x=>x.count>=3).length}
          </div>
          <div className="stat-label">3+ Call-Ins</div>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 className="section-title">Call-In Tracker</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={()=>{ setForm({ employeeId:'', date:todaySA(), reason:'' }); setModal(true); }}>
            <Plus size={14}/> Log Call-In
          </button>
        )}
      </div>

      {/* Card grid */}
      <div className="card-grid">
        {summary.map(({ emp, count, last }) => (
          <div key={emp.id} className="emp-card" style={{ cursor:'pointer', borderTop:`3px solid ${count>=3?'#dc2626':count>=1?'#f59e0b':'#e5e7eb'}` }}
            onClick={()=>setSelected(emp)}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
              </div>
              {count > 0 && (
                <div style={{ fontWeight:800, fontSize:22, fontFamily:'Manrope,sans-serif', color:count>=3?'#dc2626':'#f59e0b', flexShrink:0 }}>
                  {count}
                </div>
              )}
            </div>
            {last && (
              <div style={{ marginTop:10, fontSize:12, color:'#9ca3af' }}>Last: {last}</div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}><Phone size={16}/> Log Call-In</h3>
              <button className="btn-icon" onClick={()=>setModal(false)}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Employee
                <select style={inp} value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}>
                  <option value="">Select employee...</option>
                  {activeEmps.sort((a,b)=>a.name.localeCompare(b.name)).map(e=><option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Date
                <input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </label>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:5 }}>
                Reason
                <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} rows={3}
                  style={{ ...inp, resize:'none' }} placeholder="e.g. Called in sick, no notice given" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
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
