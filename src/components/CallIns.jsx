import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Check, ArrowLeft, Phone, Edit2, Trash2 } from 'lucide-react';
import { todaySA } from '../lib/timezone';
import Avatar from './Avatar';

const inp = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'inherit', outline:'none', width:'100%', background:'#fff', color:'#111827', boxSizing:'border-box' };
const emptyForm = { employeeId:'', date:todaySA(), reason:'', excused:false };

// Green = excused (doctor's note received), Red = unexcused
function CountBubbles({ excused, unexcused, size='sm' }) {
  const big = size === 'lg';
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    borderRadius:'50%', fontWeight:800, fontFamily:'Manrope,sans-serif',
    width: big?48:28, height: big?48:28, fontSize: big?20:12, flexShrink:0,
  };
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <div style={{ ...base, background:'#dcfce7', color:'#15803d', border:'2px solid #86efac' }}>{excused}</div>
      <div style={{ ...base, background:'#fee2e2', color:'#b91c1c', border:'2px solid #fca5a5' }}>{unexcused}</div>
    </div>
  );
}

export default function CallIns() {
  const { data, addCallIn, updateCallIn, deleteCallIn, isAdmin } = useApp();
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(null); // null | 'add' | log object
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);

  const allCallIns = data.callIns || [];
  const activeEmps = (data.employees || []).filter(e => e.employment_status !== 'Terminated');

  const openAdd  = (empId) => { setForm({ ...emptyForm, employeeId: empId ? String(empId) : '' }); setModal('add'); };
  const openEdit = (log)   => { setForm({ employeeId:String(log.employee_id), date:log.date, reason:log.reason, excused:log.excused===true, id:log.id }); setModal(log); };
  const closeModal = () => { setModal(null); setForm(emptyForm); };

  const save = async () => {
    if (!form.employeeId || !form.date || !form.reason.trim()) return;
    setSaving(true);
    if (modal === 'add') {
      await addCallIn({ employeeId:parseInt(form.employeeId), date:form.date, reason:form.reason.trim(), excused:form.excused });
    } else {
      await updateCallIn({ id:form.id, date:form.date, reason:form.reason.trim(), excused:form.excused });
    }
    closeModal();
    setSaving(false);
  };

  // ── Drill-in: single employee ──────────────────────────────────────────
  if (selected) {
    const emp  = activeEmps.find(e => e.id === selected) || {};
    const logs = allCallIns
      .filter(c => String(c.employee_id) === String(selected))
      .sort((a,b) => (b.date||'').localeCompare(a.date||''));
    const excusedCount   = logs.filter(l => l.excused === true).length;
    const unexcusedCount = logs.filter(l => l.excused !== true).length;

    return (
      <div>
        <button onClick={()=>setSelected(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#1B3A2D', fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:16, padding:0 }}>
          <ArrowLeft size={15}/> Back
        </button>

        {/* Employee header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', marginBottom:16 }}>
          <Avatar name={emp.name} photoUrl={emp.photo_url} size={50} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{emp.name}</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>{emp.role}</div>
            <div style={{ marginTop:6 }}>
              <CountBubbles excused={excusedCount} unexcused={unexcusedCount} size="sm" />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:30, fontWeight:800, fontFamily:'Manrope,sans-serif', color:'#111827', lineHeight:1 }}>{logs.length}</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>total</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginBottom:14, fontSize:12, color:'#6b7280' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:12, height:12, borderRadius:'50%', background:'#dcfce7', border:'2px solid #86efac', display:'inline-block' }}/>
            Excused / Doctor's Note
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:12, height:12, borderRadius:'50%', background:'#fee2e2', border:'2px solid #fca5a5', display:'inline-block' }}/>
            Unexcused
          </span>
        </div>

        {isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button className="btn-primary" onClick={()=>openAdd(selected)}>
              <Plus size={14}/> Log Call-In
            </button>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {logs.map((log, i) => {
            const isExcused = log.excused === true;
            return (
              <div key={log.id} className="list-card"
                style={{ borderLeft:`3px solid ${isExcused?'#86efac':'#fca5a5'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:'#374151' }}>{log.date}</span>
                      <span style={{ background:isExcused?'#dcfce7':'#fee2e2', color:isExcused?'#15803d':'#b91c1c', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, border:`1px solid ${isExcused?'#86efac':'#fca5a5'}` }}>
                        {isExcused ? 'Excused' : 'Unexcused'}
                      </span>
                      {i === 0 && <span style={{ background:'#fef3c7', color:'#92400e', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>Most Recent</span>}
                    </div>
                    <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{log.reason}</div>
                  </div>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button className="btn-icon" onClick={()=>openEdit(log)}><Edit2 size={13}/></button>
                      <button className="btn-icon danger" onClick={()=>deleteCallIn(log.id)}><Trash2 size={13}/></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {logs.length === 0 && <div className="empty-state">No call-ins recorded.</div>}
        </div>

        {/* Modal inside drill-in */}
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
                {/* Excused toggle */}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setForm(f=>({...f,excused:false}))}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:`2px solid ${!form.excused?'#fca5a5':'#e5e7eb'}`, background:!form.excused?'#fee2e2':'#fff', color:!form.excused?'#b91c1c':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    Unexcused
                  </button>
                  <button onClick={()=>setForm(f=>({...f,excused:true}))}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:`2px solid ${form.excused?'#86efac':'#e5e7eb'}`, background:form.excused?'#dcfce7':'#fff', color:form.excused?'#15803d':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    Excused / Doctor's Note ✓
                  </button>
                </div>
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

  // ── Summary view ───────────────────────────────────────────────────────
  const thisMonthKey = new Date().toISOString().slice(0,7);
  const thisMonth    = allCallIns.filter(c=>c.date?.startsWith(thisMonthKey)).length;
  const repeat       = activeEmps.filter(emp=>allCallIns.filter(c=>String(c.employee_id)===String(emp.id)).length>=3).length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
        {/* Total — with excused/unexcused breakdown */}
        <div className="stat-card" style={{ gridColumn:'1/-1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div className="stat-num">{allCallIns.length}</div>
              <div className="stat-label">Total Call-Ins</div>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:'Manrope,sans-serif', color:'#15803d' }}>
                  {allCallIns.filter(c=>c.excused===true).length}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6b7280', marginTop:2 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#86efac', display:'inline-block' }}/>
                  Excused
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:'Manrope,sans-serif', color:'#b91c1c' }}>
                  {allCallIns.filter(c=>c.excused!==true).length}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6b7280', marginTop:2 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#fca5a5', display:'inline-block' }}/>
                  Unexcused
                </div>
              </div>
            </div>
          </div>
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
        <div>
          <h2 className="section-title" style={{ marginBottom:4 }}>Call-In Tracker</h2>
          <div style={{ display:'flex', gap:12, fontSize:12, color:'#6b7280' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#dcfce7', border:'1.5px solid #86efac', display:'inline-block' }}/>
              Excused / Doctor's Note
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#fee2e2', border:'1.5px solid #fca5a5', display:'inline-block' }}/>
              Unexcused
            </span>
          </div>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={()=>openAdd(null)}>
            <Plus size={14}/> Log Call-In
          </button>
        )}
      </div>

      {/* Employee cards */}
      <div className="card-grid">
        {activeEmps
          .map(emp => {
            const logs       = [...allCallIns.filter(c=>String(c.employee_id)===String(emp.id))].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
            const excused    = logs.filter(l=>l.excused===true).length;
            const unexcused  = logs.filter(l=>l.excused!==true).length;
            const total      = logs.length;
            const last       = logs[0];
            return { emp, logs, excused, unexcused, total, last };
          })
          .sort((a,b) => b.total - a.total || a.emp.name.localeCompare(b.emp.name))
          .map(({ emp, excused, unexcused, total, last }) => (
            <div key={emp.id} className="emp-card"
              style={{ cursor:'pointer', borderTop:`3px solid ${total>=3?'#dc2626':total>=2?'#f59e0b':'#e5e7eb'}` }}
              onClick={()=>setSelected(emp.id)}>

              {/* Top row: avatar + name + bubbles */}
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <Avatar name={emp.name} photoUrl={emp.photo_url} size={42} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{emp.role}</div>
                </div>
                <CountBubbles excused={excused} unexcused={unexcused} size="sm" />
              </div>

              {/* Bottom: last call-in preview — always same height */}
              <div style={{ marginTop:10, background:last?'#fef9f9':'#f9fafb', border:`1px solid ${last?'#fecaca':'#f3f4f6'}`, borderRadius:7, padding:'8px 10px', minHeight:46 }}>
                {last ? (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em' }}>Last · {last.date}</span>
                      <span style={{ background:last.excused?'#dcfce7':'#fee2e2', color:last.excused?'#15803d':'#b91c1c', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>
                        {last.excused?'Excused':'Unexcused'}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:'#374151', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{last.reason}</div>
                  </>
                ) : (
                  <div style={{ fontSize:12, color:'#d1d5db', fontStyle:'italic', lineHeight:'30px' }}>No call-ins recorded</div>
                )}
              </div>
            </div>
          ))}
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
              {/* Excused toggle */}
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Type</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setForm(f=>({...f,excused:false}))}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:`2px solid ${!form.excused?'#fca5a5':'#e5e7eb'}`, background:!form.excused?'#fee2e2':'#fff', color:!form.excused?'#b91c1c':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    Unexcused
                  </button>
                  <button onClick={()=>setForm(f=>({...f,excused:true}))}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:`2px solid ${form.excused?'#86efac':'#e5e7eb'}`, background:form.excused?'#dcfce7':'#fff', color:form.excused?'#15803d':'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    Excused / Doctor's Note
                  </button>
                </div>
              </div>
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
